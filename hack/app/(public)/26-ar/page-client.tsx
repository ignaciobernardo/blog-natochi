'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FaPerson, FaPersonDress } from 'react-icons/fa6';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { ArcadeShowcase } from './_components/arcade-showcase';
import DualPhotoSlide from './_components/dual-photo-slide';
import PrizeSlide from './_components/prize-slide';

type NetworkSystem = {
  group: THREE.Group;
  bounds: THREE.Box3;
  update: (deltaSeconds: number) => void;
};

const TOTAL_HACKERS = 100;
const HACKER_ICONS = Array.from({ length: TOTAL_HACKERS }, (_, index) => ({
  id: index + 1,
  gender: index % 5 === 4 ? 'woman' : 'man',
}));

const TOTAL_CLOCKS = 120;
const MAX_HOURS = 36;
const CLOCK_VARIANTS = Array.from({ length: TOTAL_CLOCKS }, (_, index) => {
  const progress = index / (TOTAL_CLOCKS - 1);
  const elapsedMinutes = progress * MAX_HOURS * 60;
  const minuteAngle = (elapsedMinutes % 60) * 6;
  const hourAngle = ((elapsedMinutes / 60) % 12) * 30;

  return {
    hourAngle,
    id: index + 1,
    minuteAngle,
  };
});
const CLOCK_FLOW = [...CLOCK_VARIANTS].reverse();
const ONLY_CRACKS_REPEAT = 50;
const ONLY_CRACKS_ITEMS = Array.from(
  { length: ONLY_CRACKS_REPEAT },
  (_, index) => ({
    id: index + 1,
    outlined: index % 2 === 1,
  }),
);
const TEAM_SIZE_REPEAT = 44;
const TEAM_SIZE_CENTER_ID = Math.floor(TEAM_SIZE_REPEAT / 2) + 1;
const TEAM_SIZE_ITEMS = Array.from({ length: TEAM_SIZE_REPEAT }, (_, index) => {
  const id = index + 1;
  return {
    filled: id === TEAM_SIZE_CENTER_ID,
    id,
  };
});
const SLIDE_TEXT_SIZE_CLASS = 'text-2xl sm:text-3xl md:text-5xl lg:text-6xl';
const TOUR_SPONSORS: Array<{
  from: 'left' | 'right';
  name: string;
  src: string;
}> = [
  {
    from: 'left',
    name: 'Profound',
    src: '/assets/logos/profound.svg',
  },
  {
    from: 'right',
    name: 'Supabase',
    src: '/assets/logos/supabase.svg',
  },
  {
    from: 'left',
    name: 'Vercel',
    src: '/assets/logos/vercel.svg',
  },
  {
    from: 'right',
    name: 'ElevenLabs',
    src: '/assets/logos/elevenlabs.svg',
  },
];
const PRIORITY_DEADLINE_ISO = '2026-04-15T23:59:59-03:00';
const REGULAR_DEADLINE_ISO = '2026-04-27T23:59:59-03:00';
const EMPTY_COUNTDOWN = {
  days: '00',
  hours: '00',
  minutes: '00',
  seconds: '00',
};

