import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const PLAYER_HEIGHT = 1.72;
const PLAYER_RADIUS = 0.34;
const MOVE_SPEED = 4.25;
const SPRINT_SPEED = 6.8;
const MOBILE_DRAG_LOOK_SPEED = 0.0069;
const MOBILE_TAP_DRAG_TOLERANCE = 10;
const MOBILE_MANUAL_MOVE_DISTANCE = 78;
const MOBILE_MANUAL_MOVE_DEADZONE = 0.12;
const MOBILE_MANUAL_MOVE_CURVE = 1.2;
const MOBILE_MOVE_ZONE_START = 0.62;
const ROOM_WIDTH = 22;
const ROOM_DEPTH = 28;
const ROOM_HEIGHT = 6.9;
const SKYLIGHT_SIDE_BORDER = 4.8;
const SKYLIGHT_END_BORDER = 4.6;
const ROOM_HALF_WIDTH = ROOM_WIDTH / 2;
const ROOM_HALF_DEPTH = ROOM_DEPTH / 2;
const PLAYER_SPAWN_X = 4.7;
const PLAYER_SPAWN_Z = ROOM_HALF_DEPTH - 1.1;
const PLAYER_SPAWN_YAW = THREE.MathUtils.degToRad(20);
const ARTWORK_WIDTH = 5.2;
const ARTWORK_HEIGHT = ARTWORK_WIDTH / (16 / 9);
const ARTWORK_CENTER_Y = 2.04;
const CLERESTORY_SILL_Y = ARTWORK_CENTER_Y * 2;
const INTERACTION_DISTANCE = 4.8;
const ACTIVATION_COOLDOWN_MS = 1400;
const VIDEO_START_DISTANCE = 11.1;
const VIDEO_PAUSE_DISTANCE = 14.25;
const NPC_DIALOGUE_DURATION_MS = 8000;
const NPC_BUMP_COOLDOWN_MS = 8500;
const NPC_HOVER_HOLD_MS = 1000;
const NPC_HOVER_FADE_MS = 2000;
const CONTACT_PAGE_URL = new URL('../contact.html', import.meta.url).href;
const DOOR_X = 4.7;
const DOOR_Z = ROOM_HALF_DEPTH - 0.23;
const SUN_POSITION = new THREE.Vector3(-7, 16, -11);
const SUN_TARGET = new THREE.Vector3(0, 0, -2);

const GALLERY_PROJECTS = [
  {
    title: 'EDM Planet',
    category: 'Live music and media discovery',
    url: 'https://edmplanet.nyc/',
    screenshot: '../assets/textures/optimized/project-1-runtime.jpg',
    video: '../vids/edmplanet.mp4',
    accent: '#6255dd',
    position: new THREE.Vector3(0, ARTWORK_CENTER_Y, -ROOM_HALF_DEPTH + 0.19),
    rotationY: 0,
  },
  {
    title: 'Cupcakes + Broccoli',
    category: 'Entrepreneur and consultation brand',
    url: 'https://www.cupcakesandbroccoli.com/about',
    screenshot: '../assets/textures/optimized/project-2-runtime.jpg',
    video: '../vids/cupcakesbrocolli.mp4',
    accent: '#a6715e',
    position: new THREE.Vector3(-ROOM_HALF_WIDTH + 0.19, ARTWORK_CENTER_Y, -2.7),
    rotationY: Math.PI / 2,
  },
  {
    title: 'Skyscape Visions',
    category: 'Cinematic aerial media portfolio',
    url: 'https://scampbe3.github.io/drone-site/',
    screenshot: '../assets/textures/optimized/project-3-runtime.jpg',
    video: '../vids/dronesite.mp4',
    accent: '#2f9b98',
    position: new THREE.Vector3(ROOM_HALF_WIDTH - 0.19, ARTWORK_CENTER_Y, -2.7),
    rotationY: -Math.PI / 2,
  },
  {
    title: 'The Star Cats',
    category: 'Three.js interactive browser game',
    url: 'https://thestarcats.com/',
    screenshot: '../assets/textures/optimized/project-4-runtime.jpg',
    video: '../vids/starcats.mp4',
    accent: '#b9c2c8',
    position: new THREE.Vector3(-4.35, ARTWORK_CENTER_Y, ROOM_HALF_DEPTH - 0.19),
    rotationY: Math.PI,
  },
];

const TREE_MODEL_URLS = [
  '../assets/models/tree-autumn-ember.glb',
  '../assets/models/tree-emerald-canopy.glb',
  '../assets/models/tree-golden-birch.glb',
  '../assets/models/tree-variety-a.glb',
  '../assets/models/tree-variety-b.glb',
];

const GALLERY_NPCS = [
  {
    projectIndex: 0,
    name: 'Jules',
    personality: 'THE DJ',
    lines: [
      'Oh, this is fun. You can jump from live radio to releases and events without losing your place.',
      'I would absolutely leave this playing in another tab. The station browser makes finding a mood really easy.',
      'There is a lot here - favorites, ratings, search, the store - but it never feels overwhelming.',
    ],
    offset: [-2.65, 3.4],
    scale: 0.98,
    phase: 0.3,
    pose: 'phone',
    accessory: 'headphones',
    heldObject: 'phone',
    model: '../assets/models/npc-jules-listening-v4.glb',
    skin: '#8b5a43',
    hair: '#202127',
    top: '#c95c7d',
    trousers: '#303951',
    shoes: '#25282d',
    accent: '#7664ea',
  },
  {
    projectIndex: 1,
    name: 'Amara',
    personality: 'THE ENTREPRENEUR',
    lines: [
      'This feels like meeting the person behind the business, not reading a generic services page.',
      'I like how quickly you understand what Amanda offers and where to go next. That builds trust.',
      'The mobile layout is especially thoughtful. Nothing important gets buried when the screen gets smaller.',
    ],
    offset: [-2.6, 3.35],
    scale: 1.02,
    phase: 1.7,
    pose: 'notebook',
    accessory: 'notebook',
    hairStyle: 'high-bun',
    model: '../assets/models/npc-amara-gallery-v3.glb',
    skin: '#684234',
    hair: '#241918',
    top: '#b87557',
    trousers: '#424a4c',
    shoes: '#34302d',
    accent: '#a6715e',
  },
  {
    projectIndex: 2,
    name: 'Robo',
    personality: 'THE CINEPHILE',
    lines: [
      'The aerial footage is the star here. The site gets out of the way and lets you take in each location.',
      'I like being able to skim the thumbnails, then settle into a full clip when something catches my eye.',
      'The pacing feels confident. Each shot has time to land, but the portfolio is still quick to explore.',
    ],
    offset: [-2.7, 3.45],
    scale: 1.04,
    phase: 3.1,
    pose: 'camera',
    accessory: 'camera',
    hairStyle: 'textured-crop',
    model: '../assets/models/npc-robo-bored-v2.glb',
    skin: '#c58c68',
    hair: '#392a24',
    top: '#358c8c',
    trousers: '#293843',
    shoes: '#f0ece3',
    accent: '#2f9b98',
  },
  {
    projectIndex: 3,
    name: 'Rose',
    personality: 'THE PILOT',
    lines: [
      'Okay, this is not a normal portfolio piece. There is a full Three.js game running in the browser.',
      'The controls and HUD are doing a lot of work, but they stay readable once the action starts.',
      'I keep noticing the small performance choices. The style holds up without the game feeling heavy.',
    ],
    offset: [-2.65, 3.4],
    scale: 0.95,
    phase: 4.6,
    pose: 'tablet',
    accessory: 'glasses',
    heldObject: 'tablet',
    hairStyle: 'angular-bob',
    model: '../assets/models/npc-rose-reach-v1.glb',
    skin: '#d7a17d',
    hair: '#6f3828',
    top: '#52765f',
    trousers: '#343846',
    shoes: '#252b28',
    accent: '#b9c2c8',
  },
];

const overlay = document.getElementById('overlay');
const enterButton = document.getElementById('enterButton');
const hud = document.getElementById('hud');
const statusText = document.getElementById('statusText');
const overlayTitle = document.getElementById('overlayTitle');
const controlsNote = document.getElementById('controlsNote');
const queryParams = new URLSearchParams(window.location.search);
const previewMode = queryParams.has('preview');
const previewView = queryParams.get('view') || queryParams.get('preview');
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const POINTER_INTERACTION_DISTANCE = INTERACTION_DISTANCE * (isTouchDevice ? 1.25 : 1);
document.body.classList.toggle('touch-device', isTouchDevice);
const interactionVerb = isTouchDevice ? 'TAP' : 'CLICK';
const movementDirections = isTouchDevice
  ? 'DRAG LOW: MOVE | DRAG HIGH: TURN'
  : 'MOVE: ARROWS / W A S D\nLOOK: MOUSE\nSPRINT: SHIFT';

controlsNote.textContent = movementDirections;

document.body.dataset.sceneReady = 'false';
window.__sceneReady = false;
window.__loadTimings = { startedAt: performance.now() };

const scene = new THREE.Scene();
scene.background = new THREE.Color('#80bce7');
scene.fog = new THREE.Fog('#dfe8ea', 24, 48);

const camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(PLAYER_SPAWN_X, PLAYER_HEIGHT, PLAYER_SPAWN_Z);
camera.rotation.y = PLAYER_SPAWN_YAW;

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.25 : 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.append(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
controls.minPolarAngle = Math.PI / 2;
controls.maxPolarAngle = Math.PI / 2;
const clock = new THREE.Clock();
const textureLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const interactiveMeshes = [];
const interactions = [];
const artworks = [];
const npcs = [];
let npcHoverPrompt = null;
let npcHoverOwner = null;
let npcHoverHoldUntil = 0;
const sunRayBeams = [];
const propColliders = [];
const videos = [];
const mobileManualMoveInput = new THREE.Vector2();
const previousPlayerPosition = new THREE.Vector3();
const mobileLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const horizontalViewEuler = new THREE.Euler(0, 0, 0, 'YXZ');
const npcCameraDirection = new THREE.Vector3();
const npcBubbleWorldPosition = new THREE.Vector3();
const npcArmSwayAxis = new THREE.Vector3(0, 0, 1);
const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
};

let mobileSceneActive = false;
let lastActivationAt = 0;
let lastTouchInteractionAt = 0;
let galleryVideosStarted = false;

function setStatus(message) {
  statusText.textContent = message;
  document.body.dataset.sceneStatus = message;
}

function setHudVisible(visible) {
  hud.classList.toggle('active', visible);
}

function setMobileControlsVisible(visible) {
  const active = visible && isTouchDevice;
  document.body.classList.toggle('mobile-scene-active', active);
  if (!active) {
    document.body.classList.remove('mobile-guide-engaged');
  }
}

function resetPlayerInput() {
  input.forward = false;
  input.backward = false;
  input.left = false;
  input.right = false;
  input.sprint = false;
  mobileManualMoveInput.set(0, 0);
}

function createCanvasTexture(canvas, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createLimestoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext('2d');

  context.fillStyle = '#d8d5cb';
  context.fillRect(0, 0, canvas.width, canvas.height);

  let seed = 9127;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let index = 0; index < 3600; index += 1) {
    const shade = 176 + Math.round(random() * 48);
    context.fillStyle = `rgba(${shade}, ${shade}, ${shade - 5}, ${0.025 + random() * 0.055})`;
    const size = 0.5 + random() * 2.1;
    context.fillRect(random() * canvas.width, random() * canvas.height, size, size);
  }

  context.strokeStyle = 'rgba(99, 103, 100, 0.12)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(0, 384);
  context.lineTo(768, 384);
  context.moveTo(384, 0);
  context.lineTo(384, 768);
  context.stroke();
  return createCanvasTexture(canvas, 4.8, 6.2);
}

function createPlasterTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 384;
  const context = canvas.getContext('2d');
  context.fillStyle = '#eeeae1';
  context.fillRect(0, 0, canvas.width, canvas.height);

  let seed = 3923;
  for (let index = 0; index < 2400; index += 1) {
    seed = (seed * 48271) % 2147483647;
    const value = seed / 2147483647;
    const shade = value > 0.5 ? 255 : 132;
    context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.018)`;
    context.fillRect((seed * 13) % 384, (seed * 29) % 384, 1.2, 1.2);
  }
  return createCanvasTexture(canvas, 3.5, 1.5);
}

function createOakTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#9d7448');
  gradient.addColorStop(0.35, '#c39a69');
  gradient.addColorStop(0.72, '#ab7f50');
  gradient.addColorStop(1, '#d1ad7b');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 42; index += 1) {
    const y = (index / 42) * canvas.height;
    context.strokeStyle = `rgba(74, 47, 27, ${0.06 + (index % 5) * 0.012})`;
    context.lineWidth = 1 + (index % 3) * 0.4;
    context.beginPath();
    context.moveTo(0, y);
    for (let x = 0; x <= canvas.width; x += 24) {
      context.lineTo(x, y + Math.sin(x * 0.035 + index) * 2.6);
    }
    context.stroke();
  }
  return createCanvasTexture(canvas, 2.2, 1);
}

function createPlacardTexture(title, category, accent) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 260;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f7f5ef';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = accent;
  context.fillRect(0, 0, 16, canvas.height);
  context.fillStyle = '#202522';
  context.font = '600 48px Segoe UI, Arial, sans-serif';
  context.fillText(title, 54, 88);
  context.fillStyle = '#636963';
  context.font = '400 30px Segoe UI, Arial, sans-serif';
  context.fillText(category, 54, 142);
  context.fillStyle = '#777d77';
  context.font = '600 20px Segoe UI, Arial, sans-serif';
  context.fillText(`${interactionVerb} OR WALK INTO THE WORK`, 54, 204);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createContactPlacardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 540;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  context.fillStyle = '#f6f3ea';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#c88d56';
  context.fillRect(0, 0, canvas.width, 18);
  context.fillStyle = '#1f2522';
  context.font = '600 62px Segoe UI, Arial, sans-serif';
  context.fillText('CONTACT', 44, 112);
  context.strokeStyle = '#c8c4ba';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(44, 154);
  context.lineTo(496, 154);
  context.stroke();
  context.fillStyle = '#3f4742';
  context.font = '500 36px Segoe UI, Arial, sans-serif';
  context.fillText('Stephen Campbell', 44, 232);
  context.fillStyle = '#767c76';
  context.font = '400 27px Segoe UI, Arial, sans-serif';
  context.fillText('WEB + INTERACTIVE', 44, 286);
  context.fillText('PROJECT INQUIRIES', 44, 330);
  context.fillStyle = '#292f2b';
  context.font = '500 25px Segoe UI, Arial, sans-serif';
  context.fillText('campbell.t.stephen', 44, 430);
  context.fillText('@gmail.com', 44, 470);
  context.fillStyle = '#a66d3f';
  context.font = '600 25px Segoe UI, Arial, sans-serif';
  context.fillText(`${interactionVerb} OR WALK THROUGH`, 44, 626);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function drawPortraitCrop(context, image) {
  const { canvas } = context;
  const sourceX = image.width * 0.39;
  const sourceWidth = image.width * 0.59;
  const sourceHeight = sourceWidth / (canvas.width / canvas.height);
  const sourceY = image.height * 0.03;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    Math.min(sourceHeight, image.height - sourceY),
    0,
    0,
    canvas.width,
    canvas.height,
  );

  // Preserve the original person and gesture while replacing the slogan fragment
  // that overlaps this crop with an untouched strip of the same etched concrete.
  context.save();
  context.filter = 'blur(2px)';
  context.drawImage(
    image,
    0,
    sourceY,
    image.width * 0.055,
    image.height * 0.46,
    -4,
    -4,
    canvas.width * 0.31,
    canvas.height * 0.5,
  );
  context.restore();
}

function createPortraitCropTexture(sourceTexture) {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 600;
  drawPortraitCrop(canvas.getContext('2d'), sourceTexture.image);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createSeededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function applySkyboxTexture(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  scene.background = texture;
  scene.backgroundRotation.set(0, Math.PI * 0.08, 0);
}

function createCylinderBetween(start, end, radius, material, taper = 0.72) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * taper, radius, direction.length(), 7),
    material,
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

function createExteriorTree(config, materials, foliageGeometry) {
  const random = createSeededRandom(config.seed);
  const group = new THREE.Group();
  const branchEnds = [];
  const height = 3.05 * config.scale;
  const trunkTop = new THREE.Vector3(
    (random() - 0.5) * 0.2,
    height,
    (random() - 0.5) * 0.2,
  );
  const trunk = createCylinderBetween(
    new THREE.Vector3(0, 0, 0),
    trunkTop,
    0.2 * config.scale,
    materials.bark,
    0.58,
  );
  group.add(trunk);

  for (let index = 0; index < 4; index += 1) {
    const angle = random() * Math.PI * 2;
    const branchStart = trunkTop.clone().multiplyScalar(0.55 + random() * 0.2);
    const branchEnd = trunkTop.clone().add(new THREE.Vector3(
      Math.cos(angle) * (0.72 + random() * 0.5) * config.scale,
      (-0.08 + random() * 0.52) * config.scale,
      Math.sin(angle) * (0.72 + random() * 0.5) * config.scale,
    ));
    branchEnds.push(branchEnd);
    group.add(createCylinderBetween(
      branchStart,
      branchEnd,
      0.075 * config.scale,
      materials.bark,
      0.52,
    ));
  }

  const foliageCount = 10 + Math.floor(random() * 4);
  for (let index = 0; index < foliageCount; index += 1) {
    const foliage = new THREE.Mesh(
      foliageGeometry,
      materials.leaves[(config.palette + index) % materials.leaves.length],
    );
    if (index < branchEnds.length) {
      foliage.position.copy(branchEnds[index]).add(new THREE.Vector3(
        (random() - 0.5) * 0.08 * config.scale,
        random() * 0.08 * config.scale,
        (random() - 0.5) * 0.08 * config.scale,
      ));
    } else if (npc.idleArm && npc.idleArmQuaternion) {
      const angle = random() * Math.PI * 2;
      const radius = (0.22 + random() * 0.92) * config.scale;
      foliage.position.copy(trunkTop).add(new THREE.Vector3(
        Math.cos(angle) * radius,
        (-0.1 + random() * 0.92) * config.scale,
        Math.sin(angle) * radius,
      ));
    }
    const size = (0.42 + random() * 0.34) * config.scale;
    foliage.scale.set(size * (0.9 + random() * 0.35), size, size * (0.82 + random() * 0.32));
    foliage.rotation.set(random() * 0.5, random() * Math.PI, random() * 0.35);
    group.add(foliage);
  }

  group.position.copy(config.position);
  group.rotation.y = config.rotation;
  setMeshShadows(group, true, false);
  scene.add(group);
}

function createCloudMaterial(color, shadowColor, opacity) {
  const marchSteps = isTouchDevice ? 14 : 20;
  return new THREE.ShaderMaterial({
    uniforms: {
      cloudColor: { value: new THREE.Color(color) },
      cloudShadow: { value: new THREE.Color(shadowColor) },
      cloudOpacity: { value: opacity },
      cloudSeed: { value: 0 },
      cameraLocal: { value: new THREE.Vector3() },
    },
    vertexShader: `
      varying vec3 vLocalPosition;
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 cloudColor;
      uniform vec3 cloudShadow;
      uniform float cloudOpacity;
      uniform float cloudSeed;
      uniform vec3 cameraLocal;
      varying vec3 vLocalPosition;

      float ellipsoidField(vec3 point, vec3 center, vec3 radii) {
        return 1.0 - length((point - center) / radii);
      }

      float cloudDetail(vec3 point) {
        vec3 broad = point * vec3(4.1, 5.0, 4.4) + cloudSeed;
        float first = sin(broad.x + sin(broad.z * 0.73))
          * sin(broad.y * 0.82 - broad.z * 0.61);
        vec3 fine = point * vec3(8.3, 9.1, 7.7) - cloudSeed * 1.7;
        float second = sin(fine.x - fine.y * 0.37 + sin(fine.z));
        return first * 0.68 + second * 0.32;
      }

      float cloudDensity(vec3 point) {
        float sway = sin(cloudSeed * 2.31) * 0.07;
        float lift = cos(cloudSeed * 1.73) * 0.055;
        float field = ellipsoidField(
          point,
          vec3(0.0, -0.19, 0.0),
          vec3(0.82, 0.31, 0.55)
        );
        field = max(field, ellipsoidField(
          point,
          vec3(-0.42 + sway, -0.02, 0.05),
          vec3(0.53, 0.43, 0.49)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(0.43 + sway * 0.4, -0.01, -0.04),
          vec3(0.55, 0.41, 0.47)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(-0.04 - sway, 0.27 + lift, 0.0),
          vec3(0.52, 0.54, 0.48)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(-0.66, 0.07 + lift * 0.3, -0.03),
          vec3(0.27, 0.3, 0.34)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(0.66, 0.06 - lift * 0.2, 0.04),
          vec3(0.27, 0.29, 0.34)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(0.2 + sway, 0.16, -0.38),
          vec3(0.38, 0.36, 0.3)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(-0.3 - sway * 0.4, 0.26, 0.3),
          vec3(0.4, 0.39, 0.32)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(0.42, 0.2 + lift * 0.4, 0.25),
          vec3(0.35, 0.34, 0.3)
        ));
        field = max(field, ellipsoidField(
          point,
          vec3(-0.28 + sway, 0.08, -0.4),
          vec3(0.34, 0.31, 0.29)
        ));
        field += cloudDetail(point) * 0.135;
        field -= max(0.0, -0.42 - point.y) * 1.8;
        return smoothstep(-0.13, 0.13, field);
      }

      vec2 intersectCloudBounds(vec3 origin, vec3 direction) {
        vec3 safeDirection = direction + vec3(0.00001);
        vec3 inverseDirection = 1.0 / safeDirection;
        vec3 first = (-1.0 - origin) * inverseDirection;
        vec3 second = (1.0 - origin) * inverseDirection;
        vec3 nearPoint = min(first, second);
        vec3 farPoint = max(first, second);
        float nearDistance = max(max(nearPoint.x, nearPoint.y), nearPoint.z);
        float farDistance = min(min(farPoint.x, farPoint.y), farPoint.z);
        return vec2(nearDistance, farDistance);
      }

      float screenNoise(vec2 coordinate) {
        return fract(sin(dot(coordinate, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec3 rayDirection = normalize(vLocalPosition - cameraLocal);
        vec2 bounds = intersectCloudBounds(cameraLocal, rayDirection);
        float nearDistance = max(bounds.x, 0.0);
        float travelDistance = max(0.0, bounds.y - nearDistance);
        if (travelDistance <= 0.0) discard;

        float stepLength = travelDistance / float(${marchSteps});
        float jitter = (screenNoise(gl_FragCoord.xy + cloudSeed) - 0.5) * stepLength;
        vec3 accumulatedColor = vec3(0.0);
        float accumulatedAlpha = 0.0;

        for (int index = 0; index < ${marchSteps}; index++) {
          float sampleDistance = nearDistance + jitter + (float(index) + 0.5) * stepLength;
          vec3 samplePoint = cameraLocal + rayDirection * sampleDistance;
          float density = cloudDensity(samplePoint);
          float crownLight = smoothstep(-0.48, 0.72, samplePoint.y);
          float directionalLight = clamp(
            0.52 + samplePoint.y * 0.18 - samplePoint.x * 0.08 - samplePoint.z * 0.04,
            0.0,
            1.0
          );
          float lightAmount = clamp(0.48 + crownLight * 0.34 + directionalLight * 0.18
            - density * 0.08, 0.0, 1.0);
          vec3 sampleColor = mix(cloudShadow, cloudColor, lightAmount);
          float sampleAlpha = (1.0 - exp(-density * stepLength * 3.4)) * cloudOpacity;
          float contribution = (1.0 - accumulatedAlpha) * sampleAlpha;
          accumulatedColor += sampleColor * contribution;
          accumulatedAlpha += contribution;
        }

        if (accumulatedAlpha < 0.006) discard;
        gl_FragColor = vec4(
          accumulatedColor / max(accumulatedAlpha, 0.0001),
          accumulatedAlpha
        );
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
  });
}

function createExteriorCloud(config, materials, cloudGeometry) {
  const random = createSeededRandom(config.seed);
  const material = materials.clouds[config.seed % materials.clouds.length].clone();
  material.uniforms.cloudSeed.value = config.seed * 0.017;
  const cloud = new THREE.Mesh(
    cloudGeometry,
    material,
  );
  const width = 1.55 + Math.max(0, config.blobs - 5) * 0.08;
  const height = 0.72 + random() * 0.12;
  const depth = 1.12 + random() * 0.16;

  cloud.scale.set(
    width * config.scale * (config.widthScale || 1),
    height * config.scale,
    depth * config.scale,
  );
  cloud.rotation.set(
    (random() - 0.5) * 0.12,
    random() * Math.PI,
    (random() - 0.5) * 0.08,
  );
  cloud.rotation.y += config.rotation;
  cloud.position.copy(config.position);
  cloud.renderOrder = -2;
  cloud.onBeforeRender = () => {
    material.uniforms.cameraLocal.value.copy(camera.position);
    cloud.worldToLocal(material.uniforms.cameraLocal.value);
  };
  scene.add(cloud);
}

function createExteriorScenery(treeModels) {
  const trees = [
    // Rear wall: a loose four-tree grove with an open center-right view.
    { position: new THREE.Vector3(-9.1, 1.55, -19.1), height: 4.8, rotation: 0.35, model: 1 },
    { position: new THREE.Vector3(-5.8, 2.18, -19.4), height: 5.35, rotation: 2.2, model: 1 },
    { position: new THREE.Vector3(1.4, 1.48, -18.5), height: 5.95, rotation: 1.05, model: 1 },
    { position: new THREE.Vector3(8.2, 1.66, -20.0), height: 5.15, rotation: 2.72, model: 1 },
    { position: new THREE.Vector3(5.0, 2.04, -20.2), height: 4.9, rotation: 0.8, model: 3 },

    // Left wall: an uneven pair and a more distant solitary crown.
    { position: new THREE.Vector3(-16.3, 1.42, -9.7), height: 4.7, rotation: 2.4, model: 0 },
    { position: new THREE.Vector3(-19.2, 2.36, 7.1), height: 6.55, rotation: 0.7, model: 0 },
    { position: new THREE.Vector3(-17.6, 1.84, -3.4), height: 5.45, rotation: 1.65, model: 2 },

    // Right wall: staggered clusters at several depths instead of a continuous row.
    { position: new THREE.Vector3(16.4, 1.32, -11.2), height: 4.6, rotation: 2.8, model: 4 },
    { position: new THREE.Vector3(18.7, 2.08, -8.9), height: 5.95, rotation: 0.2, model: 4 },
    { position: new THREE.Vector3(17.1, 1.58, -3.2), height: 6.5, rotation: 1.8, model: 4 },
    { position: new THREE.Vector3(20.6, 2.48, 3.5), height: 5.4, rotation: 0.95, model: 4 },
    { position: new THREE.Vector3(16.5, 1.4, 10.8), height: 4.9, rotation: 2.45, model: 4 },
    { position: new THREE.Vector3(24.8, 2.82, -7.1), height: 6.1, rotation: 1.25, model: 0 },
    { position: new THREE.Vector3(18.2, 1.76, 6.6), height: 4.55, rotation: 2.05, model: 2 },

    // Front wall: two loose clusters with varied setbacks and an open central gap.
    { position: new THREE.Vector3(-8.6, 1.28, 18.2), height: 4.65, rotation: 0.45, model: 2 },
    { position: new THREE.Vector3(-2.4, 2.54, 22.1), height: 6.15, rotation: 2.9, model: 2 },
    { position: new THREE.Vector3(10.1, 1.72, 20.2), height: 6.45, rotation: 1.55, model: 2 },
    { position: new THREE.Vector3(-6.2, 1.86, 20.4), height: 5.3, rotation: 2.2, model: 1 },
    { position: new THREE.Vector3(0.4, 1.38, 20.8), height: 4.8, rotation: 0.3, model: 3 },
  ];
  trees.forEach((config) => {
    const source = treeModels.get(TREE_MODEL_URLS[config.model]);
    if (!source) return;

    const tree = source.scene.clone(true);
    tree.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(tree);
    const size = bounds.getSize(new THREE.Vector3());
    tree.scale.setScalar(config.height / Math.max(size.y, 0.001));
    tree.updateMatrixWorld(true);
    bounds.setFromObject(tree);
    tree.position.x -= (bounds.min.x + bounds.max.x) * 0.5;
    tree.position.y -= bounds.min.y;
    tree.position.z -= (bounds.min.z + bounds.max.z) * 0.5;
    const treeGroup = new THREE.Group();
    treeGroup.add(tree);
    treeGroup.position.copy(config.position);
    treeGroup.rotation.y = config.rotation;
    setMeshShadows(treeGroup, true, false);
    tree.traverse((child) => {
      if (child.isMesh && child.material?.map) {
        child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
    });
    scene.add(treeGroup);
  });
}

function createSunRay(start, width, opacity) {
  const sunDirection = SUN_TARGET.clone().sub(SUN_POSITION).normalize();
  const distanceToFloor = (0.14 - start.y) / sunDirection.y;
  const end = start.clone().addScaledVector(sunDirection, distanceToFloor);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const material = new THREE.ShaderMaterial({
    uniforms: {
      rayColor: { value: new THREE.Color('#fff0c8') },
      rayOpacity: { value: opacity },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 rayColor;
      uniform float rayOpacity;
      varying vec2 vUv;
      void main() {
        float centered = abs(vUv.x - 0.5) * 2.0;
        float sideFade = 1.0 - smoothstep(0.12, 1.0, centered);
        float entryFade = smoothstep(0.0, 0.34, vUv.y);
        float floorFade = 1.0 - smoothstep(0.48, 1.0, vUv.y);
        float variation = 0.94 + sin(vUv.y * 12.0) * 0.025;
        gl_FragColor = vec4(rayColor, rayOpacity * sideFade * entryFade * floorFade * variation);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });
  const group = new THREE.Group();
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, length), material);
  plane.renderOrder = 5;
  group.add(plane);
  group.position.copy(start).add(end).multiplyScalar(0.5);
  group.userData.rayDirection = direction.normalize();
  group.renderOrder = 5;
  scene.add(group);
  sunRayBeams.push(group);
}

function createSunRays() {
  createSunRay(new THREE.Vector3(-5.4, ROOM_HEIGHT + 0.1, 5.5), 4.7, 0.072);
  createSunRay(new THREE.Vector3(0.15, ROOM_HEIGHT + 0.1, 7.2), 3.9, 0.056);
  createSunRay(new THREE.Vector3(-2.8, ROOM_HEIGHT + 0.1, -0.4), 3.1, 0.044);
}

function updateSunRays() {
  const toCamera = new THREE.Vector3();
  const xAxis = new THREE.Vector3();
  const zAxis = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  for (const ray of sunRayBeams) {
    const direction = ray.userData.rayDirection;
    toCamera.copy(camera.position).sub(ray.position).normalize();
    xAxis.crossVectors(direction, toCamera).normalize();
    if (xAxis.lengthSq() < 0.001) {
      xAxis.set(1, 0, 0);
    }
    zAxis.crossVectors(xAxis, direction).normalize();
    basis.makeBasis(xAxis, direction, zAxis);
    ray.quaternion.setFromRotationMatrix(basis);
  }
}

function setMeshShadows(object, cast = true, receive = true) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function createClerestoryFrame(length, paneCount, position, rotationY, height, material) {
  const group = new THREE.Group();
  const edgeThickness = 0.14;
  const mullionThickness = 0.075;
  const depth = 0.14;
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(length, edgeThickness, depth),
    material,
  );
  const bottom = top.clone();
  top.position.y = height / 2 - edgeThickness / 2;
  bottom.position.y = -height / 2 + edgeThickness / 2;
  group.add(top, bottom);

  for (let index = 0; index <= paneCount; index += 1) {
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(mullionThickness, height, depth),
      material,
    );
    mullion.position.x = -length / 2 + (length * index) / paneCount;
    group.add(mullion);
  }

  group.position.copy(position);
  group.rotation.y = rotationY;
  scene.add(group);
  return group;
}

