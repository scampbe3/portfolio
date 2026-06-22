import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const PLAYER_HEIGHT = 1.72;
const PLAYER_RADIUS = 0.36;
const MOVE_SPEED = 4.5;
const SPRINT_SPEED = 7.2;
const MOBILE_LOOK_SPEED = 2.15;
const MOBILE_LOOK_PITCH_LIMIT = Math.PI / 2 - 0.08;
const MOBILE_MOVE_STICK_DEADZONE = 0.14;
const MOBILE_LOOK_STICK_DEADZONE = 0.06;
const MOBILE_MOVE_STICK_CURVE = 1.3;
const MOBILE_LOOK_STICK_CURVE = 1.12;
const ROOM_WIDTH = 28;
const ROOM_DEPTH = 26;
const ROOM_HALF_WIDTH = ROOM_WIDTH / 2;
const ROOM_HALF_DEPTH = ROOM_DEPTH / 2;
const WALL_HEIGHT = 21.33;
const WALL_CENTER_Y = WALL_HEIGHT / 2;
const DOOR_WIDTH = 3.2;
const DOOR_HEIGHT = 3.25;
const HALLWAY_WIDTH = 3.8;
const HALLWAY_HALF_WIDTH = HALLWAY_WIDTH / 2;
const HALLWAY_LENGTH = 32;
const HALLWAY_END_Z = ROOM_HALF_DEPTH + HALLWAY_LENGTH;
const PORTAL_FRAME_GLOW_LAYER = 1;
const CONSOLE_BODY_GLOW_LAYER = 2;
const BACK_WALL_LIGHT_X = [-8.4, 8.4];
const FRONT_WALL_LIGHT_X = [-8.4, 8.4];
const SIDE_WALL_LIGHT_Z = [-8.4, 0, 8.4];
const BACK_WALL_COLUMN_X = [-4.2, 4.2];
const FRONT_WALL_COLUMN_X = [-4.2, 4.2];
const SIDE_WALL_COLUMN_Z = [-4.2, 4.2];
const LEGACY_WALL_TEXTURE = '../legacy-wall-texture.png';
const LEGACY_WALL_PANEL_WIDTH = 6.25;
const LEGACY_WALL_PANEL_HEIGHT = 3.52;
const LEGACY_WALL_PANEL_CENTER_Y = 2.65;
const PORTAL_X = 0;
const PORTAL_Z = ROOM_HALF_DEPTH - ROOM_DEPTH * 0.66;
const PORTAL_FRAME_DIFFUSE_LIFT = 0.10125;
const PORTAL_ACTIVATION_DELAY_MS = 170;
const CONSOLE_TO_DOORWAY_BLEND = 0.4;
const CONSOLE_START_Z = PORTAL_Z + 5.1;
const CONSOLE_SPAWN_NUDGE_Z = 1.25;
const CONSOLE_X = PORTAL_X;
const CONSOLE_Z = THREE.MathUtils.lerp(CONSOLE_START_Z, ROOM_HALF_DEPTH, CONSOLE_TO_DOORWAY_BLEND) + CONSOLE_SPAWN_NUDGE_Z;
const CONSOLE_ROTATION_Y = 0;
const ROOM_BOUNDS = {
  minX: -ROOM_HALF_WIDTH + PLAYER_RADIUS,
  maxX: ROOM_HALF_WIDTH - PLAYER_RADIUS,
  minZ: -12,
  maxZ: ROOM_HALF_DEPTH - 0.85,
};
const PLAYER_SPAWN_X = 0;
const PLAYER_SPAWN_Z = ROOM_BOUNDS.maxZ;

const overlay = document.getElementById('overlay');
const enterButton = document.getElementById('enterButton');
const hud = document.getElementById('hud');
const mobileControls = document.getElementById('mobileControls');
const moveStick = document.getElementById('moveStick');
const moveKnob = document.getElementById('moveKnob');
const lookStick = document.getElementById('lookStick');
const lookKnob = document.getElementById('lookKnob');
const statusText = document.getElementById('statusText');
const previewMode = new URLSearchParams(window.location.search).has('preview');
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
document.body.dataset.sceneReady = 'false';
window.__sceneReady = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050912');
scene.fog = new THREE.Fog('#050912', 14, 36);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(PLAYER_SPAWN_X, PLAYER_HEIGHT, PLAYER_SPAWN_Z);
camera.layers.enable(PORTAL_FRAME_GLOW_LAYER);
camera.layers.enable(CONSOLE_BODY_GLOW_LAYER);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = false;
document.body.append(renderer.domElement);

const clock = new THREE.Clock();
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);

// Prefer the conservative image path for embedded GLB PNGs; it avoids decode stalls in some browsers.
try {
  window.createImageBitmap = undefined;
} catch {
  // Some browsers may expose createImageBitmap as read-only.
}

const loadingManager = new THREE.LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager);
const textureLoader = new THREE.TextureLoader(loadingManager);

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const fileName = url.split('/').pop();
  setStatus(`Loading ${itemsLoaded}/${itemsTotal}: ${fileName}`);
};

const input = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
};
const mobileMoveInput = new THREE.Vector2();
const mobileLookInput = new THREE.Vector2();
const mobileLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let mobileSceneActive = false;
let lastTouchButtonPressAt = 0;

const PORTFOLIO_PROJECTS = [
  {
    title: 'EDM NYC',
    consoleTitle: 'EDM PLANET',
    consoleBlurb: 'A nightlife-grade discovery cockpit: live streaming radio, station filters, favorites, ratings, releases, events, store, and lounge paths packed into one fast interface that makes a crowded music universe feel instantly playable.',
    consoleCta: 'The signal is live. Step into the portal and tune the room to EDM Planet now.',
    consoleAccent: '#a05eff',
    url: 'https://edmplanet.nyc/',
    screenshot: '../button1.png',
    video: '../vids/edmplanet.mp4',
  },
  {
    title: 'Cupcakes + Broccoli',
    consoleTitle: 'CUPCAKES + BROCCOLI',
    consoleBlurb: 'A founder-facing brand presence with polish and pulse: warm authority, service clarity, trust-building structure, mobile-first flow, and a clean path from curiosity to consultation.',
    consoleCta: 'Ready for sharper decisions? Enter the portal and meet the brand in full.',
    consoleAccent: '#f5efe6',
    url: 'https://www.cupcakesandbroccoli.com/about',
    screenshot: '../button2.png',
    video: '../vids/cupcakesbrocolli.mp4',
  },
  {
    title: 'Skyscape Visions',
    consoleTitle: 'SKYSCAPE VISIONS',
    consoleBlurb: 'A cinematic aerial portfolio designed like a scouting table: location browsing, embedded reels, responsive viewing, and premium visual pacing that lets the footage do the persuading.',
    consoleCta: 'Flight path loaded. Step through and survey the reel.',
    consoleAccent: '#5df5e7',
    url: 'https://scampbe3.github.io/drone-site/',
    screenshot: '../button3.png',
    video: '../vids/dronesite.mp4',
  },
  {
    title: 'The Starcats',
    consoleTitle: 'THE STAR CATS',
    consoleBlurb: 'A browser-based interactive showcase with real game energy: Three.js loops, player controls, HUD feedback, performance-minded rendering, and a visual system built for motion, challenge, and play.',
    consoleCta: 'Controls are hot. Enter the portal and take the run.',
    consoleAccent: '#74ff3f',
    url: 'https://thestarcats.com/',
    screenshot: '../button4.png',
    video: '../vids/starcats.mp4',
  },
];
const DEFAULT_PROJECT_INDEX = null;
const PORTAL_ENTRY_HALF_WIDTH = 1.8;
const PORTAL_ENTRY_HALF_DEPTH = 0.55;
const PORTAL_TRAVEL_COOLDOWN_MS = 1300;
const BUTTON_IDLE_GLOW = '#a760ff';
const BUTTON_ACTIVE_GLOW = '#57b7ff';
const CONSOLE_INITIAL_SCREEN_TEXTURE = '../console_initial_screen_texture.png';

const CONSOLE_BUTTONS = [
  { file: './console_newest/button1_listen.glb', label: 'listen', projectIndex: 0 },
  { file: './console_newest/button2_learn.glb', label: 'learn', projectIndex: 1 },
  { file: './console_newest/button3_watch.glb', label: 'watch', projectIndex: 2 },
  { file: './console_newest/button4_play.glb', label: 'play', projectIndex: 3 },
];
const BUTTON_PRESS_ANGLE = THREE.MathUtils.degToRad(40);
const BUTTON_PRESS_DEPTH = 0.12;
const BUTTON_PRESS_DIRECTION = new THREE.Vector3(
  0,
  -Math.sin(BUTTON_PRESS_ANGLE),
  -Math.cos(BUTTON_PRESS_ANGLE),
).normalize();
const BUTTON_RELEASE_DELAY_MS = 260;
const BUTTON_INTERACTION_DISTANCE = 2.35;
const BUTTON_HITBOX_PADDING = new THREE.Vector3(0.04, 0.16, 0.14);

const buttonRaycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const consoleButtonMeshes = [];
const consoleButtons = [];
const playerColliders = [];
const projectTextures = [];
const projectVideos = [];
const projectVideoTextures = [];
const portalDisplayMaterials = [];
let consoleInitialScreenTexture = null;
let activeProjectIndex = DEFAULT_PROJECT_INDEX;
let activeButtonProjectIndex = DEFAULT_PROJECT_INDEX;
let activePortalVideo = null;
let originalPortalTexture = null;
let consoleScreenImagePlane = null;
let consoleScreenImageMaterial = null;
let consoleScreenMaxWidth = 0.68;
let consoleScreenMaxHeight = 0.58;
let lastPortalTravelAt = 0;
let pendingPortalTravelStartedAt = 0;
let pendingPortalTravelProjectIndex = DEFAULT_PROJECT_INDEX;

function setStatus(message) {
  statusText.textContent = message;
  document.body.dataset.sceneStatus = message;
}

function setHudVisible(visible) {
  hud.classList.toggle('active', visible);
}

function setMobileControlsVisible(visible) {
  document.body.classList.toggle('mobile-scene-active', visible && isTouchDevice);

  if (mobileControls) {
    mobileControls.setAttribute('aria-hidden', String(!(visible && isTouchDevice)));
  }
}

function resetVirtualStick(knob, vector) {
  vector.set(0, 0);

  if (knob) {
    knob.style.left = '50%';
    knob.style.top = '50%';
  }
}

function applyVirtualStickResponse(vector, x, y, maxDistance, deadzone, curve) {
  const magnitude = Math.min(1, Math.hypot(x, y) / maxDistance);

  if (magnitude <= deadzone) {
    vector.set(0, 0);
    return;
  }

  const adjustedMagnitude = Math.pow((magnitude - deadzone) / (1 - deadzone), curve);
  const angleScale = adjustedMagnitude / magnitude;
  vector.set((x / maxDistance) * angleScale, (-y / maxDistance) * angleScale);
}

function updateVirtualStick(stick, knob, vector, event, options, origin = null) {
  const bounds = stick.getBoundingClientRect();
  const centerX = origin?.x ?? bounds.left + bounds.width / 2;
  const centerY = origin?.y ?? bounds.top + bounds.height / 2;
  const maxDistance = bounds.width * options.radiusRatio;
  const rawX = event.clientX - centerX;
  const rawY = event.clientY - centerY;
  const distance = Math.hypot(rawX, rawY);
  const scale = distance > maxDistance ? maxDistance / distance : 1;
  const x = rawX * scale;
  const y = rawY * scale;

  applyVirtualStickResponse(vector, x, y, maxDistance, options.deadzone, options.curve);

  if (knob) {
    knob.style.left = `calc(50% + ${x}px)`;
    knob.style.top = `calc(50% + ${y}px)`;
  }
}

function setupVirtualStick(stick, knob, vector, options = {}) {
  if (!stick || !knob) {
    return;
  }

  const stickOptions = {
    curve: 1,
    deadzone: 0.1,
    mode: 'absolute',
    radiusRatio: 0.38,
    ...options,
  };
  let activePointerId = null;
  const touchOrigin = { x: 0, y: 0 };

  stick.addEventListener('pointerdown', (event) => {
    if (activePointerId !== null) {
      return;
    }

    activePointerId = event.pointerId;
    stick.setPointerCapture(activePointerId);
    touchOrigin.x = event.clientX;
    touchOrigin.y = event.clientY;

    if (stickOptions.mode === 'relative') {
      resetVirtualStick(knob, vector);
    } else {
      updateVirtualStick(stick, knob, vector, event, stickOptions);
    }

    if (event.pointerType === 'touch') {
      lastTouchButtonPressAt = performance.now();
    }
    event.preventDefault();
    event.stopPropagation();
  });

  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId !== activePointerId) {
      return;
    }

    updateVirtualStick(
      stick,
      knob,
      vector,
      event,
      stickOptions,
      stickOptions.mode === 'relative' ? touchOrigin : null,
    );
    event.preventDefault();
    event.stopPropagation();
  });

  function releaseStick(event) {
    if (event.pointerId !== activePointerId) {
      return;
    }

    activePointerId = null;
    resetVirtualStick(knob, vector);
    event.preventDefault();
    event.stopPropagation();
  }

  stick.addEventListener('pointerup', releaseStick);
  stick.addEventListener('pointercancel', releaseStick);
  stick.addEventListener('lostpointercapture', () => {
    activePointerId = null;
    resetVirtualStick(knob, vector);
  });
}

function startMobileScene() {
  mobileSceneActive = true;
  overlay.hidden = true;
  setHudVisible(true);
  setMobileControlsVisible(true);
  mobileLookEuler.setFromQuaternion(controls.object.quaternion, 'YXZ');
}

function stopMobileScene() {
  mobileSceneActive = false;
  setMobileControlsVisible(false);
  resetVirtualStick(moveKnob, mobileMoveInput);
  resetVirtualStick(lookKnob, mobileLookInput);
}

async function loadConsoleFonts() {
  if (!document.fonts?.load) {
    return;
  }

  await Promise.race([
    Promise.all([
      document.fonts.load('700 48px Orbitron'),
      document.fonts.load('500 34px Rajdhani'),
    ]),
    new Promise((resolve) => {
      window.setTimeout(resolve, 1800);
    }),
  ]);
}

function prepareProjectTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

async function loadProjectTextures() {
  const textures = await Promise.all(
    PORTFOLIO_PROJECTS.map((project) => textureLoader.loadAsync(new URL(project.screenshot, import.meta.url).href)),
  );

  textures.forEach((texture, index) => {
    projectTextures[index] = prepareProjectTexture(texture);
  });
}

async function loadInitialConsoleScreenTexture() {
  const texture = await textureLoader.loadAsync(new URL(CONSOLE_INITIAL_SCREEN_TEXTURE, import.meta.url).href);
  consoleInitialScreenTexture = prepareProjectTexture(texture);
}

function preparePortalVideoTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function getProjectPortalVideo(projectIndex) {
  if (projectVideos[projectIndex] && projectVideoTextures[projectIndex]) {
    return {
      video: projectVideos[projectIndex],
      texture: projectVideoTextures[projectIndex],
    };
  }

  const project = PORTFOLIO_PROJECTS[projectIndex];
  if (!project?.video) {
    return null;
  }

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.src = new URL(project.video, import.meta.url).href;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  const texture = preparePortalVideoTexture(new THREE.VideoTexture(video));
  projectVideos[projectIndex] = video;
  projectVideoTextures[projectIndex] = texture;

  return { video, texture };
}

function rewindVideoWhenReady(video) {
  const rewind = () => {
    try {
      video.currentTime = 0;
    } catch {
      // Metadata may still be settling on slower devices; playback will continue from the first available frame.
    }
  };

  if (video.readyState >= 1) {
    rewind();
  } else {
    video.addEventListener('loadedmetadata', rewind, { once: true });
  }
}

function stopActivePortalVideo(exceptVideo = null) {
  if (activePortalVideo && activePortalVideo !== exceptVideo) {
    activePortalVideo.pause();
    rewindVideoWhenReady(activePortalVideo);
  }

  if (activePortalVideo !== exceptVideo) {
    activePortalVideo = null;
  }
}

function resumeActivePortalVideo() {
  if (!activePortalVideo) {
    return;
  }

  const playPromise = activePortalVideo.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {});
  }
}

function applyTextureToDisplayMaterials(materials, texture) {
  if (!texture) {
    return;
  }

  for (const material of materials) {
    material.map = texture;
    material.color.set('#ffffff');
    material.needsUpdate = true;
  }
}

function applyPortalDisplayTexture(texture) {
  applyTextureToDisplayMaterials(portalDisplayMaterials, texture);
}

function applyPortalVideo(projectIndex) {
  const portalVideo = getProjectPortalVideo(projectIndex);

  if (!portalVideo) {
    return false;
  }

  const { video, texture } = portalVideo;
  stopActivePortalVideo(video);
  activePortalVideo = video;
  rewindVideoWhenReady(video);
  applyPortalDisplayTexture(texture);

  const playPromise = video.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      setStatus('The portal video is ready. Click the selected button again if your browser paused it.');
    });
  }

  return true;
}