function getCountdownFromDiff(diffMs: number) {
  const safeDiff = Math.max(0, diffMs);
  const days = Math.floor(safeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((safeDiff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((safeDiff / (1000 * 60)) % 60);
  const seconds = Math.floor((safeDiff / 1000) % 60);

  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

function getLogoMaskStyle(src: string): CSSProperties {
  return {
    WebkitMaskImage: `url(${src})`,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskImage: `url(${src})`,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
  };
}

function getProjectedBounds(
  box: THREE.Box3,
  object: THREE.Object3D,
  camera: THREE.PerspectiveCamera,
  widthCss: number,
  heightCss: number,
) {
  const corners = [
    new THREE.Vector3(box.min.x, box.min.y, box.min.z),
    new THREE.Vector3(box.min.x, box.min.y, box.max.z),
    new THREE.Vector3(box.min.x, box.max.y, box.min.z),
    new THREE.Vector3(box.min.x, box.max.y, box.max.z),
    new THREE.Vector3(box.max.x, box.min.y, box.min.z),
    new THREE.Vector3(box.max.x, box.min.y, box.max.z),
    new THREE.Vector3(box.max.x, box.max.y, box.min.z),
    new THREE.Vector3(box.max.x, box.max.y, box.max.z),
  ];

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const corner of corners) {
    corner.applyMatrix4(object.matrixWorld);
    corner.project(camera);
    const sx = (corner.x + 1) * 0.5 * widthCss;
    const sy = (1 - corner.y) * 0.5 * heightCss;
    minX = Math.min(minX, sx);
    maxX = Math.max(maxX, sx);
    minY = Math.min(minY, sy);
    maxY = Math.max(maxY, sy);
  }

  return { minX, minY, maxX, maxY };
}

function getGeometryArea(geometry: THREE.BufferGeometry): number {
  const position = geometry.attributes.position;

  if (!position) return 0;

  const index = geometry.index;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  let area = 0;

  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      a.fromBufferAttribute(position, index.getX(i));
      b.fromBufferAttribute(position, index.getX(i + 1));
      c.fromBufferAttribute(position, index.getX(i + 2));
      ab.subVectors(b, a);
      ac.subVectors(c, a);
      area += ab.cross(ac).length() * 0.5;
    }
  } else {
    for (let i = 0; i < position.count; i += 3) {
      a.fromBufferAttribute(position, i);
      b.fromBufferAttribute(position, i + 1);
      c.fromBufferAttribute(position, i + 2);
      ab.subVectors(b, a);
      ac.subVectors(c, a);
      area += ab.cross(ac).length() * 0.5;
    }
  }

  return area;
}

function buildNeuronNetwork(root: THREE.Object3D, colorHex = 0x242424) {
  const meshes: { node: THREE.Mesh; area: number }[] = [];

  root.traverse((node) => {
    if (node instanceof THREE.Mesh && node.geometry?.attributes?.position) {
      const area = getGeometryArea(node.geometry);

      if (area > 0) meshes.push({ node, area });
    }
  });

  if (meshes.length === 0) return null;

  const samplerEntries = meshes.map(({ node, area }) => ({
    area,
    node,
    sampler: new MeshSurfaceSampler(node).build(),
  }));
  const totalArea = samplerEntries.reduce((sum, entry) => sum + entry.area, 0);

  const samplePoint = (
    outPosition: THREE.Vector3,
    outNormal: THREE.Vector3,
  ) => {
    let pick = Math.random() * totalArea;
    let chosen = samplerEntries[samplerEntries.length - 1];

    for (let i = 0; i < samplerEntries.length; i += 1) {
      pick -= samplerEntries[i].area;

      if (pick <= 0) {
        chosen = samplerEntries[i];
        break;
      }
    }

    chosen.sampler.sample(outPosition, outNormal);
    chosen.node.localToWorld(outPosition);
    outNormal.transformDirection(chosen.node.matrixWorld);
  };

  const neuronCount = 9000;
  const tempPosition = new THREE.Vector3();
  const tempNormal = new THREE.Vector3();
  const basePositions = new Float32Array(neuronCount * 3);
  const animatedPositions = new Float32Array(neuronCount * 3);
  const spawnPositions = new Float32Array(neuronCount * 3);
  const normals = new Float32Array(neuronCount * 3);
  const tangentA = new Float32Array(neuronCount * 3);
  const tangentB = new Float32Array(neuronCount * 3);
  const phases = new Float32Array(neuronCount);
  const speeds = new Float32Array(neuronCount);
  const jitter = new Float32Array(neuronCount);
  const alphaAttr = new Float32Array(neuronCount);

  const fallbackUp = new THREE.Vector3(0, 1, 0);
  const fallbackSide = new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3();
  const bitangent = new THREE.Vector3();
  const randomDirection = new THREE.Vector3();

  const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

  for (let i = 0; i < neuronCount; i += 1) {
    samplePoint(tempPosition, tempNormal);

    if (tempNormal.lengthSq() < 1e-6) tempNormal.set(0, 1, 0);
    tempNormal.normalize();
    tangent.crossVectors(tempNormal, fallbackUp);

    if (tangent.lengthSq() < 1e-6)
      tangent.crossVectors(tempNormal, fallbackSide);
    tangent.normalize();
    bitangent.crossVectors(tempNormal, tangent).normalize();

    basePositions[i * 3] = tempPosition.x;
    basePositions[i * 3 + 1] = tempPosition.y;
    basePositions[i * 3 + 2] = tempPosition.z;
    animatedPositions[i * 3] = tempPosition.x;
    animatedPositions[i * 3 + 1] = tempPosition.y;
    animatedPositions[i * 3 + 2] = tempPosition.z;
    normals[i * 3] = tempNormal.x;
    normals[i * 3 + 1] = tempNormal.y;
    normals[i * 3 + 2] = tempNormal.z;
    tangentA[i * 3] = tangent.x;
    tangentA[i * 3 + 1] = tangent.y;
    tangentA[i * 3 + 2] = tangent.z;
    tangentB[i * 3] = bitangent.x;
    tangentB[i * 3 + 1] = bitangent.y;
    tangentB[i * 3 + 2] = bitangent.z;
    phases[i] = Math.random() * Math.PI * 2;
    speeds[i] = 0.25 + Math.random() * 0.55;
    jitter[i] = 0.6 + Math.random() * 0.9;
    alphaAttr[i] = 0.78 + Math.random() * 0.22;

    randomDirection
      .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize();
    const spread = 0.9 + Math.random() * 1.6;
    spawnPositions[i * 3] = tempPosition.x + randomDirection.x * spread;
    spawnPositions[i * 3 + 1] = tempPosition.y + randomDirection.y * spread;
    spawnPositions[i * 3 + 2] = tempPosition.z + randomDirection.z * spread;
  }

  const bounds = new THREE.Box3().setFromBufferAttribute(
    new THREE.BufferAttribute(basePositions, 3),
  );
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const spawnHalfSpan = maxDim * 4.6;
  const spawnDepth = maxDim * 1.4;

  for (let i = 0; i < neuronCount; i += 1) {
    spawnPositions[i * 3] = center.x + (Math.random() * 2 - 1) * spawnHalfSpan;
    spawnPositions[i * 3 + 1] =
      center.y + (Math.random() * 2 - 1) * spawnHalfSpan;
    spawnPositions[i * 3 + 2] = center.z + (Math.random() * 2 - 1) * spawnDepth;
  }

  const geometry = new THREE.BufferGeometry();
  const pointAttr = new THREE.BufferAttribute(animatedPositions, 3);
  pointAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', pointAttr);
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphaAttr, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uColorA: { value: new THREE.Color(colorHex) },
      uColorB: { value: new THREE.Color(0x3d3d3d) },
      uMinY: { value: bounds.min.y },
      uMaxY: { value: bounds.max.y },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uSize: { value: Math.max(4, maxDim * 14) },
    },
    vertexShader: `
      attribute float aAlpha;
      varying float vAlpha;
      varying float vGradient;
      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uMinY;
      uniform float uMaxY;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = uSize * uPixelRatio / max(0.1, -mvPosition.z);
        vAlpha = aAlpha;
        float span = max(0.0001, uMaxY - uMinY);
        vGradient = clamp((position.y - uMinY) / span, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying float vGradient;
      uniform vec3 uColorA;
      uniform vec3 uColorB;

      void main() {
        vec2 centered = gl_PointCoord - vec2(0.5);
        float cheb = max(abs(centered.x), abs(centered.y));
        float body = 1.0 - smoothstep(0.34, 0.42, cheb);
        float ring = smoothstep(0.20, 0.24, cheb) - smoothstep(0.28, 0.32, cheb);
        float crossX = 1.0 - smoothstep(0.025, 0.07, abs(centered.x));
        float crossY = 1.0 - smoothstep(0.025, 0.07, abs(centered.y));
        float cross = max(crossX, crossY);
        float alpha = clamp(body * 0.56 + ring * 0.26 + cross * 0.24, 0.0, 1.0) * vAlpha;
        if (alpha < 0.08) discard;
        vec3 color = mix(uColorA, uColorB, vGradient);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: true,
    blending: THREE.NormalBlending,
  });

  const group = new THREE.Group();
  const points = new THREE.Points(geometry, material);
  group.add(points);

  const displacement = maxDim * 0.012;
  let elapsed = 0;
  const assembleDurationSeconds = 2.4;

  const updateNeuronPositions = (timeSeconds: number) => {
    const assembleProgress = Math.min(1, timeSeconds / assembleDurationSeconds);
    const easedAssemble = easeOutCubic(assembleProgress);

    for (let i = 0; i < neuronCount; i += 1) {
      const phase = phases[i] + timeSeconds * speeds[i];
      const alongA = Math.sin(phase) * displacement * jitter[i];
      const alongB = Math.cos(phase * 1.17) * displacement * 0.8 * jitter[i];
      const alongN = Math.sin(phase * 0.63) * displacement * 0.32;

      const finalX =
        basePositions[i * 3] +
        tangentA[i * 3] * alongA +
        tangentB[i * 3] * alongB +
        normals[i * 3] * alongN;
      const finalY =
        basePositions[i * 3 + 1] +
        tangentA[i * 3 + 1] * alongA +
        tangentB[i * 3 + 1] * alongB +
        normals[i * 3 + 1] * alongN;
      const finalZ =
        basePositions[i * 3 + 2] +
        tangentA[i * 3 + 2] * alongA +
        tangentB[i * 3 + 2] * alongB +
        normals[i * 3 + 2] * alongN;

      animatedPositions[i * 3] =
        spawnPositions[i * 3] +
        (finalX - spawnPositions[i * 3]) * easedAssemble;
      animatedPositions[i * 3 + 1] =
        spawnPositions[i * 3 + 1] +
        (finalY - spawnPositions[i * 3 + 1]) * easedAssemble;
      animatedPositions[i * 3 + 2] =
        spawnPositions[i * 3 + 2] +
        (finalZ - spawnPositions[i * 3 + 2]) * easedAssemble;
    }

    pointAttr.needsUpdate = true;
  };

  return {
    bounds,
    group,
    update: (deltaSeconds: number) => {
      elapsed += deltaSeconds;
      updateNeuronPositions(elapsed);
    },
  } satisfies NetworkSystem;
}

type BuenosAiresPageProps = {
  scheduleSlide?: ReactNode;
};

export default function BuenosAiresPage({
  scheduleSlide,
}: BuenosAiresPageProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const peopleSectionRef = useRef<HTMLElement>(null);
  const peopleTrackRef = useRef<HTMLDivElement>(null);
  const peopleRowRef = useRef<HTMLDivElement>(null);
  const peopleStartedRef = useRef(false);
  const peopleFinishedRef = useRef(false);
  const cracksTrackRef = useRef<HTMLDivElement>(null);
  const cracksFinalRef = useRef<HTMLSpanElement>(null);
  const cracksStartedRef = useRef(false);
  const cracksFinishedRef = useRef(false);
  const teamSizeTrackRef = useRef<HTMLDivElement>(null);
  const teamSizeCenterRef = useRef<HTMLSpanElement>(null);
  const teamSizeStartedRef = useRef(false);
  const teamSizeFinishedRef = useRef(false);
  const clockSectionRef = useRef<HTMLDivElement>(null);
  const clockTrackRef = useRef<HTMLDivElement>(null);
  const clockRowRef = useRef<HTMLDivElement>(null);
  const clockLabelRef = useRef<HTMLParagraphElement>(null);
  const firstClockRef = useRef<HTMLDivElement>(null);
  const clockStartedRef = useRef(false);
  const clockFinishedRef = useRef(false);
  const sponsorSectionRef = useRef<HTMLElement>(null);
  const countdownSlideRef = useRef<HTMLElement>(null);
  const arcadeSectionRef = useRef<HTMLElement>(null);
  const arcadeScrollProgressRef = useRef(0);
  const [showSponsors, setShowSponsors] = useState(false);
  const [showCountdownEnter, setShowCountdownEnter] = useState(false);
  const [countdown, setCountdown] = useState({ ...EMPTY_COUNTDOWN });
  const [priorityCountdown, setPriorityCountdown] = useState({
    ...EMPTY_COUNTDOWN,
  });
  const [isPriorityClosed, setIsPriorityClosed] = useState(false);

  useEffect(() => {
    const priorityTarget = new Date(PRIORITY_DEADLINE_ISO).getTime();
    const regularTarget = new Date(REGULAR_DEADLINE_ISO).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const priorityDiff = priorityTarget - now;

      if (priorityDiff <= 0) {
        setIsPriorityClosed(true);
        setPriorityCountdown({ ...EMPTY_COUNTDOWN });
      } else {
        setIsPriorityClosed(false);
        setPriorityCountdown(getCountdownFromDiff(priorityDiff));
      }

      if (now > regularTarget) {
        setCountdown({ ...EMPTY_COUNTDOWN });
        return;
      }

      const target =
        now <= priorityTarget
          ? { time: priorityTarget }
          : { time: regularTarget };
      setCountdown(getCountdownFromDiff(target.time - now));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(2, 1.1, 2.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    let networkSystem: NetworkSystem | null = null;
    let isHovered = false;
    let rotationSpeed = 0.65;
    const pointer = { x: 0, y: 0, active: false };

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
      isHovered = false;
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    const loader = new GLTFLoader();
    loader.load(
      '/assets/models/mate.optimized.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim > 0) {
          const isMobileViewport =
            window.matchMedia('(max-width: 767px)').matches;
          const targetMateSize = isMobileViewport ? 1.2 : 1.32;
          model.scale.setScalar(targetMateSize / maxDim);
        }

        model.updateMatrixWorld(true);
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
        model.position.x -= scaledCenter.x;
        model.position.z -= scaledCenter.z;
        model.position.y -= scaledCenter.y;

        networkSystem = buildNeuronNetwork(model);

        if (!networkSystem) {
          console.error(
            'Could not build neuron network from /mate.optimized.glb',
          );
          return;
        }

        scene.add(networkSystem.group);
        const placedCenter = networkSystem.bounds.getCenter(
          new THREE.Vector3(),
        );
        camera.lookAt(placedCenter);
      },
      undefined,
      (error) => {
        console.error('Failed to load mate model', error);
      },
    );

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    resize();
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();

      if (networkSystem) {
        networkSystem.group.updateMatrixWorld(true);
        const rect = renderer.domElement.getBoundingClientRect();
        const { minX, minY, maxX, maxY } = getProjectedBounds(
          networkSystem.bounds,
          networkSystem.group,
          camera,
          rect.width,
          rect.height,
        );
        const padding = 3;
        isHovered =
          pointer.active &&
          pointer.x >= minX - padding &&
          pointer.x <= maxX + padding &&
          pointer.y >= minY - padding &&
          pointer.y <= maxY + padding;

        const targetSpeed = isHovered ? 1.8 : 0.65;
        rotationSpeed += (targetSpeed - rotationSpeed) * 0.08;
        networkSystem.group.rotation.y += delta * rotationSpeed;
        networkSystem.update(delta);
      }

      renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(animate);

    return () => {
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const section = peopleSectionRef.current;
    const track = peopleTrackRef.current;
    const peopleRow = peopleRowRef.current;

    if (!section || !track || !peopleRow) return;

    let frameId: number | null = null;
    let startX = 0;
    let endX = 0;

    const setTrackPosition = (x: number, opacity: number) => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      track.style.opacity = String(opacity);
    };

    const getEndX = () => {
      const sectionWidth = section.clientWidth;
      const peopleWidth = peopleRow.scrollWidth;
      const trackWidth = track.scrollWidth;
      const anchorPeopleToMiddle = sectionWidth * 0.5 - peopleWidth;
      const keepTextVisible = sectionWidth - trackWidth - 56;
      return Math.min(anchorPeopleToMiddle, keepTextVisible);
    };

    const recalculatePositions = () => {
      const sectionWidth = section.clientWidth;
      startX = sectionWidth + 96;
      endX = getEndX();

      if (!peopleStartedRef.current) {
        setTrackPosition(startX, 0.12);
      } else if (peopleFinishedRef.current) {
        setTrackPosition(endX, 1);
      }
    };

    const runAnimation = () => {
      recalculatePositions();
      const startTime = performance.now();
      const durationMs = 1900;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - (1 - progress) ** 4;
        endX = getEndX();
        const x = startX + (endX - startX) * eased;
        const opacity = Math.min(1, 0.12 + progress * 1.35);
        setTrackPosition(x, opacity);

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        peopleFinishedRef.current = true;
      };

      frameId = window.requestAnimationFrame(tick);
    };

    recalculatePositions();

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (!isVisible || peopleStartedRef.current) return;

        peopleStartedRef.current = true;
        observer.disconnect();
        runAnimation();
      },
      { threshold: 0.4 },
    );

    observer.observe(section);

    const onResize = () => {
      recalculatePositions();
    };

    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const section = clockSectionRef.current;
    const track = clockTrackRef.current;
    const clockRow = clockRowRef.current;
    const label = clockLabelRef.current;
    const firstClock = firstClockRef.current;

    if (!section || !track || !clockRow || !label || !firstClock) return;

    let frameId: number | null = null;
    let startX = 0;
    let endX = 0;

    const setTrackPosition = (x: number, opacity: number) => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      track.style.opacity = String(opacity);
    };

    const getEndX = () => {
      const targetPadding = 24;
      return targetPadding - label.offsetLeft;
    };

    const recalculatePositions = () => {
      const targetPadding = 24;
      const firstClockLeft = clockRow.offsetLeft + firstClock.offsetLeft;
      startX = targetPadding - firstClockLeft;
      endX = getEndX();

      if (!clockStartedRef.current) {
        setTrackPosition(startX, 0.12);
      } else if (clockFinishedRef.current) {
        setTrackPosition(endX, 1);
      }
    };

    const runAnimation = () => {
      recalculatePositions();
      const startTime = performance.now();
      const durationMs = 1950;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - (1 - progress) ** 4;
        endX = getEndX();
        const x = startX + (endX - startX) * eased;
        const opacity = Math.min(1, 0.12 + progress * 1.35);
        setTrackPosition(x, opacity);

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        clockFinishedRef.current = true;
      };

      frameId = window.requestAnimationFrame(tick);
    };

    recalculatePositions();

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (!isVisible || clockStartedRef.current) return;

        clockStartedRef.current = true;
        observer.disconnect();
        runAnimation();
      },
      { threshold: 0.4 },
    );

    observer.observe(section);

    const onResize = () => {
      recalculatePositions();
    };

    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const section = peopleSectionRef.current;
    const track = cracksTrackRef.current;
    const finalPhrase = cracksFinalRef.current;

    if (!section || !track || !finalPhrase) return;

    let frameId: number | null = null;
    let startX = 0;
    let endX = 0;

    const setTrackPosition = (x: number, opacity: number) => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      track.style.opacity = String(opacity);
    };

    const getEndX = () => {
      return -finalPhrase.offsetLeft;
    };

    const recalculatePositions = () => {
      const sectionWidth = section.clientWidth;
      startX = sectionWidth + 96;
      endX = getEndX();

      if (!cracksStartedRef.current) {
        setTrackPosition(startX, 0.12);
      } else if (cracksFinishedRef.current) {
        setTrackPosition(endX, 1);
      }
    };

    const runAnimation = () => {
      recalculatePositions();
      const startTime = performance.now();
      const durationMs = 1900;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - (1 - progress) ** 4;
        endX = getEndX();
        const x = startX + (endX - startX) * eased;
        const opacity = Math.min(1, 0.12 + progress * 1.35);
        setTrackPosition(x, opacity);

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        cracksFinishedRef.current = true;
      };

      frameId = window.requestAnimationFrame(tick);
    };

    recalculatePositions();

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (!isVisible || cracksStartedRef.current) return;

        cracksStartedRef.current = true;
        observer.disconnect();
        runAnimation();
      },
      { threshold: 0.4 },
    );

    observer.observe(section);

    const onResize = () => {
      recalculatePositions();
    };

    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const section = peopleSectionRef.current;
    const track = teamSizeTrackRef.current;
    const centeredPhrase = teamSizeCenterRef.current;

    if (!section || !track || !centeredPhrase) return;

    let frameId: number | null = null;
    let startX = 0;
    let endX = 0;

    const setTrackPosition = (x: number, opacity: number) => {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      track.style.opacity = String(opacity);
    };

    const getEndX = () => {
      const sectionWidth = section.clientWidth;
      const rightPadding = Math.max(16, sectionWidth * 0.05);
      const phraseRight =
        centeredPhrase.offsetLeft + centeredPhrase.offsetWidth;
      return sectionWidth - rightPadding - phraseRight;
    };

    const recalculatePositions = () => {
      startX = -track.scrollWidth - 96;
      endX = getEndX();

      if (!teamSizeStartedRef.current) {
        setTrackPosition(startX, 0.12);
      } else if (teamSizeFinishedRef.current) {
        setTrackPosition(endX, 1);
      }
    };

    const runAnimation = () => {
      recalculatePositions();
      const startTime = performance.now();
      const durationMs = 1900;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - (1 - progress) ** 4;
        endX = getEndX();
        const x = startX + (endX - startX) * eased;
        const opacity = Math.min(1, 0.12 + progress * 1.35);
        setTrackPosition(x, opacity);

        if (progress < 1) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        teamSizeFinishedRef.current = true;
      };

      frameId = window.requestAnimationFrame(tick);
    };

    recalculatePositions();

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);

        if (!isVisible || teamSizeStartedRef.current) return;

        teamSizeStartedRef.current = true;
        observer.disconnect();
        runAnimation();
      },
      { threshold: 0.4 },
    );

    observer.observe(section);

    const onResize = () => {
      recalculatePositions();
    };

    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);

      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  useEffect(() => {
    const section = sponsorSectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible) return;

        setShowSponsors(true);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const section = countdownSlideRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting);
        if (!isVisible) return;

        setShowCountdownEnter(true);
        observer.disconnect();
      },
      { threshold: 0.45 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const section = arcadeSectionRef.current;
      if (!section) return;
      // 0 when section bottom enters viewport, 1 when section top reaches viewport top
      const rect = section.getBoundingClientRect();
      const progress = 1 - rect.top / window.innerHeight;
      arcadeScrollProgressRef.current = Math.max(0, Math.min(1, progress));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const getSponsorMotionClass = (from: 'left' | 'right') =>
    showSponsors
      ? 'translate-x-0 rotate-0 opacity-100'
      : `${from === 'left' ? '-translate-x-24 -rotate-6' : 'translate-x-24 rotate-6'} opacity-0`;

  return (
    <>
      <section className="selection-on-light relative min-h-dvh w-full overflow-hidden bg-primary text-background md:h-dvh">
        <div ref={containerRef} className="absolute inset-0" />
        <h1 className="absolute inset-x-0 top-10 z-10 px-4 text-center lowercase tracking-tighter md:top-14">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-85"
          >
            <span className="font-logo text-4xl sm:text-5xl md:text-7xl lg:text-8xl">
              <span className="font-light">platanus hack</span>{' '}
              <span className="font-medium">[26]</span>
            </span>{' '}
            <span className="mt-2 block font-title text-base uppercase tracking-[0.2em] md:text-xl">
              latam tour: buenos aires -{' '}
              <strong className="font-bold">8 al 10 de mayo</strong>
            </span>
          </Link>
        </h1>
        <div className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-4 md:bottom-12">
          <Link
            href={'/26-ar/apply' as any}
            className="inline-flex min-h-12 flex-col items-center justify-center border-2 border-background bg-background px-6 py-2.5 text-center font-title text-base text-primary uppercase tracking-[0.12em] transition [animation:landingFadeIn_700ms_cubic-bezier(0.22,1,0.36,1)_420ms_both] hover:scale-[1.02] md:min-h-14 md:px-10 md:text-xl"
          >
            <span>postulá con tu equipo</span>
            <span className="mt-0.5 font-mono text-[9px] text-primary/75 uppercase tracking-[0.08em] md:text-[11px]">
              {isPriorityClosed
                ? 'priority cerrado'
                : `priority ${priorityCountdown.days}:${priorityCountdown.hours}:${priorityCountdown.minutes}:${priorityCountdown.seconds}`}
            </span>
          </Link>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex justify-center">
          <span className="font-title text-3xl text-background/85 leading-none [animation:bounce_1.5s_ease-in-out_infinite]">
            ⌄
          </span>
        </div>
      </section>

      <section
        ref={peopleSectionRef}
        className="selection-on-light flex h-auto min-h-0 w-full items-start justify-center bg-background px-6 py-10 text-primary sm:px-10 md:h-dvh md:items-center md:py-0"
      >
        <div className="mx-auto flex w-full max-w-[1800px] flex-col justify-start gap-3 py-2 md:h-full md:justify-evenly md:gap-0 md:py-8">
          <div className="relative h-36 overflow-hidden md:h-[14rem]">
            <div className="-translate-y-1/2 absolute top-1/2">
              <div
                ref={peopleTrackRef}
                className="flex w-max flex-nowrap items-center gap-12 px-4 will-change-transform"
                style={{ transform: 'translate3d(110vw, 0, 0)', opacity: 0.12 }}
              >
                <div
                  ref={peopleRowRef}
                  className="flex flex-nowrap items-center gap-4 md:gap-5"
                >
                  {HACKER_ICONS.map(({ id, gender }) => {
                    const Icon = gender === 'man' ? FaPerson : FaPersonDress;

                    return (
                      <Icon
                        key={id}
                        className="size-14 shrink-0 text-primary sm:size-16 md:size-20"
                      />
                    );
                  })}
                </div>

                <p className="m-0 whitespace-nowrap font-bold font-title text-4xl text-primary uppercase leading-none sm:text-6xl md:text-7xl lg:text-8xl">
                  100 hackers
                </p>
              </div>
            </div>
          </div>

          <div
            ref={clockSectionRef}
            className="relative h-36 overflow-hidden bg-background md:h-[14rem]"
          >
            <div className="-translate-y-1/2 absolute top-1/2">
              <div
                ref={clockTrackRef}
                className="flex w-max flex-nowrap items-center gap-8 px-4 will-change-transform md:gap-10"
                style={{
                  transform: 'translate3d(-110vw, 0, 0)',
                  opacity: 0.12,
                }}
              >
                <p
                  ref={clockLabelRef}
                  className="m-0 whitespace-nowrap font-bold font-title text-4xl text-primary uppercase leading-none sm:text-6xl md:text-7xl lg:text-8xl"
                >
                  36 horas
                </p>
                <div
                  ref={clockRowRef}
                  className="flex flex-nowrap items-center gap-3 md:gap-4"
                >
                  {CLOCK_FLOW.map(({ id, hourAngle, minuteAngle }) => {
                    const isFirstClock = id === 1;

                    return (
                      <div
                        key={id}
                        ref={isFirstClock ? firstClockRef : undefined}
                        className="relative size-14 shrink-0 rounded-full border-[3px] border-primary sm:size-16 md:size-20"
                      >
                        <span
                          className="absolute top-1/2 left-1/2 h-[26%] w-[3px] origin-bottom rounded-full bg-primary"
                          style={{
                            transform: `translate(-50%, -100%) rotate(${hourAngle}deg)`,
                          }}
                        />
                        <span
                          className="absolute top-1/2 left-1/2 h-[38%] w-[2px] origin-bottom rounded-full bg-primary"
                          style={{
                            transform: `translate(-50%, -100%) rotate(${minuteAngle}deg)`,
                          }}
                        />
                        <span className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 size-2 rounded-full bg-primary" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="relative h-20 overflow-hidden md:h-[7rem]">
            <div className="-translate-y-1/2 absolute top-1/2">
              <div
                ref={teamSizeTrackRef}
                className={`flex w-max flex-nowrap items-center gap-5 whitespace-nowrap px-4 font-bold font-title text-primary uppercase leading-none tracking-[0.08em] ${SLIDE_TEXT_SIZE_CLASS}`}
                style={{ transform: 'translate3d(110vw, 0, 0)', opacity: 0.12 }}
              >
                {TEAM_SIZE_ITEMS.map(({ id, filled }) => (
                  <span
                    key={id}
                    ref={filled ? teamSizeCenterRef : undefined}
                    style={
                      !filled
                        ? {
                            WebkitTextFillColor: 'transparent',
                            WebkitTextStroke: '1.5px currentColor',
                          }
                        : undefined
                    }
                  >
                    3-5 por equipo
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative hidden h-24 overflow-hidden md:block md:h-[7rem]">
            <div className="-translate-y-1/2 absolute top-1/2">
              <div
                ref={cracksTrackRef}
                className={`flex w-max flex-nowrap items-center gap-5 whitespace-nowrap px-4 font-bold font-title text-primary uppercase leading-none tracking-[0.08em] ${SLIDE_TEXT_SIZE_CLASS}`}
                style={{ transform: 'translate3d(110vw, 0, 0)', opacity: 0.12 }}
              >
                {ONLY_CRACKS_ITEMS.map(({ id, outlined }) => (
                  <span
                    key={id}
                    style={
                      outlined
                        ? {
                            WebkitTextFillColor: 'transparent',
                            WebkitTextStroke: '1.5px currentColor',
                          }
                        : undefined
                    }
                  >
                    only cracks
                  </span>
                ))}
                <span ref={cracksFinalRef} className="whitespace-nowrap">
                  only cracks @ buenos aires
                </span>
                <span
                  className="whitespace-nowrap"
                  style={{
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: '1.5px currentColor',
                  }}
                >
                  only cracks @ buenos aires
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PrizeSlide />

      <section
        ref={sponsorSectionRef}
        className="selection-on-light flex w-full items-center justify-center bg-background px-6 py-16 text-primary sm:px-10 md:h-dvh md:py-0"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center text-center">
          <h2 className="mt-4 font-bold font-title text-5xl leading-tight sm:text-6xl md:text-7xl">
            <span className="inline-block bg-primary px-3 py-1 text-background sm:px-4 sm:py-1.5">
              sponsored by the big ones
            </span>
          </h2>

          <div className="mt-12 w-full">
            <div className="relative overflow-hidden py-4 sm:py-6">
              <div className="relative flex flex-col gap-8 md:gap-10">
                <div
                  className={`flex transform-gpu justify-center transition duration-700 ease-out will-change-transform ${getSponsorMotionClass('left')}`}
                  style={{ transitionDelay: '80ms' }}
                >
                  <div
                    role="img"
                    aria-label="Anthropic"
                    className="h-16 w-full max-w-[900px] bg-primary sm:h-20 md:h-24"
                    style={getLogoMaskStyle('/assets/logos/anthropic.svg')}
                  />
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  {TOUR_SPONSORS.map((sponsor, index) => (
                    <div
                      key={sponsor.name}
                      className={`flex transform-gpu items-center justify-center transition duration-700 ease-out will-change-transform ${getSponsorMotionClass(sponsor.from)}`}
                      style={{
                        transitionDelay: `${160 + index * 90}ms`,
                      }}
                    >
                      <div
                        role="img"
                        aria-label={sponsor.name}
                        className="h-14 w-full max-w-[320px] bg-primary sm:h-16 md:h-20"
                        style={getLogoMaskStyle(sponsor.src)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href={'/tour/sponsor' as any}
              className="inline-flex min-h-12 items-center justify-center border-2 border-primary bg-primary px-6 py-2.5 text-center font-title text-background text-base uppercase tracking-[0.12em] transition hover:scale-[1.02] md:min-h-14 md:px-10 md:text-xl"
            >
              sé sponsor
            </Link>
          </div>
        </div>
      </section>

      <DualPhotoSlide />

      {/* Arcade showcase — camera zoom driven by scroll, no hijacking */}
      <section
        ref={arcadeSectionRef}
        className="relative min-h-dvh w-full overflow-hidden bg-background"
      >
        <ArcadeShowcase
          scrollProgressRef={arcadeScrollProgressRef}
          onStartPress={(player) => {
            if (player === 1)
              window.open(
                'https://github.com/platanus-hack/platanus-hack-26-argentina-arcade/fork',
                '_blank',
              );
          }}
        />
      </section>

      {scheduleSlide}

      <section
        ref={countdownSlideRef}
        className="selection-on-light relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-6 py-16 text-primary md:h-dvh md:py-0"
      >
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <h2 className="mt-4 font-bold font-title text-5xl leading-tight sm:text-6xl md:text-7xl">
            <span className="inline-block bg-primary px-3 py-1 text-background sm:px-4 sm:py-1.5">
              clock is ticking
            </span>
          </h2>
          <div className="mt-6 flex w-full max-w-5xl items-start justify-center gap-1 sm:gap-2 md:gap-3">
            <div
              className={`flex w-[23%] min-w-0 transform-gpu flex-col items-center transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${showCountdownEnter ? 'translate-y-0 scale-100 opacity-100 blur-0' : 'translate-y-6 scale-95 opacity-0 blur-[2px]'}`}
              style={{ transitionDelay: '0ms' }}
            >
              <span className="font-bold font-title text-[clamp(2rem,8vw,5.8rem)] tabular-nums leading-none tracking-tight">
                {countdown.days}
              </span>
              <span className="mt-2 font-title text-[10px] uppercase tracking-[0.16em] sm:text-xs">
                días
              </span>
            </div>
            <span
              className={`pt-1 font-bold font-title text-[clamp(1.4rem,4vw,3.2rem)] leading-none transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:pt-2 ${showCountdownEnter ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: '90ms' }}
            >
              :
            </span>
            <div
              className={`flex w-[23%] min-w-0 transform-gpu flex-col items-center transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${showCountdownEnter ? 'translate-y-0 scale-100 opacity-100 blur-0' : 'translate-y-6 scale-95 opacity-0 blur-[2px]'}`}
              style={{ transitionDelay: '160ms' }}
            >
              <span className="font-bold font-title text-[clamp(2rem,8vw,5.8rem)] tabular-nums leading-none tracking-tight">
                {countdown.hours}
              </span>
              <span className="mt-2 font-title text-[10px] uppercase tracking-[0.16em] sm:text-xs">
                horas
              </span>
            </div>
            <span
              className={`pt-1 font-bold font-title text-[clamp(1.4rem,4vw,3.2rem)] leading-none transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:pt-2 ${showCountdownEnter ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: '250ms' }}
            >
              :
            </span>
            <div
              className={`flex w-[23%] min-w-0 transform-gpu flex-col items-center transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${showCountdownEnter ? 'translate-y-0 scale-100 opacity-100 blur-0' : 'translate-y-6 scale-95 opacity-0 blur-[2px]'}`}
              style={{ transitionDelay: '320ms' }}
            >
              <span className="font-bold font-title text-[clamp(2rem,8vw,5.8rem)] tabular-nums leading-none tracking-tight">
                {countdown.minutes}
              </span>
              <span className="mt-2 font-title text-[10px] uppercase tracking-[0.16em] sm:text-xs">
                minutos
              </span>
            </div>
            <span
              className={`pt-1 font-bold font-title text-[clamp(1.4rem,4vw,3.2rem)] leading-none transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:pt-2 ${showCountdownEnter ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              style={{ transitionDelay: '410ms' }}
            >
              :
            </span>
            <div
              className={`flex w-[23%] min-w-0 transform-gpu flex-col items-center transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${showCountdownEnter ? 'translate-y-0 scale-100 opacity-100 blur-0' : 'translate-y-6 scale-95 opacity-0 blur-[2px]'}`}
              style={{ transitionDelay: '480ms' }}
            >
              <span className="font-bold font-title text-[clamp(2rem,8vw,5.8rem)] tabular-nums leading-none tracking-tight">
                {countdown.seconds}
              </span>
              <span className="mt-2 font-title text-[10px] uppercase tracking-[0.16em] sm:text-xs">
                segundos
              </span>
            </div>
          </div>
          <p className="mt-4 font-title text-sm uppercase tracking-[0.18em] sm:text-base">
            para postular prioritariamente
          </p>

          <div className="mt-9">
            <Link
              href={'/26-ar/apply' as any}
              className="inline-flex min-h-12 items-center justify-center border-2 border-primary bg-primary px-6 py-2.5 text-center font-title text-background text-base uppercase tracking-[0.12em] transition hover:scale-[1.02] md:min-h-14 md:px-10 md:text-xl"
            >
              postulá con tu equipo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