function createGlassPyramid(width, depth, baseY, rise, glassMaterial, frameMaterial) {
  const group = new THREE.Group();
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const apex = new THREE.Vector3(0, baseY + rise, 0);
  const corners = [
    new THREE.Vector3(-halfWidth, baseY, -halfDepth),
    new THREE.Vector3(halfWidth, baseY, -halfDepth),
    new THREE.Vector3(halfWidth, baseY, halfDepth),
    new THREE.Vector3(-halfWidth, baseY, halfDepth),
  ];
  const pyramidGlass = glassMaterial.clone();
  pyramidGlass.color.set('#d7edf1');
  pyramidGlass.opacity = 0.16;
  pyramidGlass.roughness = 0.08;

  for (let index = 0; index < corners.length; index += 1) {
    const nextIndex = (index + 1) % corners.length;
    const geometry = new THREE.BufferGeometry().setFromPoints([
      corners[index],
      corners[nextIndex],
      apex,
    ]);
    geometry.computeVertexNormals();
    const pane = new THREE.Mesh(geometry, pyramidGlass);
    pane.renderOrder = -1;
    pane.castShadow = false;
    pane.receiveShadow = false;
    group.add(pane);
  }

  const panelDivisions = 4;
  const latticePositions = [];
  for (let index = 0; index < corners.length; index += 1) {
    const nextIndex = (index + 1) % corners.length;
    const faceStart = corners[index];
    const faceEnd = corners[nextIndex];
    const getPanelPoint = (alongBase, towardApex) => (
      faceStart.clone()
        .multiplyScalar((panelDivisions - alongBase - towardApex) / panelDivisions)
        .addScaledVector(faceEnd, alongBase / panelDivisions)
        .addScaledVector(apex, towardApex / panelDivisions)
    );
    const addLatticeSegment = (start, end) => {
      latticePositions.push(...start.toArray(), ...end.toArray());
    };

    for (let alongBase = 0; alongBase <= panelDivisions; alongBase += 1) {
      for (
        let towardApex = 0;
        towardApex <= panelDivisions - alongBase;
        towardApex += 1
      ) {
        const point = getPanelPoint(alongBase, towardApex);
        if (alongBase + towardApex < panelDivisions) {
          addLatticeSegment(point, getPanelPoint(alongBase + 1, towardApex));
          addLatticeSegment(point, getPanelPoint(alongBase, towardApex + 1));
        }
        if (alongBase > 0) {
          addLatticeSegment(point, getPanelPoint(alongBase - 1, towardApex + 1));
        }
      }
    }
  }

  const latticeGeometry = new THREE.BufferGeometry();
  latticeGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(latticePositions, 3),
  );
  const lattice = new THREE.LineSegments(
    latticeGeometry,
    new THREE.LineBasicMaterial({
      color: '#46514f',
      transparent: true,
      opacity: 0.76,
    }),
  );
  lattice.renderOrder = 1;
  group.add(lattice);

  const structuralFrames = [];
  for (let index = 0; index < corners.length; index += 1) {
    structuralFrames.push([corners[index], corners[(index + 1) % corners.length]]);
    structuralFrames.push([corners[index], apex]);
  }
  structuralFrames.forEach(([start, end]) => {
    const frame = createCylinderBetween(start, end, 0.055, frameMaterial, 1);
    frame.castShadow = true;
    frame.receiveShadow = true;
    group.add(frame);
  });

  const apexCap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), frameMaterial);
  apexCap.position.copy(apex);
  apexCap.castShadow = true;
  group.add(apexCap);
  scene.add(group);
}

