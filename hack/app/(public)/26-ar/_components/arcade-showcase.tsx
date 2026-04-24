'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  CSS3DObject,
  CSS3DRenderer,
} from 'three/addons/renderers/CSS3DRenderer.js';
import { DEFAULT_ARCADE_MAPPING } from '@/src/lib/constants';

const BUTTON_CAP_Z_THRESHOLD = 0.13;
const BUTTON_REST_OFFSET = 0.04;
const BUTTON_PRESS_LOCAL = 0.06;
const LERP_SPEED = 14;
const JOYSTICK_TILT = 0.3;

const MATERIAL_COLOR_OVERRIDES: Record<string, number> = {
  'Material.001': 0xe1ff00,
};

const SCREEN_WORLD_WIDTH = 2.21;
const SCREEN_WORLD_HEIGHT = 2.04;
const SCREEN_TARGET_ASPECT = 4 / 3;
const GAME_SLUG = 'snake-2p';

type FlatButtonSpec = {
  control: string;
  sourceName: string;
  position: [number, number];
  shouldClone: boolean;
  color?: number;
};

const FLAT_BUTTONS: FlatButtonSpec[] = [
  {
    control: 'P1_1',
    sourceName: 'Cilindro005',
    position: [-0.67, 1.13],
    shouldClone: false,
  },
  {
    control: 'P1_2',
    sourceName: 'Cilindro002',
    position: [-0.425, 1.13],
    shouldClone: false,
  },
  {
    control: 'P1_3',
    sourceName: 'Cilindro003',
    position: [-0.18, 1.13],
    shouldClone: false,
  },
  {
    control: 'P1_4',
    sourceName: 'Cilindro007',
    position: [-0.67, 1.38],
    shouldClone: false,
  },
  {
    control: 'P1_5',
    sourceName: 'Cilindro004',
    position: [-0.425, 1.38],
    shouldClone: false,
  },
  {
    control: 'P1_6',
    sourceName: 'Cilindro002',
    position: [-0.18, 1.38],
    shouldClone: true,
  },
  {
    control: 'P2_1',
    sourceName: 'Cilindro012',
    position: [0.58, 1.13],
    shouldClone: false,
  },
  {
    control: 'P2_2',
    sourceName: 'Cilindro009',
    position: [0.825, 1.13],
    shouldClone: false,
  },
  {
    control: 'P2_3',
    sourceName: 'Cilindro008',
    position: [1.07, 1.13],
    shouldClone: false,
  },
  {
    control: 'P2_4',
    sourceName: 'Cilindro011',
    position: [0.58, 1.38],
    shouldClone: false,
  },
  {
    control: 'P2_5',
    sourceName: 'Cilindro010',
    position: [0.825, 1.38],
    shouldClone: false,
  },
  {
    control: 'P2_6',
    sourceName: 'Cilindro012',
    position: [1.07, 1.38],
    shouldClone: true,
  },
  {
    control: 'START1',
    sourceName: 'Cilindro002',
    position: [-0.15, 0.82],
    shouldClone: true,
    color: 0xffffff,
  },
  {
    control: 'START2',
    sourceName: 'Cilindro012',
    position: [0.15, 0.82],
    shouldClone: true,
    color: 0xffffff,
  },
];

// Camera keyframes: full cabinet (far-left angle) → screen+controls close-up
const CAM_START_POS = new THREE.Vector3(-3.5, 8, 13);
const CAM_START_TARGET = new THREE.Vector3(0, 3.5, 0);
const CAM_START_FOV = 48;

// Pulled back from original (0.5, 4.5, 5.5) / FOV 22 so the full screen + buttons are visible
const CAM_END_POS = new THREE.Vector3(0.2, 4.8, 11.5);
const CAM_END_TARGET = new THREE.Vector3(0.1, 4.0, 0.3);
const CAM_END_TARGET_MOBILE = new THREE.Vector3(0.0, 4.0, 0.3);
const CAM_END_FOV = 17;

// On portrait/narrow screens, pull the camera much closer so the machine fills the frame
const CAM_END_POS_MOBILE = new THREE.Vector3(0.2, 6.2, 10.0);
const CAM_END_FOV_MOBILE = 30;

function buildKeyToControlMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const [code, key] of Object.entries(DEFAULT_ARCADE_MAPPING)) {
    const normalizedKey = key.toLowerCase();
    const existing = map.get(normalizedKey) ?? [];
    existing.push(code);
    map.set(normalizedKey, existing);
  }
  return map;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

function findNodeByName(
  root: THREE.Object3D,
  name: string,
): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (!found && obj.name === name && !(obj instanceof THREE.Mesh))
      found = obj;
  });
  if (!found)
    root.traverse((obj) => {
      if (!found && obj.name === name) found = obj;
    });
  return found;
}

function setupJoystickPivot(
  model: THREE.Object3D,
  baseName: string,
  shaftName: string,
  ballName: string,
): THREE.Group | null {
  const base = findNodeByName(model, baseName);
  const shaft = findNodeByName(model, shaftName);
  const ball = findNodeByName(model, ballName);
  if (!base || !shaft || !ball) return null;

  model.updateMatrixWorld(true);
  const baseWorldPos = new THREE.Vector3();
  base.getWorldPosition(baseWorldPos);

  const pivot = new THREE.Group();
  pivot.name = `${baseName}_pivot`;
  const parent = base.parent;
  if (!parent) return null;

  parent.add(pivot);
  pivot.position.copy(parent.worldToLocal(baseWorldPos.clone()));
  pivot.updateMatrixWorld(true);
  pivot.attach(shaft);
  pivot.attach(ball);
  return pivot;
}