function cloneTextureForConsoleScreen(texture) {
  const clonedTexture = texture.clone();
  clonedTexture.flipY = true;
  clonedTexture.needsUpdate = true;
  return clonedTexture;
}

function getTextureAspect(texture) {
  const image = texture?.image;
  const width = image?.videoWidth ?? image?.naturalWidth ?? image?.width;
  const height = image?.videoHeight ?? image?.naturalHeight ?? image?.height;

  return width && height ? width / height : 16 / 9;
}

function drawImageContain(context, image, x, y, width, height) {
  const imageWidth = image?.videoWidth ?? image?.naturalWidth ?? image?.width;
  const imageHeight = image?.videoHeight ?? image?.naturalHeight ?? image?.height;

  if (!imageWidth || !imageHeight) {
    return;
  }

  const scale = Math.min(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function fitCanvasText(context, text, maxWidth, startingSize, minSize, fontFamily, weight = 700) {
  let fontSize = startingSize;

  do {
    context.font = `${weight} ${fontSize}px ${fontFamily}`;
    if (context.measureText(text).width <= maxWidth || fontSize <= minSize) {
      return fontSize;
    }

    fontSize -= 2;
  } while (fontSize >= minSize);

  return minSize;
}

function getWrappedCanvasLines(context, text, maxWidth) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;

    if (context.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line) {
    lines.push(line);
  }

  return lines;
}

function drawWrappedCanvasText(context, text, x, y, maxWidth, maxHeight, options = {}) {
  const startY = y;
  const fontFamily = options.fontFamily ?? 'Rajdhani, Arial, sans-serif';
  const weight = options.weight ?? 500;
  const minSize = options.minSize ?? 24;
  let fontSize = options.fontSize ?? 34;
  let lineHeight = fontSize * 1.24;
  let lines = [];

  do {
    context.font = `${weight} ${fontSize}px ${fontFamily}`;
    lines = getWrappedCanvasLines(context, text, maxWidth);
    lineHeight = fontSize * (options.lineHeight ?? 1.24);
    fontSize -= 2;
  } while (lines.length * lineHeight > maxHeight && fontSize >= minSize);

  for (const line of lines) {
    if (y + lineHeight > startY + maxHeight + 1) {
      break;
    }

    context.fillText(line, x, y);
    y += lineHeight;
  }
}

function addRoundedRectPath(context, x, y, width, height, radius) {
  const cornerRadius = Math.min(radius, width / 2, height / 2);

  context.moveTo(x + cornerRadius, y);
  context.lineTo(x + width - cornerRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  context.lineTo(x + width, y + height - cornerRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  context.lineTo(x + cornerRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  context.lineTo(x, y + cornerRadius);
  context.quadraticCurveTo(x, y, x + cornerRadius, y);
}

function createConsoleProjectTexture(texture, project) {
  const sourceImage = texture?.image;
  const screenAspect = consoleScreenMaxWidth / consoleScreenMaxHeight || 1;
  const canvasWidth = 1024;
  const canvasHeight = Math.round(canvasWidth / screenAspect);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const topHeight = Math.floor(canvasHeight * 0.5);
  const marginX = 58;
  const previewPaddingY = 28;
  const title = project.consoleTitle ?? project.title.toUpperCase();
  const blurb = project.consoleBlurb ?? '';
  const cta = project.consoleCta ?? 'Step right up. Enter the portal and visit the site now.';
  const accent = project.consoleAccent ?? '#a05eff';

  context.fillStyle = '#03030a';
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  const topGradient = context.createLinearGradient(0, 0, 0, topHeight);
  topGradient.addColorStop(0, 'rgba(70, 42, 125, 0.26)');
  topGradient.addColorStop(0.42, 'rgba(10, 12, 30, 0.14)');
  topGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = topGradient;
  context.fillRect(0, 0, canvasWidth, topHeight);

  context.fillStyle = '#05050b';
  context.fillRect(marginX - 8, previewPaddingY - 8, canvasWidth - marginX * 2 + 16, topHeight - previewPaddingY * 2 + 16);
  drawImageContain(
    context,
    sourceImage,
    marginX,
    previewPaddingY,
    canvasWidth - marginX * 2,
    topHeight - previewPaddingY * 2,
  );

  context.strokeStyle = accent;
  context.shadowColor = accent;
  context.shadowBlur = 10;
  context.lineWidth = 3;
  context.strokeRect(marginX - 8, previewPaddingY - 8, canvasWidth - marginX * 2 + 16, topHeight - previewPaddingY * 2 + 16);
  context.shadowBlur = 0;

  context.strokeStyle = accent;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(marginX, topHeight + 1);
  context.lineTo(canvasWidth - marginX, topHeight + 1);
  context.stroke();

  const bottomGradient = context.createLinearGradient(0, topHeight, 0, canvasHeight);
  bottomGradient.addColorStop(0, 'rgba(38, 15, 70, 0.42)');
  bottomGradient.addColorStop(0.48, 'rgba(13, 11, 30, 0.62)');
  bottomGradient.addColorStop(1, 'rgba(4, 5, 12, 0.9)');
  context.fillStyle = bottomGradient;
  context.fillRect(0, topHeight, canvasWidth, canvasHeight - topHeight);

  const lowerMarginTop = 54;
  const columnGap = 46;
  const lowerHeight = canvasHeight - topHeight;
  const leftWidth = Math.floor((canvasWidth - marginX * 2 - columnGap) * 0.58);
  const rightX = marginX + leftWidth + columnGap;
  const rightWidth = canvasWidth - rightX - marginX;
  const titleY = topHeight + lowerMarginTop;
  const titleSize = fitCanvasText(
    context,
    title,
    leftWidth,
    48,
    32,
    'Orbitron, Rajdhani, Arial, sans-serif',
    700,
  );

  context.font = `700 ${titleSize}px Orbitron, Rajdhani, Arial, sans-serif`;
  context.fillStyle = '#f4efff';
  context.shadowColor = accent;
  context.shadowBlur = 12;
  context.fillText(title, marginX, titleY);
  context.shadowBlur = 0;

  context.strokeStyle = accent;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(marginX, titleY + 20);
  context.lineTo(Math.min(marginX + leftWidth, marginX + context.measureText(title).width * 0.64), titleY + 20);
  context.stroke();

  context.font = '500 34px Rajdhani, Arial, sans-serif';
  context.fillStyle = 'rgba(229, 238, 255, 0.94)';
  drawWrappedCanvasText(
    context,
    blurb,
    marginX,
    titleY + 72,
    leftWidth,
    canvasHeight - (titleY + 96),
    {
      fontSize: 32,
      minSize: 24,
      lineHeight: 1.2,
    },
  );

  const ctaTop = topHeight + 44;
  const ctaHeight = lowerHeight - 88;
  const panelRadius = 18;
  context.save();
  context.beginPath();
  addRoundedRectPath(context, rightX, ctaTop, rightWidth, ctaHeight, panelRadius);
  context.fillStyle = 'rgba(7, 8, 18, 0.72)';
  context.fill();
  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.shadowColor = accent;
  context.shadowBlur = 14;
  context.stroke();
  context.shadowBlur = 0;
  context.restore();

  context.font = '700 25px Orbitron, Rajdhani, Arial, sans-serif';
  context.fillStyle = accent;
  context.fillText('PORTAL READY', rightX + 28, ctaTop + 48);

  context.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(rightX + 28, ctaTop + 68);
  context.lineTo(rightX + rightWidth - 28, ctaTop + 68);
  context.stroke();

  context.fillStyle = 'rgba(242, 246, 255, 0.96)';
  drawWrappedCanvasText(
    context,
    cta,
    rightX + 28,
    ctaTop + 112,
    rightWidth - 56,
    ctaHeight - 178,
    {
      fontSize: 30,
      minSize: 23,
      lineHeight: 1.18,
      weight: 600,
    },
  );

  context.font = '700 28px Orbitron, Rajdhani, Arial, sans-serif';
  context.fillStyle = '#ffffff';
  context.shadowColor = accent;
  context.shadowBlur = 12;
  context.fillText('ENTER PORTAL', rightX + 28, ctaTop + ctaHeight - 42);
  context.shadowBlur = 0;

  const canvasTexture = new THREE.CanvasTexture(canvas);
  canvasTexture.colorSpace = THREE.SRGBColorSpace;
  canvasTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  canvasTexture.minFilter = THREE.LinearFilter;
  canvasTexture.magFilter = THREE.LinearFilter;
  return canvasTexture;
}

function applyConsoleScreenTexture(texture, project = null) {
  if (!consoleScreenImagePlane || !consoleScreenImageMaterial || !texture) {
    return;
  }

  if (consoleScreenImageMaterial.map) {
    consoleScreenImageMaterial.map.dispose();
  }

  if (project) {
    consoleScreenImagePlane.scale.set(consoleScreenMaxWidth, consoleScreenMaxHeight, 1);
    consoleScreenImageMaterial.map = createConsoleProjectTexture(texture, project);
    consoleScreenImageMaterial.color.set('#ffffff');
    consoleScreenImageMaterial.needsUpdate = true;
    return;
  }

  const aspect = getTextureAspect(texture);
  let width = consoleScreenMaxWidth;
  let height = width / aspect;

  if (height > consoleScreenMaxHeight) {
    height = consoleScreenMaxHeight;
    width = height * aspect;
  }

  consoleScreenImagePlane.scale.set(width, height, 1);
  consoleScreenImageMaterial.map = cloneTextureForConsoleScreen(texture);
  consoleScreenImageMaterial.color.set('#ffffff');
  consoleScreenImageMaterial.needsUpdate = true;
}

function applyInitialConsoleScreenTexture() {
  applyConsoleScreenTexture(consoleInitialScreenTexture ?? originalPortalTexture);
}

function applyOriginalPortalTexture() {
  stopActivePortalVideo();
  applyPortalDisplayTexture(originalPortalTexture);
}

function resetConsoleButtonStates() {
  for (const button of consoleButtons) {
    button.targetProgress = 0;
    button.pressProgress = 0;
    button.releaseAt = 0;
    button.root.position.copy(button.restPosition);

    if (button.hitbox) {
      button.hitbox.position.copy(button.hitboxRestPosition);
    }
  }
}

function resetPortalSelection() {
  activeProjectIndex = DEFAULT_PROJECT_INDEX;
  activeButtonProjectIndex = DEFAULT_PROJECT_INDEX;
  applyOriginalPortalTexture();
  applyInitialConsoleScreenTexture();
  resetConsoleButtonStates();
  updateConsoleButtonGlowState();
}

function updateConsoleButtonGlowState() {
  for (const button of consoleButtons) {
    const color = button.projectIndex === activeButtonProjectIndex ? BUTTON_ACTIVE_GLOW : BUTTON_IDLE_GLOW;

    if (button.glowLight) {
      button.glowLight.color.set(color);
    }

    for (const material of button.glowMaterials) {
      if ('emissive' in material) {
        material.emissive.set(color);
      }
    }
  }
}

function applyPortalProject(projectIndex) {
  const project = PORTFOLIO_PROJECTS[projectIndex];
  const texture = projectTextures[projectIndex];

  if (!project || !texture) {
    return;
  }

  activeProjectIndex = projectIndex;
  activeButtonProjectIndex = projectIndex;

  if (!applyPortalVideo(projectIndex)) {
    applyPortalDisplayTexture(texture);
  }
  applyConsoleScreenTexture(texture, project);
  updateConsoleButtonGlowState();

  setStatus(`Portal linked to ${project.title}. Walk through to open it.`);
}

function resetPlayerToSpawn() {
  controls.object.position.set(PLAYER_SPAWN_X, PLAYER_HEIGHT, PLAYER_SPAWN_Z);
  controls.object.rotation.set(0, 0, 0);

  input.forward = false;
  input.backward = false;
  input.left = false;
  input.right = false;
  input.sprint = false;
}

function isPlayerInsidePortalPortal(position) {
  const dx = Math.abs(position.x - PORTAL_X);
  const dz = Math.abs(position.z - (PORTAL_Z + 0.1));

  return (
    dx <= PORTAL_ENTRY_HALF_WIDTH
    && dz <= PORTAL_ENTRY_HALF_DEPTH
    && getPortalStepHeight(position) > 0.45
  );
}

function clearPendingPortalTravel() {
  pendingPortalTravelStartedAt = 0;
  pendingPortalTravelProjectIndex = DEFAULT_PROJECT_INDEX;
}

function openSelectedProjectFromPortal(projectIndex = activeProjectIndex) {
  clearPendingPortalTravel();

  const now = performance.now();

  if (now - lastPortalTravelAt < PORTAL_TRAVEL_COOLDOWN_MS) {
    return;
  }

  const project = projectIndex === null ? null : PORTFOLIO_PROJECTS[projectIndex];
  if (!project) {
    setStatus('Select a console button to link the portal first.');
    resetPlayerToSpawn();
    resetPortalSelection();
    return;
  }

  lastPortalTravelAt = now;
  const openedWindow = window.open(project.url, '_blank');
  let resetStatus = 'Portal reset. Select another destination.';

  if (openedWindow) {
    openedWindow.opener = null;
  } else {
    resetStatus = `Popup blocked. Allow popups to open ${project.title} from the portal.`;
  }

  resetPlayerToSpawn();
  resetPortalSelection();
  setStatus(resetStatus);
}

function updatePortalTravel() {
  if (!controls.isLocked && !mobileSceneActive) {
    return;
  }

  const now = performance.now();

  if (pendingPortalTravelStartedAt > 0) {
    if (now - pendingPortalTravelStartedAt >= PORTAL_ACTIVATION_DELAY_MS) {
      openSelectedProjectFromPortal(pendingPortalTravelProjectIndex);
    }

    return;
  }

  if (isPlayerInsidePortalPortal(controls.object.position)) {
    if (activeProjectIndex === null) {
      openSelectedProjectFromPortal();
      return;
    }

    pendingPortalTravelStartedAt = now;
    pendingPortalTravelProjectIndex = activeProjectIndex;
  }
}

function registerPlayerCollider(centerX, centerZ, halfX, halfZ, rotation = 0) {
  playerColliders.push({
    center: new THREE.Vector2(centerX, centerZ),
    halfExtents: new THREE.Vector2(halfX, halfZ),
    rotation,
  });
}

function resolvePlayerCollisions(position) {
  for (const collider of playerColliders) {
    const cos = Math.cos(-collider.rotation);
    const sin = Math.sin(-collider.rotation);
    const dx = position.x - collider.center.x;
    const dz = position.z - collider.center.y;
    const localX = dx * cos - dz * sin;
    const localZ = dx * sin + dz * cos;
    const closestX = THREE.MathUtils.clamp(localX, -collider.halfExtents.x, collider.halfExtents.x);
    const closestZ = THREE.MathUtils.clamp(localZ, -collider.halfExtents.y, collider.halfExtents.y);
    const diffX = localX - closestX;
    const diffZ = localZ - closestZ;
    const distanceSq = diffX * diffX + diffZ * diffZ;

    let pushX = 0;
    let pushZ = 0;

    if (distanceSq > 0 && distanceSq < PLAYER_RADIUS * PLAYER_RADIUS) {
      const distance = Math.sqrt(distanceSq);
      const pushDistance = PLAYER_RADIUS - distance;
      pushX = (diffX / distance) * pushDistance;
      pushZ = (diffZ / distance) * pushDistance;
    } else if (distanceSq === 0) {
      const penetrationX = collider.halfExtents.x - Math.abs(localX);
      const penetrationZ = collider.halfExtents.y - Math.abs(localZ);

      if (penetrationX < penetrationZ) {
        pushX = (localX < 0 ? -1 : 1) * (penetrationX + PLAYER_RADIUS);
      } else {
        pushZ = (localZ < 0 ? -1 : 1) * (penetrationZ + PLAYER_RADIUS);
      }
    }

    if (pushX !== 0 || pushZ !== 0) {
      const outCos = Math.cos(collider.rotation);
      const outSin = Math.sin(collider.rotation);
      position.x += pushX * outCos - pushZ * outSin;
      position.z += pushX * outSin + pushZ * outCos;
    }
  }
}

function getPortalStepHeight(position) {
  const centerX = PORTAL_X;
  const centerZ = PORTAL_Z;
  const innerHalfX = 2.35;
  const outerHalfX = 3.35;
  const innerHalfZ = 0.8;
  const outerHalfZ = 2.2;
  const localX = position.x - centerX;
  const localZ = position.z - centerZ;
  const absX = Math.abs(localX);
  const absZ = Math.abs(localZ);
  const maxStepHeight = 0.58;

  if (absX <= outerHalfX && absZ <= outerHalfZ) {
    const xRamp = absX <= innerHalfX ? 1 : (outerHalfX - absX) / (outerHalfX - innerHalfX);
    const zRamp = absZ <= innerHalfZ ? 1 : (outerHalfZ - absZ) / (outerHalfZ - innerHalfZ);
    return Math.max(0, Math.min(xRamp, zRamp)) * maxStepHeight;
  }

  return 0;
}

function clampPlayerPosition() {
  const position = controls.object.position;
  position.x = THREE.MathUtils.clamp(position.x, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
  position.z = THREE.MathUtils.clamp(position.z, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);
  resolvePlayerCollisions(position);
  position.x = THREE.MathUtils.clamp(position.x, ROOM_BOUNDS.minX, ROOM_BOUNDS.maxX);
  position.z = THREE.MathUtils.clamp(position.z, ROOM_BOUNDS.minZ, ROOM_BOUNDS.maxZ);
  position.y = PLAYER_HEIGHT + getPortalStepHeight(position);
}

function createTiledTexture(filePath, repeatX, repeatY) {
  const texture = textureLoader.load(new URL(filePath, import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function createSingleTexture(filePath) {
  const texture = textureLoader.load(new URL(filePath, import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createUpperWallFadeMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      color: { value: new THREE.Color('#050912') },
      fadeStart: { value: 0.9 },
      opacity: { value: 0.045 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 color;
      uniform float fadeStart;
      uniform float opacity;

      void main() {
        float alpha = smoothstep(fadeStart, 1.0, vUv.y) * opacity;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createPyramidCeilingMaterial(texture) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      map: { value: texture },
      tint: { value: new THREE.Color('#d7dde0') },
      opacity: { value: 0.16 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 tint;
      uniform float opacity;
      varying vec2 vUv;

      void main() {
        vec4 texel = texture2D(map, vUv);
        float apexFade = 1.0 - smoothstep(0.08, 0.86, vUv.y);
        float baseFade = smoothstep(0.0, 0.08, vUv.y);
        float textureLift = 0.55 + texel.r * 0.45;
        float alpha = opacity * apexFade * baseFade * textureLift;
        vec3 color = texel.rgb * tint * 0.42;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createPyramidCeiling(material) {
  const baseY = WALL_HEIGHT - 0.15;
  const apexY = WALL_HEIGHT + 12;
  const apex = [0, apexY, 0];
  const corners = {
    frontLeft: [-ROOM_HALF_WIDTH, baseY, ROOM_HALF_DEPTH],
    frontRight: [ROOM_HALF_WIDTH, baseY, ROOM_HALF_DEPTH],
    backRight: [ROOM_HALF_WIDTH, baseY, -ROOM_HALF_DEPTH],
    backLeft: [-ROOM_HALF_WIDTH, baseY, -ROOM_HALF_DEPTH],
  };
  const faces = [
    corners.frontLeft, corners.frontRight, apex,
    corners.frontRight, corners.backRight, apex,
    corners.backRight, corners.backLeft, apex,
    corners.backLeft, corners.frontLeft, apex,
  ];
  const uvs = [
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
    0, 0, 1, 0, 0.5, 1,
  ];
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(faces.flat(), 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();

  const ceiling = new THREE.Mesh(geometry, material);
  ceiling.renderOrder = -1;
  scene.add(ceiling);
}

function createRoom() {
  const floorTexture = createTiledTexture('../floor texture.png', 7, 6.5);
  const ceilingTexture = createTiledTexture('../floor texture.png', 3.5, 3.5);
  const hallwayFloorTexture = createTiledTexture('../floor texture.png', 1.2, 10);
  const wallTexture = createTiledTexture('../wall_texture.png', 7, 4);
  const hallwayWallTexture = createTiledTexture('../wall_texture.png', 1.1, 8);
  const columnTexture = createTiledTexture('../wall_texture.png', 0.65, 8);
  const legacyWallTexture = createSingleTexture(LEGACY_WALL_TEXTURE);

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: floorTexture,
    emissive: '#ffffff',
    emissiveMap: floorTexture,
    emissiveIntensity: 0.12,
    metalness: 0,
    roughness: 0.62,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: wallTexture,
    emissive: '#ffffff',
    emissiveMap: wallTexture,
    emissiveIntensity: 0.06375,
    metalness: 0.02,
    roughness: 0.68,
    side: THREE.DoubleSide,
  });
  const hallwayWallMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: hallwayWallTexture,
    emissive: '#ffffff',
    emissiveMap: hallwayWallTexture,
    emissiveIntensity: 0.04875,
    metalness: 0.02,
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const hallwayFloorMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: hallwayFloorTexture,
    emissive: '#ffffff',
    emissiveMap: hallwayFloorTexture,
    emissiveIntensity: 0.09,
    metalness: 0,
    roughness: 0.68,
  });
  const pyramidCeilingMaterial = createPyramidCeilingMaterial(ceilingTexture);
  const columnMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: columnTexture,
    emissive: '#ffffff',
    emissiveMap: columnTexture,
    emissiveIntensity: 0.06375,
    metalness: 0.02,
    roughness: 0.68,
  });
  const legacyWallMaterial = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    map: legacyWallTexture,
    emissive: '#ffffff',
    emissiveMap: legacyWallTexture,
    emissiveIntensity: PORTAL_FRAME_DIFFUSE_LIFT,
    metalness: 0.02,
    roughness: 0.68,
    side: THREE.DoubleSide,
  });
  const doorwayTrimMaterial = new THREE.MeshStandardMaterial({
    color: '#11161a',
    metalness: 0.15,
    roughness: 0.7,
  });
  const hallwayDarkMaterial = new THREE.MeshBasicMaterial({
    color: '#030509',
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
  });
  const hallwayFadeMaterial = new THREE.MeshBasicMaterial({
    color: '#030509',
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const wallFadeMaterial = createUpperWallFadeMaterial();

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  createPyramidCeiling(pyramidCeilingMaterial);

  function addWallPanel(width, height, position, rotationY = 0, material = wallMaterial, fade = true) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    wall.position.copy(position);
    wall.rotation.y = rotationY;
    scene.add(wall);

    if (fade) {
      const fadePanel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), wallFadeMaterial);
      fadePanel.position.copy(position);
      fadePanel.rotation.y = rotationY;
      fadePanel.translateZ(0.02);
      scene.add(fadePanel);
    }

    return wall;
  }

  function addWallColumn(wall, value) {
    const horizontal = wall === 'back' || wall === 'front';
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(horizontal ? 1.36 : 0.68, WALL_HEIGHT, horizontal ? 0.68 : 1.36),
      columnMaterial,
    );

    column.position.y = WALL_CENTER_Y;

    if (wall === 'back') {
      column.position.set(value, WALL_CENTER_Y, -ROOM_HALF_DEPTH + 0.34);
    } else if (wall === 'front') {
      column.position.set(value, WALL_CENTER_Y, ROOM_HALF_DEPTH - 0.34);
    } else if (wall === 'left') {
      column.position.set(-ROOM_HALF_WIDTH + 0.34, WALL_CENTER_Y, value);
    } else {
      column.position.set(ROOM_HALF_WIDTH - 0.34, WALL_CENTER_Y, value);
    }

    scene.add(column);
  }

  function addDoorwayTrim() {
    const sideWidth = 0.24;
    const trimDepth = 0.34;
    const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, DOOR_HEIGHT, trimDepth), doorwayTrimMaterial);
    const rightTrim = leftTrim.clone();
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(DOOR_WIDTH + sideWidth * 2, sideWidth, trimDepth), doorwayTrimMaterial);

    leftTrim.position.set(-DOOR_WIDTH / 2 - sideWidth / 2, DOOR_HEIGHT / 2, ROOM_HALF_DEPTH - 0.18);
    rightTrim.position.set(DOOR_WIDTH / 2 + sideWidth / 2, DOOR_HEIGHT / 2, ROOM_HALF_DEPTH - 0.18);
    topTrim.position.set(0, DOOR_HEIGHT + sideWidth / 2, ROOM_HALF_DEPTH - 0.18);
    scene.add(leftTrim, rightTrim, topTrim);
  }

  addWallPanel(ROOM_WIDTH, WALL_HEIGHT, new THREE.Vector3(0, WALL_CENTER_Y, -ROOM_HALF_DEPTH), 0);
  addWallPanel(
    LEGACY_WALL_PANEL_WIDTH,
    LEGACY_WALL_PANEL_HEIGHT,
    new THREE.Vector3(0, LEGACY_WALL_PANEL_CENTER_Y, -ROOM_HALF_DEPTH + 0.045),
    0,
    legacyWallMaterial,
    false,
  );
  addWallPanel(ROOM_DEPTH, WALL_HEIGHT, new THREE.Vector3(-ROOM_HALF_WIDTH, WALL_CENTER_Y, 0), Math.PI / 2);
  addWallPanel(ROOM_DEPTH, WALL_HEIGHT, new THREE.Vector3(ROOM_HALF_WIDTH, WALL_CENTER_Y, 0), -Math.PI / 2);

  const frontSideWidth = (ROOM_WIDTH - DOOR_WIDTH) / 2;
  addWallPanel(
    frontSideWidth,
    WALL_HEIGHT,
    new THREE.Vector3(-(DOOR_WIDTH / 2 + frontSideWidth / 2), WALL_CENTER_Y, ROOM_HALF_DEPTH),
    Math.PI,
  );
  addWallPanel(
    frontSideWidth,
    WALL_HEIGHT,
    new THREE.Vector3(DOOR_WIDTH / 2 + frontSideWidth / 2, WALL_CENTER_Y, ROOM_HALF_DEPTH),
    Math.PI,
  );
  addWallPanel(
    DOOR_WIDTH,
    WALL_HEIGHT - DOOR_HEIGHT,
    new THREE.Vector3(0, DOOR_HEIGHT + (WALL_HEIGHT - DOOR_HEIGHT) / 2, ROOM_HALF_DEPTH),
    Math.PI,
  );
  addDoorwayTrim();

  for (const x of BACK_WALL_COLUMN_X) {
    addWallColumn('back', x);
  }

  for (const x of FRONT_WALL_COLUMN_X) {
    addWallColumn('front', x);
  }

  for (const z of SIDE_WALL_COLUMN_Z) {
    addWallColumn('left', z);
    addWallColumn('right', z);
  }

  const hallwayCenterZ = ROOM_HALF_DEPTH + HALLWAY_LENGTH / 2;
  const hallwayHeight = DOOR_HEIGHT + 1.1;
  const hallwayFloor = new THREE.Mesh(new THREE.PlaneGeometry(HALLWAY_WIDTH, HALLWAY_LENGTH), hallwayFloorMaterial);
  hallwayFloor.rotation.x = -Math.PI / 2;
  hallwayFloor.position.set(0, 0.01, hallwayCenterZ);
  hallwayFloor.receiveShadow = true;
  scene.add(hallwayFloor);

  addWallPanel(HALLWAY_LENGTH, hallwayHeight, new THREE.Vector3(-HALLWAY_HALF_WIDTH, hallwayHeight / 2, hallwayCenterZ), Math.PI / 2, hallwayWallMaterial, true);
  addWallPanel(HALLWAY_LENGTH, hallwayHeight, new THREE.Vector3(HALLWAY_HALF_WIDTH, hallwayHeight / 2, hallwayCenterZ), -Math.PI / 2, hallwayWallMaterial, true);

  const hallwayCeiling = new THREE.Mesh(new THREE.PlaneGeometry(HALLWAY_WIDTH, HALLWAY_LENGTH), hallwayDarkMaterial);
  hallwayCeiling.rotation.x = Math.PI / 2;
  hallwayCeiling.position.set(0, hallwayHeight, hallwayCenterZ);
  scene.add(hallwayCeiling);

  const hallwayEndFade = new THREE.Mesh(new THREE.PlaneGeometry(HALLWAY_WIDTH, hallwayHeight), hallwayDarkMaterial);
  hallwayEndFade.position.set(0, hallwayHeight / 2, HALLWAY_END_Z);
  hallwayEndFade.rotation.y = Math.PI;
  scene.add(hallwayEndFade);

  for (let i = 1; i <= 5; i += 1) {
    const fadePlane = new THREE.Mesh(new THREE.PlaneGeometry(HALLWAY_WIDTH, hallwayHeight), hallwayFadeMaterial.clone());
    fadePlane.material.opacity = 0.12 + i * 0.1;
    fadePlane.position.set(0, hallwayHeight / 2, ROOM_HALF_DEPTH + HALLWAY_LENGTH * (i / 6));
    fadePlane.rotation.y = Math.PI;
    scene.add(fadePlane);
  }
}

function createFloorGlowTexture(size = 96) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');

  const gradient = context.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 191, 112, 0.48)');
  gradient.addColorStop(0.42, 'rgba(255, 191, 112, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 191, 112, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createWallWashMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      color: { value: new THREE.Color('#ffc27a') },
      opacity: { value: 0.54 },
    },
    vertexShader: `
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform float opacity;
      varying vec2 vUv;

      void main() {
        float y = vUv.y;
        float centeredX = abs(vUv.x * 2.0 - 1.0);
        float coneWidth = mix(0.13, 0.58, smoothstep(0.02, 0.68, y));
        float edge = 1.0 - smoothstep(coneWidth * 0.35, coneWidth, centeredX);
        float baseFade = smoothstep(0.0, 0.08, y);
        float topFade = 1.0 - smoothstep(0.38, 1.0, y);
        float softCore = 0.44 + (1.0 - y) * 0.36;
        float alpha = opacity * edge * baseFade * topFade * softCore;

        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

function createLights() {
  const hemisphere = new THREE.HemisphereLight('#81919a', '#030507', 0.5);
  scene.add(hemisphere);

  const ambient = new THREE.AmbientLight('#7b858c', 0.18);
  scene.add(ambient);

  const fixtureMaterial = new THREE.MeshStandardMaterial({
    color: '#0a0b0c',
    metalness: 0.45,
    roughness: 0.38,
  });
  const lensMaterial = new THREE.MeshBasicMaterial({
    color: '#ffc37a',
  });
  const wallWashMaterial = createWallWashMaterial();
  const floorGlowMaterial = new THREE.MeshBasicMaterial({
    map: createFloorGlowTexture(),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  function addWallUplight(position, target, rotationY = 0) {
    const fixture = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.18), fixtureMaterial);
    const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.08), lensMaterial);
    const beamOffset = 0.045;
    body.position.y = 0.06;
    lens.position.set(0, 0.125, beamOffset);
    lens.rotation.x = -Math.PI / 2;
    fixture.add(body, lens);
    fixture.position.copy(position);
    fixture.rotation.y = rotationY;
    scene.add(fixture);

    const inward = new THREE.Vector3(target.x - position.x, 0, target.z - position.z).normalize();
    const wallWash = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 13.8), wallWashMaterial);
    wallWash.position.set(position.x + inward.x * beamOffset, 6.25, position.z + inward.z * beamOffset);
    wallWash.rotation.y = rotationY;
    wallWash.renderOrder = 1;
    scene.add(wallWash);

    const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.05), floorGlowMaterial);
    floorGlow.rotation.x = -Math.PI / 2;
    floorGlow.position.set(position.x + inward.x * beamOffset, 0.025, position.z + inward.z * beamOffset);
    floorGlow.renderOrder = 1;
    scene.add(floorGlow);
  }

  for (const x of BACK_WALL_LIGHT_X) {
    addWallUplight(new THREE.Vector3(x, 0, -ROOM_HALF_DEPTH + 0.18), new THREE.Vector3(x, 3.7, -ROOM_HALF_DEPTH + 0.8), 0);
  }

  for (const x of FRONT_WALL_LIGHT_X) {
    addWallUplight(new THREE.Vector3(x, 0, ROOM_HALF_DEPTH - 0.18), new THREE.Vector3(x, 3.7, ROOM_HALF_DEPTH - 0.8), Math.PI);
  }

  for (const z of SIDE_WALL_LIGHT_Z) {
    addWallUplight(new THREE.Vector3(-ROOM_HALF_WIDTH + 0.18, 0, z), new THREE.Vector3(-ROOM_HALF_WIDTH + 0.8, 3.7, z), Math.PI / 2);
    addWallUplight(new THREE.Vector3(ROOM_HALF_WIDTH - 0.18, 0, z), new THREE.Vector3(ROOM_HALF_WIDTH - 0.8, 3.7, z), -Math.PI / 2);
  }

}

function createScreenGlowLights() {
  // Screen meshes use MeshBasicMaterial, so these lights enrich the room without changing the displays.
  function addGlowSpot(name, color, intensity, distance, angle, position, targetPosition, layer) {
    const light = new THREE.SpotLight(color, intensity, distance, angle, 1, 2.2);
    light.name = name;
    light.position.copy(position);
    light.target.position.copy(targetPosition);
    light.layers.set(layer);
    scene.add(light, light.target);
  }

  addGlowSpot(
    'Portal screen room glow',
    '#6658ff',
    2.2,
    7.4,
    Math.PI / 2.7,
    new THREE.Vector3(PORTAL_X, 1.8, PORTAL_Z + 2.05),
    new THREE.Vector3(PORTAL_X, 1.55, PORTAL_Z + 7.3),
    PORTAL_FRAME_GLOW_LAYER,
  );
  addGlowSpot(
    'Portal cool edge glow',
    '#39bfff',
    0.65,
    5.4,
    Math.PI / 3.2,
    new THREE.Vector3(PORTAL_X, 2.25, PORTAL_Z + 2.05),
    new THREE.Vector3(PORTAL_X, 1.6, PORTAL_Z + 6.5),
    PORTAL_FRAME_GLOW_LAYER,
  );
  addGlowSpot(
    'Console screen room glow',
    '#7c67ff',
    0.55,
    3.8,
    Math.PI / 2.8,
    new THREE.Vector3(CONSOLE_X, 1.22, CONSOLE_Z + 0.78),
    new THREE.Vector3(CONSOLE_X, 1.0, CONSOLE_Z + 2.95),
    CONSOLE_BODY_GLOW_LAYER,
  );
}

async function loadGlb(filePath, label) {
  setStatus(`Loading ${label}...`);
  const gltf = await gltfLoader.loadAsync(filePath);
  return gltf.scene;
}

function enableLightLayer(object, layer) {
  object.traverse((child) => {
    child.layers.enable(layer);
  });
}

function tuneImportedMaterials(object, options = {}) {
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const diffuseLiftColor = new THREE.Color(options.diffuseLiftColor ?? '#ffffff');

  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = options.castShadow ?? false;
    child.receiveShadow = true;

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material) {
        continue;
      }

      material.side = THREE.DoubleSide;

      if (material.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.anisotropy = maxAnisotropy;
      }

      if ('color' in material && options.colorTint) {
        material.color.multiply(new THREE.Color(options.colorTint));
      }

      if ('color' in material && options.diffuseLift) {
        material.color.lerp(diffuseLiftColor, options.diffuseLift);
      }

      if ('emissive' in material && options.emissive) {
        material.emissive.set(options.emissive);
        material.emissiveIntensity = options.emissiveIntensity ?? 0.25;

        if (options.emissiveFromMap && material.map && 'emissiveMap' in material) {
          material.emissiveMap = material.map;
        }
      }

      material.needsUpdate = true;
    }
  });
}

function tuneDisplayMaterials(object) {
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const assignedMaterials = [];

  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = false;
    child.receiveShadow = false;

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const displayMaterials = sourceMaterials.map((material) => {
      if (material?.map) {
        material.map.colorSpace = THREE.SRGBColorSpace;
        material.map.anisotropy = maxAnisotropy;
      }

      return new THREE.MeshBasicMaterial({
        map: material?.map ?? null,
        color: material?.map ? '#ffffff' : material?.color ?? '#ffffff',
        side: THREE.DoubleSide,
        transparent: material?.transparent ?? false,
        opacity: material?.opacity ?? 1,
        toneMapped: false,
      });
    });

    child.material = Array.isArray(child.material) ? displayMaterials : displayMaterials[0];
    assignedMaterials.push(...displayMaterials);
  });

  return assignedMaterials;
}

function getObjectAverageNormal(object) {
  const normal = new THREE.Vector3();
  const transformedNormal = new THREE.Vector3();

  object.updateWorldMatrix(true, true);
  object.traverse((child) => {
    if (!child.isMesh || !child.geometry?.attributes?.normal) {
      return;
    }

    const normalMatrix = new THREE.Matrix3().getNormalMatrix(child.matrixWorld);
    const normals = child.geometry.attributes.normal;

    for (let i = 0; i < normals.count; i += 1) {
      transformedNormal.fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize();
      normal.add(transformedNormal);
    }
  });

  if (normal.lengthSq() < 0.001) {
    normal.set(0, 0.357, 0.934);
  } else {
    normal.normalize();
  }

  if (normal.z < 0) {
    normal.multiplyScalar(-1);
  }

  return normal;
}

function createConsoleScreenOverlay(screenSource) {
  const bounds = new THREE.Box3().setFromObject(screenSource);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const screenNormal = getObjectAverageNormal(screenSource);
  const screenHeight = Math.sqrt(size.y * size.y + size.z * size.z);
  const screenWidth = size.x;
  const overlay = new THREE.Group();
  const backingMaterial = new THREE.MeshBasicMaterial({
    color: '#020205',
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const backing = new THREE.Mesh(
    new THREE.PlaneGeometry(screenWidth * 0.98, screenHeight * 0.98),
    backingMaterial,
  );

  consoleScreenMaxWidth = screenWidth * 0.92;
  consoleScreenMaxHeight = screenHeight * 0.88;
  consoleScreenImageMaterial = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  consoleScreenImagePlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), consoleScreenImageMaterial);
  consoleScreenImagePlane.position.z = 0.006;
  consoleScreenImagePlane.renderOrder = 4;
  backing.renderOrder = 3;

  overlay.position.copy(center).addScaledVector(screenNormal, 0.012);
  overlay.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), screenNormal);
  overlay.add(backing, consoleScreenImagePlane);
  return overlay;
}

function anchorGroupToFloor(content) {
  const bounds = new THREE.Box3().setFromObject(content);
  const center = bounds.getCenter(new THREE.Vector3());

  content.position.x -= center.x;
  content.position.z -= center.z;
  content.position.y -= bounds.min.y;
}

function registerConsoleButton(root, config) {
  const button = {
    root,
    label: config.label,
    projectIndex: config.projectIndex,
    restPosition: root.position.clone(),
    pressProgress: 0,
    targetProgress: 0,
    releaseAt: 0,
    hitbox: null,
    hitboxRestPosition: new THREE.Vector3(),
    glowLight: null,
    glowMaterials: [],
  };
  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3()).add(BUTTON_HITBOX_PADDING);
  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    }),
  );

  root.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.userData.consoleButton = button;
    const materials = Array.isArray(child.material) ? child.material : [child.material];

    for (const material of materials) {
      if (material && 'emissive' in material) {
        button.glowMaterials.push(material);
      }
    }
  });

  hitbox.name = `${config.label} button hitbox`;
  hitbox.position.copy(center);
  hitbox.userData.consoleButton = button;
  button.hitbox = hitbox;
  button.hitboxRestPosition.copy(center);
  root.add(hitbox);
  consoleButtonMeshes.push(hitbox);
  consoleButtons.push(button);
  return button;
}

function addButtonGlow(root, color) {
  const bounds = new THREE.Box3().setFromObject(root);
  const center = bounds.getCenter(new THREE.Vector3());
  const glow = new THREE.PointLight(color, 0.18, 0.9, 2.4);

  glow.name = `${root.name} glow`;
  glow.position.copy(center).addScaledVector(BUTTON_PRESS_DIRECTION, -0.08);
  root.add(glow);
  return glow;
}

async function createConsoleButton(config) {
  const buttonModel = await loadGlb(config.file, `${config.label} button`);
  const root = new THREE.Group();

  root.name = `${config.label} button`;
  tuneImportedMaterials(buttonModel, {
    diffuseLift: 0.12,
    emissive: BUTTON_IDLE_GLOW,
    emissiveIntensity: 0.16,
    emissiveFromMap: true,
  });
  root.add(buttonModel);
  const glowLight = addButtonGlow(root, BUTTON_IDLE_GLOW);
  const button = registerConsoleButton(root, config);
  button.glowLight = glowLight;
  updateConsoleButtonGlowState();
  return root;
}

async function createPortalGroup() {
  const content = new THREE.Group();
  const frame = await loadGlb('./portal_newest/portal_frame_newest.glb', 'portal frame');
  const portal = await loadGlb('./portal_newest/portal_portal_newest.glb', 'portal screen');

  tuneImportedMaterials(frame, {
    colorTint: '#f5fbff',
    diffuseLift: PORTAL_FRAME_DIFFUSE_LIFT,
    emissive: '#d8edf9',
    emissiveIntensity: 0.04,
    emissiveFromMap: true,
  });
  enableLightLayer(frame, PORTAL_FRAME_GLOW_LAYER);
  const portalMaterials = tuneDisplayMaterials(portal);
  portalDisplayMaterials.push(...portalMaterials);
  originalPortalTexture = portalMaterials.find((material) => material.map)?.map ?? originalPortalTexture;
  applyOriginalPortalTexture();

  content.add(frame, portal);
  anchorGroupToFloor(content);

  const group = new THREE.Group();
  group.add(content);
  group.position.set(PORTAL_X, 0, PORTAL_Z);
  group.scale.setScalar(0.78);
  return group;
}

async function createConsoleGroup() {
  const content = new THREE.Group();
  const consoleBody = await loadGlb('./console_newest/console_buttonless.glb', 'console');
  const screen = await loadGlb('./console_newest/console_screen_newest.glb', 'console screen');
  const buttons = [];

  for (const buttonConfig of CONSOLE_BUTTONS) {
    buttons.push(await createConsoleButton(buttonConfig));
  }

  tuneImportedMaterials(consoleBody, {
    colorTint: '#f5fbff',
    diffuseLift: 0.09,
    emissive: '#d7edf8',
    emissiveIntensity: 0.045,
    emissiveFromMap: true,
  });
  enableLightLayer(consoleBody, CONSOLE_BODY_GLOW_LAYER);
  const consoleScreenOverlay = createConsoleScreenOverlay(screen);
  applyInitialConsoleScreenTexture();

  content.add(consoleBody, consoleScreenOverlay, ...buttons);
  anchorGroupToFloor(content);

  const group = new THREE.Group();
  group.add(content);
  group.position.set(CONSOLE_X, 0, CONSOLE_Z);
  group.rotation.y = CONSOLE_ROTATION_Y;
  group.scale.setScalar(1.2);
  return group;
}

function registerSceneColliders() {
  playerColliders.length = 0;
  registerPlayerCollider(CONSOLE_X, CONSOLE_Z, 0.95, 0.78, CONSOLE_ROTATION_Y);
  registerPlayerCollider(PORTAL_X - 2.35, PORTAL_Z + 0.35, 0.48, 0.72);
  registerPlayerCollider(PORTAL_X + 2.35, PORTAL_Z + 0.35, 0.48, 0.72);
}

function handleKeyChange(event, pressed) {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      input.forward = pressed;
      break;
    case 'KeyS':
    case 'ArrowDown':
      input.backward = pressed;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      input.left = pressed;
      break;
    case 'KeyD':
    case 'ArrowRight':
      input.right = pressed;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      input.sprint = pressed;
      break;
    default:
      break;
  }
}

function updateMobileLook(deltaSeconds) {
  if (!mobileSceneActive || mobileLookInput.lengthSq() === 0) {
    return;
  }

  mobileLookEuler.setFromQuaternion(controls.object.quaternion, 'YXZ');
  mobileLookEuler.y -= mobileLookInput.x * MOBILE_LOOK_SPEED * deltaSeconds;
  mobileLookEuler.x += mobileLookInput.y * MOBILE_LOOK_SPEED * deltaSeconds;
  mobileLookEuler.x = THREE.MathUtils.clamp(
    mobileLookEuler.x,
    -MOBILE_LOOK_PITCH_LIMIT,
    MOBILE_LOOK_PITCH_LIMIT,
  );
  controls.object.quaternion.setFromEuler(mobileLookEuler);
}

function updateMovement(deltaSeconds) {
  if (!controls.isLocked && !mobileSceneActive) {
    return;
  }

  updateMobileLook(deltaSeconds);

  const moveSpeed = input.sprint ? SPRINT_SPEED : MOVE_SPEED;
  const keyboardMoveVector = new THREE.Vector2(
    Number(input.right) - Number(input.left),
    Number(input.forward) - Number(input.backward),
  );

  if (keyboardMoveVector.lengthSq() > 0) {
    keyboardMoveVector.normalize();
  }

  const moveVector = keyboardMoveVector.add(mobileMoveInput);

  if (moveVector.lengthSq() > 0) {
    if (moveVector.lengthSq() > 1) {
      moveVector.normalize();
    }

    controls.moveRight(moveVector.x * moveSpeed * deltaSeconds);
    controls.moveForward(moveVector.y * moveSpeed * deltaSeconds);
  }

  clampPlayerPosition();
  updatePortalTravel();
}

function updateConsoleButtons(deltaSeconds) {
  const now = performance.now();

  for (const button of consoleButtons) {
    if (button.targetProgress > 0 && now >= button.releaseAt) {
      button.targetProgress = 0;
    }

    const damping = button.targetProgress > button.pressProgress ? 28 : 15;
    button.pressProgress = THREE.MathUtils.damp(
      button.pressProgress,
      button.targetProgress,
      damping,
      deltaSeconds,
    );

    if (button.targetProgress === 0 && button.pressProgress < 0.001) {
      button.pressProgress = 0;
    }

    const pressOffset = BUTTON_PRESS_DEPTH * button.pressProgress;
    button.root.position.copy(button.restPosition).addScaledVector(BUTTON_PRESS_DIRECTION, pressOffset);

    if (button.hitbox) {
      button.hitbox.position.copy(button.hitboxRestPosition).addScaledVector(BUTTON_PRESS_DIRECTION, -pressOffset);
    }
  }
}

function getButtonPointer(event) {
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

function pickConsoleButton(event) {
  if (consoleButtonMeshes.length === 0) {
    return null;
  }

  getButtonPointer(event);
  buttonRaycaster.setFromCamera(pointer, camera);
  buttonRaycaster.far = BUTTON_INTERACTION_DISTANCE;

  const hits = buttonRaycaster.intersectObjects(consoleButtonMeshes, false);
  return hits[0]?.object.userData.consoleButton ?? null;
}

function pressConsoleButton(button) {
  button.targetProgress = 1;
  button.releaseAt = performance.now() + BUTTON_RELEASE_DELAY_MS;
  applyPortalProject(button.projectIndex);
}

function getActiveConsoleButton() {
  return consoleButtons.find((button) => button.targetProgress > 0 || button.pressProgress > 0.03) ?? null;
}

async function initialize() {
  createRoom();
  createLights();
  createScreenGlowLights();
  await loadConsoleFonts();
  await Promise.all([
    loadProjectTextures(),
    loadInitialConsoleScreenTexture(),
  ]);

  const portalGroup = await createPortalGroup();
  const consoleGroup = await createConsoleGroup();

  scene.add(portalGroup, consoleGroup);
  registerSceneColliders();

  setStatus(isTouchDevice
    ? 'Scene ready. Tap enter to use touch controls.'
    : 'Scene ready. Click enter to lock the mouse and walk around.');
  enterButton.disabled = false;
  document.body.dataset.sceneReady = 'true';
  window.__sceneReady = true;

  if (previewMode) {
    overlay.hidden = true;
    setHudVisible(true);
  }
}

controls.addEventListener('lock', () => {
  stopMobileScene();
  overlay.hidden = true;
  setHudVisible(true);
});

controls.addEventListener('unlock', () => {
  overlay.hidden = false;
  setHudVisible(false);
});

enterButton.addEventListener('click', () => {
  if (isTouchDevice) {
    startMobileScene();
    return;
  }

  controls.lock();
});

setupVirtualStick(moveStick, moveKnob, mobileMoveInput, {
  curve: MOBILE_MOVE_STICK_CURVE,
  deadzone: MOBILE_MOVE_STICK_DEADZONE,
  mode: 'relative',
  radiusRatio: 0.38,
});
setupVirtualStick(lookStick, lookKnob, mobileLookInput, {
  curve: MOBILE_LOOK_STICK_CURVE,
  deadzone: MOBILE_LOOK_STICK_DEADZONE,
  mode: 'relative',
  radiusRatio: 0.42,
});

function handleScenePointerDown(event) {
  if (event.target?.closest?.('.joystick')) {
    return;
  }

  if (event.type === 'mousedown' && performance.now() - lastTouchButtonPressAt < 700) {
    return;
  }

  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  if (!controls.isLocked && !previewMode && !mobileSceneActive) {
    return;
  }

  const button = pickConsoleButton(event);
  if (!button) {
    return;
  }

  const activeButton = getActiveConsoleButton();
  if (activeButton && activeButton !== button) {
    event.preventDefault();
    return;
  }

  event.preventDefault();
  if (event.pointerType === 'touch') {
    lastTouchButtonPressAt = performance.now();
  }
  pressConsoleButton(button);
}

document.addEventListener('pointerdown', handleScenePointerDown);
document.addEventListener('mousedown', handleScenePointerDown);
document.addEventListener('visibilitychange', () => {
  if (!activePortalVideo) {
    return;
  }

  if (document.hidden) {
    activePortalVideo.pause();
  } else {
    resumeActivePortalVideo();
  }
});

window.addEventListener('keydown', (event) => {
  handleKeyChange(event, true);
});

window.addEventListener('keyup', (event) => {
  handleKeyChange(event, false);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('error', (event) => {
  if (event.message) {
    setStatus(`Scene load failed: ${event.message}`);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason);
  setStatus(`Scene load failed: ${message}`);
});

initialize().catch((error) => {
  console.error(error);
  const message = error instanceof Error ? error.message : String(error);
  setStatus(`Scene load failed: ${message}`);
});

function animate() {
  requestAnimationFrame(animate);
  const deltaSeconds = clock.getDelta();
  updateMovement(deltaSeconds);
  updateConsoleButtons(deltaSeconds);
  renderer.render(scene, camera);
}

animate();