function createGalleryShell(materials) {
  const {
    floorMaterial,
    wallMaterial,
    trimMaterial,
    glassMaterial,
  } = materials;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallHeight = CLERESTORY_SILL_Y;
  const wallY = wallHeight / 2;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, wallHeight, 0.25), wallMaterial);
  const entranceOpeningWidth = 4.8;
  const frontWallLeftWidth = DOOR_X - entranceOpeningWidth / 2 + ROOM_HALF_WIDTH;
  const frontWallRightWidth = ROOM_WIDTH - frontWallLeftWidth - entranceOpeningWidth;
  const frontWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(frontWallLeftWidth, wallHeight, 0.25),
    wallMaterial,
  );
  const frontWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(frontWallRightWidth, wallHeight, 0.25),
    wallMaterial,
  );
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, wallHeight, ROOM_DEPTH), wallMaterial);
  const rightWall = leftWall.clone();
  backWall.position.set(0, wallY, -ROOM_HALF_DEPTH);
  frontWallLeft.position.set(-ROOM_HALF_WIDTH + frontWallLeftWidth / 2, wallY, ROOM_HALF_DEPTH);
  frontWallRight.position.set(ROOM_HALF_WIDTH - frontWallRightWidth / 2, wallY, ROOM_HALF_DEPTH);
  leftWall.position.set(-ROOM_HALF_WIDTH, wallY, 0);
  rightWall.position.set(ROOM_HALF_WIDTH, wallY, 0);
  scene.add(backWall, frontWallLeft, frontWallRight, leftWall, rightWall);

  const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, 0.16, 0.13), trimMaterial);
  const baseboardFrontLeft = new THREE.Mesh(
    new THREE.BoxGeometry(frontWallLeftWidth, 0.16, 0.13),
    trimMaterial,
  );
  const baseboardFrontRight = new THREE.Mesh(
    new THREE.BoxGeometry(frontWallRightWidth, 0.16, 0.13),
    trimMaterial,
  );
  const baseboardLeft = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, ROOM_DEPTH), trimMaterial);
  const baseboardRight = baseboardLeft.clone();
  baseboardBack.position.set(0, 0.08, -ROOM_HALF_DEPTH + 0.15);
  baseboardFrontLeft.position.set(-ROOM_HALF_WIDTH + frontWallLeftWidth / 2, 0.08, ROOM_HALF_DEPTH - 0.15);
  baseboardFrontRight.position.set(ROOM_HALF_WIDTH - frontWallRightWidth / 2, 0.08, ROOM_HALF_DEPTH - 0.15);
  baseboardLeft.position.set(-ROOM_HALF_WIDTH + 0.15, 0.08, 0);
  baseboardRight.position.set(ROOM_HALF_WIDTH - 0.15, 0.08, 0);
  scene.add(baseboardBack, baseboardFrontLeft, baseboardFrontRight, baseboardLeft, baseboardRight);

  const clerestoryHeight = ROOM_HEIGHT - wallHeight;
  const clerestoryY = wallHeight + clerestoryHeight / 2;
  const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, clerestoryHeight), glassMaterial);
  const frontGlass = backGlass.clone();
  const leftGlass = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, clerestoryHeight), glassMaterial);
  const rightGlass = leftGlass.clone();
  backGlass.position.set(0, clerestoryY, -ROOM_HALF_DEPTH + 0.14);
  frontGlass.position.set(0, clerestoryY, ROOM_HALF_DEPTH - 0.14);
  frontGlass.rotation.y = Math.PI;
  leftGlass.position.set(-ROOM_HALF_WIDTH + 0.14, clerestoryY, 0);
  leftGlass.rotation.y = Math.PI / 2;
  rightGlass.position.set(ROOM_HALF_WIDTH - 0.14, clerestoryY, 0);
  rightGlass.rotation.y = -Math.PI / 2;
  scene.add(backGlass, frontGlass, leftGlass, rightGlass);

  createClerestoryFrame(
    ROOM_WIDTH,
    6,
    new THREE.Vector3(0, clerestoryY, -ROOM_HALF_DEPTH + 0.08),
    0,
    clerestoryHeight,
    trimMaterial,
  );
  createClerestoryFrame(
    ROOM_WIDTH,
    6,
    new THREE.Vector3(0, clerestoryY, ROOM_HALF_DEPTH - 0.08),
    Math.PI,
    clerestoryHeight,
    trimMaterial,
  );
  createClerestoryFrame(
    ROOM_DEPTH,
    8,
    new THREE.Vector3(-ROOM_HALF_WIDTH + 0.08, clerestoryY, 0),
    Math.PI / 2,
    clerestoryHeight,
    trimMaterial,
  );
  createClerestoryFrame(
    ROOM_DEPTH,
    8,
    new THREE.Vector3(ROOM_HALF_WIDTH - 0.08, clerestoryY, 0),
    -Math.PI / 2,
    clerestoryHeight,
    trimMaterial,
  );

  const roofDepth = SKYLIGHT_END_BORDER;
  const roofSideWidth = SKYLIGHT_SIDE_BORDER;
  const roofFront = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, 0.22, roofDepth), wallMaterial);
  const roofBack = roofFront.clone();
  const roofLeft = new THREE.Mesh(
    new THREE.BoxGeometry(roofSideWidth, 0.22, ROOM_DEPTH - roofDepth * 2),
    wallMaterial,
  );
  const roofRight = roofLeft.clone();
  roofFront.position.set(0, ROOM_HEIGHT, ROOM_HALF_DEPTH - roofDepth / 2);
  roofBack.position.set(0, ROOM_HEIGHT, -ROOM_HALF_DEPTH + roofDepth / 2);
  roofLeft.position.set(-ROOM_HALF_WIDTH + roofSideWidth / 2, ROOM_HEIGHT, 0);
  roofRight.position.set(ROOM_HALF_WIDTH - roofSideWidth / 2, ROOM_HEIGHT, 0);
  scene.add(roofFront, roofBack, roofLeft, roofRight);

  createGlassPyramid(
    ROOM_WIDTH - roofSideWidth * 2,
    ROOM_DEPTH - roofDepth * 2,
    ROOM_HEIGHT + 0.02,
    3.8,
    glassMaterial,
    trimMaterial,
  );

  setMeshShadows(backWall, true, true);
  setMeshShadows(frontWallLeft, true, true);
  setMeshShadows(frontWallRight, true, true);
  setMeshShadows(leftWall, true, true);
  setMeshShadows(rightWall, true, true);
  setMeshShadows(roofFront, true, true);
  setMeshShadows(roofBack, true, true);
  setMeshShadows(roofLeft, true, true);
  setMeshShadows(roofRight, true, true);
}

function attachInteraction(mesh, interaction) {
  mesh.userData.interaction = interaction;
  interactiveMeshes.push(mesh);
}

function createArtwork(project, previewTexture) {
  const group = new THREE.Group();
  const isSilverFrame = project.title === 'The Star Cats';
  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: project.accent,
    emissive: project.accent,
    emissiveIntensity: isSilverFrame ? 0.025 : 0.045,
    metalness: isSilverFrame ? 0.88 : 0.18,
    roughness: isSilverFrame ? 0.14 : 0.34,
    clearcoat: isSilverFrame ? 0.75 : 0,
    clearcoatRoughness: isSilverFrame ? 0.1 : 0,
  });
  const matMaterial = new THREE.MeshStandardMaterial({
    color: '#f8f6f0',
    roughness: 0.78,
    metalness: 0,
  });
  const screenMaterial = new THREE.MeshBasicMaterial({
    map: previewTexture,
    color: '#ffffff',
    toneMapped: false,
    side: THREE.DoubleSide,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0.075,
    roughness: 0.08,
    metalness: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const outerWidth = ARTWORK_WIDTH + 0.46;
  const outerHeight = ARTWORK_HEIGHT + 0.46;
  const rail = 0.18;
  const depth = 0.19;
  const top = new THREE.Mesh(new THREE.BoxGeometry(outerWidth, rail, depth), frameMaterial);
  const bottom = top.clone();
  const left = new THREE.Mesh(new THREE.BoxGeometry(rail, outerHeight, depth), frameMaterial);
  const right = left.clone();
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(outerWidth - 0.18, outerHeight - 0.18), matMaterial);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(ARTWORK_WIDTH, ARTWORK_HEIGHT), screenMaterial);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(ARTWORK_WIDTH, ARTWORK_HEIGHT), glassMaterial);

  top.position.set(0, outerHeight / 2 - rail / 2, 0.08);
  bottom.position.set(0, -outerHeight / 2 + rail / 2, 0.08);
  left.position.set(-outerWidth / 2 + rail / 2, 0, 0.08);
  right.position.set(outerWidth / 2 - rail / 2, 0, 0.08);
  backing.position.z = 0.03;
  screen.position.z = 0.13;
  glass.position.z = 0.145;
  glass.renderOrder = 3;

  const placardTexture = createPlacardTexture(project.title, project.category, project.accent);
  const placard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.15, 0.72),
    new THREE.MeshBasicMaterial({ map: placardTexture, toneMapped: false }),
  );
  placard.position.set(outerWidth / 2 + 1.38, -0.52, 0.12);

  const interaction = {
    type: 'project',
    project,
    group,
    frameMaterial,
    screenMaterial,
    video: null,
    videoTexture: null,
    horizontalPosition: new THREE.Vector2(project.position.x, project.position.z),
  };

  for (const mesh of [
    top,
    bottom,
    left,
    right,
    screen,
    glass,
    placard,
  ]) {
    attachInteraction(mesh, interaction);
  }

  group.add(top, bottom, left, right, backing, screen, glass, placard);
  group.position.copy(project.position);
  group.rotation.y = project.rotationY;
  group.name = `${project.title} artwork`;
  setMeshShadows(group, true, true);
  screen.castShadow = false;
  glass.castShadow = false;
  scene.add(group);
  interactions.push(interaction);
  artworks.push(interaction);

  const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), project.rotationY);
  const artworkLight = new THREE.SpotLight('#fff3de', 0.72, 10, Math.PI / 4.8, 0.78, 1.5);
  artworkLight.position.copy(project.position).addScaledVector(normal, 2.6);
  artworkLight.position.y = 5.95;
  artworkLight.target.position.copy(project.position);
  scene.add(artworkLight, artworkLight.target);

  return interaction;
}

function createNpcMaterial(color, roughness = 0.76, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    flatShading: true,
  });
}

function addNpcMesh(parent, geometry, material, position, rotation = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (rotation) {
    mesh.rotation.set(...rotation);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function traceRoundedRectangle(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function getWrappedTextLines(context, text, maxWidth) {
  const lines = [];
  let currentLine = '';

  for (const word of text.split(' ')) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawNpcSpeechBubble(canvas, config, dialogue) {
  const width = 920;
  const height = 340;
  const pixelScale = 1.5;
  const context = canvas.getContext('2d');
  const bubbleColor = '#fbfaf5';

  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);

  context.save();
  context.shadowColor = 'rgba(38, 43, 40, 0.2)';
  context.shadowBlur = 18;
  context.shadowOffsetY = 9;
  context.fillStyle = bubbleColor;
  context.beginPath();
  context.moveTo(430, 282);
  context.lineTo(468, 330);
  context.lineTo(512, 282);
  context.closePath();
  context.fill();
  traceRoundedRectangle(context, 18, 16, 884, 278, 26);
  context.fill();
  context.restore();

  traceRoundedRectangle(context, 18, 16, 884, 278, 26);
  context.strokeStyle = config.accent;
  context.lineWidth = 6;
  context.stroke();
  context.fillStyle = config.accent;
  context.fillRect(18, 42, 11, 226);

  context.fillStyle = '#242a27';
  context.font = '700 35px Segoe UI, Arial, sans-serif';
  context.fillText(config.name.toUpperCase(), 60, 73);
  const nameWidth = context.measureText(config.name.toUpperCase()).width;
  context.fillStyle = config.accent;
  context.font = '700 20px Segoe UI, Arial, sans-serif';
  context.fillText(config.personality, 76 + nameWidth, 70);

  context.fillStyle = '#3d4541';
  context.font = '500 29px Segoe UI, Arial, sans-serif';
  const lines = getWrappedTextLines(context, dialogue, 790);
  lines.forEach((line, index) => {
    context.fillText(line, 60, 126 + index * 39);
  });

  context.setTransform(1, 0, 0, 1, 0, 0);
}

function createNpcSpeechBubble(config) {
  const canvas = document.createElement('canvas');
  canvas.width = 1380;
  canvas.height = 510;
  drawNpcSpeechBubble(canvas, config, config.lines[0]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });
  const bubble = new THREE.Sprite(material);
  bubble.center.set(0.5, 0);
  bubble.position.set(0, 1.92, 0);
  if (isTouchDevice) {
    bubble.scale.set(1.75, 0.647, 1);
  } else {
    bubble.scale.set(3.45, 1.275, 1);
  }
  bubble.renderOrder = 12;
  bubble.visible = false;
  return { bubble, material, canvas, texture };
}

function createMobileNpcSpeechBubble(config) {
  const element = document.createElement('aside');
  const header = document.createElement('div');
  const name = document.createElement('strong');
  const personality = document.createElement('span');
  const dialogue = document.createElement('p');

  element.className = 'mobile-npc-bubble';
  element.style.setProperty('--npc-accent', config.accent);
  header.className = 'mobile-npc-bubble__header';
  name.textContent = config.name.toUpperCase();
  personality.textContent = config.personality;
  dialogue.textContent = config.lines[0];
  header.append(name, personality);
  element.append(header, dialogue);
  document.body.appendChild(element);

  return { element, dialogue };
}

function createNpcHoverPrompt() {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(251, 250, 245, 0.98)';
  context.strokeStyle = '#343a37';
  context.lineWidth = 5;
  context.beginPath();
  context.roundRect(18, 12, 156, 82, 18);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(82, 93);
  context.lineTo(96, 113);
  context.lineTo(110, 93);
  context.closePath();
  context.fill();
  context.stroke();
  context.fillStyle = '#303633';
  context.font = '700 48px Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('...', 96, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const prompt = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  }));
  prompt.center.set(0.5, 0.08);
  prompt.scale.set(0.58, 0.39, 1);
  prompt.renderOrder = 20;
  prompt.visible = false;
  return prompt;
}

function createImportedGalleryNpc(config, gltf) {
  const project = GALLERY_PROJECTS[config.projectIndex];
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group();
  const model = gltf.scene;
  bodyRoot.add(model);
  group.add(bodyRoot);

  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const modelScale = 1.86 / Math.max(size.y, 0.001);
  model.scale.multiplyScalar(modelScale);
  model.updateMatrixWorld(true);
  bounds.setFromObject(model);
  model.position.x -= (bounds.min.x + bounds.max.x) * 0.5;
  model.position.y -= bounds.min.y;
  model.position.z -= (bounds.min.z + bounds.max.z) * 0.5;

  const headPivot = new THREE.Object3D();
  headPivot.position.y = 1.83;
  group.add(headPivot);
  const bubbleAnchor = headPivot;

  const {
    bubble,
    material: bubbleMaterial,
    canvas: bubbleCanvas,
    texture: bubbleTexture,
  } = createNpcSpeechBubble(config);
  const mobileBubble = createMobileNpcSpeechBubble(config);
  bubble.position.y = 2.06;
  group.add(bubble);

  const localOffset = new THREE.Vector3(config.offset[0], 0, config.offset[1]);
  localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), project.rotationY);
  group.position.set(
    project.position.x + localOffset.x,
    0,
    project.position.z + localOffset.z,
  );
  const directionToArtwork = new THREE.Vector3(
    project.position.x - group.position.x,
    0,
    project.position.z - group.position.z,
  ).normalize();
  group.rotation.y = Math.atan2(directionToArtwork.x, directionToArtwork.z);
  group.scale.setScalar(config.scale);
  group.name = `${config.name}, ${project.title} visitor`;

  let mixer = null;
  if (gltf.animations.length) {
    const idleClip = gltf.animations.reduce((longest, clip) => (
      !longest || clip.duration > longest.duration ? clip : longest
    ), null);
    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(idleClip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
    mixer.setTime(config.phase % Math.max(idleClip.duration, 0.001));
  }

  const npc = {
    config,
    group,
    bodyRoot,
    headPivot,
    bubbleAnchor,
    eyes: [],
    idleArm: null,
    idleArmQuaternion: null,
    armSwayQuaternion: new THREE.Quaternion(),
    mixer,
    bubble,
    bubbleMaterial,
    bubbleCanvas,
    bubbleTexture,
    mobileBubble,
    bubbleBaseScale: bubble.scale.clone(),
    bubbleBaseY: bubble.position.y,
    dialogueIndex: -1,
    speechUntil: 0,
    nextBumpAt: 0,
    nextInteractionAt: 0,
    horizontalPosition: new THREE.Vector2(group.position.x, group.position.z),
  };
  const interaction = {
    type: 'npc',
    npc,
    group,
    horizontalPosition: npc.horizontalPosition,
  };
  npc.interaction = interaction;
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.frustumCulled = false;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = false;
      material.opacity = 1;
      material.alphaTest = 0;
      material.depthWrite = true;
      material.side = THREE.DoubleSide;
      material.color?.set(0xffffff);
      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
      }
      material.needsUpdate = true;
    });
    attachInteraction(child, interaction);
  });

  propColliders.push({
    x: group.position.x,
    z: group.position.z,
    radius: 0.35 * config.scale,
    npc,
  });
  scene.add(group);
  npcs.push(npc);
  return npc;
}

