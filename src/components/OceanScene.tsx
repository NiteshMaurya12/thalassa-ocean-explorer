import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MARINE_ORGANISMS, DEPTH_LANDMARKS } from '../data/oceanData';
import { MarineOrganismData, DepthLandmark } from '../types/ocean';
import { depthToWorldY } from '../utils/oceanMath';
import {
  AnimatedOrganismHandle,
  createMarineOrganismMesh,
} from '../three/createMarineOrganismMesh';

interface OceanSceneProps {
  currentDepth: number;
  selectedOrganism: MarineOrganismData | null;
  onSelectOrganism: (org: MarineOrganismData) => void;
  onSelectDepth?: (depth: number) => void;
}

interface ProjectedTag {
  org: MarineOrganismData;
  x: number;
  y: number;
  visible: boolean;
  distanceM: number;
}

interface ProjectedLandmarkTag {
  landmark: DepthLandmark;
  x: number;
  y: number;
}

// Continuous depth-based water column color stops (depth in metres -> hex color & fog density)
const WATER_COLOR_STOPS: { depth: number; color: THREE.Color; fogDensity: number }[] = [
  { depth: 0, color: new THREE.Color('#0c4f73'), fogDensity: 0.032 },
  { depth: 65, color: new THREE.Color('#083d5c'), fogDensity: 0.036 },
  { depth: 200, color: new THREE.Color('#062845'), fogDensity: 0.041 },
  { depth: 650, color: new THREE.Color('#051c36'), fogDensity: 0.045 },
  { depth: 1000, color: new THREE.Color('#041326'), fogDensity: 0.048 },
  { depth: 2800, color: new THREE.Color('#030d1c'), fogDensity: 0.052 },
  { depth: 4000, color: new THREE.Color('#020914'), fogDensity: 0.055 },
  { depth: 6000, color: new THREE.Color('#01060e'), fogDensity: 0.058 },
  { depth: 10935, color: new THREE.Color('#01040a'), fogDensity: 0.062 },
];

function sampleWaterAtmosphere(
  depthM: number,
  outColor: THREE.Color
): number {
  const clamped = Math.max(0, Math.min(10935, depthM));
  for (let i = 0; i < WATER_COLOR_STOPS.length - 1; i++) {
    const curr = WATER_COLOR_STOPS[i];
    const next = WATER_COLOR_STOPS[i + 1];
    if (clamped >= curr.depth && clamped <= next.depth) {
      const span = Math.max(1, next.depth - curr.depth);
      const t = (clamped - curr.depth) / span;
      outColor.copy(curr.color).lerp(next.color, t);
      return THREE.MathUtils.lerp(curr.fogDensity, next.fogDensity, t);
    }
  }
  const last = WATER_COLOR_STOPS[WATER_COLOR_STOPS.length - 1];
  outColor.copy(last.color);
  return last.fogDensity;
}

