'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { cn } from '@/src/lib/utils';

type NetworkSystem = {
  group: THREE.Group;
  bounds: THREE.Box3;
  update: (deltaSeconds: number) => void;
};

type RotatingMateProps = {
  className?: string;
};

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

  const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

  for (let i = 0; i < neuronCount; i += 1) {
    samplePoint(tempPosition, tempNormal);

    if (tempNormal.lengthSq() < 1e-6) tempNormal.set(0, 1, 0);
    tempNormal.normalize();
    tangent.crossVectors(tempNormal, fallbackUp);

    if (tangent.lengthSq() < 1e-6) {
      tangent.crossVectors(tempNormal, fallbackSide);
    }

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
  const loopDurationSeconds = 10;

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
      elapsed = (elapsed + deltaSeconds) % loopDurationSeconds;
      updateNeuronPositions(elapsed);
    },
  } satisfies NetworkSystem;
}

export function RotatingMate({ className }: RotatingMateProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className={cn('absolute inset-0', className)} />
  );
}