function createGalleryNpc(config) {
  const project = GALLERY_PROJECTS[config.projectIndex];
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group();
  const skinMaterial = createNpcMaterial(config.skin, 0.82);
  const hairMaterial = createNpcMaterial(config.hair, 0.88);
  const topMaterial = createNpcMaterial(config.top, 0.72);
  const trouserMaterial = createNpcMaterial(config.trousers, 0.8);
  const shoeMaterial = createNpcMaterial(config.shoes, 0.7);
  const accentMaterial = createNpcMaterial(config.accent, 0.52, 0.08);
  const darkMaterial = createNpcMaterial('#202522', 0.62);
  const paperMaterial = createNpcMaterial('#efece3', 0.9);
  group.add(bodyRoot);

  addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.18, 0.12, 0.34), shoeMaterial, [-0.12, 0.07, 0.07]);
  addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.18, 0.12, 0.34), shoeMaterial, [0.12, 0.07, 0.07]);
  addNpcMesh(bodyRoot, new THREE.CylinderGeometry(0.072, 0.088, 0.66, 6), trouserMaterial, [-0.12, 0.46, 0]);
  addNpcMesh(bodyRoot, new THREE.CylinderGeometry(0.072, 0.088, 0.66, 6), trouserMaterial, [0.12, 0.46, 0]);
  addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.38, 0.18, 0.23), trouserMaterial, [0, 0.82, 0]);
  addNpcMesh(bodyRoot, new THREE.CylinderGeometry(0.265, 0.205, 0.58, 6), topMaterial, [0, 1.14, 0]);
  addNpcMesh(bodyRoot, new THREE.CylinderGeometry(0.066, 0.066, 0.12, 7), skinMaterial, [0, 1.47, 0]);

  const armPoses = {
    phone: {
      left: [-0.31, 0.95, 0.03],
      right: [0.13, 1.08, 0.255],
    },
    notebook: {
      left: [-0.12, 1.08, 0.255],
      right: [0.12, 1.08, 0.255],
    },
    camera: {
      left: [-0.13, 1.12, 0.27],
      right: [0.13, 1.12, 0.27],
    },
    tablet: {
      left: [-0.13, 1.06, 0.255],
      right: [0.13, 1.06, 0.255],
    },
  };
  const wrists = armPoses[config.pose];
  const leftArm = createCylinderBetween(
    new THREE.Vector3(-0.245, 1.35, 0),
    new THREE.Vector3(...wrists.left),
    0.066,
    topMaterial,
    0.84,
  );
  const rightArm = createCylinderBetween(
    new THREE.Vector3(0.245, 1.35, 0),
    new THREE.Vector3(...wrists.right),
    0.066,
    topMaterial,
    0.84,
  );
  leftArm.castShadow = true;
  rightArm.castShadow = true;
  bodyRoot.add(leftArm, rightArm);
  addNpcMesh(bodyRoot, new THREE.IcosahedronGeometry(0.074, 1), skinMaterial, wrists.left);
  addNpcMesh(bodyRoot, new THREE.IcosahedronGeometry(0.074, 1), skinMaterial, wrists.right);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.68, 0);
  bodyRoot.add(headPivot);
  const head = addNpcMesh(
    headPivot,
    new THREE.SphereGeometry(0.2, 8, 5),
    skinMaterial,
    [0, 0, 0],
  );
  head.scale.set(0.92, 1.13, 0.9);
  const hairThetaLength = {
    'high-bun': Math.PI * 0.46,
    'textured-crop': Math.PI * 0.4,
    'angular-bob': Math.PI * 0.49,
  }[config.hairStyle] || Math.PI * 0.56;
  const hair = addNpcMesh(
    headPivot,
    new THREE.SphereGeometry(0.207, 8, 4, 0, Math.PI * 2, 0, hairThetaLength),
    hairMaterial,
    [0, 0.015, -0.008],
  );
  hair.scale.set(0.95, 1.08, 0.92);
  const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: '#f6f1e6' });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: '#151916' });
  const eyeGeometry = new THREE.SphereGeometry(0.033, 8, 5);
  const pupilGeometry = new THREE.SphereGeometry(0.014, 7, 4);
  const leftEye = addNpcMesh(headPivot, eyeGeometry, eyeWhiteMaterial, [-0.068, 0.026, 0.18]);
  const rightEye = addNpcMesh(headPivot, eyeGeometry, eyeWhiteMaterial, [0.068, 0.026, 0.18]);
  leftEye.scale.set(1.08, 0.78, 0.42);
  rightEye.scale.set(1.08, 0.78, 0.42);
  const leftPupil = addNpcMesh(headPivot, pupilGeometry, pupilMaterial, [-0.068, 0.026, 0.207]);
  const rightPupil = addNpcMesh(headPivot, pupilGeometry, pupilMaterial, [0.068, 0.026, 0.207]);
  leftPupil.scale.z = 0.45;
  rightPupil.scale.z = 0.45;
  addNpcMesh(headPivot, new THREE.ConeGeometry(0.026, 0.07, 5), skinMaterial, [0, -0.018, 0.195], [Math.PI / 2, 0, 0]);
  addNpcMesh(headPivot, new THREE.BoxGeometry(0.075, 0.012, 0.012), darkMaterial, [0, -0.083, 0.176], [0, 0, -0.08]);

  if (config.hairStyle === 'high-bun') {
    addNpcMesh(headPivot, new THREE.IcosahedronGeometry(0.095, 1), hairMaterial, [0.035, 0.222, -0.095]);
    addNpcMesh(headPivot, new THREE.IcosahedronGeometry(0.062, 1), hairMaterial, [-0.04, 0.255, -0.09]);
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.045, 0.18, 0.055), hairMaterial, [-0.176, -0.015, 0]);
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.045, 0.18, 0.055), hairMaterial, [0.176, -0.015, 0]);
  } else if (config.hairStyle === 'textured-crop') {
    const cropTufts = [
      [-0.12, 0.155, 0.012, 0.065],
      [-0.04, 0.198, -0.006, 0.073],
      [0.048, 0.188, -0.012, 0.069],
      [0.126, 0.15, 0.01, 0.06],
    ];
    cropTufts.forEach(([x, y, z, radius]) => {
      const tuft = addNpcMesh(
        headPivot,
        new THREE.IcosahedronGeometry(radius, 1),
        hairMaterial,
        [x, y, z],
      );
      tuft.scale.set(1, 0.72, 0.92);
    });
  } else if (config.hairStyle === 'angular-bob') {
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.06, 0.27, 0.11), hairMaterial, [-0.177, -0.035, -0.005], [0, 0, -0.06]);
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.06, 0.27, 0.11), hairMaterial, [0.177, -0.035, -0.005], [0, 0, 0.06]);
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.27, 0.1, 0.08), hairMaterial, [0, 0.13, 0.075], [0, 0, -0.1]);
  }

  if (config.accessory === 'headphones') {
    addNpcMesh(
      headPivot,
      new THREE.TorusGeometry(0.225, 0.024, 4, 12, Math.PI),
      accentMaterial,
      [0, 0.012, -0.012],
    );
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.055, 0.12, 0.07), accentMaterial, [-0.22, -0.015, 0.005]);
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.055, 0.12, 0.07), accentMaterial, [0.22, -0.015, 0.005]);
    addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.125, 0.22, 0.035), darkMaterial, [0.13, 1.1, 0.285], [-0.08, 0, 0]);
    addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.095, 0.17, 0.008), accentMaterial, [0.13, 1.1, 0.307], [-0.08, 0, 0]);
  } else if (config.accessory === 'notebook') {
    addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.29, 0.35, 0.045), paperMaterial, [0, 1.09, 0.245], [0.04, 0, -0.05]);
    addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.025, 0.3, 0.052), accentMaterial, [-0.115, 1.09, 0.272], [0.04, 0, -0.05]);
  } else if (config.accessory === 'camera') {
    addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.3, 0.2, 0.13), darkMaterial, [0, 1.13, 0.24]);
    addNpcMesh(bodyRoot, new THREE.CylinderGeometry(0.072, 0.085, 0.09, 8), accentMaterial, [0, 1.13, 0.34], [Math.PI / 2, 0, 0]);
  } else if (config.accessory === 'glasses') {
    addNpcMesh(headPivot, new THREE.TorusGeometry(0.061, 0.009, 4, 10), darkMaterial, [-0.073, 0.022, 0.213]);
    addNpcMesh(headPivot, new THREE.TorusGeometry(0.061, 0.009, 4, 10), darkMaterial, [0.073, 0.022, 0.213]);
    addNpcMesh(headPivot, new THREE.BoxGeometry(0.045, 0.009, 0.009), darkMaterial, [0, 0.022, 0.213]);
    addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.32, 0.23, 0.035), darkMaterial, [0, 1.075, 0.285], [-0.08, 0, 0]);
    addNpcMesh(bodyRoot, new THREE.BoxGeometry(0.275, 0.185, 0.008), accentMaterial, [0, 1.075, 0.307], [-0.08, 0, 0]);
  }

  const {
    bubble,
    material: bubbleMaterial,
    canvas: bubbleCanvas,
    texture: bubbleTexture,
  } = createNpcSpeechBubble(config);
  const mobileBubble = createMobileNpcSpeechBubble(config);
  group.add(bubble);

  const localOffset = new THREE.Vector3(config.offset[0], 0, config.offset[1]);
  localOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), project.rotationY);
  group.position.set(
    project.position.x + localOffset.x,
    0,
    project.position.z + localOffset.z,
  );
  const directionToArtwork = new THREE.Vector3(
    project.position.x - group.position.x,
    0,
    project.position.z - group.position.z,
  ).normalize();
  group.rotation.y = Math.atan2(directionToArtwork.x, directionToArtwork.z);
  group.scale.setScalar(config.scale);
  group.name = `${config.name}, ${project.title} visitor`;

  const npc = {
    config,
    group,
    bodyRoot,
    headPivot,
    bubbleAnchor: headPivot,
    eyes: [leftEye, rightEye, leftPupil, rightPupil],
    idleArm: rightArm,
    idleArmQuaternion: rightArm.quaternion.clone(),
    armSwayQuaternion: new THREE.Quaternion(),
    bubble,
    bubbleMaterial,
    bubbleCanvas,
    bubbleTexture,
    mobileBubble,
    bubbleBaseScale: bubble.scale.clone(),
    bubbleBaseY: bubble.position.y,
    dialogueIndex: -1,
    speechUntil: 0,
    nextBumpAt: 0,
    nextInteractionAt: 0,
    horizontalPosition: new THREE.Vector2(group.position.x, group.position.z),
  };
  const interaction = {
    type: 'npc',
    npc,
    group,
    horizontalPosition: npc.horizontalPosition,
  };
  npc.interaction = interaction;
  bodyRoot.traverse((child) => {
    if (child.isMesh) {
      attachInteraction(child, interaction);
    }
  });

  propColliders.push({
    x: group.position.x,
    z: group.position.z,
    radius: 0.35 * config.scale,
    npc,
  });
  scene.add(group);
  npcs.push(npc);
  return npc;
}