export const OceanScene: React.FC<OceanSceneProps> = ({
  currentDepth,
  selectedOrganism,
  onSelectOrganism,
  onSelectDepth,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const depthRef = useRef<number>(currentDepth);
  const selectedIdRef = useRef<string | null>(selectedOrganism?.id ?? null);
  const onSelectRef = useRef(onSelectOrganism);

  const [webglAvailable, setWebglAvailable] = useState<boolean>(true);
  const [isSceneReady, setIsSceneReady] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);
  const [projectedTags, setProjectedTags] = useState<ProjectedTag[]>([]);
  const [projectedLandmarks, setProjectedLandmarks] = useState<
    ProjectedLandmarkTag[]
  >([]);

  useEffect(() => {
    depthRef.current = currentDepth;
  }, [currentDepth]);

  useEffect(() => {
    selectedIdRef.current = selectedOrganism?.id ?? null;
  }, [selectedOrganism]);

  useEffect(() => {
    onSelectRef.current = onSelectOrganism;
  }, [onSelectOrganism]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // Detect WebGL and software renderer per threejs skill guidelines
    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl =
        probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) {
        setWebglAvailable(false);
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl =
        /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      setWebglAvailable(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored
    );

    const scene = new THREE.Scene();
    const initialBg = new THREE.Color('#0c4f73');
    scene.background = initialBg;
    const sceneFog = new THREE.FogExp2('#0c4f73', 0.032);
    scene.fog = sceneFog;

    // Studio environment map for physically based specular highlights & transmission
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 140);
    camera.position.set(0, 0, 7.6);

    // 3-Point Underwater & Submersible Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x020617, 1.55);
    scene.add(hemiLight);

    const sunDirLight = new THREE.DirectionalLight(0xe0f2fe, 2.7);
    sunDirLight.position.set(5, 28, 9);
    scene.add(sunDirLight);

    const rimDirLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    rimDirLight.position.set(-10, 12, -8);
    scene.add(rimDirLight);

    // Submersible exploration beam attached to camera depth
    const subSpotLight = new THREE.PointLight(0x38bdf8, 2.4, 28, 1.35);
    scene.add(subSpotLight);

    // 1. Animated 3D Ocean Surface Mesh + Sub-Surface Caustic Shimmer Layer
    const surfaceGeo = new THREE.PlaneGeometry(68, 44, 40, 26);
    surfaceGeo.rotateX(Math.PI / 2);
    const surfaceBasePos = surfaceGeo.attributes.position.clone();
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.16,
      metalness: 0.62,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.86,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.position.set(0, 2.35, -3.5);
    scene.add(surfaceMesh);

    const causticGeo = new THREE.PlaneGeometry(56, 34, 24, 16);
    causticGeo.rotateX(Math.PI / 2);
    const causticMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const causticMesh = new THREE.Mesh(causticGeo, causticMat);
    causticMesh.position.set(0, 2.15, -3.5);
    scene.add(causticMesh);

    // 2. Multi-Layered Volumetric Sunlight Rays in Epipelagic Zone (0 - 250 m)
    const sunBeamsGroup = new THREE.Group();
    const primaryBeamGeo = new THREE.CylinderGeometry(0.4, 2.8, 30, 12, 1, true);
    const secondaryBeamGeo = new THREE.CylinderGeometry(0.25, 1.7, 24, 10, 1, true);

    const primaryBeamMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const secondaryBeamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const beamConfigs = [
      { x: -6.8, y: -10.5, z: -6.5, rotZ: 0.16, phase: 0.2, primary: true },
      { x: -3.4, y: -9.5, z: -4.2, rotZ: 0.11, phase: 1.1, primary: false },
      { x: -1.1, y: -11.0, z: -7.5, rotZ: 0.07, phase: 2.0, primary: true },
      { x: 1.4, y: -9.8, z: -3.8, rotZ: -0.06, phase: 2.8, primary: false },
      { x: 3.6, y: -10.5, z: -5.5, rotZ: -0.11, phase: 3.7, primary: true },
      { x: 6.2, y: -11.5, z: -7.0, rotZ: -0.17, phase: 4.5, primary: true },
      { x: 8.4, y: -10.2, z: -5.0, rotZ: -0.21, phase: 5.4, primary: false },
    ];

    const beamMeshes: { mesh: THREE.Mesh; baseX: number; baseRotZ: number; phase: number }[] = [];
    beamConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(
        cfg.primary ? primaryBeamGeo : secondaryBeamGeo,
        cfg.primary ? primaryBeamMat : secondaryBeamMat
      );
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.rotation.z = cfg.rotZ;
      sunBeamsGroup.add(mesh);
      beamMeshes.push({ mesh, baseX: cfg.x, baseRotZ: cfg.rotZ, phase: cfg.phase });
    });
    scene.add(sunBeamsGroup);

    // 3. Instanced Marine Snow Particles (360 drifting organic particulates)
    const particleCount = 360;
    const particleGeo = new THREE.IcosahedronGeometry(0.052, 0);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      transparent: true,
      opacity: 0.62,
    });
    const particleInstanced = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      particleCount
    );
    particleInstanced.frustumCulled = false;

    const dummyMat4 = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3();

    for (let i = 0; i < particleCount; i++) {
      dummyPos.set(
        (Math.random() - 0.5) * 24,
        -Math.random() * 235,
        (Math.random() - 0.5) * 14 - 2
      );
      dummyScale.setScalar(0.45 + Math.random() * 1.15);
      dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
      particleInstanced.setMatrixAt(i, dummyMat4);
    }
    scene.add(particleInstanced);

    // 4. Instanced Rising 3D Air & Gas Bubbles (110 translucent spheres)
    const bubbleCount = 110;
    const bubbleGeo = new THREE.SphereGeometry(0.075, 10, 8);
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.35,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.58,
    });
    const bubbleInstanced = new THREE.InstancedMesh(
      bubbleGeo,
      bubbleMat,
      bubbleCount
    );
    bubbleInstanced.frustumCulled = false;

    const bubbleSeeds: {
      x: number;
      y: number;
      z: number;
      riseSpeed: number;
      wobbleFreq: number;
      wobbleAmp: number;
      scale: number;
      phase: number;
    }[] = [];

    for (let i = 0; i < bubbleCount; i++) {
      const inUpper = i < 82;
      const seed = {
        x: (Math.random() - 0.5) * 18,
        y: inUpper ? -Math.random() * 88 : -90 - Math.random() * 135,
        z: (Math.random() - 0.5) * 11 - 1.5,
        riseSpeed: 0.45 + Math.random() * 0.75,
        wobbleFreq: 1.5 + Math.random() * 2.2,
        wobbleAmp: 0.08 + Math.random() * 0.18,
        scale: 0.45 + Math.random() * 1.25,
        phase: Math.random() * Math.PI * 2,
      };
      bubbleSeeds.push(seed);
      dummyPos.set(seed.x, seed.y, seed.z);
      dummyScale.setScalar(seed.scale);
      dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
      bubbleInstanced.setMatrixAt(i, dummyMat4);
    }
    scene.add(bubbleInstanced);

    // 5. Instanced Bioluminescent Deep-Sea Plankton (160 glowing nodes)
    const bioCount = 160;
    const bioGeo = new THREE.OctahedronGeometry(0.06, 0);
    const bioMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const bioInstanced = new THREE.InstancedMesh(bioGeo, bioMat, bioCount);
    bioInstanced.frustumCulled = false;

    for (let i = 0; i < bioCount; i++) {
      dummyPos.set(
        (Math.random() - 0.5) * 20,
        -25 - Math.random() * 202,
        (Math.random() - 0.5) * 12 - 2
      );
      dummyScale.setScalar(0.5 + Math.random() * 1.1);
      dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
      bioInstanced.setMatrixAt(i, dummyMat4);
    }
    scene.add(bioInstanced);

    // 6. Visual Storytelling 3D Structures: Zone Horizon Rings, Hydrothermal Vents & Shipwreck Beacons
    const landmarksGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(9.5, 0.035, 8, 64);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
    });
    [200, 1000, 4000, 6000].forEach((boundaryDepth) => {
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, depthToWorldY(boundaryDepth), -2.5);
      landmarksGroup.add(ring);
    });

    // 3D Hydrothermal Vent Chimneys at Lost City (800 m) & Galápagos Black Smokers (2,500 m)
    const ventRockMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.2,
    });
    const ventGlowMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.8,
      roughness: 0.3,
    });
    [800, 2500].forEach((ventDepth, idx) => {
      const ventY = depthToWorldY(ventDepth);
      const ventCluster = new THREE.Group();
      ventCluster.position.set(idx === 0 ? -3.2 : 2.8, ventY, -3.6);

      for (let c = 0; c < 3; c++) {
        const h = 1.6 + c * 0.55;
        const chimney = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 0.42, h, 9),
          ventRockMat
        );
        chimney.position.set((c - 1) * 0.65, h * 0.5 - 0.8, (c % 2) * -0.4);
        ventCluster.add(chimney);

        const orifice = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 8, 8),
          ventGlowMat
        );
        orifice.position.set((c - 1) * 0.65, h - 0.78, (c % 2) * -0.4);
        ventCluster.add(orifice);
      }
      landmarksGroup.add(ventCluster);
    });

    // 3D Shipwreck Hull Structures at 120 m (Britannic), 3,800 m (Titanic), 4,790 m (Bismarck), 6,469 m (USS Johnston)
    const wreckMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.78,
      metalness: 0.42,
    });
    const wreckBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });
    [120, 3800, 4790, 6469].forEach((wreckDepth, idx) => {
      const wy = depthToWorldY(wreckDepth);
      const wreckGroup = new THREE.Group();
      wreckGroup.position.set(idx % 2 === 0 ? -2.9 : 2.7, wy, -3.5);
      wreckGroup.rotation.y = idx % 2 === 0 ? 0.35 : -0.4;

      // Bow hull prism
      const hull = new THREE.Mesh(
        new THREE.BoxGeometry(2.1, 0.48, 0.62),
        wreckMat
      );
      wreckGroup.add(hull);

      const prow = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 0.9, 5),
        wreckMat
      );
      prow.rotation.z = -Math.PI / 2;
      prow.position.set(1.4, 0.04, 0);
      wreckGroup.add(prow);

      const bridge = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 0.36, 0.45),
        wreckMat
      );
      bridge.position.set(-0.2, 0.38, 0);
      wreckGroup.add(bridge);

      const beaconRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.025, 6, 28),
        wreckBeaconMat
      );
      beaconRing.rotation.x = Math.PI / 2;
      wreckGroup.add(beaconRing);

      landmarksGroup.add(wreckGroup);
    });
    scene.add(landmarksGroup);

    // 7. Mid-Water & Abyssal Canyon Outcrops + Hadal Subduction Trench Walls
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.86,
      metalness: 0.16,
    });
    const trenchWallGeo = new THREE.ConeGeometry(4.2, 26, 7);
    const rockCluster = new THREE.Group();

    for (let i = 0; i < 10; i++) {
      const isLeft = i % 2 === 0;
      const yPos = -36 - i * 9.5;
      const seamount = new THREE.Mesh(trenchWallGeo, rockMat);
      seamount.position.set(
        (isLeft ? -1 : 1) * (11.5 + (i % 3) * 1.5),
        yPos,
        -9.5 - (i % 3) * 1.8
      );
      seamount.rotation.z = (isLeft ? -1 : 1) * 0.22;
      seamount.rotation.y = i * 1.1;
      seamount.scale.set(1.5, 1.2, 1.3);
      rockCluster.add(seamount);
    }

    for (let i = 0; i < 28; i++) {
      const isLeft = i % 2 === 0;
      const yPos = -132 - i * 3.6;
      const isHadal = yPos < -175;
      const wall = new THREE.Mesh(trenchWallGeo, rockMat);
      const xSpread = isHadal ? 5.6 : 8.4;
      wall.position.set(
        (isLeft ? -1 : 1) * (xSpread + (i % 3) * 0.9),
        yPos,
        -4.5 - (i % 4) * 1.2
      );
      wall.rotation.z = (isLeft ? -1 : 1) * (isHadal ? 0.36 : 0.16);
      wall.rotation.y = i * 0.8;
      wall.scale.set(1.3, 1.1, 1.2);
      rockCluster.add(wall);
    }

    const floorGeo = new THREE.PlaneGeometry(46, 32, 18, 14);
    floorGeo.rotateX(-Math.PI / 2);
    const floorPos = floorGeo.attributes.position;
    for (let i = 0; i < floorPos.count; i++) {
      const vx = floorPos.getX(i);
      const vz = floorPos.getZ(i);
      floorPos.setY(
        i,
        Math.sin(vx * 0.4) * 0.65 + Math.cos(vz * 0.5) * 0.48
      );
    }
    floorGeo.computeVertexNormals();
    const trenchFloor = new THREE.Mesh(floorGeo, rockMat);
    trenchFloor.position.set(0, -227.5, -3);
    rockCluster.add(trenchFloor);
    scene.add(rockCluster);

    // 8. Build All 18 Procedural 3D Marine Organisms at Their Characteristic World Y
    const sharedProxyGeo = new THREE.SphereGeometry(1.85, 8, 8);
    const organismHandles: AnimatedOrganismHandle[] = [];
    const hitProxies: THREE.Object3D[] = [];

    MARINE_ORGANISMS.forEach((org) => {
      const handle = createMarineOrganismMesh(org, sharedProxyGeo);
      const worldY = depthToWorldY(org.characteristicDepth);
      handle.root.position.set(org.sceneOffsetX, worldY, org.sceneOffsetZ);
      handle.root.userData.baseY = worldY;
      scene.add(handle.root);
      organismHandles.push(handle);
      hitProxies.push(handle.hitProxy);
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    setIsSceneReady(true);

    // Raycasting on click/pointer for 3D organism discovery
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitProxies, false);
      if (hits.length > 0) {
        const orgId = hits[0].object.userData?.organismId;
        const matched = MARINE_ORGANISMS.find((item) => item.id === orgId);
        if (matched) {
          onSelectRef.current(matched);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Resize listener: render immediately after setSize so canvas is never cleared blank
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', handleResize);

    // Zero-GC reusable scratch objects for render loop
    const clock = new THREE.Clock();
    const targetBgColor = new THREE.Color('#0c4f73');
    const currentBgColor = new THREE.Color('#0c4f73');
    const scratchProjVec = new THREE.Vector3();
    let smoothedY = depthToWorldY(depthRef.current);
    let lastTagSyncTime = -1;
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      const activeDepth = depthRef.current;
      const targetY = depthToWorldY(activeDepth);

      if (isSoftwareGl || Math.abs(targetY - smoothedY) > 18) {
        smoothedY = isSoftwareGl
          ? targetY
          : THREE.MathUtils.lerp(smoothedY, targetY, 0.45);
      } else {
        smoothedY = THREE.MathUtils.damp(smoothedY, targetY, 7.5, delta);
      }

      camera.position.y = smoothedY + Math.sin(elapsed * 0.65) * 0.08;
      camera.position.x = Math.sin(elapsed * 0.35) * 0.14;
      camera.lookAt(0, smoothedY - 0.12, -2.5);

      subSpotLight.position.set(
        camera.position.x,
        camera.position.y + 0.6,
        camera.position.z - 1.2
      );

      // Continuous depth-based water column color & fog density transition
      const targetFogDensity = sampleWaterAtmosphere(activeDepth, targetBgColor);
      currentBgColor.lerp(
        targetBgColor,
        isSoftwareGl ? 0.68 : Math.min(1, delta * 5.0)
      );
      scene.background = currentBgColor;
      sceneFog.color.copy(currentBgColor);
      sceneFog.density = THREE.MathUtils.lerp(
        sceneFog.density,
        targetFogDensity,
        0.15
      );

      const sunFactor = Math.max(0, 1 - activeDepth / 700);
      sunDirLight.intensity = 0.12 + sunFactor * 2.65;
      hemiLight.intensity = 0.28 + sunFactor * 1.35;

      const beamFade = Math.max(0, 1 - activeDepth / 260);
      primaryBeamMat.opacity = beamFade * 0.14;
      secondaryBeamMat.opacity = beamFade * 0.095;
      causticMat.opacity = Math.max(0, (1 - activeDepth / 140) * 0.16);

      if (beamFade > 0.01) {
        for (let i = 0; i < beamMeshes.length; i++) {
          const b = beamMeshes[i];
          b.mesh.position.x =
            b.baseX + Math.sin(elapsed * 0.55 + b.phase) * 0.35;
          b.mesh.rotation.z =
            b.baseRotZ + Math.cos(elapsed * 0.4 + b.phase) * 0.025;
        }
      }

      if (smoothedY > -32) {
        const posAttr = surfaceGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const bx = surfaceBasePos.getX(i);
          const bz = surfaceBasePos.getZ(i);
          const waveY =
            Math.sin(bx * 0.32 + elapsed * 1.55) * 0.28 +
            Math.cos(bz * 0.42 + elapsed * 1.2) * 0.22 +
            Math.sin((bx + bz) * 0.25 + elapsed * 2.1) * 0.1;
          posAttr.setY(i, waveY);
        }
        posAttr.needsUpdate = true;
        causticMesh.position.x = Math.sin(elapsed * 0.7) * 0.45;
        causticMesh.position.z = -3.5 + Math.cos(elapsed * 0.5) * 0.35;
      }

      // Animate rising 3D bubbles nearby camera
      for (let i = 0; i < bubbleCount; i++) {
        const b = bubbleSeeds[i];
        const cycleRange = i < 82 ? 90 : 140;
        const baseTop = i < 82 ? 1.8 : -88;
        const risenY =
          baseTop -
          cycleRange +
          ((elapsed * b.riseSpeed * 2.2 + Math.abs(b.y)) % cycleRange);
        if (Math.abs(risenY - smoothedY) < 24) {
          const wx =
            b.x + Math.sin(elapsed * b.wobbleFreq + b.phase) * b.wobbleAmp;
          const wz =
            b.z + Math.cos(elapsed * b.wobbleFreq + b.phase) * b.wobbleAmp;
          dummyPos.set(wx, risenY, wz);
          dummyScale.setScalar(
            b.scale * (0.9 + Math.sin(elapsed * 3 + b.phase) * 0.1)
          );
          dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
          bubbleInstanced.setMatrixAt(i, dummyMat4);
        }
      }
      bubbleInstanced.instanceMatrix.needsUpdate = true;

      const bioFactor = THREE.MathUtils.clamp((activeDepth - 120) / 600, 0.18, 0.92);
      bioMat.opacity = bioFactor * (0.72 + Math.sin(elapsed * 1.8) * 0.18);

      // Animate all 18 marine organisms
      const currentSelectedId = selectedIdRef.current;
      for (let i = 0; i < organismHandles.length; i++) {
        const handle = organismHandles[i];
        handle.animate(elapsed, handle.data.id === currentSelectedId);
      }

      // Project nearby 3D organisms & visual storytelling landmarks to 2D coordinates at <= 10Hz
      if (elapsed - lastTagSyncTime > 0.12) {
        lastTagSyncTime = elapsed;
        const w = renderer.domElement.clientWidth || width;
        const h = renderer.domElement.clientHeight || height;
        const nextTags: ProjectedTag[] = [];

        for (let i = 0; i < organismHandles.length; i++) {
          const handle = organismHandles[i];
          const dy = Math.abs(handle.root.position.y - camera.position.y);
          if (dy < 12.5) {
            scratchProjVec.copy(handle.root.position);
            scratchProjVec.y += 0.72;
            scratchProjVec.project(camera);
            if (scratchProjVec.z < 1) {
              const sx = (scratchProjVec.x * 0.5 + 0.5) * w;
              const sy = (-scratchProjVec.y * 0.5 + 0.5) * h;
              if (sy >= 150 && sy <= h - 165) {
                nextTags.push({
                  org: handle.data,
                  x: Math.max(85, Math.min(w - 110, sx)),
                  y: sy,
                  visible: true,
                  distanceM: Math.abs(
                    Math.round(activeDepth - handle.data.characteristicDepth)
                  ),
                });
              }
            }
          }
        }
        setProjectedTags(nextTags);

        // Project nearby visual storytelling discovery landmarks (shipwrecks, vents, records)
        const nextLandmarks: ProjectedLandmarkTag[] = [];
        if (activeDepth > 25) {
          for (let i = 0; i < DEPTH_LANDMARKS.length; i++) {
            const lm = DEPTH_LANDMARKS[i];
            if (lm.depth === 0) continue;
            const lmY = depthToWorldY(lm.depth);
            const dy = Math.abs(lmY - camera.position.y);
            if (dy < 5.5) {
              scratchProjVec.set(2.4, lmY + 0.35, -3.2);
              scratchProjVec.project(camera);
              if (scratchProjVec.z < 1) {
                const sx = (scratchProjVec.x * 0.5 + 0.5) * w;
                const sy = (-scratchProjVec.y * 0.5 + 0.5) * h;
                if (sy >= 140 && sy <= h - 170) {
                  nextLandmarks.push({
                    landmark: lm,
                    x: Math.max(360, Math.min(w - 190, sx)),
                    y: sy,
                  });
                }
              }
            }
          }
        }
        setProjectedLandmarks(nextLandmarks.slice(0, 1));
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        handleContextLost
      );
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored
      );
      renderer.dispose();
    };
  }, []);

  if (!webglAvailable) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#041226] text-slate-200 p-8 text-center">
        <p className="text-lg font-semibold text-white mb-2">
          Interactive 3D Ocean Column Fallback Mode
        </p>
        <p className="text-sm text-slate-400 max-w-md">
          WebGL hardware acceleration is unavailable in this browser context. You
          can still inspect all ocean zones, pressure telemetry, and species
          profiles using the depth controls.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Isolated WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="ocean-3d-canvas"
        className="w-full h-full cursor-crosshair"
      />

      {/* Graceful Loading & Context Recovery Overlay */}
      {(!isSceneReady || contextLost) && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#030b18]/80 z-10">
          <div className="px-4 py-2.5 rounded-lg bg-[#051326] border border-cyan-500/30 text-xs font-mono-tabular text-cyan-300">
            {contextLost
              ? 'Restoring 3D Submersible Graphics Context...'
              : 'Initializing 3D Bathymetric Water Column...'}
          </div>
        </div>
      )}

      {/* Screen-Projected 3D Organism Interactive Labels & Visual Storytelling Landmarks */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {projectedTags.map((tag) => {
          const isSelected = selectedOrganism?.id === tag.org.id;
          return (
            <button
              key={tag.org.id}
              type="button"
              onClick={() => onSelectOrganism(tag.org)}
              style={{
                transform: `translate3d(${Math.round(tag.x)}px, ${Math.round(tag.y)}px, 0)`,
              }}
              aria-label={`Inspect ${tag.org.commonName}`}
              className={`pointer-events-auto absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md border text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/90 border-cyan-400 text-white shadow-md'
                  : 'bg-[#040d1c]/75 border-cyan-500/35 text-slate-100 hover:border-cyan-400 hover:bg-[#06152b]/90 hover:text-white'
              }`}
            >
              <div className="text-xs font-semibold whitespace-nowrap flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                <span>{tag.org.commonName}</span>
              </div>
              <div className="text-[10px] font-mono-tabular text-cyan-300/90 whitespace-nowrap pl-3">
                {tag.org.illustrativeMinDepth.toLocaleString()}–
                {tag.org.illustrativeMaxDepth.toLocaleString()} m
              </div>
            </button>
          );
        })}

        {/* Projected Visual Storytelling Landmark Marker (Shipwrecks, Vents, Records) */}
        {projectedLandmarks.map((pl) => (
          <button
            key={pl.landmark.id}
            type="button"
            onClick={() => onSelectDepth?.(pl.landmark.depth)}
            style={{
              transform: `translate3d(${Math.round(pl.x)}px, ${Math.round(pl.y)}px, 0)`,
            }}
            className="pointer-events-auto absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 max-w-[230px] px-3 py-1.5 rounded-lg bg-[#051224]/82 border border-amber-400/45 text-left shadow-lg hover:border-amber-300 transition-colors cursor-pointer"
          >
            <div className="text-[10px] font-mono-tabular uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>
                {pl.landmark.depth.toLocaleString()} m · {pl.landmark.category}
              </span>
            </div>
            <div className="text-xs font-semibold text-white leading-snug mt-0.5">
              {pl.landmark.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