export function ArcadeShowcase({
  scrollProgressRef,
  onStartPress,
  cameraEasing,
  iframeSrc,
  camEndYOffset = 0,
  cameraAnimFn,
  disableInteraction = false,
  showOrbitEnvironment = false,
}: {
  scrollProgressRef: { current: number };
  onStartPress?: (player: 1 | 2) => void;
  cameraEasing?: (t: number) => number;
  iframeSrc?: string;
  camEndYOffset?: number;
  /**
   * When provided, completely overrides the scroll-based camera.
   * Called each frame with seconds elapsed since mount.
   * Return null to keep the camera at its last position.
   */
  cameraAnimFn?: (elapsedSeconds: number) => {
    pos: [number, number, number];
    target: [number, number, number];
    fov: number;
  } | null;
  disableInteraction?: boolean;
  showOrbitEnvironment?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onStartPressRef = useRef(onStartPress);
  onStartPressRef.current = onStartPress;
  const cameraEasingRef = useRef(cameraEasing);
  cameraEasingRef.current = cameraEasing;
  const camEndYOffsetRef = useRef(camEndYOffset);
  camEndYOffsetRef.current = camEndYOffset;
  const cameraAnimFnRef = useRef(cameraAnimFn);
  cameraAnimFnRef.current = cameraAnimFn;
  const disableInteractionRef = useRef(disableInteraction);
  disableInteractionRef.current = disableInteraction;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Input state ───────────────────────────────────────────────────────────
    const activeControls = new Set<string>();
    const keyToControls = buildKeyToControlMap();
    const mouseButtonControls = new Set<string>();
    const buttonShaders = new Map<string, { uniform: { value: number } }>();
    const buttonNodeToControl = new Map<THREE.Object3D, string>();
    const joystickPartToPlayer = new Map<THREE.Object3D, 'p1' | 'p2'>();
    let p1JoystickPivot: THREE.Group | null = null;
    let p2JoystickPivot: THREE.Group | null = null;
    const joystickOverride = new Map<
      'p1' | 'p2',
      { rotX: number; rotY: number }
    >();
    const joystickDragControls = new Map<'p1' | 'p2', Set<string>>();
    let joystickDragState: {
      player: 'p1' | 'p2';
      startClientX: number;
      startClientY: number;
    } | null = null;

    // ── Audio ─────────────────────────────────────────────────────────────────
    let audioCtx: AudioContext | null = null;
    const getAudioCtx = () => {
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    };
    const playNoise = (
      freq: number,
      q: number,
      decay: number,
      volume: number,
      durationS: number,
    ) => {
      const ctx = getAudioCtx();
      const samples = Math.ceil(ctx.sampleRate * durationS);
      const buffer = ctx.createBuffer(1, samples, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < samples; i++) {
        const t = i / ctx.sampleRate;
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay);
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    };
    const playButtonClick = () => playNoise(5000, 4, 320, 0.5, 0.018);
    const playJoystickClick = () => playNoise(3200, 3, 220, 0.38, 0.022);
    const isDirectionControl = (code: string) => /_(U|D|L|R)$/.test(code);

    // ── User-controlled camera orbit state ───────────────────────────────────
    let userYaw = 0; // horizontal orbit offset (radians)
    let userPitch = 0; // vertical orbit offset (radians)
    let userZoom = 1.0; // zoom multiplier (1 = no zoom)
    let orbitDragActive = false;
    let orbitDragStartX = 0;
    let orbitDragStartY = 0;
    let orbitDragStartYaw = 0;
    let orbitDragStartPitch = 0;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      CAM_START_FOV,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.copy(CAM_START_POS);
    camera.lookAt(CAM_START_TARGET);

    // CSS3D renderer sits behind WebGL — needed for the screen iframe
    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(container.clientWidth, container.clientHeight);
    Object.assign(cssRenderer.domElement.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      pointerEvents: 'none',
    });
    container.appendChild(cssRenderer.domElement);

    // WebGL renderer on top, transparent background
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    Object.assign(renderer.domElement.style, {
      position: 'absolute',
      top: '0',
      left: '0',
    });
    container.appendChild(renderer.domElement);

    const cssScene = new THREE.Scene();

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(2, 8, 3);
    mainLight.castShadow = true;
    scene.add(mainLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-3, 4, -2);
    scene.add(fillLight);
    const rimLight = new THREE.PointLight(0xffffff, 0.8, 10);
    rimLight.position.set(0, 6, -3);
    scene.add(rimLight);

    if (showOrbitEnvironment) {
      const envGroup = new THREE.Group();

      const makeGradientTexture = (
        width: number,
        height: number,
        draw: (ctx: CanvasRenderingContext2D) => void,
      ) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        draw(ctx);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      };

      const floorTexture = makeGradientTexture(1024, 1024, (ctx) => {
        const bg = ctx.createRadialGradient(512, 512, 140, 512, 512, 512);
        bg.addColorStop(0, 'rgba(98,255,182,0.14)');
        bg.addColorStop(0.35, 'rgba(25,73,61,0.12)');
        bg.addColorStop(0.7, 'rgba(12,18,24,0.08)');
        bg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 1024, 1024);

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        for (let i = 120; i <= 900; i += 110) {
          ctx.beginPath();
          ctx.arc(512, 512, i / 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      const floor = new THREE.Mesh(
        new THREE.CircleGeometry(22, 96),
        new THREE.MeshBasicMaterial({
          color: 0x0b0f14,
          map: floorTexture ?? undefined,
          transparent: true,
          opacity: 0.9,
        }),
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.25;
      envGroup.add(floor);

      const backdropTexture = makeGradientTexture(1024, 640, (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 1024, 0);
        grad.addColorStop(0, 'rgba(255,122,69,0.22)');
        grad.addColorStop(0.4, 'rgba(17,27,40,0.12)');
        grad.addColorStop(0.7, 'rgba(87,255,198,0.18)');
        grad.addColorStop(1, 'rgba(6,10,18,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 640);

        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2;
        for (let x = 80; x < 1024; x += 120) {
          ctx.beginPath();
          ctx.moveTo(x, 60);
          ctx.lineTo(x - 40, 580);
          ctx.stroke();
        }
      });

      const backdrop = new THREE.Mesh(
        new THREE.PlaneGeometry(36, 18),
        new THREE.MeshBasicMaterial({
          map: backdropTexture ?? undefined,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        }),
      );
      backdrop.position.set(0, 7, -16);
      envGroup.add(backdrop);

      const sideTexture = makeGradientTexture(768, 768, (ctx) => {
        const grad = ctx.createLinearGradient(0, 0, 768, 768);
        grad.addColorStop(0, 'rgba(82,255,204,0.18)');
        grad.addColorStop(0.5, 'rgba(10,15,22,0.06)');
        grad.addColorStop(1, 'rgba(255,122,69,0.16)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 768, 768);

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        for (let y = 90; y < 700; y += 90) {
          ctx.beginPath();
          ctx.moveTo(70, y);
          ctx.lineTo(698, y - 40);
          ctx.stroke();
        }
      });

      const sidePanel = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 14),
        new THREE.MeshBasicMaterial({
          map: sideTexture ?? undefined,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
        }),
      );
      sidePanel.position.set(13, 5.5, -3);
      sidePanel.rotation.y = -Math.PI / 2.8;
      envGroup.add(sidePanel);

      scene.add(envGroup);
    }

    // Smooth camera state
    const smoothPos = CAM_START_POS.clone();
    const smoothTarget = CAM_START_TARGET.clone();
    let smoothFov = CAM_START_FOV;
    const _tmpPos = new THREE.Vector3();
    const _tmpTarget = new THREE.Vector3();

    container.tabIndex = -1;
    container.style.outline = 'none';

    const postControlToIframe = (controlCode: string, pressed: boolean) => {
      gameIframe.contentWindow?.postMessage(
        { type: 'arcade:virtual-control', controlCode, pressed },
        '*',
      );
    };

    const dispatchControl = (code: string, pressed: boolean) => {
      postControlToIframe(code, pressed);
    };

    // Game screen iframe (showcase — no pointer events, game plays on its own)
    const IFRAME_PX_W = 1024;
    const IFRAME_PX_H = 768;
    const gameIframe = document.createElement('iframe');
    gameIframe.src = iframeSrc ?? `/26/arcade/${GAME_SLUG}/embed`;
    gameIframe.style.cssText = `width:${IFRAME_PX_W}px;height:${IFRAME_PX_H}px;border:0;background:#000;pointer-events:none;`;

    const screenCssObject = new CSS3DObject(gameIframe);

    // Load model
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load('/assets/models/arcade.optimized.glb', (gltf) => {
      const model = gltf.scene;
      model.rotation.y = Math.PI;
      scene.add(model);
      model.updateMatrixWorld(true);

      // Material colour overrides
      const recoloredMats = new Set<THREE.Material>();
      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        for (const mat of mats) {
          if (!mat || recoloredMats.has(mat)) continue;
          const override = MATERIAL_COLOR_OVERRIDES[mat.name];
          if (override !== undefined && 'color' in mat) {
            (mat as THREE.MeshStandardMaterial).color.setHex(override);
            recoloredMats.add(mat);
          }
        }
      });

      // Hide screen glass mesh (replaced by CSS3D iframe)
      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        if (mats.some((m) => m.name === 'Material.008')) obj.visible = false;
      });

      // ── Screen CSS3D placement ──────────────────────────────────────────────
      const screen = findNodeByName(model, 'Cube001');
      if (screen) {
        const desiredHeight = SCREEN_WORLD_WIDTH / SCREEN_TARGET_ASPECT;
        const scaleFactor = desiredHeight / SCREEN_WORLD_HEIGHT;
        let meshLocalCenterZ = 0;
        screen.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
            const box = o.geometry.boundingBox;
            if (box) meshLocalCenterZ = (box.min.z + box.max.z) / 2;
          }
        });
        const oldScaleZ = screen.scale.z;
        const newScaleZ = oldScaleZ * scaleFactor;
        screen.position.z += meshLocalCenterZ * (oldScaleZ - newScaleZ);
        screen.scale.z = newScaleZ;
        screen.updateMatrixWorld(true);

        model.updateMatrixWorld(true);
        const screenBox = new THREE.Box3().setFromObject(screen);
        const center = new THREE.Vector3();
        screenBox.getCenter(center);

        const cabinet = findNodeByName(model, 'Cube');
        const cabinetMeshes: THREE.Mesh[] = [];
        if (cabinet)
          cabinet.traverse((o) => {
            if (o instanceof THREE.Mesh) cabinetMeshes.push(o);
          });

        const rc = new THREE.Raycaster(
          new THREE.Vector3(center.x, center.y, 10),
          new THREE.Vector3(0, 0, -1),
        );
        const hit = rc.intersectObjects(cabinetMeshes, false)[0] ?? null;
        const hitPoint = hit ? hit.point.clone() : center.clone();

        let planeNormal = new THREE.Vector3(0, 0, 1);
        if (hit?.face) {
          const nm = new THREE.Matrix3().getNormalMatrix(
            hit.object.matrixWorld,
          );
          planeNormal = hit.face.normal.clone().applyMatrix3(nm).normalize();
          if (planeNormal.z < 0) planeNormal.negate();
        }

        const worldScale = SCREEN_WORLD_WIDTH / IFRAME_PX_W;
        const fwd = planeNormal.clone();
        const right = new THREE.Vector3()
          .crossVectors(new THREE.Vector3(0, 1, 0), fwd)
          .normalize();
        const up = new THREE.Vector3().crossVectors(fwd, right).normalize();
        const orientation = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(right, up, fwd),
        );

        screenCssObject.position
          .copy(hitPoint)
          .addScaledVector(planeNormal, 0.005);
        screenCssObject.quaternion.copy(orientation);
        screenCssObject.scale.setScalar(worldScale);
        cssScene.add(screenCssObject);

        // Mask mesh — cuts a hole in the WebGL layer so the CSS3D iframe shows through
        const maskMat = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          depthTest: true,
          depthWrite: false,
          blending: THREE.CustomBlending,
          blendEquation: THREE.AddEquation,
          blendSrc: THREE.ZeroFactor,
          blendDst: THREE.ZeroFactor,
          blendSrcAlpha: THREE.ZeroFactor,
          blendDstAlpha: THREE.ZeroFactor,
        });
        maskMat.polygonOffset = true;
        maskMat.polygonOffsetFactor = -4;
        maskMat.polygonOffsetUnits = -4;

        const maskMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(
            SCREEN_WORLD_WIDTH,
            SCREEN_WORLD_WIDTH / SCREEN_TARGET_ASPECT,
          ),
          maskMat,
        );
        maskMesh.position.copy(screenCssObject.position);
        maskMesh.quaternion.copy(screenCssObject.quaternion);
        maskMesh.renderOrder = 10;
        // Tag the mask so pickAtPointer can detect screen-area clicks.
        // The mask is already in the scene with a computed matrixWorld, so
        // raycasting against it is reliable (unlike an off-scene stand-alone mesh).
        // Tag so pickAtPointer can detect screen-area clicks via scene raycasting.
        // The mask is already in the scene with a valid matrixWorld — reliable hit target.
        maskMesh.userData.isScreen = true;
        scene.add(maskMesh);
        screen.visible = false;
      }

      // ── Marquee sign ───────────────────────────────────────────────────────
      {
        const cabinetNode = findNodeByName(model, 'Cube');
        if (cabinetNode) {
          const cabinetBox = new THREE.Box3().setFromObject(cabinetNode);
          const meshes: THREE.Mesh[] = [];
          cabinetNode.traverse((o) => {
            if (o instanceof THREE.Mesh) meshes.push(o);
          });

          const ray = new THREE.Raycaster(
            new THREE.Vector3(0, cabinetBox.max.y - 0.3, 5),
            new THREE.Vector3(0, 0, -1),
          );
          const hit = ray.intersectObjects(meshes, false)[0] ?? null;
          const hitPoint = hit
            ? hit.point.clone()
            : new THREE.Vector3(0, cabinetBox.max.y - 0.3, cabinetBox.max.z);

          let normal = new THREE.Vector3(0, 0, 1);
          if (hit?.face) {
            const nm = new THREE.Matrix3().getNormalMatrix(
              hit.object.matrixWorld,
            );
            normal = hit.face.normal.clone().applyMatrix3(nm).normalize();
            if (normal.z < 0) normal.negate();
          }

          const mRight = new THREE.Vector3()
            .crossVectors(new THREE.Vector3(0, 1, 0), normal)
            .normalize();
          const mUp = new THREE.Vector3()
            .crossVectors(normal, mRight)
            .normalize();
          const orientation = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(mRight, mUp, normal),
          );

          const w = (cabinetBox.max.x - cabinetBox.min.x) * 0.85;
          const h = w * 0.22;
          const canvas = document.createElement('canvas');
          canvas.width = 1024;
          canvas.height = Math.round(1024 * (h / w));
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;

          const draw = () => {
            const cw = canvas.width;
            const ch = canvas.height;
            ctx.clearRect(0, 0, cw, ch);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, cw, ch);
            ctx.font = `bold ${Math.round(ch * 0.32)}px Oxanium, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#e1ff00';
            ctx.fillText('platanus hack [26]', cw / 2, ch / 2);
            tex.needsUpdate = true;
          };
          document.fonts
            .load(`bold ${Math.round(canvas.height * 0.32)}px Oxanium`)
            .then(draw)
            .catch(draw);

          const marqueeMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }),
          );
          marqueeMesh.position.copy(hitPoint).addScaledVector(normal, 0.01);
          marqueeMesh.quaternion.copy(orientation);
          scene.add(marqueeMesh);
        }
      }

      // ── Side panel logo ────────────────────────────────────────────────────
      {
        const cabinetNode = findNodeByName(model, 'Cube');
        if (cabinetNode) {
          const cabinetBox = new THREE.Box3().setFromObject(cabinetNode);
          const meshes: THREE.Mesh[] = [];
          cabinetNode.traverse((o) => {
            if (o instanceof THREE.Mesh) meshes.push(o);
          });

          const ray = new THREE.Raycaster(
            new THREE.Vector3(cabinetBox.min.x - 1, cabinetBox.min.y + 1.2, 0),
            new THREE.Vector3(1, 0, 0),
          );
          const hit = ray.intersectObjects(meshes, false)[0] ?? null;
          const hitPoint = hit
            ? hit.point.clone()
            : new THREE.Vector3(cabinetBox.min.x, cabinetBox.min.y + 1.2, 0);

          let sideNormal = new THREE.Vector3(-1, 0, 0);
          if (hit?.face) {
            const nm = new THREE.Matrix3().getNormalMatrix(
              hit.object.matrixWorld,
            );
            sideNormal = hit.face.normal.clone().applyMatrix3(nm).normalize();
            if (sideNormal.x > 0) sideNormal.negate();
          }

          const sRight = new THREE.Vector3()
            .crossVectors(new THREE.Vector3(0, 1, 0), sideNormal)
            .normalize();
          const sUp = new THREE.Vector3()
            .crossVectors(sideNormal, sRight)
            .normalize();
          const orientation = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(sRight, sUp, sideNormal),
          );

          const logoW = (cabinetBox.max.z - cabinetBox.min.z) * 0.5;
          const logoH = logoW / (576 / 112);
          const logoCanvas = document.createElement('canvas');
          logoCanvas.width = 512;
          logoCanvas.height = Math.round(512 / (576 / 112));
          const lCtx = logoCanvas.getContext('2d');
          if (!lCtx) return;
          const logoTex = new THREE.CanvasTexture(logoCanvas);
          logoTex.colorSpace = THREE.SRGBColorSpace;

          const img = new Image();
          img.onload = () => {
            lCtx.clearRect(0, 0, logoCanvas.width, logoCanvas.height);
            lCtx.drawImage(img, 0, 0, logoCanvas.width, logoCanvas.height);
            lCtx.globalCompositeOperation = 'source-in';
            lCtx.fillStyle = '#ffffff';
            lCtx.fillRect(0, 0, logoCanvas.width, logoCanvas.height);
            lCtx.globalCompositeOperation = 'source-over';
            logoTex.needsUpdate = true;
          };
          img.src = '/assets/logos/platanus.svg';

          const logoMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(logoW, logoH),
            new THREE.MeshBasicMaterial({
              map: logoTex,
              toneMapped: false,
              transparent: true,
            }),
          );
          const panelCenterZ = (cabinetBox.min.z + cabinetBox.max.z) / 2 - 0.4;
          logoMesh.position.set(
            hitPoint.x + sideNormal.x * 0.01,
            cabinetBox.min.y + logoH / 2 + 0.15,
            panelCenterZ,
          );
          logoMesh.quaternion.copy(orientation);
          scene.add(logoMesh);
        }
      }

      // ── Joystick pivots ────────────────────────────────────────────────────
      p1JoystickPivot = setupJoystickPivot(
        model,
        'Cilindro',
        'Cilindro001',
        'Esfera',
      );
      p2JoystickPivot = setupJoystickPivot(
        model,
        'Cilindro014',
        'Cilindro013',
        'Esfera001',
      );
      if (p1JoystickPivot)
        p1JoystickPivot.traverse((o) => joystickPartToPlayer.set(o, 'p1'));
      if (p2JoystickPivot)
        p2JoystickPivot.traverse((o) => joystickPartToPlayer.set(o, 'p2'));

      // ── Button layout + rest-position shaders ──────────────────────────────
      const nodesByControl = new Map<string, THREE.Object3D>();
      for (const spec of FLAT_BUTTONS) {
        let node: THREE.Object3D | null;
        if (spec.shouldClone) {
          const template = findNodeByName(model, spec.sourceName);
          if (!template?.parent) continue;
          const cloned = template.clone(true);
          cloned.name = `${spec.control}_clone`;
          template.parent.add(cloned);
          node = cloned;
        } else {
          node = findNodeByName(model, spec.sourceName);
        }
        if (node) nodesByControl.set(spec.control, node);
      }

      for (const spec of FLAT_BUTTONS) {
        const node = nodesByControl.get(spec.control);
        if (!node?.parent) continue;
        const currentWorld = new THREE.Vector3();
        node.getWorldPosition(currentWorld);
        const target = new THREE.Vector3(
          spec.position[0],
          currentWorld.y,
          spec.position[1],
        );
        node.position.copy(node.parent.worldToLocal(target));
        node.updateMatrixWorld(true);
      }
      model.updateMatrixWorld(true);

      const specByControl = new Map<string, FlatButtonSpec>();
      for (const spec of FLAT_BUTTONS) specByControl.set(spec.control, spec);

      const downVec = new THREE.Vector3(0, -1, 0);
      const raycaster = new THREE.Raycaster();

      for (const [control, node] of nodesByControl) {
        if (!node.parent) continue;
        const box = new THREE.Box3().setFromObject(node);
        const center = new THREE.Vector3();
        box.getCenter(center);
        const currentBottomY = box.min.y;

        raycaster.set(
          new THREE.Vector3(center.x, center.y + 0.5, center.z),
          downVec,
        );
        const excluded = new Set<THREE.Object3D>();
        node.traverse((o) => excluded.add(o));

        const hits = raycaster
          .intersectObject(model, true)
          .filter((h) => !excluded.has(h.object));
        let surfaceY: number | null = null;
        for (const hit of hits) {
          if (
            hit.point.y < center.y &&
            (surfaceY === null || hit.point.y > surfaceY)
          )
            surfaceY = hit.point.y;
        }
        if (surfaceY !== null) {
          const worldPos = new THREE.Vector3();
          node.getWorldPosition(worldPos);
          worldPos.y += surfaceY - currentBottomY;
          node.position.copy(node.parent.worldToLocal(worldPos));
          node.updateMatrixWorld(true);
        }

        let mesh: THREE.Mesh | null = null;
        node.traverse((obj) => {
          if (!mesh && obj instanceof THREE.Mesh) mesh = obj;
        });
        if (!mesh) continue;

        const buttonMesh = mesh as THREE.Mesh;
        const srcMat = Array.isArray(buttonMesh.material)
          ? buttonMesh.material[0]
          : buttonMesh.material;
        const clonedMat = srcMat.clone();
        const uPress = { value: BUTTON_REST_OFFSET };

        clonedMat.onBeforeCompile = (shader) => {
          shader.uniforms.uPressAmount = uPress;
          shader.uniforms.uCapThreshold = { value: BUTTON_CAP_Z_THRESHOLD };
          shader.vertexShader = shader.vertexShader
            .replace(
              '#include <common>',
              '#include <common>\nuniform float uPressAmount;\nuniform float uCapThreshold;',
            )
            .replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\nif (position.z > uCapThreshold) { transformed.z -= uPressAmount; }',
            );
        };

        const colorOverride = specByControl.get(control)?.color;
        if (colorOverride !== undefined && 'color' in clonedMat) {
          (clonedMat as THREE.MeshStandardMaterial).color.setHex(colorOverride);
        }
        buttonMesh.material = clonedMat;
        buttonShaders.set(control, { uniform: uPress });
        node.traverse((o) => {
          if (!buttonNodeToControl.has(o)) buttonNodeToControl.set(o, control);
        });
      }

      // ── Logo panel — front face, at button height ────────────────────────────
      // perforador gives the correct front-face Z (confirmed by shift-click log).
      // START1 gives the correct Y (the actual height of the button row).
      {
        const coinNode = findNodeByName(model, 'perforador');
        const start1Node = nodesByControl.get('START1');
        if (coinNode && start1Node) {
          const coinPos = new THREE.Vector3();
          coinNode.getWorldPosition(coinPos);

          const startPos = new THREE.Vector3();
          start1Node.getWorldPosition(startPos);

          const PANEL_W = 0.6;
          const CANVAS_W2 = 1024;
          const CANVAS_H2 = 700;
          const PANEL_H = PANEL_W * (CANVAS_H2 / CANVAS_W2);

          const lCanvas2 = document.createElement('canvas');
          lCanvas2.width = CANVAS_W2;
          lCanvas2.height = CANVAS_H2;
          const lctx2 = lCanvas2.getContext('2d');
          if (!lctx2) return;
          const lTex2 = new THREE.CanvasTexture(lCanvas2);
          lTex2.colorSpace = THREE.SRGBColorSpace;

          let platImg2: HTMLImageElement | null = null;
          let paisImg2: HTMLImageElement | null = null;

          const drawFrontLogos = () => {
            if (!platImg2 || !paisImg2) return;
            lctx2.clearRect(0, 0, CANVAS_W2, CANVAS_H2);

            const pad = 48;
            const gap = 40;
            const availW = CANVAS_W2 - 2 * pad;
            const halfH = (CANVAS_H2 - 2 * pad - gap) / 2;

            // Platanus — top half
            const platRatio2 = 576 / 112;
            const platH2 = Math.min(halfH, availW / platRatio2);
            const platW2 = platH2 * platRatio2;
            lctx2.drawImage(
              platImg2,
              pad + (availW - platW2) / 2,
              pad + (halfH - platH2) / 2,
              platW2,
              platH2,
            );

            // Paisanos — bottom half
            const paisRatio2 = 163 / 28;
            const paisH2 = Math.min(halfH, availW / paisRatio2);
            const paisW2 = paisH2 * paisRatio2;
            lctx2.drawImage(
              paisImg2,
              pad + (availW - paisW2) / 2,
              pad + halfH + gap + (halfH - paisH2) / 2,
              paisW2,
              paisH2,
            );

            lTex2.needsUpdate = true;
          };

          const pImg2 = new Image();
          pImg2.onload = () => {
            platImg2 = pImg2;
            drawFrontLogos();
          };
          pImg2.src = '/assets/logos/platanus.svg';

          const paImg2 = new Image();
          paImg2.onload = () => {
            paisImg2 = paImg2;
            drawFrontLogos();
          };
          paImg2.src = '/assets/logos/paisanos.svg';

          const frontMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(PANEL_W, PANEL_H),
            new THREE.MeshBasicMaterial({
              map: lTex2,
              toneMapped: false,
              transparent: true,
            }),
          );
          // X=0: centered between start buttons
          // Y from START1: places logo at button-row height
          // Z from model bounding box max: the actual frontmost face of the cabinet
          const frontZ = new THREE.Box3().setFromObject(model).max.z;
          frontMesh.position.set(0, startPos.y - 0.35, frontZ + 0.01);
          scene.add(frontMesh);
        }
      }
    });

    // ── Raycasting helper for pointer events ──────────────────────────────────
    const pointerRaycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();

    const pickAtPointer = (
      clientX: number,
      clientY: number,
    ):
      | {
          kind: 'button';
          control: string;
        }
      | { kind: 'joystick'; player: 'p1' | 'p2' }
      | { kind: 'cabinet' }
      | { kind: 'screen'; u: number; v: number }
      | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      pointerRaycaster.setFromCamera(pointerNDC, camera);

      const hits = pointerRaycaster.intersectObjects(scene.children, true);
      let hitMachine = false;
      for (const hit of hits) {
        hitMachine = true;
        // Screen mask mesh is positioned in front of the cabinet surface and tagged
        // with isScreen — its UV maps directly to iframe canvas coordinates.
        if (hit.object.userData.isScreen && hit.uv) {
          return { kind: 'screen', u: hit.uv.x, v: hit.uv.y };
        }
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          const control = buttonNodeToControl.get(obj);
          if (control) return { kind: 'button', control };
          const player = joystickPartToPlayer.get(obj);
          if (player) return { kind: 'joystick', player };
          obj = obj.parent;
        }
      }
      // Ray hit the cabinet body (not a button/joystick) — block orbit
      if (hitMachine) return { kind: 'cabinet' };
      return null;
    };

    // ── Keyboard handlers ─────────────────────────────────────────────────────
    // Use capture phase so we intercept keys before any focused element (menu,
    // link, etc.) can consume or stop-propagate them.
    const onKeyDown = (e: KeyboardEvent) => {
      if (disableInteractionRef.current) return;
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      const codes = keyToControls.get(key);
      if (codes) {
        e.preventDefault();
        for (const code of codes) {
          if (!activeControls.has(code)) {
            activeControls.add(code);
            dispatchControl(code, true);
            if (isDirectionControl(code)) playJoystickClick();
            else playButtonClick();
          }
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (disableInteractionRef.current) return;
      const key = e.key.toLowerCase();
      const codes = keyToControls.get(key);
      if (codes) {
        e.preventDefault();
        for (const code of codes) {
          activeControls.delete(code);
          dispatchControl(code, false);
        }
      }
    };

    // capture: true — fires before any focused child element, so keyboard
    // always reaches the arcade regardless of what else is on-screen.
    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('keyup', onKeyUp, { capture: true });

    const updateJoystickDragControls = (
      player: 'p1' | 'p2',
      rotX: number,
      rotY: number,
    ) => {
      const threshold = JOYSTICK_TILT * 0.4;
      const prefix = player === 'p1' ? 'P1' : 'P2';
      const next = new Set<string>();
      if (rotX > threshold) next.add(`${prefix}_U`);
      else if (rotX < -threshold) next.add(`${prefix}_D`);
      if (rotY > threshold) next.add(`${prefix}_L`);
      else if (rotY < -threshold) next.add(`${prefix}_R`);
      const current = joystickDragControls.get(player) ?? new Set<string>();
      for (const code of current)
        if (!next.has(code)) dispatchControl(code, false);
      for (const code of next)
        if (!current.has(code)) {
          dispatchControl(code, true);
          playJoystickClick();
        }
      joystickDragControls.set(player, next);
    };

    const releaseJoystickDragControls = (player: 'p1' | 'p2') => {
      const current = joystickDragControls.get(player);
      if (!current) return;
      for (const code of current) dispatchControl(code, false);
      joystickDragControls.delete(player);
    };

    // ── Debug raycast logger (Shift+click) ───────────────────────────────────
    const onDebugClick = (e: MouseEvent) => {
      if (!e.shiftKey) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const dbgRay = new THREE.Raycaster();
      dbgRay.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const dbgHits = dbgRay.intersectObjects(scene.children, true);
      if (dbgHits.length === 0) {
        console.log('[raycast] no hit');
        return;
      }
      console.group(`[raycast] ${dbgHits.length} hit(s)`);
      for (const h of dbgHits) {
        const wn = new THREE.Vector3();
        if (h.face) {
          const nm = new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld);
          wn.copy(h.face.normal).applyMatrix3(nm).normalize();
        }
        console.log(
          `obj="${h.object.name || '(unnamed)'}"` +
            `  point=(${h.point.x.toFixed(3)}, ${h.point.y.toFixed(3)}, ${h.point.z.toFixed(3)})` +
            `  normal=(${wn.x.toFixed(2)}, ${wn.y.toFixed(2)}, ${wn.z.toFixed(2)})` +
            `  dist=${h.distance.toFixed(3)}`,
        );
      }
      console.groupEnd();
    };
    renderer.domElement.addEventListener('click', onDebugClick);

    // ── Pointer handlers (button click + joystick drag + orbit) ──────────────
    const onPointerDown = (e: PointerEvent) => {
      if (disableInteractionRef.current) return;
      if (e.button !== 0) return;
      renderer.domElement.setPointerCapture(e.pointerId);
      const pick = pickAtPointer(e.clientX, e.clientY);

      if (pick?.kind === 'button') {
        mouseButtonControls.add(pick.control);
        dispatchControl(pick.control, true);
        playButtonClick();
      } else if (pick?.kind === 'joystick') {
        joystickDragState = {
          player: pick.player,
          startClientX: e.clientX,
          startClientY: e.clientY,
        };
        joystickOverride.set(pick.player, { rotX: 0, rotY: 0 });
      } else if (pick?.kind === 'screen') {
        // Forward click UV to the iframe — it maps UV to canvas coords and hit-tests buttons
        gameIframe.contentWindow?.postMessage(
          { type: 'arcade:screen-click', u: pick.u, v: pick.v },
          '*',
        );
      } else if (pick === null) {
        // Ray missed everything — user clicked empty space outside the machine
        orbitDragActive = true;
        orbitDragStartX = e.clientX;
        orbitDragStartY = e.clientY;
        orbitDragStartYaw = userYaw;
        orbitDragStartPitch = userPitch;
      }
      // pick.kind === 'cabinet' → no orbit
    };

    const onPointerMove = (e: PointerEvent) => {
      if (disableInteractionRef.current) return;
      if (joystickDragState) {
        const dx = e.clientX - joystickDragState.startClientX;
        const dy = e.clientY - joystickDragState.startClientY;
        const pxPerFullTilt = 80;
        const rotX =
          THREE.MathUtils.clamp(-dy / pxPerFullTilt, -1, 1) * JOYSTICK_TILT;
        const rotY =
          THREE.MathUtils.clamp(-dx / pxPerFullTilt, -1, 1) * JOYSTICK_TILT;
        joystickOverride.set(joystickDragState.player, { rotX, rotY });
        updateJoystickDragControls(joystickDragState.player, rotX, rotY);
        return;
      }
      if (!orbitDragActive) return;
      const dx = e.clientX - orbitDragStartX;
      const dy = e.clientY - orbitDragStartY;
      const sensitivity = 0.005;
      userYaw = THREE.MathUtils.clamp(
        orbitDragStartYaw - dx * sensitivity,
        -1.0,
        1.0,
      );
      userPitch = THREE.MathUtils.clamp(
        orbitDragStartPitch + dy * sensitivity,
        -0.4,
        0.4,
      );
    };

    const onPointerUp = (e: PointerEvent) => {
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
      for (const code of mouseButtonControls) dispatchControl(code, false);
      mouseButtonControls.clear();
      if (joystickDragState) {
        releaseJoystickDragControls(joystickDragState.player);
        joystickOverride.delete(joystickDragState.player);
        joystickDragState = null;
      }
      orbitDragActive = false;
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // ── Shift+scroll zoom ─────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      if (disableInteractionRef.current) return;
      if (!e.shiftKey) return;
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      userZoom = THREE.MathUtils.clamp(userZoom + delta, 0.4, 2.5);
    };
    container.addEventListener('wheel', onWheel, { passive: false });

    // ── Animation loop ─────────────────────────────────────────────────────
    let rafId: number;
    let lastTime = performance.now();
    let animStartTime = -1;
    let highWaterProgress = 0; // camera only ever advances forward

    const _relPos = new THREE.Vector3();
    const _yawQ = new THREE.Quaternion();
    const _pitchQ = new THREE.Quaternion();
    const _rightAxis = new THREE.Vector3();
    const _worldY = new THREE.Vector3(0, 1, 0);
    const _mobileEndPos = new THREE.Vector3();
    const _mobileEndTarget = new THREE.Vector3();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const now = performance.now();
      if (animStartTime < 0) animStartTime = now;
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const lerpFactor = 1 - Math.exp(-LERP_SPEED * dt);

      if (cameraAnimFnRef.current) {
        // ── Fully custom camera animation ──────────────────────────────────
        const elapsed = (now - animStartTime) / 1000;
        const cam = cameraAnimFnRef.current(elapsed);
        if (cam) {
          camera.position.set(...cam.pos);
          camera.lookAt(...cam.target);
          camera.fov = cam.fov;
          camera.updateProjectionMatrix();
        }
      } else {
        // ── Scroll-driven camera ───────────────────────────────────────────
        highWaterProgress = Math.max(
          highWaterProgress,
          scrollProgressRef.current,
        );
        const easeFn = cameraEasingRef.current ?? easeInOutCubic;
        const eased = easeFn(Math.max(0, Math.min(1, highWaterProgress)));
        // On portrait screens pull the camera closer; blend from 0 (landscape) to 1 (very portrait).
        const aspect = container.clientWidth / container.clientHeight;
        const mobileFactor = Math.max(0, Math.min(1, (0.75 - aspect) / 0.4));
        _mobileEndPos.lerpVectors(
          CAM_END_POS,
          CAM_END_POS_MOBILE,
          mobileFactor,
        );
        _mobileEndTarget.lerpVectors(
          CAM_END_TARGET,
          CAM_END_TARGET_MOBILE,
          mobileFactor,
        );
        const endFov = THREE.MathUtils.lerp(
          CAM_END_FOV,
          CAM_END_FOV_MOBILE,
          mobileFactor,
        );

        _tmpPos.lerpVectors(CAM_START_POS, _mobileEndPos, eased);
        _tmpTarget.lerpVectors(CAM_START_TARGET, _mobileEndTarget, eased);
        const targetFov = THREE.MathUtils.lerp(CAM_START_FOV, endFov, eased);
        const yOff = camEndYOffsetRef.current * eased;
        _tmpPos.y += yOff;
        _tmpTarget.y += yOff;

        const s = Math.min(dt * 10, 1);
        smoothPos.lerp(_tmpPos, s);
        smoothTarget.lerp(_tmpTarget, s);
        smoothFov += (targetFov - smoothFov) * s;

        // Apply user orbit offset on top of scroll-driven position
        _relPos.subVectors(smoothPos, smoothTarget);
        const dist = _relPos.length();
        _relPos.normalize();

        // Yaw (rotate around world Y)
        _yawQ.setFromAxisAngle(_worldY, userYaw);
        _relPos.applyQuaternion(_yawQ);

        // Pitch (rotate around local right axis)
        _rightAxis.crossVectors(_worldY, _relPos).normalize();
        _pitchQ.setFromAxisAngle(_rightAxis, userPitch);
        _relPos.applyQuaternion(_pitchQ);

        camera.position
          .copy(smoothTarget)
          .addScaledVector(_relPos, dist * userZoom);
        camera.lookAt(smoothTarget);
        camera.fov = smoothFov;
        camera.updateProjectionMatrix();
      }

      // Animate joysticks from keyboard input or mouse drag
      const applyJoystick = (
        pivot: THREE.Group,
        player: 'p1' | 'p2',
        up: string,
        down: string,
        left: string,
        right: string,
      ) => {
        const override = joystickOverride.get(player);
        let targetX: number;
        let targetY: number;
        if (override) {
          targetX = override.rotX;
          targetY = override.rotY;
        } else {
          targetX =
            (activeControls.has(up) ? JOYSTICK_TILT : 0) -
            (activeControls.has(down) ? JOYSTICK_TILT : 0);
          targetY =
            (activeControls.has(left) ? JOYSTICK_TILT : 0) -
            (activeControls.has(right) ? JOYSTICK_TILT : 0);
        }
        pivot.rotation.x += (targetX - pivot.rotation.x) * lerpFactor;
        pivot.rotation.y += (targetY - pivot.rotation.y) * lerpFactor;
        pivot.rotation.z += (0 - pivot.rotation.z) * lerpFactor;
      };
      if (p1JoystickPivot)
        applyJoystick(p1JoystickPivot, 'p1', 'P1_U', 'P1_D', 'P1_L', 'P1_R');
      if (p2JoystickPivot)
        applyJoystick(p2JoystickPivot, 'p2', 'P2_U', 'P2_D', 'P2_L', 'P2_R');

      // Animate button press uniforms
      for (const [control, { uniform }] of buttonShaders) {
        const pressed =
          activeControls.has(control) || mouseButtonControls.has(control);
        const target = BUTTON_REST_OFFSET + (pressed ? BUTTON_PRESS_LOCAL : 0);
        uniform.value += (target - uniform.value) * lerpFactor;
      }

      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      cssRenderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('click', onDebugClick);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
      dracoLoader.dispose();
      audioCtx?.close();
      if (container.contains(cssRenderer.domElement))
        container.removeChild(cssRenderer.domElement);
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
    };
  }, [scrollProgressRef]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