function createGalleryNpcs(importedModels) {
  GALLERY_NPCS.forEach((config) => {
    if (config.model && importedModels.has(config.model)) {
      createImportedGalleryNpc(config, importedModels.get(config.model));
    } else {
      createGalleryNpc(config);
    }
  });
  npcHoverPrompt = createNpcHoverPrompt();
  scene.add(npcHoverPrompt);
}

function showNpcDialogue(npc) {
  const now = performance.now();
  for (const otherNpc of npcs) {
    if (otherNpc !== npc) {
      otherNpc.speechUntil = Math.min(otherNpc.speechUntil, now + 180);
    }
  }
  npc.dialogueIndex = (npc.dialogueIndex + 1) % npc.config.lines.length;
  const dialogue = npc.config.lines[npc.dialogueIndex];
  drawNpcSpeechBubble(npc.bubbleCanvas, npc.config, dialogue);
  npc.bubbleTexture.needsUpdate = true;
  if (npc.mobileBubble) {
    npc.mobileBubble.dialogue.textContent = dialogue;
  }
  npc.speechUntil = now + NPC_DIALOGUE_DURATION_MS;
  npc.bubble.visible = !npc.mobileBubble;
  setStatus(`${npc.config.name}: ${dialogue}`);
}

function showNpcDialogueOnBump(npc) {
  const now = performance.now();
  if (now < npc.nextBumpAt) {
    return;
  }
  npc.nextBumpAt = now + NPC_BUMP_COOLDOWN_MS;
  showNpcDialogue(npc);
}

function dismissNpcDialogues() {
  for (const npc of npcs) {
    npc.speechUntil = 0;
    npc.bubble.visible = false;
    npc.bubbleMaterial.opacity = 0;
    npc.mobileBubble?.element.classList.remove('active');
  }
}

function updateNpcs(deltaSeconds, elapsedSeconds) {
  const now = performance.now();
  for (const npc of npcs) {
    const speaking = overlay.hidden && now < npc.speechUntil;
    if (npc.mixer) {
      npc.mixer.update(deltaSeconds);
    } else {
      const breathing = Math.sin(elapsedSeconds * 1.45 + npc.config.phase);
      npc.bodyRoot.position.y = breathing * 0.004;
      npc.bodyRoot.scale.set(1, 1 + breathing * 0.008, 1);

      let targetHeadYaw = Math.sin(elapsedSeconds * 0.56 + npc.config.phase) * 0.045;
      if (speaking) {
        npcCameraDirection.copy(camera.position).sub(npc.group.position);
        const cameraYaw = Math.atan2(npcCameraDirection.x, npcCameraDirection.z);
        const relativeYaw = Math.atan2(
          Math.sin(cameraYaw - npc.group.rotation.y),
          Math.cos(cameraYaw - npc.group.rotation.y),
        );
        targetHeadYaw = THREE.MathUtils.clamp(relativeYaw, -0.9, 0.9);
      }
      npc.headPivot.rotation.y = THREE.MathUtils.damp(
        npc.headPivot.rotation.y,
        targetHeadYaw,
        speaking ? 5 : 2.4,
        deltaSeconds,
      );
      npc.headPivot.rotation.z = Math.sin(elapsedSeconds * 0.72 + npc.config.phase) * 0.012;

      const armSway = Math.sin(elapsedSeconds * 0.9 + npc.config.phase) * 0.018;
      npc.armSwayQuaternion.setFromAxisAngle(npcArmSwayAxis, armSway);
      npc.idleArm.quaternion.copy(npc.idleArmQuaternion).multiply(npc.armSwayQuaternion);

      const blinkPhase = (elapsedSeconds + npc.config.phase * 0.71) % 4.6;
      const eyeScaleY = blinkPhase > 4.47 ? 0.12 : 1;
      npc.eyes.forEach((eye) => {
        eye.scale.y = eyeScaleY;
      });
    }

    const targetOpacity = speaking ? 1 : 0;
    npc.bubbleMaterial.opacity = THREE.MathUtils.damp(
      npc.bubbleMaterial.opacity,
      targetOpacity,
      speaking ? 9 : 4.5,
      deltaSeconds,
    );
    const bubbleDistance = Math.hypot(
      camera.position.x - npc.group.position.x,
      camera.position.z - npc.group.position.z,
    );
    const distanceScale = THREE.MathUtils.clamp(bubbleDistance / 4.1, 0.24, 1.15);
    const bubbleScale = (0.94 + npc.bubbleMaterial.opacity * 0.06) * distanceScale;
    npc.bubble.scale.copy(npc.bubbleBaseScale).multiplyScalar(bubbleScale);
    npc.bubble.position.y = npc.bubbleBaseY
      + Math.sin(elapsedSeconds * 1.1 + npc.config.phase) * 0.008;
    if (!speaking && npc.bubbleMaterial.opacity < 0.008) {
      npc.bubble.visible = false;
    }

    if (npc.mobileBubble) {
      npc.bubbleAnchor.getWorldPosition(npcBubbleWorldPosition);
      npcBubbleWorldPosition.y += 0.07 * npc.config.scale;
      npcBubbleWorldPosition.project(camera);
      const bubbleOnScreen = npcBubbleWorldPosition.z > -1 && npcBubbleWorldPosition.z < 1;
      const screenX = (npcBubbleWorldPosition.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-npcBubbleWorldPosition.y * 0.5 + 0.5) * window.innerHeight;
      npc.mobileBubble.element.style.left = `${screenX}px`;
      npc.mobileBubble.element.style.top = `${screenY}px`;
      npc.mobileBubble.element.classList.toggle('active', speaking && bubbleOnScreen);
    }
  }
}

function createContactDoor(materials) {
  const group = new THREE.Group();
  const doorHeight = 3.18;
  const doorCenterY = doorHeight / 2;
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: '#202a2d',
    roughness: 0.28,
    metalness: 0.58,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: '#d9eef2',
    transparent: true,
    opacity: 0.2,
    roughness: 0.08,
    metalness: 0.03,
    transmission: 0.16,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const hardwareMaterial = new THREE.MeshStandardMaterial({
    color: '#9ca9ab',
    roughness: 0.22,
    metalness: 0.82,
  });
  const facadeMaterial = new THREE.MeshStandardMaterial({
    color: '#eee9df',
    roughness: 0.82,
  });

  const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.34, doorHeight, 0.055), glassMaterial);
  const rightDoor = leftDoor.clone();
  leftDoor.position.set(-0.69, doorCenterY, 0);
  rightDoor.position.set(0.69, doorCenterY, 0);
  const leftSidelight = new THREE.Mesh(new THREE.BoxGeometry(0.82, doorHeight, 0.045), glassMaterial);
  const rightSidelight = leftSidelight.clone();
  leftSidelight.position.set(-1.83, doorCenterY, 0.015);
  rightSidelight.position.set(1.83, doorCenterY, 0.015);

  const verticalFrameGeometry = new THREE.BoxGeometry(0.09, doorHeight + 0.08, 0.13);
  const verticalFrames = [-2.28, -1.4, 0, 1.4, 2.28].map((x) => {
    const frame = new THREE.Mesh(verticalFrameGeometry, frameMaterial);
    frame.position.set(x, doorCenterY, -0.035);
    return frame;
  });
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(4.65, 0.1, 0.13), frameMaterial);
  const bottomFrame = topFrame.clone();
  topFrame.position.set(0, doorHeight + 0.02, -0.035);
  bottomFrame.position.set(0, 0.05, -0.035);

  const pullLeft = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.72, 0.065), hardwareMaterial);
  const pullRight = pullLeft.clone();
  pullLeft.position.set(-0.14, 1.18, -0.13);
  pullRight.position.set(0.14, 1.18, -0.13);

  const soffit = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.34, 0.58), facadeMaterial);
  soffit.position.set(0, doorHeight + 0.3, 0.08);
  const soffitEdge = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.075, 0.08), frameMaterial);
  soffitEdge.position.set(0, doorHeight + 0.14, -0.22);

  const plaza = new THREE.Mesh(new THREE.BoxGeometry(12.5, 0.06, 9.5), materials.floorMaterial);
  plaza.position.set(0, -0.045, 4.35);
  plaza.receiveShadow = true;
  const walkway = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.065, 8.5), materials.floorMaterial);
  walkway.position.set(0, -0.01, 8.4);
  walkway.receiveShadow = true;

  const planterBaseMaterial = new THREE.MeshStandardMaterial({
    color: '#b8b8b1',
    roughness: 0.88,
  });
  const shrubMaterials = [
    new THREE.MeshStandardMaterial({ color: '#73952f', roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ color: '#91ad35', roughness: 0.92 }),
    new THREE.MeshStandardMaterial({ color: '#587b2d', roughness: 0.92 }),
  ];
  const planterMeshes = [];
  for (const side of [-1, 1]) {
    const planter = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.38, 3.4),
      planterBaseMaterial,
    );
    planter.position.set(side * 4.15, 0.18, 4.35);
    planterMeshes.push(planter);
    const shrubOffsets = [
      [-0.62, -1.0, 0.44],
      [0.1, -0.92, 0.5],
      [0.66, -0.48, 0.4],
      [-0.48, -0.12, 0.52],
      [0.32, 0.08, 0.46],
      [0.62, 0.72, 0.5],
      [-0.25, 1.02, 0.42],
    ];
    shrubOffsets.forEach(([offsetX, offsetZ, scale], index) => {
      const shrub = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.72, 1),
        shrubMaterials[index % shrubMaterials.length],
      );
      shrub.position.set(side * 4.15 + offsetX, 0.55, 4.35 + offsetZ);
      shrub.scale.set(scale * 1.35, scale, scale * 1.1);
      planterMeshes.push(shrub);
    });
  }

  group.add(
    leftDoor,
    rightDoor,
    leftSidelight,
    rightSidelight,
    ...verticalFrames,
    topFrame,
    bottomFrame,
    pullLeft,
    pullRight,
    soffit,
    soffitEdge,
    plaza,
    walkway,
    ...planterMeshes,
  );
  group.position.set(DOOR_X, 0, DOOR_Z);
  group.name = 'contact door';
  setMeshShadows(group, true, true);
  scene.add(group);

  const placard = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 1.92),
    new THREE.MeshBasicMaterial({ map: createContactPlacardTexture(), toneMapped: false }),
  );
  placard.position.set(DOOR_X + 3.35, 1.72, DOOR_Z - 0.12);
  placard.rotation.y = Math.PI;
  const placardBacking = new THREE.Mesh(
    new THREE.BoxGeometry(1.57, 2.04, 0.055),
    frameMaterial,
  );
  placardBacking.position.set(DOOR_X + 3.35, 1.72, DOOR_Z - 0.075);
  scene.add(placard, placardBacking);

  const interaction = {
    type: 'contact',
    group,
    frameMaterial,
    horizontalPosition: new THREE.Vector2(DOOR_X, DOOR_Z),
  };
  for (const mesh of [
    leftDoor,
    rightDoor,
    leftSidelight,
    rightSidelight,
    ...verticalFrames,
    topFrame,
    bottomFrame,
    pullLeft,
    pullRight,
    soffit,
    soffitEdge,
    placard,
    placardBacking,
  ]) {
    attachInteraction(mesh, interaction);
  }
  interactions.push(interaction);
}

function createBench(x, z, rotationY, materials) {
  const group = new THREE.Group();
  const seat = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.18, 0.7), materials.oakMaterial);
  const legLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.58, 0.5), materials.trimMaterial);
  const legRight = legLeft.clone();
  seat.position.y = 0.68;
  legLeft.position.set(-1.08, 0.3, 0);
  legRight.position.set(1.08, 0.3, 0);
  group.add(seat, legLeft, legRight);
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  setMeshShadows(group, true, true);
  scene.add(group);
  propColliders.push({
    type: 'box',
    x,
    z,
    halfWidth: 1.55,
    halfDepth: 0.35,
    rotationY,
  });
}

