'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  CSS3DObject,
  CSS3DRenderer,
} from 'three/addons/renderers/CSS3DRenderer.js';
import { DEFAULT_ARCADE_MAPPING } from '@/src/lib/constants';

const JOYSTICK_TILT = 0.3;
const BUTTON_CAP_Z_THRESHOLD = 0.13;
const BUTTON_REST_OFFSET = 0.04;
const BUTTON_PRESS_LOCAL = 0.06;
const LERP_SPEED = 14;

const MATERIAL_COLOR_OVERRIDES: Record<string, number> = {
  'Material.001': 0xe1ff00,
};

const SCREEN_WORLD_WIDTH = 2.21;
const SCREEN_WORLD_HEIGHT = 2.04;
const SCREEN_TARGET_ASPECT = 4 / 3;

const GAME_SLUG = 'word-breaker';

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

function findNodeByName(
  root: THREE.Object3D,
  name: string,
): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((obj) => {
    if (!found && obj.name === name && !(obj instanceof THREE.Mesh)) {
      found = obj;
    }
  });
  if (!found) {
    root.traverse((obj) => {
      if (!found && obj.name === name) {
        found = obj;
      }
    });
  }
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

export function Arcade3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pressedKeys = new Set<string>();
    const activeControls = new Set<string>();
    const keyToControls = buildKeyToControlMap();

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.set(0, 5.5, 4);
    camera.lookAt(0, 3.5, -0.5);

    container.style.background = '#1a1a2e';

    const cssRenderer = new CSS3DRenderer();
    cssRenderer.setSize(container.clientWidth, container.clientHeight);
    cssRenderer.domElement.style.position = 'absolute';
    cssRenderer.domElement.style.top = '0';
    cssRenderer.domElement.style.left = '0';
    cssRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(cssRenderer.domElement);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    container.appendChild(renderer.domElement);

    const cssScene = new THREE.Scene();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 3.5, -0.5);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 15;
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

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

    let p1JoystickPivot: THREE.Group | null = null;
    let p2JoystickPivot: THREE.Group | null = null;
    const buttonShaders = new Map<string, { uniform: { value: number } }>();

    const buttonNodeToControl = new Map<THREE.Object3D, string>();
    const joystickPartToPlayer = new Map<THREE.Object3D, 'p1' | 'p2'>();
    const mouseButtonControls = new Set<string>();

    const IFRAME_PIXEL_WIDTH = 1024;
    const IFRAME_PIXEL_HEIGHT = 768;

    const gameIframe = document.createElement('iframe');
    gameIframe.src = `/26/arcade/${GAME_SLUG}/embed`;
    gameIframe.style.width = `${IFRAME_PIXEL_WIDTH}px`;
    gameIframe.style.height = `${IFRAME_PIXEL_HEIGHT}px`;
    gameIframe.style.border = '0';
    gameIframe.style.background = '#000';
    gameIframe.style.pointerEvents = 'auto';

    const screenCssObject = new CSS3DObject(gameIframe);

    const postControlToIframe = (controlCode: string, pressed: boolean) => {
      gameIframe.contentWindow?.postMessage(
        { type: 'arcade:virtual-control', controlCode, pressed },
        '*',
      );
    };
    const joystickOverride = new Map<
      'p1' | 'p2',
      { rotX: number; rotY: number }
    >();
    let dragState: {
      player: 'p1' | 'p2';
      startClientX: number;
      startClientY: number;
    } | null = null;
    const joystickDragControls = new Map<'p1' | 'p2', Set<string>>();

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
      for (const code of current) {
        if (!next.has(code)) postControlToIframe(code, false);
      }
      for (const code of next) {
        if (!current.has(code)) postControlToIframe(code, true);
      }
      joystickDragControls.set(player, next);
    };

    const releaseJoystickDragControls = (player: 'p1' | 'p2') => {
      const current = joystickDragControls.get(player);
      if (!current) return;
      for (const code of current) postControlToIframe(code, false);
      joystickDragControls.delete(player);
    };

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load('/assets/models/arcade.optimized.glb', (gltf) => {
      const model = gltf.scene;
      model.rotation.y = Math.PI;
      scene.add(model);
      model.updateMatrixWorld(true);

      const allNames: string[] = [];
      model.traverse((obj) => {
        if (obj.name)
          allNames.push(`${obj instanceof THREE.Mesh ? 'M' : 'O'}:${obj.name}`);
      });
      console.log('[arcade-3d] All node names:', allNames.join(' | '));

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

      model.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material];
        if (mats.some((m) => m.name === 'Material.008')) obj.visible = false;
      });

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
      }

      if (screen) {
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(screen);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const cabinet = findNodeByName(model, 'Cube');
        const cabinetMeshes: THREE.Mesh[] = [];
        if (cabinet) {
          cabinet.traverse((o) => {
            if (o instanceof THREE.Mesh) cabinetMeshes.push(o);
          });
        }

        const rayOrigin = new THREE.Vector3(center.x, center.y, 10);
        const rayDir = new THREE.Vector3(0, 0, -1);
        const rc = new THREE.Raycaster(rayOrigin, rayDir);
        const hits = rc.intersectObjects(cabinetMeshes, false);
        const hit = hits[0] ?? null;
        const hitPoint = hit ? hit.point.clone() : center.clone();

        let planeNormal = new THREE.Vector3(0, 0, 1);
        if (hit?.face) {
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(
            hit.object.matrixWorld,
          );
          planeNormal = hit.face.normal
            .clone()
            .applyMatrix3(normalMatrix)
            .normalize();
          if (planeNormal.z < 0) planeNormal.negate();
        }

        const worldScale = SCREEN_WORLD_WIDTH / IFRAME_PIXEL_WIDTH;

        const forward = planeNormal.clone().normalize();
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3()
          .crossVectors(worldUp, forward)
          .normalize();
        const up = new THREE.Vector3().crossVectors(forward, right).normalize();
        const rotMat = new THREE.Matrix4().makeBasis(right, up, forward);
        const orientation = new THREE.Quaternion().setFromRotationMatrix(
          rotMat,
        );

        screenCssObject.position
          .copy(hitPoint)
          .addScaledVector(planeNormal, 0.005);
        screenCssObject.quaternion.copy(orientation);
        screenCssObject.scale.setScalar(worldScale);
        cssScene.add(screenCssObject);

        const maskWidth = SCREEN_WORLD_WIDTH;
        const maskHeight = SCREEN_WORLD_WIDTH / SCREEN_TARGET_ASPECT;
        const maskGeom = new THREE.PlaneGeometry(maskWidth, maskHeight);
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

        const maskMesh = new THREE.Mesh(maskGeom, maskMat);
        maskMesh.position.copy(screenCssObject.position);
        maskMesh.quaternion.copy(screenCssObject.quaternion);
        maskMesh.renderOrder = 10;
        scene.add(maskMesh);

        console.log(
          '[arcade-3d] CSS3D screen placed at',
          hitPoint
            .toArray()
            .map((n) => n.toFixed(3))
            .join(','),
          'normal=',
          planeNormal
            .toArray()
            .map((n) => n.toFixed(3))
            .join(','),
          'scale=',
          worldScale.toFixed(5),
        );

        screen.visible = false;
      }

      // Marquee sign
      {
        const cabinetNode = findNodeByName(model, 'Cube');
        if (cabinetNode) {
          const cabinetBox = new THREE.Box3().setFromObject(cabinetNode);

          // Ray from above-front toward -Z to hit the marquee face
          const marqueeRay = new THREE.Raycaster(
            new THREE.Vector3(0, cabinetBox.max.y - 0.3, 5),
            new THREE.Vector3(0, 0, -1),
          );
          const cabinetMeshes: THREE.Mesh[] = [];
          cabinetNode.traverse((o) => {
            if (o instanceof THREE.Mesh) cabinetMeshes.push(o);
          });
          const marqueeHits = marqueeRay.intersectObjects(cabinetMeshes, false);
          const marqueeHit = marqueeHits[0] ?? null;
          const marqueeHitPoint = marqueeHit
            ? marqueeHit.point.clone()
            : new THREE.Vector3(0, cabinetBox.max.y - 0.3, cabinetBox.max.z);

          // Build orientation from face normal, same as screen
          let marqueeNormal = new THREE.Vector3(0, 0, 1);
          if (marqueeHit?.face) {
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(
              marqueeHit.object.matrixWorld,
            );
            marqueeNormal = marqueeHit.face.normal
              .clone()
              .applyMatrix3(normalMatrix)
              .normalize();
            if (marqueeNormal.z < 0) marqueeNormal.negate();
          }
          const mRight = new THREE.Vector3()
            .crossVectors(new THREE.Vector3(0, 1, 0), marqueeNormal)
            .normalize();
          const mUp = new THREE.Vector3()
            .crossVectors(marqueeNormal, mRight)
            .normalize();
          const marqueeOrientation =
            new THREE.Quaternion().setFromRotationMatrix(
              new THREE.Matrix4().makeBasis(mRight, mUp, marqueeNormal),
            );

          const marqueeW = (cabinetBox.max.x - cabinetBox.min.x) * 0.85;
          const marqueeH = marqueeW * 0.22;

          const marqueeCanvas = document.createElement('canvas');
          marqueeCanvas.width = 1024;
          marqueeCanvas.height = Math.round(1024 * (marqueeH / marqueeW));
          const ctx = marqueeCanvas.getContext('2d');
          if (!ctx) return;
          const marqueeTex = new THREE.CanvasTexture(marqueeCanvas);
          marqueeTex.colorSpace = THREE.SRGBColorSpace;

          const drawMarquee = () => {
            const w = marqueeCanvas.width;
            const h = marqueeCanvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);
            ctx.font = `bold ${Math.round(h * 0.32)}px Oxanium, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#e1ff00';
            ctx.fillText('platanus hack [26]', w / 2, h / 2);
            marqueeTex.needsUpdate = true;
          };

          document.fonts
            .load(`bold ${Math.round(marqueeCanvas.height * 0.32)}px Oxanium`)
            .then(drawMarquee)
            .catch(drawMarquee);

          const marqueeGeo = new THREE.PlaneGeometry(marqueeW, marqueeH);
          const marqueeMat = new THREE.MeshBasicMaterial({
            map: marqueeTex,
            toneMapped: false,
          });
          const marqueeMesh = new THREE.Mesh(marqueeGeo, marqueeMat);
          marqueeMesh.position
            .copy(marqueeHitPoint)
            .addScaledVector(marqueeNormal, 0.01);
          marqueeMesh.quaternion.copy(marqueeOrientation);
          scene.add(marqueeMesh);
        }
      }

      // Side panel logo
      {
        const cabinetNode = findNodeByName(model, 'Cube');
        if (cabinetNode) {
          const cabinetBox = new THREE.Box3().setFromObject(cabinetNode);
          const cabinetMeshes: THREE.Mesh[] = [];
          cabinetNode.traverse((o) => {
            if (o instanceof THREE.Mesh) cabinetMeshes.push(o);
          });

          // Ray from left (-X) toward +X to hit the left panel face
          const sideRay = new THREE.Raycaster(
            new THREE.Vector3(cabinetBox.min.x - 1, cabinetBox.min.y + 1.2, 0),
            new THREE.Vector3(1, 0, 0),
          );
          const sideHits = sideRay.intersectObjects(cabinetMeshes, false);
          const sideHit = sideHits[0] ?? null;
          const sideHitPoint = sideHit
            ? sideHit.point.clone()
            : new THREE.Vector3(cabinetBox.min.x, cabinetBox.min.y + 1.2, 0);

          let sideNormal = new THREE.Vector3(-1, 0, 0);
          if (sideHit?.face) {
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(
              sideHit.object.matrixWorld,
            );
            sideNormal = sideHit.face.normal
              .clone()
              .applyMatrix3(normalMatrix)
              .normalize();
            if (sideNormal.x > 0) sideNormal.negate();
          }
          const sRight = new THREE.Vector3()
            .crossVectors(new THREE.Vector3(0, 1, 0), sideNormal)
            .normalize();
          const sUp = new THREE.Vector3()
            .crossVectors(sideNormal, sRight)
            .normalize();
          const sideOrientation = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(sRight, sUp, sideNormal),
          );

          // Logo dimensions — SVG aspect 576:112 ≈ 5.14:1
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
            // Force everything to white
            lCtx.globalCompositeOperation = 'source-in';
            lCtx.fillStyle = '#ffffff';
            lCtx.fillRect(0, 0, logoCanvas.width, logoCanvas.height);
            lCtx.globalCompositeOperation = 'source-over';
            logoTex.needsUpdate = true;
          };
          img.src = '/assets/logos/platanus.svg';

          const logoGeo = new THREE.PlaneGeometry(logoW, logoH);
          const logoMat = new THREE.MeshBasicMaterial({
            map: logoTex,
            toneMapped: false,
            transparent: true,
          });
          const logoMesh = new THREE.Mesh(logoGeo, logoMat);
          const panelCenterZ = (cabinetBox.min.z + cabinetBox.max.z) / 2 - 0.4;
          logoMesh.position.set(
            sideHitPoint.x + sideNormal.x * 0.01,
            cabinetBox.min.y + logoH / 2 + 0.15,
            panelCenterZ,
          );
          logoMesh.quaternion.copy(sideOrientation);
          scene.add(logoMesh);
        }
      }

      p1JoystickPivot = setupJoystickPivot(
        model,
        'Cilindro',
        'Cilindro001',
        'Esfera',
      );
      console.log('[arcade-3d] P1 joystick pivot:', p1JoystickPivot?.name);
      if (p1JoystickPivot) {
        p1JoystickPivot.traverse((o) => joystickPartToPlayer.set(o, 'p1'));
      }

      p2JoystickPivot = setupJoystickPivot(
        model,
        'Cilindro014',
        'Cilindro013',
        'Esfera001',
      );
      console.log('[arcade-3d] P2 joystick pivot:', p2JoystickPivot?.name);
      if (p2JoystickPivot) {
        p2JoystickPivot.traverse((o) => joystickPartToPlayer.set(o, 'p2'));
      }

      const raycaster = new THREE.Raycaster();
      const downVec = new THREE.Vector3(0, -1, 0);

      const nodesByControl = new Map<string, THREE.Object3D>();

      for (const spec of FLAT_BUTTONS) {
        let node: THREE.Object3D | null;
        if (spec.shouldClone) {
          const template = findNodeByName(model, spec.sourceName);
          if (!template || !template.parent) continue;
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
        if (!node || !node.parent) continue;
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
          if (hit.point.y < center.y) {
            if (surfaceY === null || hit.point.y > surfaceY) {
              surfaceY = hit.point.y;
            }
          }
        }

        if (surfaceY !== null) {
          const delta = surfaceY - currentBottomY;
          const worldPos = new THREE.Vector3();
          node.getWorldPosition(worldPos);
          worldPos.y += delta;
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
              `#include <common>
uniform float uPressAmount;
uniform float uCapThreshold;`,
            )
            .replace(
              '#include <begin_vertex>',
              `#include <begin_vertex>
if (position.z > uCapThreshold) {
  transformed.z -= uPressAmount;
}`,
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
      console.log(`[arcade-3d] Total buttons mapped: ${buttonShaders.size}`);
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      pressedKeys.add(key);
      const codes = keyToControls.get(key);
      if (codes) {
        for (const code of codes) {
          activeControls.add(code);
          postControlToIframe(code, true);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.delete(key);
      const codes = keyToControls.get(key);
      if (codes) {
        for (const code of codes) {
          activeControls.delete(code);
          postControlToIframe(code, false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

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
      | {
          kind: 'joystick';
          player: 'p1' | 'p2';
        }
      | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      pointerRaycaster.setFromCamera(pointerNDC, camera);
      const hits = pointerRaycaster.intersectObjects(scene.children, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          const control = buttonNodeToControl.get(obj);
          if (control) return { kind: 'button', control };
          const player = joystickPartToPlayer.get(obj);
          if (player) return { kind: 'joystick', player };
          obj = obj.parent;
        }
      }
      return null;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const hit = pickAtPointer(e.clientX, e.clientY);
      if (!hit) return;
      e.stopPropagation();
      controls.enabled = false;
      renderer.domElement.setPointerCapture(e.pointerId);

      if (hit.kind === 'button') {
        mouseButtonControls.add(hit.control);
        postControlToIframe(hit.control, true);
      } else {
        dragState = {
          player: hit.player,
          startClientX: e.clientX,
          startClientY: e.clientY,
        };
        joystickOverride.set(hit.player, { rotX: 0, rotY: 0 });
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startClientX;
      const dy = e.clientY - dragState.startClientY;
      const pxPerFullTilt = 80;
      const rotX =
        THREE.MathUtils.clamp(-dy / pxPerFullTilt, -1, 1) * JOYSTICK_TILT;
      const rotY =
        THREE.MathUtils.clamp(-dx / pxPerFullTilt, -1, 1) * JOYSTICK_TILT;
      joystickOverride.set(dragState.player, { rotX, rotY });
      updateJoystickDragControls(dragState.player, rotX, rotY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (renderer.domElement.hasPointerCapture(e.pointerId)) {
        renderer.domElement.releasePointerCapture(e.pointerId);
      }
      for (const code of mouseButtonControls) postControlToIframe(code, false);
      mouseButtonControls.clear();
      if (dragState) {
        releaseJoystickDragControls(dragState.player);
        joystickOverride.delete(dragState.player);
        dragState = null;
      }
      controls.enabled = true;
    };

    const debugRaycaster = new THREE.Raycaster();
    const debugNDC = new THREE.Vector2();
    const onDebugClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      debugNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      debugNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      debugRaycaster.setFromCamera(debugNDC, camera);
      const hits = debugRaycaster.intersectObjects(scene.children, true);
      if (hits.length === 0) {
        console.log('[debug] no hit');
        return;
      }
      const hit = hits[0];
      const obj = hit.object as THREE.Mesh;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      console.group('[debug] clicked mesh');
      console.log('  name:', obj.name);
      console.log('  parent:', obj.parent?.name);
      console.log('  grandparent:', obj.parent?.parent?.name);
      for (const mat of mats) {
        const color =
          'color' in mat
            ? `#${(mat as THREE.MeshStandardMaterial).color.getHexString()}`
            : 'n/a';
        console.log(`  material: ${mat.name} | color: ${color}`);
      }
      console.groupEnd();
    };
    renderer.domElement.addEventListener('click', onDebugClick);

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const clock = new THREE.Clock();
    let animationId: number;

    function animate() {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const lerpFactor = 1 - Math.exp(-LERP_SPEED * dt);

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

      for (const [control, { uniform }] of buttonShaders) {
        const pressed =
          activeControls.has(control) || mouseButtonControls.has(control);
        const target = BUTTON_REST_OFFSET + (pressed ? BUTTON_PRESS_LOCAL : 0);
        uniform.value += (target - uniform.value) * lerpFactor;
      }

      controls.update();
      renderer.render(scene, camera);
      cssRenderer.render(cssScene, camera);
    }

    animate();

    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      cssRenderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      renderer.domElement.removeEventListener('click', onDebugClick);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      controls.dispose();
      dracoLoader.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      if (cssRenderer.domElement.parentNode === container) {
        container.removeChild(cssRenderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative h-screen w-full">
      <div ref={containerRef} className="relative h-full w-full" />
      <div className="absolute bottom-4 left-4 rounded-lg bg-black/70 p-4 text-sm text-white backdrop-blur-sm">
        <p className="mb-2 font-bold">Controls</p>
        <div className="flex gap-8">
          <div>
            <p className="mb-1 text-gray-400 text-xs">Player 1</p>
            <p>WASD - Joystick</p>
            <p>U I O - Buttons 1-3</p>
            <p>J K L - Buttons 4-6</p>
            <p>1 - Start</p>
          </div>
          <div>
            <p className="mb-1 text-gray-400 text-xs">Player 2</p>
            <p>Arrows - Joystick</p>
            <p>R T Y - Buttons 1-3</p>
            <p>F G H - Buttons 4-6</p>
            <p>2 - Start</p>
          </div>
        </div>
      </div>
    </div>
  );
}
