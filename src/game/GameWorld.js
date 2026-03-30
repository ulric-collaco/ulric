import * as THREE from 'three'
import * as CANNON from 'cannon-es'


const C = {
  sky:        '#EFE0C2',
  ground:     '#D9C99A',
  intro:      '#E8D9B0',
  projects:   '#A8D5A2',
  about:      '#A0C4E8',
  contact:    '#F5AABB',
  playground: '#FFD0A0',
  wall:       '#C4A882',
  wallTop:    '#AF9070',
  carBody:    '#A7B500',
  carRoof:    '#8A9600',
  carWheel:   '#4A4A4A',
  treeTrunk:  '#8D6E63',
  path:       '#CAB88A',
  platform:   '#FFF9C4',
  pole:       '#795548',
  sign:       '#FFF176',
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function makeMesh(geo, color, castShadow = true, receiveShadow = true, options = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.88,
    metalness: options.metalness ?? 0.04,
    ...options,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = castShadow
  mesh.receiveShadow = receiveShadow
  return mesh
}

function makeBox(w, h, d, color, castShadow, receiveShadow) {
  return makeMesh(new THREE.BoxGeometry(w, h, d), color, castShadow, receiveShadow)
}

/** Lighten (+) or darken (-) a hex color by a fixed amount (0-255 per channel) */
function shadeColor(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (n >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ─────────────────────────────────────────────
//  GameWorld  (Three.js + cannon-es)
// ─────────────────────────────────────────────
export default class GameWorld {
  /**
   * @param {HTMLElement} container  – DOM element that receives the canvas
   * @param {Function}    onZoneEnter – (zoneName: string) => void
   * @param {Function}    onZoneExit  – ()              => void
   */
  constructor(container, onZoneEnter, onZoneExit) {
    this.container    = container
    this.onZoneEnter  = onZoneEnter
    this.onZoneExit   = onZoneExit

    // Input state
    this.keys = { w: false, a: false, s: false, d: false }
    this.joystick = { x: 0, y: 0 } // normalised -1..1

    // Runtime state
    this.currentZone    = null
    this.syncPairs      = []   // { body: CANNON.Body, mesh: THREE.Object3D }
    this.floatObjects   = []   // { mesh, baseY, speed, phase }
    this.clock          = new THREE.Clock()
    this.disposed       = false

    // Reusable objects (never new inside the loop)
    this._tmpVec3  = new THREE.Vector3()
    this._tmpVec3b = new THREE.Vector3()
    this._tmpQuat  = new THREE.Quaternion()
    this._cannonVec = new CANNON.Vec3()

    this._init()
  }

  // ──────────────────────────────────────────
  //  Bootstrap
  // ──────────────────────────────────────────
  _init() {
    this._setupRenderer()
    this._setupScene()
    this._setupPhysics()
    this._setupCamera()
    this._setupLights()
    this._buildWorld()
    this._buildCar()
    this._setupEvents()

    // Use setAnimationLoop – handles tab visibility automatically
    this.renderer.setAnimationLoop(() => this._update())
  }

  // ──────────────────────────────────────────
  //  Renderer
  // ──────────────────────────────────────────
  _setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio < 2,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3))
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.container.appendChild(this.renderer.domElement)

    // WebGL context loss – critical per skill reference
    const canvas = this.renderer.domElement
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault()
      this.renderer.setAnimationLoop(null)
    })
    canvas.addEventListener('webglcontextrestored', () => {
      if (!this.disposed) this.renderer.setAnimationLoop(() => this._update())
    })
  }

  // ──────────────────────────────────────────
  //  Scene
  // ──────────────────────────────────────────
  _setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(C.sky)
    this.scene.fog = new THREE.FogExp2(C.sky, 0.015)
  }

  // ──────────────────────────────────────────
  //  Physics
  // ──────────────────────────────────────────
  _setupPhysics() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -25, 0),
    })
    this.world.broadphase = new CANNON.SAPBroadphase(this.world)
    this.world.allowSleep = true
    this.world.defaultContactMaterial.friction    = 0.3
    this.world.defaultContactMaterial.restitution = 0.25
  }

  // ──────────────────────────────────────────
  //  Camera
  // ──────────────────────────────────────────
  _setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      55,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      200,
    )
    this.camera.position.set(0, 14, 18)
    this.cameraTarget  = new THREE.Vector3()
    // offset behind+above car in car local space
    this.camOffset = new THREE.Vector3(0, 12, 16)
  }

  // ──────────────────────────────────────────
  //  Lights
  // ──────────────────────────────────────────
  _setupLights() {
    // Sky/ground gradient ambient — rich two-tone environment
    this.scene.add(new THREE.HemisphereLight('#FFE8C0', '#A0875A', 1.1))
    // Very soft fill ambient
    this.scene.add(new THREE.AmbientLight('#FFF8E7', 0.45))

    // Primary sun — high-res shadows
    const sun = new THREE.DirectionalLight('#FFE0A0', 2.6)
    sun.position.set(20, 30, 15)
    sun.castShadow = true
    sun.shadow.mapSize.width  = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near   = 0.5
    sun.shadow.camera.far    = 160
    const s = 65
    sun.shadow.camera.left   = -s
    sun.shadow.camera.right  =  s
    sun.shadow.camera.top    =  s
    sun.shadow.camera.bottom = -s
    sun.shadow.bias  = -0.0008
    sun.shadow.normalBias = 0.02
    this.scene.add(sun)

    // Warm floor bounce  (Bruno Simon trick)
    const fill = new THREE.DirectionalLight('#FFB74D', 0.55)
    fill.position.set(-15, -8, -10)
    this.scene.add(fill)

    // Cool blue rim from opposite side — gives objects nice edge separation
    const rim = new THREE.DirectionalLight('#A8C8FF', 0.4)
    rim.position.set(-25, 18, -20)
    this.scene.add(rim)
  }

  // ──────────────────────────────────────────
  //  World
  // ──────────────────────────────────────────
  _buildWorld() {
    this._addGround()
    this._addSectionPatches()
    this._addBorderWalls()
    this._addPaths()
    this._addTitleBlocks()
    this._buildProjectSection()
    this._buildAboutSection()
    this._buildContactSection()
    this._buildPlayground()
    this._addTrees()

    // Zone data (position + radius for proximity detection)
    this.zones = {
      projects:   { pos: new THREE.Vector3( 24, 0,  0), radius: 10 },
      about:      { pos: new THREE.Vector3(-24, 0,  0), radius: 10 },
      contact:    { pos: new THREE.Vector3(  0, 0,-24), radius: 10 },
      playground: { pos: new THREE.Vector3(  0, 0, 24), radius: 10 },
    }
  }

  _addGround() {
    const mesh = makeBox(120, 0.2, 120, C.ground, false, true)
    mesh.position.y = -0.1
    this.scene.add(mesh)

    const body = new CANNON.Body({ mass: 0 })
    body.addShape(new CANNON.Plane())
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    this.world.addBody(body)
  }

  _addSectionPatches() {
    const patches = [
      [ 24,  0, C.projects,   20, 20],
      [-24,  0, C.about,      20, 20],
      [  0,-24, C.contact,    20, 20],
      [  0, 24, C.playground, 20, 20],
    ]
    patches.forEach(([x, z, color, w, d]) => {
      const mesh = makeMesh(new THREE.PlaneGeometry(w, d), color, false, true)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(x, 0.01, z)
      this.scene.add(mesh)
    })

    // Intro patch (centre)
    const intro = makeMesh(new THREE.PlaneGeometry(18, 18), C.intro, false, true)
    intro.rotation.x = -Math.PI / 2
    intro.position.set(0, 0.01, 0)
    this.scene.add(intro)
  }

  _addBorderWalls() {
    // [cx, cz, halfX, halfZ]
    const walls = [
      [  0, -52,  52, 1.5],
      [  0,  52,  52, 1.5],
      [-52,   0, 1.5,  52],
      [ 52,   0, 1.5,  52],
    ]
    walls.forEach(([cx, cz, hx, hz]) => {
      const mesh = makeBox(hx * 2, 3.5, hz * 2, C.wall)
      mesh.position.set(cx, 1.75, cz)
      this.scene.add(mesh)

      // Top cap for visual finish
      const cap = makeBox(hx * 2 + 0.2, 0.4, hz * 2 + 0.2, C.wallTop, false, false)
      cap.position.set(cx, 3.75, cz)
      this.scene.add(cap)

      const body = new CANNON.Body({ mass: 0 })
      body.addShape(new CANNON.Box(new CANNON.Vec3(hx, 1.75, hz)))
      body.position.set(cx, 1.75, cz)
      this.world.addBody(body)
    })
  }

  _addPaths() {
    // Tile strips connecting the centre to each zone
    const strips = [
      // [start, end, axis]  (axis='x' or 'z')
      { axis: 'x', fixed: 0,  from:  9, to:  16, z: 0  }, // East  → Projects
      { axis: 'x', fixed: 0,  from: -9, to: -16, z: 0  }, // West  → About
      { axis: 'z', fixed: 0,  from: -9, to: -16, x: 0  }, // South → Contact
      { axis: 'z', fixed: 0,  from:  9, to:  16, x: 0  }, // North → Playground
    ]
    const tileMat = new THREE.MeshStandardMaterial({ color: C.path, roughness: 0.92, metalness: 0.0 })
    const tileGeo = new THREE.PlaneGeometry(3.5, 3.5)

    strips.forEach(({ axis, from, to, x = 0, z = 0 }) => {
      const step = from < to ? 3.5 : -3.5
      for (let v = from; Math.abs(v) <= Math.abs(to); v += step) {
        const tile = new THREE.Mesh(tileGeo, tileMat)
        tile.rotation.x = -Math.PI / 2
        tile.position.set(
          axis === 'x' ? v : x,
          0.015,
          axis === 'z' ? v : z,
        )
        this.scene.add(tile)
      }
    })
  }

  _addTitleBlocks() {
    // "ULRIC" in colourful bumpable boxes at intro zone
    const letters  = ['U','L','R','I','C']
    const colours  = ['#FF8A65','#FFB300','#66BB6A','#42A5F5','#AB47BC']
    const size     = 2.2

    letters.forEach((letter, i) => {
      const x = (i - 2) * 3.2
      const mesh = makeBox(size, size, size, colours[i])
      mesh.position.set(x, size / 2, -7)
      this.scene.add(mesh)

      // Canvas texture for the letter face
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 512
      const ctx = canvas.getContext('2d')
      // gradient fill
      const grad = ctx.createLinearGradient(0, 0, 0, 512)
      grad.addColorStop(0, colours[i])
      grad.addColorStop(1, shadeColor(colours[i], -22))
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 512, 512)
      // letter shadow
      ctx.shadowColor = 'rgba(0,0,0,0.35)'
      ctx.shadowBlur = 18
      ctx.shadowOffsetX = 4
      ctx.shadowOffsetY = 5
      ctx.fillStyle = '#fff'
      ctx.font = "bold 320px 'Segoe UI', Arial, sans-serif"
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(letter, 256, 265)
      const tex = new THREE.CanvasTexture(canvas)
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
      const matWithLetter = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.1 })
      // Apply letter texture to front face only (index 4 = +z face)
      mesh.material = [
        new THREE.MeshStandardMaterial({ color: colours[i], roughness: 0.65, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ color: colours[i], roughness: 0.65, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ color: shadeColor(colours[i], 15), roughness: 0.7, metalness: 0.08 }), // top — lighter
        new THREE.MeshStandardMaterial({ color: shadeColor(colours[i], -18), roughness: 0.8, metalness: 0.05 }), // bottom — darker
        matWithLetter, // +z  (front)
        matWithLetter, // -z (back)
      ]

      // Physics body (dynamic, bumpable)
      const body = new CANNON.Body({
        mass: 15,
        shape: new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)),
        position: new CANNON.Vec3(x, size / 2, -7),
        linearDamping: 0.5,
        angularDamping: 0.75,
      })
      this.world.addBody(body)
      this.syncPairs.push({ body, mesh })
    })

    // "COLLACO" subtitle – just a flat sign on the ground
    const signMesh = makeBox(14, 0.12, 2.5, '#c9b888', false, true)
    signMesh.position.set(0, 0.07, -11)
    this.scene.add(signMesh)

    const ctx2Canvas = document.createElement('canvas')
    ctx2Canvas.width  = 1024
    ctx2Canvas.height = 192
    const ctx2 = ctx2Canvas.getContext('2d')
    ctx2.fillStyle = '#c9b888'
    ctx2.fillRect(0, 0, 1024, 192)
    ctx2.fillStyle = '#6b5a3a'
    ctx2.font = "bold 112px 'Segoe UI', Arial, sans-serif"
    ctx2.textAlign = 'center'
    ctx2.textBaseline = 'middle'
    ctx2.shadowColor = 'rgba(0,0,0,0.22)'
    ctx2.shadowBlur  = 8
    ctx2.fillText('C O L L A C O', 512, 96)
    const subtitleTex = new THREE.CanvasTexture(ctx2Canvas)
    subtitleTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    const subtitleMesh = makeMesh(new THREE.PlaneGeometry(14, 2.5), '#c9b888', false, true)
    subtitleMesh.material = new THREE.MeshStandardMaterial({ map: subtitleTex, roughness: 0.9, metalness: 0.0 })
    subtitleMesh.rotation.x = -Math.PI / 2
    subtitleMesh.position.set(0, 0.14, -11)
    this.scene.add(subtitleMesh)

    // Controls prompt on ground
    this._addGroundText('W A S D  or  ← → ↑ ↓  to drive', 0, 0.14, 4, 12, 1.6, '#8a7a5a', '#c9b888')
  }

  _addGroundText(text, x, y, z, w, h, textColor, bgColor) {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = Math.round(1024 * (h / w))
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // subtle inner shadow for depth
    ctx.shadowColor = 'rgba(0,0,0,0.18)'
    ctx.shadowBlur  = 6
    ctx.fillStyle = textColor
    ctx.font = `bold ${Math.round(canvas.height * 0.52)}px 'Segoe UI', Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
    const mesh = makeMesh(new THREE.PlaneGeometry(w, h), bgColor, false, true)
    mesh.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, metalness: 0.0, transparent: true, opacity: 0.9 })
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, y, z)
    this.scene.add(mesh)
  }

  // ──────────────────────────────────────────
  //  Sections
  // ──────────────────────────────────────────
  _buildProjectSection() {
    const cx = 24, cz = 0

    // Two project platforms
    const projData = [
      { dx: -4, dz: -4, name: 'Gyro Car',     color: '#81C784' },
      { dx:  4, dz: -4, name: 'ChatRTX Clone', color: '#64B5F6' },
    ]

    projData.forEach(({ dx, dz, name, color }) => {
      // Raised platform with lip
      const plat = makeBox(5.5, 0.35, 5.5, color)
      plat.position.set(cx + dx, 0.175, cz + dz)
      this.scene.add(plat)
      const lip = makeBox(5.8, 0.12, 5.8, shadeColor(color, -12))
      lip.position.set(cx + dx, 0.36, cz + dz)
      this.scene.add(lip)

      // Signpost pole — rounder
      const pole = makeMesh(new THREE.CylinderGeometry(0.09, 0.11, 4.2, 16), C.pole)
      pole.position.set(cx + dx, 2.45, cz + dz - 2.5)
      this.scene.add(pole)
      // Pole base foot
      const foot = makeMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 16), C.pole)
      foot.position.set(cx + dx, 0.09, cz + dz - 2.5)
      this.scene.add(foot)

      // Sign board with project name — higher-res canvas
      const signCanvas = document.createElement('canvas')
      signCanvas.width = 768; signCanvas.height = 256
      const sc = signCanvas.getContext('2d')
      // rounded rect background
      sc.fillStyle = '#FFF9C4'
      sc.fillRect(0, 0, 768, 256)
      // top color stripe
      sc.fillStyle = color
      sc.fillRect(0, 0, 768, 52)
      sc.fillStyle = '#fff'
      sc.font = "bold 38px 'Segoe UI', Arial"
      sc.textAlign = 'center'
      sc.textBaseline = 'middle'
      sc.fillText('PROJECT', 384, 26)
      sc.fillStyle = '#222'
      sc.font = "bold 64px 'Segoe UI', Arial"
      sc.fillText(name, 384, 158)
      const signTex = new THREE.CanvasTexture(signCanvas)
      signTex.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
      const sign = makeMesh(new THREE.BoxGeometry(3.8, 1.4, 0.14), '#FFF9C4')
      sign.material = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6, metalness: 0.05 })
      sign.position.set(cx + dx, 5.15, cz + dz - 2.5)
      this.scene.add(sign)
      // Sign board border frame
      const frame = makeBox(4.0, 1.6, 0.1, shadeColor(color, -15))
      frame.position.set(cx + dx, 5.15, cz + dz - 2.56)
      this.scene.add(frame)
    })

    // Zone marker ring on ground
    this._addZoneMarker(cx, cz, '#81C784', 'PROJECTS')

    // Static physics bodies for platforms (so car can drive over them)
    projData.forEach(({ dx, dz }) => {
      const body = new CANNON.Body({ mass: 0 })
      body.addShape(new CANNON.Box(new CANNON.Vec3(2.75, 0.175, 2.75)))
      body.position.set(cx + dx, 0.175, cz + dz)
      this.world.addBody(body)
    })
  }

  _buildAboutSection() {
    const cx = -24, cz = 0

    // Floating sphere (animated) — smooth high-res
    const sphere = makeMesh(new THREE.SphereGeometry(2, 48, 32), '#42A5F5', true, true, { roughness: 0.25, metalness: 0.35 })
    sphere.position.set(cx, 4, cz)
    this.scene.add(sphere)
    this.floatObjects.push({ mesh: sphere, baseY: 4, speed: 1.1, phase: 0 })
    // Inner glow ring
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.3, 0.08, 16, 80),
      new THREE.MeshStandardMaterial({ color: '#90CAF9', emissive: '#90CAF9', emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2 }),
    )
    glowRing.rotation.x = Math.PI / 2
    sphere.add(glowRing)

    // Platform disk — multi-tier
    const plat = makeMesh(new THREE.CylinderGeometry(4.5, 4.8, 0.35, 40), '#90CAF9', true, true, { roughness: 0.75, metalness: 0.1 })
    plat.position.set(cx, 0.175, cz)
    this.scene.add(plat)
    const platRim = makeMesh(new THREE.CylinderGeometry(4.82, 4.82, 0.15, 40), '#64B5E8', true, false, { roughness: 0.6, metalness: 0.15 })
    platRim.position.set(cx, 0.43, cz)
    this.scene.add(platRim)

    // "ABOUT" sign
    this._addGroundText('ABOUT ME', cx, 0.14, cz + 6, 8, 1.6, '#1a5276', '#A0C4E8')
    this._addZoneMarker(cx, cz, '#A0C4E8', 'ABOUT')

    const body = new CANNON.Body({ mass: 0 })
    body.addShape(new CANNON.Cylinder(4.5, 4.5, 0.35, 12))
    body.position.set(cx, 0.175, cz)
    this.world.addBody(body)
  }

  _buildContactSection() {
    const cx = 0, cz = -24

    // Social icon boxes (GitHub dark, Instagram pink, LinkedIn blue)
    const icons = [
      { dx: -5, color: '#1a1a1a', name: 'GitHub' },
      { dx:  0, color: '#C13584', name: 'Insta'  },
      { dx:  5, color: '#0077B5', name: 'LinkedIn'},
    ]
    icons.forEach(({ dx, color, name }, i) => {
      const mesh = makeBox(2.8, 2.8, 2.8, color, true, true)
      mesh.material = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.22 })
      mesh.position.set(cx + dx, 1.4, cz)
      this.scene.add(mesh)
      // Icon base plinth
      const plinth = makeMesh(new THREE.CylinderGeometry(1.7, 1.9, 0.22, 24), shadeColor(color, -20), false, true, { roughness: 0.7, metalness: 0.1 })
      plinth.position.set(cx + dx, 0.11, cz)
      this.scene.add(plinth)

      // Label under box
      this._addGroundText(name, cx + dx, 0.14, cz + 2.2, 4, 1, '#333', '#F5AABB')

      this.floatObjects.push({ mesh, baseY: 1.4, speed: 0.8, phase: i * 1.2 })

      const body = new CANNON.Body({
        mass: 20,
        shape: new CANNON.Box(new CANNON.Vec3(1.4, 1.4, 1.4)),
        position: new CANNON.Vec3(cx + dx, 1.4, cz),
        linearDamping: 0.5,
        angularDamping: 0.8,
      })
      this.world.addBody(body)
      this.syncPairs.push({ body, mesh })
    })

    this._addZoneMarker(cx, cz, '#F5AABB', 'CONTACT')
  }

  _buildPlayground() {
    const cx = 0, cz = 24
    const colors = ['#FF8A65','#FFD54F','#A5D6A7','#80DEEA','#CE93D8','#EF9A9A','#80CBC4']

    // Stacked / scattered bumpable boxes (InstancedMesh)
    const numBoxes = 18;
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const boxMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1 });
    const instMesh = new THREE.InstancedMesh(boxGeo, boxMat, numBoxes);
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();
    const physicsBodies = [];

    for (let i = 0; i < numBoxes; i++) {
      const size  = 0.8 + Math.random() * 1.0
      const x     = cx + (Math.random() - 0.5) * 14
      const z     = cz + (Math.random() - 0.5) * 12
      const y     = size / 2 + 0.05
      const color = colors[Math.floor(Math.random() * colors.length)]

      dummy.position.set(x, y, z);
      dummy.scale.set(size, size, size);
      dummy.updateMatrix();
      instMesh.setMatrixAt(i, dummy.matrix);
      colorObj.set(color);
      instMesh.setColorAt(i, colorObj);

      const body = new CANNON.Body({
        mass: 6 + Math.random() * 12,
        shape: new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2)),
        position: new CANNON.Vec3(x, y, z),
        linearDamping: 0.3,
        angularDamping: 0.6,
      })
      this.world.addBody(body)
      physicsBodies.push(body);
    }
    
    this.scene.add(instMesh);
    this.syncPairs.push({
      isInstanced: true,
      mesh: instMesh,
      bodies: physicsBodies,
      dummy: dummy
    });

    // Ramp
    const ramp = makeBox(8, 0.35, 6, '#FFCC02')
    ramp.position.set(cx + 5, 1.3, cz + 3)
    ramp.rotation.x = -Math.PI / 9
    ramp.castShadow = true
    this.scene.add(ramp)

    const rampBody = new CANNON.Body({ mass: 0 })
    rampBody.addShape(new CANNON.Box(new CANNON.Vec3(4, 0.175, 3)))
    rampBody.position.set(cx + 5, 1.3, cz + 3)
    rampBody.quaternion.setFromEuler(-Math.PI / 9, 0, 0)
    this.world.addBody(rampBody)

    this._addGroundText('PLAYGROUND', cx, 0.14, cz - 8, 9, 1.6, '#7b3f00', '#FFD0A0')
    this._addZoneMarker(cx, cz, '#FFD0A0', 'PLAY')
  }

  // ──────────────────────────────────────────
  //  Zone visual marker (ring on ground)
  // ──────────────────────────────────────────
  _addZoneMarker(cx, cz, color, label) {
    const rgb = new THREE.Color(color);
    const uniforms = {
      uColor: { value: new THREE.Vector3(rgb.r, rgb.g, rgb.b) },
      uTime: { value: 0 }
    };
    const shaderMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          vec2 centeredUv = vUv - 0.5;
          float dist = length(centeredUv);
          
          float outer = smoothstep(0.46, 0.43, dist) * smoothstep(0.4, 0.43, dist);
          float inner = smoothstep(0.35, 0.33, dist) * smoothstep(0.31, 0.33, dist);
          
          float angle = atan(centeredUv.y, centeredUv.x);
          float dash = sin(angle * 30.0 + uTime * 2.0) > 0.0 ? 1.0 : 0.2;
          float scanline = sin(dist * 100.0 - uTime * 5.0) * 0.5 + 0.5;
          
          float alpha = (outer + inner * dash) * (0.5 + scanline * 0.5);
          gl_FragColor = vec4(uColor * 1.5, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    if (!this.shaders) this.shaders = [];
    this.shaders.push(uniforms);

    const ring = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), shaderMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(cx, 0.03, cz);
    this.scene.add(ring);
  }

  // ──────────────────────────────────────────
  //  Trees (low-poly, instanced-ish)
  // ──────────────────────────────────────────
  _addTrees() {
    const spots = [
      [-44,-44],[-44,-22],[-44, 0],[-44, 22],[-44, 44],
      [ 44,-44],[ 44,-22],[ 44, 0],[ 44, 22],[ 44, 44],
      [-22,-44],[ 22,-44],[-22, 44],[ 22, 44],
      [  0,-44],[  0, 44],
    ]
    spots.forEach(([x, z]) => {
      const scale = 0.7 + Math.random() * 0.6
      this._placeTree(x + (Math.random() - 0.5) * 4, z + (Math.random() - 0.5) * 4, scale)
    })
  }

  _placeTree(x, z, scale = 1) {
    const g = new THREE.Group()
    // Trunk — more segments, slight taper
    const trunk = makeMesh(new THREE.CylinderGeometry(0.22, 0.38, 2.4, 12), C.treeTrunk, true, true, { roughness: 0.95, metalness: 0.0 })
    trunk.position.y = 1.2
    g.add(trunk)
    // Root flare bulge rings
    ;[0.12, 0.28].forEach((fy) => {
      const flare = makeMesh(new THREE.CylinderGeometry(0.46 - fy, 0.38, 0.22, 10), C.treeTrunk, true, false, { roughness: 0.95 })
      flare.position.y = fy + 0.02
      g.add(flare)
    })

    // Four-layer canopy — slightly more segments and variation
    const layers = [
      [2.6, 2.6, 0.0],
      [3.5, 2.2, 1.0],
      [2.6, 1.9, 2.0],
      [1.6, 1.5, 2.95],
    ]
    layers.forEach(([r, h, yo], li) => {
      const hue   = 90 + Math.random() * 30
      const sat   = 44 + Math.random() * 14
      const light = 35 + Math.random() * 17
      const cone  = makeMesh(
        new THREE.ConeGeometry(r, h, 8 + (li % 2) * 2),
        `hsl(${hue}, ${sat}%, ${light}%)`,
        true, true,
        { roughness: 0.95 + Math.random() * 0.04, metalness: 0.0 },
      )
      // slight random lean per layer
      cone.position.set((Math.random() - 0.5) * 0.18, 2.1 + yo, (Math.random() - 0.5) * 0.18)
      g.add(cone)
    })
    g.position.set(x, 0, z)
    g.rotation.y = Math.random() * Math.PI * 2
    g.scale.setScalar(scale)
    this.scene.add(g)
  }

  // ──────────────────────────────────────────
  //  Car
  // ──────────────────────────────────────────
  _buildCar() {
    this.carGroup = new THREE.Group()
    const scene = this.scene

    // Chassis
    const chassis = makeBox(1.7, 0.52, 3.0, C.carBody, true, true)
    chassis.material = new THREE.MeshStandardMaterial({ color: C.carBody, roughness: 0.50, metalness: 0.22 })
    chassis.position.y = 0
    this.carGroup.add(chassis)
    // Side skirts
    ;[-0.88, 0.88].forEach((sx) => {
      const skirt = makeBox(0.06, 0.18, 2.7, shadeColor(C.carBody, -18), true, false)
      skirt.material = new THREE.MeshStandardMaterial({ color: shadeColor(C.carBody, -18), roughness: 0.6, metalness: 0.15 })
      skirt.position.set(sx, -0.17, 0)
      this.carGroup.add(skirt)
    })
    // Front bumper
    const fBumper = makeBox(1.72, 0.26, 0.18, shadeColor(C.carBody, -10), true, false)
    fBumper.material = new THREE.MeshStandardMaterial({ color: shadeColor(C.carBody, -10), roughness: 0.55, metalness: 0.2 })
    fBumper.position.set(0, -0.13, 1.56)
    this.carGroup.add(fBumper)
    // Rear bumper
    const rBumper = makeBox(1.72, 0.26, 0.18, shadeColor(C.carBody, -10), true, false)
    rBumper.material = new THREE.MeshStandardMaterial({ color: shadeColor(C.carBody, -10), roughness: 0.55, metalness: 0.2 })
    rBumper.position.set(0, -0.13, -1.56)
    this.carGroup.add(rBumper)

    // Roof / cabin
    const roof = makeBox(1.25, 0.5, 1.5, C.carRoof, true, false)
    roof.material = new THREE.MeshStandardMaterial({ color: C.carRoof, roughness: 0.48, metalness: 0.25 })
    roof.position.set(0, 0.51, 0.1)
    this.carGroup.add(roof)
    // Roof rail stripe
    ;[-0.65, 0.65].forEach((rx) => {
      const rail = makeBox(0.04, 0.055, 1.4, '#888', false, false)
      rail.material = new THREE.MeshStandardMaterial({ color: '#999', roughness: 0.3, metalness: 0.7 })
      rail.position.set(rx, 0.78, 0.1)
      this.carGroup.add(rail)
    })

    // Windshield (translucent) — PBR glass
    const wsMat = new THREE.MeshStandardMaterial({ color: '#B3E5FC', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.62, envMapIntensity: 1.0 })
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.06), wsMat)
    ws.position.set(0, 0.57, 0.87)
    this.carGroup.add(ws)
    // Rear screen
    const rs = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 0.06), wsMat.clone())
    rs.position.set(0, 0.57, -0.67)
    this.carGroup.add(rs)
    // Side windows
    ;[-0.64, 0.64].forEach((sx) => {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 1.18), wsMat.clone())
      sw.position.set(sx, 0.57, 0.12)
      this.carGroup.add(sw)
    })

    // Side mirrors
    ;[-0.9, 0.9].forEach((sx) => {
      const mirrorArm = makeBox(0.12, 0.06, 0.22, shadeColor(C.carBody, -15), true, false)
      mirrorArm.material = new THREE.MeshStandardMaterial({ color: shadeColor(C.carBody, -15), roughness: 0.5, metalness: 0.2 })
      mirrorArm.position.set(sx, 0.3, 0.78)
      this.carGroup.add(mirrorArm)
      const mirrorFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.2, 0.3),
        new THREE.MeshStandardMaterial({ color: '#c0c8d0', roughness: 0.08, metalness: 0.65 }),
      )
      mirrorFace.position.set(sx + (sx > 0 ? 0.065 : -0.065), 0.3, 0.78)
      this.carGroup.add(mirrorFace)
    })

    // Wheels — high-res with hub detail
    const wheelGeo = new THREE.CylinderGeometry(0.40, 0.40, 0.34, 24)
    const wheelMat = new THREE.MeshStandardMaterial({ color: C.carWheel, roughness: 0.92, metalness: 0.05 })
    const hubMat   = new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.25, metalness: 0.85 })
    const hubGeo   = new THREE.CylinderGeometry(0.18, 0.18, 0.36, 16)
    const lug1Geo  = new THREE.CylinderGeometry(0.04, 0.04, 0.36, 8)
    const wheelPos = [
      [-0.95, -0.22,  1.0],
      [ 0.95, -0.22,  1.0],
      [-0.95, -0.22, -1.0],
      [ 0.95, -0.22, -1.0],
    ]
    this.wheelMeshes = []
    wheelPos.forEach(([wx, wy, wz]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat)
      w.rotation.z = Math.PI / 2
      w.position.set(wx, wy, wz)
      w.castShadow = true
      // Hub cap
      const hub = new THREE.Mesh(hubGeo, hubMat)
      hub.rotation.z = Math.PI / 2
      w.add(hub)
      // 5 lug bolts
      for (let li = 0; li < 5; li++) {
        const angle = (li / 5) * Math.PI * 2
        const lug = new THREE.Mesh(lug1Geo, hubMat)
        lug.rotation.z = Math.PI / 2
        lug.position.set(0, Math.sin(angle) * 0.22, Math.cos(angle) * 0.22)
        w.add(lug)
      }
      this.carGroup.add(w)
      this.wheelMeshes.push(w)
    })

    // Rear brake lights
    const lightGeo = new THREE.BoxGeometry(0.72, 0.23, 0.08)
    this.brakeLightMat = new THREE.MeshStandardMaterial({
      color: '#FF4444',
      emissive: '#FF2222',
      emissiveIntensity: 0,
      roughness: 0.3,
      metalness: 0.1,
    })
    const brakeLight = new THREE.Mesh(lightGeo, this.brakeLightMat)
    brakeLight.position.set(0, 0.05, -1.52)
    this.carGroup.add(brakeLight)
    // Brake light lens strip detail
    ;[-0.28, 0.28].forEach((bx) => {
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.12, 0.1),
        new THREE.MeshStandardMaterial({ color: '#FF2222', emissive: '#FF1111', emissiveIntensity: 0, roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.88 }),
      )
      lens.position.set(bx, 0.05, -1.52)
      this.carGroup.add(lens)
    })

    // Front headlights — emissive PBR
    const frontMat = new THREE.MeshStandardMaterial({ color: '#FFFDE7', emissive: '#FFFDE7', emissiveIntensity: 0.7, roughness: 0.1, metalness: 0.05 })
    ;[-0.45, 0.45].forEach((lx) => {
      const fl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.2, 0.08), frontMat)
      fl.position.set(lx, 0.06, 1.52)
      this.carGroup.add(fl)
      // reflector ring
      const refMat = new THREE.MeshStandardMaterial({ color: '#ccc', roughness: 0.15, metalness: 0.85 })
      const ref = new THREE.Mesh(new THREE.RingGeometry(0.07, 0.14, 16), refMat)
      ref.position.set(lx, 0.06, 1.57)
      this.carGroup.add(ref)
    })

    // Exhaust pipe
    const exhaust = makeMesh(new THREE.CylinderGeometry(0.055, 0.07, 0.45, 12), '#888', true, false)
    exhaust.material = new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.35, metalness: 0.75 })
    exhaust.rotation.x = Math.PI / 2
    exhaust.position.set(0.45, -0.22, -1.72)
    this.carGroup.add(exhaust)

    // Antenna (wiggles with acceleration)
    this.antennaPivot = new THREE.Group()
    this.antennaPivot.position.set(0.4, 0.55, -0.5)
    const antennaStick = makeBox(0.04, 0.95, 0.04, '#aaa', true, false)
    antennaStick.material = new THREE.MeshStandardMaterial({ color: '#ccc', roughness: 0.3, metalness: 0.75 })
    antennaStick.position.y = 0.47
    this.antennaPivot.add(antennaStick)
    const antennaBall = makeMesh(new THREE.SphereGeometry(0.1, 16, 12), '#FF8A65', true, false, { roughness: 0.5, metalness: 0.1 })
    antennaBall.position.y = 0.98
    this.antennaPivot.add(antennaBall)
    this.carGroup.add(this.antennaPivot)

    // Initial placement
    this.carGroup.position.set(0, 0.5, 2)
    scene.add(this.carGroup)

    // Shadow blob
    const shadow = makeMesh(new THREE.PlaneGeometry(3, 4), '#000000', false, false)
    shadow.material = new THREE.MeshLambertMaterial({ color: '#000', transparent: true, opacity: 0.18 })
    shadow.rotation.x = -Math.PI / 2
    shadow.position.set(0, 0.02, 2)
    this.carShadow = shadow
    scene.add(shadow)

    // ─ Physics body ─
    this.carBody = new CANNON.Body({
      mass: 160,
      shape: new CANNON.Box(new CANNON.Vec3(0.85, 0.26, 1.5)),
      position: new CANNON.Vec3(0, 0.5, 2),
      linearDamping:  0.15,
      angularDamping: 0.99,
    })
    // Only allow rotation around Y (no flipping)
    this.carBody.angularFactor.set(0, 1, 0)
    // Never sleep — otherwise force/velocity updates are ignored
    this.carBody.allowSleep = false
    this.world.addBody(this.carBody)

    // Store previous speed for antenna animation
    this._prevSpeed = 0
  }

  // ──────────────────────────────────────────
  //  Input setup
  // ──────────────────────────────────────────
  _setupEvents() {
    this._onKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup')    this.keys.w = true
      if (k === 'a' || k === 'arrowleft')  this.keys.a = true
      if (k === 's' || k === 'arrowdown')  this.keys.s = true
      if (k === 'd' || k === 'arrowright') this.keys.d = true
    }
    this._onKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup')    this.keys.w = false
      if (k === 'a' || k === 'arrowleft')  this.keys.a = false
      if (k === 's' || k === 'arrowdown')  this.keys.s = false
      if (k === 'd' || k === 'arrowright') this.keys.d = false
    }
    this._onResize = () => {
      const w = this.container.clientWidth
      const h = this.container.clientHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    }
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup',   this._onKeyUp)
    window.addEventListener('resize',  this._onResize)
  }

  /** Called by React touch joystick — joystick values in -1..1 */
  setJoystick(x, y) {
    this.joystick.x = x
    this.joystick.y = y
  }

  // ──────────────────────────────────────────
  //  Main update loop
  // ──────────────────────────────────────────
  _update() {
    if (this.disposed) return

    const raw   = this.clock.getDelta()
    const delta = Math.min(raw, 0.05) // cap at 50 ms

    // Step physics (fixed dt, max 3 sub-steps)
    this.world.step(1 / 60, delta, 3)

    // Sync dynamic bodies → meshes
    for (const pair of this.syncPairs) {
      if (pair.isInstanced) {
        for (let i = 0; i < pair.bodies.length; i++) {
          pair.dummy.position.copy(pair.bodies[i].position)
          pair.dummy.quaternion.copy(pair.bodies[i].quaternion)
          pair.dummy.updateMatrix()
          pair.mesh.setMatrixAt(i, pair.dummy.matrix)
        }
        pair.mesh.instanceMatrix.needsUpdate = true
      } else {
        pair.mesh.position.copy(pair.body.position)
        pair.mesh.quaternion.copy(pair.body.quaternion)
      }
    }
    
    if (this.shaders) {
      this.shaders.forEach(u => u.uTime.value += delta);
    }

    this._updateCar(delta)
    this._updateCamera()
    this._updateFloats(delta)
    this._checkZones()

    this.renderer.render(this.scene, this.camera)
  }

  // ──────────────────────────────────────────
  //  Car physics update
  // ──────────────────────────────────────────
  _updateCar(delta) {
    const MAX_SPEED  = 25   // m/s
    const ACCEL_LERP = 0.18  // fraction per frame toward target speed
    const TURN_RATE  = 2.0   // rad/s max yaw rate
    const LATERAL_DAMP = 0.82 // kills sideways sliding each frame

    // Always keep the car body awake
    this.carBody.wakeUp()

    // Combine keyboard + joystick  (joystick.y: +1 = down = reverse)
    const fwd  = Math.max(-1, Math.min(1,
      (this.keys.w ? 1 : 0) - (this.keys.s ? 1 : 0) - this.joystick.y))
    const turn = Math.max(-1, Math.min(1,
      (this.keys.a ? 1 : 0) - (this.keys.d ? 1 : 0) - this.joystick.x))

    // Car world-space forward vector (local -Z)
    const q = this.carBody.quaternion
    const wFwd = q.vmult(new CANNON.Vec3(0, 0, -1))   // forward
    const wRight = q.vmult(new CANNON.Vec3(1, 0, 0))  // right

    const vel = this.carBody.velocity

    // Current speeds along each axis
    const speed   = wFwd.x*vel.x  + wFwd.z*vel.z    // forward (ignore Y)
    const lateral = wRight.x*vel.x + wRight.z*vel.z  // sideways

    // Lerp forward speed toward target
    const targetSpeed = fwd * MAX_SPEED
    const newSpeed = speed + (targetSpeed - speed) * ACCEL_LERP

    // Kill lateral sliding
    const newLateral = lateral * LATERAL_DAMP

    // Reconstruct horizontal velocity preserving Y (gravity/bounce)
    this.carBody.velocity.set(
      wFwd.x * newSpeed + wRight.x * newLateral,
      vel.y,
      wFwd.z * newSpeed + wRight.z * newLateral,
    )

    // ── Steering direction ── STABLE intent-first flag, never flips from speed jitter ──
    // Priority: key being held > actual speed > last known direction (no blind flip)
    if (!this._steerDir) this._steerDir = 1
    if      (fwd >  0.05) this._steerDir =  1   // pressing forward  → turn normally
    else if (fwd < -0.05) this._steerDir = -1   // pressing reverse  → invert turn
    else if (speed >  1.0) this._steerDir =  1  // coasting forward
    else if (speed < -1.0) this._steerDir = -1  // coasting backward
    // else: stationary — keep last direction, no jitter flip

    if (Math.abs(turn) > 0.02) {
      // High boost at low speed so the car pivots quickly
      const boost = Math.abs(speed) < 1.5 ? 8.0 : 1.0
      this.carBody.angularVelocity.y = turn * this._steerDir * TURN_RATE * boost
    } else {
      this.carBody.angularVelocity.y *= 0.7  // snap steering back
    }

    // Brake lights
    if (this.brakeLightMat) {
      this.brakeLightMat.emissiveIntensity = fwd < -0.1 ? 1.0 : 0
    }

    // Wheel spin
    this.wheelMeshes.forEach((w) => {
      w.rotation.x += speed * delta * 1.8
    })

    // Antenna wiggle
    const accel = speed - this._prevSpeed
    this._prevSpeed = speed
    if (this.antennaPivot) {
      this.antennaPivot.rotation.x = THREE.MathUtils.lerp(
        this.antennaPivot.rotation.x, -accel * 0.15, 0.2,
      )
    }

    // Sync mesh → physics body
    this.carGroup.position.copy(this.carBody.position)
    this.carGroup.quaternion.copy(this.carBody.quaternion)

    // Shadow follows car
    if (this.carShadow) {
      this.carShadow.position.set(
        this.carBody.position.x,
        0.02,
        this.carBody.position.z,
      )
      this.carShadow.quaternion.copy(this.carBody.quaternion)
    }
  }

  // ──────────────────────────────────────────
  //  Camera follow
  // ──────────────────────────────────────────
  _updateCamera() {
    const carPos  = this.carGroup.position
    const carQuat = this.carGroup.quaternion

    // Ideal camera position = car pos + offset rotated by car's Y rotation
    const offset = this.camOffset.clone().applyQuaternion(carQuat)
    const ideal  = carPos.clone().add(offset)

    // Smooth lerp (frame-rate dependent — fine for a browser game at 60fps)
    this.camera.position.lerp(ideal, 0.06)

    // Look slightly ahead of the car (not just at its centre)
    this._tmpVec3.set(0, 0, -4).applyQuaternion(carQuat).add(carPos)
    this.cameraTarget.lerp(this._tmpVec3, 0.1)
    this.camera.lookAt(this.cameraTarget)
  }

  // ──────────────────────────────────────────
  //  Floating animations
  // ──────────────────────────────────────────
  _updateFloats(delta) {
    const t = this.clock.elapsedTime
    this.floatObjects.forEach(({ mesh, baseY, speed, phase }) => {
      mesh.position.y = baseY + Math.sin(t * speed + phase) * 0.45
      mesh.rotation.y += delta * 0.5
    })
  }

  // ──────────────────────────────────────────
  //  Zone detection
  // ──────────────────────────────────────────
  _checkZones() {
    const carPos = this.carGroup.position
    let newZone  = null

    for (const [name, { pos, radius }] of Object.entries(this.zones)) {
      if (carPos.distanceTo(pos) < radius) {
        newZone = name
        break
      }
    }

    if (newZone !== this.currentZone) {
      if (this.currentZone) this.onZoneExit  && this.onZoneExit(this.currentZone)
      this.currentZone = newZone
      if (newZone)        this.onZoneEnter && this.onZoneEnter(newZone)
    }
  }

  // ──────────────────────────────────────────
  //  Cleanup – called by React on unmount
  // ──────────────────────────────────────────
  dispose() {
    this.disposed = true

    this.renderer.setAnimationLoop(null)

    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup',   this._onKeyUp)
    window.removeEventListener('resize',  this._onResize)

    // Dispose all GPU resources
    this.scene.traverse((obj) => {
      if (obj.isMesh || obj.isInstancedMesh) {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m) => {
            if (m.map)              m.map.dispose()
            if (m.emissiveMap)      m.emissiveMap.dispose()
            if (m.normalMap)        m.normalMap.dispose()
            if (m.roughnessMap)     m.roughnessMap.dispose()
            if (m.metalnessMap)     m.metalnessMap.dispose()
            m.dispose()
          })
        }
      }
    })

    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