function createSculpture(materials) {
  const plinthHeight = 1.05;
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.05, 1.25), materials.plinthMaterial);
  plinth.position.set(0, plinthHeight / 2, -1.2);
  const sculpture = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.56, 0.14, isTouchDevice ? 64 : 96, 10, 2, 3),
    materials.sculptureMaterial,
  );
  sculpture.position.set(0, 0, -1.2);
  sculpture.rotation.set(0.3, 0.15, -0.18);
  sculpture.updateMatrixWorld(true);
  const sculptureBounds = new THREE.Box3().setFromObject(sculpture, true);
  sculpture.position.y = plinthHeight - sculptureBounds.min.y;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  sculpture.castShadow = true;
  sculpture.receiveShadow = true;
  scene.add(plinth, sculpture);
  propColliders.push({ x: 0, z: -1.2, radius: 0.82 });
  return sculpture;
}

function createLighting() {
  const hemisphere = new THREE.HemisphereLight('#f8fcff', '#a99d87', 1.35);
  const ambient = new THREE.AmbientLight('#fffaf0', 0.28);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.15);
  sun.position.copy(SUN_POSITION);
  sun.target.position.copy(SUN_TARGET);
  sun.castShadow = true;
  sun.shadow.mapSize.set(isTouchDevice ? 512 : 1024, isTouchDevice ? 512 : 1024);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 17;
  sun.shadow.camera.bottom = -17;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 42;
  sun.shadow.radius = isTouchDevice ? 4 : 8;
  sun.shadow.bias = -0.00035;
  const coolFill = new THREE.DirectionalLight('#d7ecf4', 0.58);
  coolFill.position.set(8, 9, -12);
  coolFill.target.position.set(0, 2, 0);
  scene.add(hemisphere, ambient, sun, sun.target, coolFill, coolFill.target);
}

function createGalleryMaterials() {
  const floorTexture = createLimestoneTexture();
  const plasterTexture = createPlasterTexture();
  const oakTexture = createOakTexture();
  return {
    oakTexture,
    floorMaterial: new THREE.MeshStandardMaterial({
      color: '#f3efe5',
      map: floorTexture,
      roughness: 0.72,
      metalness: 0.02,
    }),
    wallMaterial: new THREE.MeshStandardMaterial({
      color: '#fffdf8',
      map: plasterTexture,
      roughness: 0.86,
      metalness: 0,
    }),
    trimMaterial: new THREE.MeshStandardMaterial({
      color: '#606866',
      metalness: 0.65,
      roughness: 0.32,
    }),
    glassMaterial: new THREE.MeshPhysicalMaterial({
      color: '#dff1f4',
      transparent: true,
      opacity: 0.2,
      roughness: 0.14,
      metalness: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    oakMaterial: new THREE.MeshStandardMaterial({
      color: '#c49a69',
      map: oakTexture,
      roughness: 0.42,
      metalness: 0.02,
    }),
    plinthMaterial: new THREE.MeshStandardMaterial({
      color: '#e5e1d8',
      roughness: 0.78,
      metalness: 0,
    }),
    sculptureMaterial: new THREE.MeshStandardMaterial({
      color: '#6d827d',
      roughness: 0.28,
      metalness: 0.62,
    }),
  };
}

function horizontalDistance(position, interaction) {
  return Math.hypot(
    position.x - interaction.horizontalPosition.x,
    position.z - interaction.horizontalPosition.y,
  );
}

function getPointerFromEvent(event) {
  if (controls.isLocked) {
    pointer.set(0, 0);
    return;
  }
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

function raycastInteraction(event = null) {
  if (event) {
    getPointerFromEvent(event);
  } else {
    pointer.set(0, 0);
  }
  raycaster.setFromCamera(pointer, camera);
  raycaster.far = POINTER_INTERACTION_DISTANCE + 1.5;
  const hit = raycaster.intersectObjects(interactiveMeshes, false)[0];
  const interaction = hit?.object.userData.interaction ?? null;
  const allowedDistance = interaction?.type === 'npc'
    ? POINTER_INTERACTION_DISTANCE
    : INTERACTION_DISTANCE;
  if (
    !interaction
    || horizontalDistance(controls.object.position, interaction) > allowedDistance
  ) {
    return null;
  }
  return interaction;
}

function resetPlayerToSpawn() {
  controls.object.position.set(PLAYER_SPAWN_X, PLAYER_HEIGHT, PLAYER_SPAWN_Z);
  controls.object.rotation.set(0, PLAYER_SPAWN_YAW, 0);
  resetPlayerInput();
}

function activateInteraction(interaction) {
  if (interaction?.type === 'npc') {
    const now = performance.now();
    if (now < interaction.npc.nextInteractionAt) {
      return;
    }
    interaction.npc.nextInteractionAt = now + 350;
    showNpcDialogue(interaction.npc);
    return;
  }

  const now = performance.now();
  if (!interaction || now - lastActivationAt < ACTIVATION_COOLDOWN_MS) {
    return;
  }

  lastActivationAt = now;
  const url = interaction.type === 'contact' ? CONTACT_PAGE_URL : interaction.project.url;
  const label = interaction.type === 'contact' ? 'contact page' : interaction.project.title;
  resetPlayerToSpawn();
  const openedWindow = window.open(url, '_blank');

  if (openedWindow) {
    openedWindow.opener = null;
    setStatus(`${label} opened in a new tab.`);
  } else {
    setStatus(`Opening ${label}.`);
    window.location.assign(url);
  }
}

function checkWalkThroughInteractions(previousPosition, movingForward) {
  if (!movingForward) {
    return;
  }

  const position = controls.object.position;
  const localPosition = new THREE.Vector3();
  const previousLocalPosition = new THREE.Vector3();

  for (const artwork of artworks) {
    localPosition.copy(position);
    artwork.group.worldToLocal(localPosition);
    previousLocalPosition.copy(previousPosition);
    artwork.group.worldToLocal(previousLocalPosition);
    if (
      Math.abs(localPosition.x) <= ARTWORK_WIDTH * 0.49
      && localPosition.z >= 0.16
      && localPosition.z <= 0.7
      && localPosition.z < previousLocalPosition.z
    ) {
      activateInteraction(artwork);
      return;
    }
  }

  if (
    Math.abs(position.x - DOOR_X) <= 1.28
    && position.z >= ROOM_HALF_DEPTH - 0.72
    && position.z > previousPosition.z
  ) {
    activateInteraction(interactions.find((interaction) => interaction.type === 'contact'));
  }
}

function resolvePropCollisions(position) {
  for (const collider of propColliders) {
    if (collider.type === 'box') {
      const cosine = Math.cos(collider.rotationY);
      const sine = Math.sin(collider.rotationY);
      const offsetX = position.x - collider.x;
      const offsetZ = position.z - collider.z;
      let localX = cosine * offsetX - sine * offsetZ;
      let localZ = sine * offsetX + cosine * offsetZ;
      const closestX = THREE.MathUtils.clamp(localX, -collider.halfWidth, collider.halfWidth);
      const closestZ = THREE.MathUtils.clamp(localZ, -collider.halfDepth, collider.halfDepth);
      const differenceX = localX - closestX;
      const differenceZ = localZ - closestZ;
      const distanceSquared = differenceX * differenceX + differenceZ * differenceZ;

      if (distanceSquared > 0 && distanceSquared < PLAYER_RADIUS * PLAYER_RADIUS) {
        const distance = Math.sqrt(distanceSquared);
        const correction = PLAYER_RADIUS - distance;
        localX += (differenceX / distance) * correction;
        localZ += (differenceZ / distance) * correction;
      } else if (distanceSquared === 0) {
        const exitX = collider.halfWidth + PLAYER_RADIUS - Math.abs(localX);
        const exitZ = collider.halfDepth + PLAYER_RADIUS - Math.abs(localZ);
        if (exitX < exitZ) {
          localX = Math.sign(localX || 1) * (collider.halfWidth + PLAYER_RADIUS);
        } else {
          localZ = Math.sign(localZ || 1) * (collider.halfDepth + PLAYER_RADIUS);
        }
      } else {
        continue;
      }

      position.x = collider.x + cosine * localX + sine * localZ;
      position.z = collider.z - sine * localX + cosine * localZ;
      continue;
    }

    const dx = position.x - collider.x;
    const dz = position.z - collider.z;
    const distance = Math.hypot(dx, dz);
    const minimumDistance = collider.radius + PLAYER_RADIUS;
    if (distance < minimumDistance) {
      if (collider.npc) {
        showNpcDialogueOnBump(collider.npc);
      }
      if (distance > 0) {
        position.x = collider.x + (dx / distance) * minimumDistance;
        position.z = collider.z + (dz / distance) * minimumDistance;
      } else {
        position.x = collider.x + minimumDistance;
      }
    }
  }
}

function clampPlayerPosition() {
  const position = controls.object.position;
  position.x = THREE.MathUtils.clamp(
    position.x,
    -ROOM_HALF_WIDTH + PLAYER_RADIUS + 0.15,
    ROOM_HALF_WIDTH - PLAYER_RADIUS - 0.15,
  );
  position.z = THREE.MathUtils.clamp(
    position.z,
    -ROOM_HALF_DEPTH + PLAYER_RADIUS + 0.15,
    ROOM_HALF_DEPTH - PLAYER_RADIUS - 0.15,
  );
  resolvePropCollisions(position);
  position.y = PLAYER_HEIGHT;
}

function rotateMobileView(yawDelta) {
  mobileLookEuler.setFromQuaternion(controls.object.quaternion, 'YXZ');
  mobileLookEuler.y -= yawDelta;
  mobileLookEuler.x = 0;
  mobileLookEuler.z = 0;
  controls.object.quaternion.setFromEuler(mobileLookEuler);
}

function enforceHorizontalView() {
  horizontalViewEuler.setFromQuaternion(controls.object.quaternion, 'YXZ');
  horizontalViewEuler.x = 0;
  horizontalViewEuler.z = 0;
  controls.object.quaternion.setFromEuler(horizontalViewEuler);
}

function updateMovement(deltaSeconds) {
  if (!controls.isLocked && !mobileSceneActive) {
    return;
  }
  enforceHorizontalView();
  const keyboard = new THREE.Vector2(
    Number(input.right) - Number(input.left),
    Number(input.forward) - Number(input.backward),
  );
  if (keyboard.lengthSq() > 0) {
    keyboard.normalize();
  }
  const movement = keyboard.add(mobileManualMoveInput);
  if (movement.lengthSq() > 1) {
    movement.normalize();
  }
  if (movement.lengthSq() > 0) {
    previousPlayerPosition.copy(controls.object.position);
    const speed = input.sprint ? SPRINT_SPEED : MOVE_SPEED;
    controls.moveRight(movement.x * speed * deltaSeconds);
    controls.moveForward(movement.y * speed * deltaSeconds);
    clampPlayerPosition();
    checkWalkThroughInteractions(previousPlayerPosition, movement.y > 0.05);
  } else {
    clampPlayerPosition();
  }
}

function updateFocus(deltaSeconds) {
  const nextFocus = raycastInteraction();
  const now = performance.now();
  const hoverNpc = overlay.hidden
    && nextFocus?.type === 'npc'
    && now >= nextFocus.npc.speechUntil
    ? nextFocus.npc
    : null;

  if (npcHoverPrompt) {
    if (hoverNpc) {
      npcHoverOwner = hoverNpc;
      npcHoverHoldUntil = now + NPC_HOVER_HOLD_MS;
    }

    if (
      !overlay.hidden
      || (npcHoverOwner && now < npcHoverOwner.speechUntil)
    ) {
      npcHoverOwner = null;
      npcHoverHoldUntil = 0;
    }

    let opacity = 0;
    if (npcHoverOwner) {
      if (hoverNpc === npcHoverOwner || now <= npcHoverHoldUntil) {
        opacity = 1;
      } else {
        opacity = Math.max(0, 1 - (now - npcHoverHoldUntil) / NPC_HOVER_FADE_MS);
      }
      npcHoverOwner.bubbleAnchor.getWorldPosition(npcBubbleWorldPosition);
      npcBubbleWorldPosition.y += 0.25 * npcHoverOwner.config.scale;
      npcHoverPrompt.position.copy(npcBubbleWorldPosition);
    }

    npcHoverPrompt.material.opacity = opacity;
    npcHoverPrompt.visible = opacity > 0.001;
    if (opacity <= 0 && !hoverNpc) {
      npcHoverOwner = null;
    }
  }

  for (const interaction of interactions) {
    const distance = horizontalDistance(controls.object.position, interaction);
    const near = distance <= INTERACTION_DISTANCE;
    const target = interaction === nextFocus ? 0.18 : near ? 0.09 : 0.045;
    interaction.frameMaterial.emissiveIntensity = THREE.MathUtils.damp(
      interaction.frameMaterial.emissiveIntensity,
      target,
      7,
      deltaSeconds,
    );
  }
}

function revealArtworkVideoAfterFirstFrames(artwork, video, videoTexture) {
  const reveal = () => {
    if (artwork.screenMaterial.map === videoTexture) {
      return;
    }
    videoTexture.needsUpdate = true;
    renderer.initTexture(videoTexture);
    artwork.videoTexture = videoTexture;
    artwork.screenMaterial.map = videoTexture;
    artwork.screenMaterial.needsUpdate = true;
  };

  if (typeof video.requestVideoFrameCallback === 'function') {
    const waitForDecodedFrame = (_now, metadata) => {
      const hasPresentedFrames = metadata.presentedFrames === undefined || metadata.presentedFrames >= 2;
      if (metadata.mediaTime < 0.08 || !hasPresentedFrames) {
        video.requestVideoFrameCallback(waitForDecodedFrame);
        return;
      }
      reveal();
    };
    video.requestVideoFrameCallback(waitForDecodedFrame);
    return;
  }

  const waitForPlayback = () => {
    if (video.currentTime < 0.08 || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }
    video.removeEventListener('timeupdate', waitForPlayback);
    reveal();
  };
  video.addEventListener('timeupdate', waitForPlayback);
}

function ensureArtworkVideo(artwork) {
  if (artwork.video) {
    return artwork.video;
  }

  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.addEventListener('loadeddata', () => {
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    revealArtworkVideoAfterFirstFrames(artwork, video, videoTexture);
  }, { once: true });
  video.addEventListener('error', () => {
    console.warn(`Unable to play ${artwork.project.title} gallery video.`);
  });
  video.src = new URL(artwork.project.video, import.meta.url).href;
  artwork.video = video;
  videos.push(video);
  return video;
}

function updateGalleryVideos() {
  if (!galleryVideosStarted || document.hidden) {
    return;
  }

  for (const artwork of artworks) {
    const distance = horizontalDistance(controls.object.position, artwork);
    if (distance <= VIDEO_START_DISTANCE) {
      ensureArtworkVideo(artwork).play().catch(() => {});
    } else if (distance >= VIDEO_PAUSE_DISTANCE && artwork.video) {
      artwork.video.pause();
    }
  }
}

function startGalleryVideos() {
  galleryVideosStarted = true;
  updateGalleryVideos();
}

function stopMobileScene() {
  mobileSceneActive = false;
  setMobileControlsVisible(false);
  resetPlayerInput();
}

function startMobileScene() {
  overlay.hidden = true;
  mobileSceneActive = true;
  setHudVisible(true);
  setMobileControlsVisible(true);
  startGalleryVideos();
}

async function loadTexture(url) {
  const texture = await textureLoader.loadAsync(new URL(url, import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

async function loadGalleryModel(url) {
  const model = await gltfLoader.loadAsync(new URL(url, import.meta.url).href);
  return [url, model];
}

async function initialize() {
  const materials = createGalleryMaterials();
  createLighting();
  createGalleryShell(materials);
  createSunRays();
  createBench(0, 5.2, 0, materials);
  // createSculpture(materials);

  const texturePromises = GALLERY_PROJECTS.map((project) => (
    loadTexture(project.screenshot)
  ));
  const skyboxPromise = loadTexture('../assets/textures/optimized/gallery-sky-runtime.jpg');
  const modelPromises = GALLERY_NPCS
    .filter((config) => config.model)
    .map((config) => loadGalleryModel(config.model));
  const treeModelPromises = TREE_MODEL_URLS.map((url) => loadGalleryModel(url));
  const [projectTextures, skyboxTexture, modelEntries, treeModelEntries] = await Promise.all([
    Promise.all(texturePromises),
    skyboxPromise,
    Promise.all(modelPromises),
    Promise.all(treeModelPromises),
  ]);
  const importedModels = new Map(modelEntries);
  const importedTrees = new Map(treeModelEntries);
  applySkyboxTexture(skyboxTexture);
  createExteriorScenery(importedTrees);

  GALLERY_PROJECTS.forEach((project, index) => {
    createArtwork(project, projectTextures[index]);
  });
  createGalleryNpcs(importedModels);
  createContactDoor(materials);
  if (previewMode && previewView?.startsWith('npc')) {
    const requestedIndex = Number.parseInt(previewView.slice(3), 10);
    const npcIndex = Number.isFinite(requestedIndex)
      ? THREE.MathUtils.clamp(requestedIndex, 0, npcs.length - 1)
      : 0;
    const npc = npcs[npcIndex];
    const project = GALLERY_PROJECTS[npc.config.projectIndex];
    const artworkNormal = new THREE.Vector3(0, 0, 1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      project.rotationY,
    );
    const previewDistance = previewView.endsWith('-close') ? 0.9 : 4.1;
    controls.object.position.copy(npc.group.position).addScaledVector(artworkNormal, previewDistance);
    controls.object.position.y = PLAYER_HEIGHT;
    controls.object.lookAt(npc.group.position.x, PLAYER_HEIGHT, npc.group.position.z);
    showNpcDialogue(npc);
  } else if (previewMode && previewView === 'contact') {
    controls.object.position.set(DOOR_X, PLAYER_HEIGHT, DOOR_Z - 5.4);
    controls.object.rotation.set(0, Math.PI, 0);
  } else if (previewMode && previewView === 'sky') {
    controls.object.position.set(0, PLAYER_HEIGHT, 0);
    controls.object.rotation.set(Math.PI / 2, 0, 0);
  } else if (previewMode && previewView === 'sun') {
    controls.object.position.set(0, PLAYER_HEIGHT, 1.5);
    controls.object.lookAt(SUN_POSITION);
  } else if (previewMode && previewView === 'windows') {
    controls.object.position.set(-1.5, 3.3, 7.5);
    controls.object.rotation.set(-0.17, -0.42, 0);
  }
  renderer.shadowMap.needsUpdate = true;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  overlayTitle.textContent = 'Selected Work';
  enterButton.textContent = 'Enter';
  controlsNote.textContent = movementDirections;
  enterButton.disabled = false;
  document.body.dataset.sceneReady = 'true';
  window.__sceneReady = true;
  window.__sceneReadyAt = performance.now();
  window.__loadTimings.sceneReadyAt = window.__sceneReadyAt;

  if (previewMode) {
    overlay.hidden = true;
    setHudVisible(true);
    startGalleryVideos();
  }

}

controls.addEventListener('lock', () => {
  stopMobileScene();
  overlay.hidden = true;
  setHudVisible(true);
  startGalleryVideos();
});

controls.addEventListener('unlock', () => {
  dismissNpcDialogues();
  overlay.hidden = false;
  setHudVisible(false);
  setStatus('Gallery ready. Enter to continue.');
});

enterButton.addEventListener('click', () => {
  if (isTouchDevice) {
    startMobileScene();
  } else {
    controls.lock();
  }
});

function setupMobileTouchNavigation(target) {
  if (!isTouchDevice || !target) {
    return;
  }

  let moveGesture = null;
  let lookGesture = null;

  const updateGuideEngagement = () => {
    document.body.classList.toggle(
      'mobile-guide-engaged',
      mobileSceneActive && Boolean(moveGesture || lookGesture),
    );
  };

  const findGesture = (pointerId) => {
    if (moveGesture?.pointerId === pointerId) return moveGesture;
    if (lookGesture?.pointerId === pointerId) return lookGesture;
    return null;
  };

  const updateManualMovement = (event, gesture) => {
    const rawX = event.clientX - gesture.startX;
    const rawY = event.clientY - gesture.startY;
    const distance = Math.hypot(rawX, rawY);
    const magnitude = Math.min(1, distance / MOBILE_MANUAL_MOVE_DISTANCE);

    if (distance === 0 || magnitude <= MOBILE_MANUAL_MOVE_DEADZONE) {
      mobileManualMoveInput.set(0, 0);
      return;
    }

    const adjustedMagnitude = Math.pow(
      (magnitude - MOBILE_MANUAL_MOVE_DEADZONE) / (1 - MOBILE_MANUAL_MOVE_DEADZONE),
      MOBILE_MANUAL_MOVE_CURVE,
    );
    mobileManualMoveInput.set(
      (rawX / distance) * adjustedMagnitude,
      (-rawY / distance) * adjustedMagnitude,
    );
  };

  target.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'touch' || !mobileSceneActive) {
      return;
    }

    const bounds = target.getBoundingClientRect();
    const type = event.clientY >= bounds.top + bounds.height * MOBILE_MOVE_ZONE_START
      ? 'move'
      : 'look';
    if ((type === 'move' && moveGesture) || (type === 'look' && lookGesture)) {
      return;
    }

    event.preventDefault();
    const gesture = {
      pointerId: event.pointerId,
      type,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      maximumTravel: 0,
      isDragging: false,
    };
    if (type === 'move') {
      moveGesture = gesture;
      mobileManualMoveInput.set(0, 0);
    } else {
      lookGesture = gesture;
    }
    updateGuideEngagement();
    target.setPointerCapture(event.pointerId);
  });

  target.addEventListener('pointermove', (event) => {
    const gesture = findGesture(event.pointerId);
    if (!gesture) {
      return;
    }
    event.preventDefault();
    gesture.maximumTravel = Math.max(
      gesture.maximumTravel,
      Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY),
    );
    if (gesture.maximumTravel > MOBILE_TAP_DRAG_TOLERANCE) {
      gesture.isDragging = true;
    }
    if (gesture.isDragging) {
      if (gesture.type === 'move') {
        updateManualMovement(event, gesture);
      } else {
        rotateMobileView((event.clientX - gesture.lastX) * MOBILE_DRAG_LOOK_SPEED);
      }
    }
    gesture.lastX = event.clientX;
  });

  const finish = (event, allowTap) => {
    const gesture = findGesture(event.pointerId);
    if (!gesture) {
      return;
    }
    if (gesture.type === 'move') {
      moveGesture = null;
      mobileManualMoveInput.set(0, 0);
    } else {
      lookGesture = null;
    }
    updateGuideEngagement();

    if (!allowTap || gesture.isDragging || !mobileSceneActive) {
      return;
    }

    lastTouchInteractionAt = performance.now();

    const nearbyInteraction = raycastInteraction(event);
    if (nearbyInteraction) {
      activateInteraction(nearbyInteraction);
    }
  };

  target.addEventListener('pointerup', (event) => finish(event, true));
  target.addEventListener('pointercancel', (event) => finish(event, false));
  target.addEventListener('lostpointercapture', (event) => finish(event, false));
}

setupMobileTouchNavigation(renderer.domElement);

function handleScenePointerDown(event) {
  if (event.pointerType === 'touch') {
    return;
  }
  if (event.type === 'mousedown' && performance.now() - lastTouchInteractionAt < 700) {
    return;
  }
  if (event.button !== undefined && event.button !== 0) {
    return;
  }
  if (!controls.isLocked && !mobileSceneActive && !previewMode) {
    return;
  }

  const interaction = raycastInteraction(event);
  if (!interaction) {
    return;
  }
  event.preventDefault();
  activateInteraction(interaction);
}

document.addEventListener('pointerdown', handleScenePointerDown);
document.addEventListener('mousedown', handleScenePointerDown);

window.addEventListener('keydown', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') input.forward = true;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') input.backward = true;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') input.left = true;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') input.right = true;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sprint = true;
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'KeyW' || event.code === 'ArrowUp') input.forward = false;
  if (event.code === 'KeyS' || event.code === 'ArrowDown') input.backward = false;
  if (event.code === 'KeyA' || event.code === 'ArrowLeft') input.left = false;
  if (event.code === 'KeyD' || event.code === 'ArrowRight') input.right = false;
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') input.sprint = false;
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    for (const video of videos) video.pause();
  } else if (galleryVideosStarted) {
    updateGalleryVideos();
  }
});

window.addEventListener('focus', () => {
  if (
    document.body.dataset.sceneReady === 'true'
    && !controls.isLocked
    && !mobileSceneActive
    && !previewMode
  ) {
    dismissNpcDialogues();
    overlay.hidden = false;
    setHudVisible(false);
    setStatus('Gallery ready. Enter to continue.');
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.25 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('error', (event) => {
  if (event.message) {
    setStatus(`Gallery load failed: ${event.message}`);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
  setStatus(`Gallery load failed: ${message}`);
});

initialize().catch((error) => {
  console.error(error);
  setStatus(`Gallery load failed: ${error instanceof Error ? error.message : String(error)}`);
});

function animate() {
  requestAnimationFrame(animate);
  const deltaSeconds = Math.min(clock.getDelta(), 0.05);
  if (!window.__sceneReady) {
    return;
  }

  if (!document.hidden) {
    updateMovement(deltaSeconds);
    updateFocus(deltaSeconds);
    updateNpcs(deltaSeconds, clock.elapsedTime);
    updateGalleryVideos();
    updateSunRays();
    renderer.render(scene, camera);
  }
}

animate();
