import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MARINE_ORGANISMS } from '../data/oceanData';
import { MarineOrganismData } from '../types/ocean';
import { depthToWorldY, getZoneForDepth } from '../utils/oceanMath';
import {
  AnimatedOrganismHandle,
  createMarineOrganismMesh,
} from '../three/createMarineOrganismMesh';

interface OceanSceneProps {
  currentDepth: number;
  selectedOrganism: MarineOrganismData | null;
  onSelectOrganism: (org: MarineOrganismData) => void;
}

interface ProjectedTag {
  org: MarineOrganismData;
  x: number;
  y: number;
  visible: boolean;
  distanceM: number;
}

export const OceanScene: React.FC<OceanSceneProps> = ({
  currentDepth,
  selectedOrganism,
  onSelectOrganism,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const depthRef = useRef<number>(currentDepth);
  const selectedIdRef = useRef<string | null>(selectedOrganism?.id ?? null);
  const onSelectRef = useRef(onSelectOrganism);

  const [webglAvailable, setWebglAvailable] = useState<boolean>(true);
  const [projectedTags, setProjectedTags] = useState<ProjectedTag[]>([]);

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
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const initialBg = new THREE.Color('#083a54');
    scene.background = initialBg;
    scene.fog = new THREE.FogExp2('#083a54', 0.042);

    // Mandatory studio environment map for metallic & translucent marine life
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 140);
    camera.position.set(0, 0, 7.5);

    // 3-Point Warm/Cool Underwater & Submersible Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x020617, 1.4);
    scene.add(hemiLight);

    const sunDirLight = new THREE.DirectionalLight(0xe0f2fe, 2.4);
    sunDirLight.position.set(6, 25, 8);
    scene.add(sunDirLight);

    // Submersible exploration beam attached to camera depth
    const subSpotLight = new THREE.PointLight(0x38bdf8, 2.2, 26, 1.4);
    scene.add(subSpotLight);

    // 1. Animated 3D Ocean Surface Mesh at y = 2.2 (visible at surface 0-40m)
    const surfaceGeo = new THREE.PlaneGeometry(60, 40, 36, 24);
    surfaceGeo.rotateX(Math.PI / 2);
    const surfaceBasePos = surfaceGeo.attributes.position.clone();
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.55,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.82,
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.position.set(0, 2.4, -4);
    scene.add(surfaceMesh);

    // 2. Volumetric-style Sunlight Beams in Epipelagic Zone (0 - 200 m)
    const sunBeamsGroup = new THREE.Group();
    const beamGeo = new THREE.CylinderGeometry(0.45, 2.6, 28, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beamOffsets = [
      [-5.5, -10, -6, 0.14],
      [-1.5, -11, -8, 0.08],
      [2.8, -10, -5, -0.11],
      [6.4, -12, -7, -0.16],
    ];
    beamOffsets.forEach(([bx, by, bz, rotZ]) => {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(bx, by, bz);
      beam.rotation.z = rotZ;
      sunBeamsGroup.add(beam);
    });
    scene.add(sunBeamsGroup);

    // 3. Instanced Marine Snow & Bioluminescent Plankton Particles (360 instances)
    const particleCount = 360;
    const particleGeo = new THREE.IcosahedronGeometry(0.055, 0);
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.65,
    });
    const particleInstanced = new THREE.InstancedMesh(
      particleGeo,
      particleMat,
      particleCount
    );
    particleInstanced.frustumCulled = false;

    const particleSeeds: {
      x: number;
      y: number;
      z: number;
      speed: number;
      scale: number;
    }[] = [];
    const dummyMat4 = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3();

    for (let i = 0; i < particleCount; i++) {
      const seed = {
        x: (Math.random() - 0.5) * 24,
        y: -Math.random() * 235,
        z: (Math.random() - 0.5) * 14 - 2,
        speed: 0.15 + Math.random() * 0.35,
        scale: 0.5 + Math.random() * 1.1,
      };
      particleSeeds.push(seed);
      dummyPos.set(seed.x, seed.y, seed.z);
      dummyScale.setScalar(seed.scale);
      dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
      particleInstanced.setMatrixAt(i, dummyMat4);
    }
    scene.add(particleInstanced);

    // 4. Abyssal Plain & Hadal Subduction Trench Rocky Canyon Walls
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.88,
      metalness: 0.15,
    });
    const trenchWallGeo = new THREE.ConeGeometry(4.2, 26, 7);
    const rockCluster = new THREE.Group();

    // Abyssal outcrops (-136 to -176) and V-shaped Hadal Trench canyon walls (-176 to -228)
    for (let i = 0; i < 28; i++) {
      const isLeft = i % 2 === 0;
      const yPos = -132 - i * 3.6;
      const isHadal = yPos < -175;
      const wall = new THREE.Mesh(trenchWallGeo, rockMat);
      const xSpread = isHadal ? 5.8 : 8.5;
      wall.position.set(
        (isLeft ? -1 : 1) * (xSpread + (i % 3) * 0.9),
        yPos,
        -4.5 - (i % 4) * 1.2
      );
      wall.rotation.z = (isLeft ? -1 : 1) * (isHadal ? 0.35 : 0.15);
      wall.rotation.y = i * 0.8;
      wall.scale.set(1.3, 1.1, 1.2);
      rockCluster.add(wall);
    }

    // Challenger Deep Trench Floor at y = -227.5
    const floorGeo = new THREE.PlaneGeometry(45, 30, 16, 12);
    floorGeo.rotateX(-Math.PI / 2);
    const floorPos = floorGeo.attributes.position;
    for (let i = 0; i < floorPos.count; i++) {
      const vx = floorPos.getX(i);
      const vz = floorPos.getZ(i);
      floorPos.setY(
        i,
        Math.sin(vx * 0.4) * 0.6 + Math.cos(vz * 0.5) * 0.45
      );
    }
    floorGeo.computeVertexNormals();
    const trenchFloor = new THREE.Mesh(floorGeo, rockMat);
    trenchFloor.position.set(0, -227.5, -3);
    rockCluster.add(trenchFloor);
    scene.add(rockCluster);

    // 5. Build All 15 Procedural 3D Marine Organisms at Their Characteristic World Y
    const sharedProxyGeo = new THREE.SphereGeometry(1.75, 8, 8);
    const organismHandles: AnimatedOrganismHandle[] = [];
    const hitProxies: THREE.Object3D[] = [];

    MARINE_ORGANISMS.forEach((org) => {
      const handle = createMarineOrganismMesh(org, sharedProxyGeo);
      const worldY = depthToWorldY(org.characteristicDepth);
      handle.root.position.set(org.sceneOffsetX, worldY, org.sceneOffsetZ);
      scene.add(handle.root);
      organismHandles.push(handle);
      hitProxies.push(handle.hitProxy);
    });

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

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
    const targetBgColor = new THREE.Color();
    const currentBgColor = new THREE.Color('#083a54');
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

      // If jumping across zones (> 12 world units) or on software WebGL, converge faster
      if (Math.abs(targetY - smoothedY) > 12 || isSoftwareGl) {
        smoothedY = THREE.MathUtils.lerp(smoothedY, targetY, isSoftwareGl ? 0.65 : 0.35);
      } else {
        smoothedY = THREE.MathUtils.damp(smoothedY, targetY, 6.5, delta);
      }

      camera.position.y = smoothedY + Math.sin(elapsed * 0.65) * 0.08;
      camera.position.x = Math.sin(elapsed * 0.35) * 0.12;
      camera.lookAt(0, smoothedY - 0.15, -2.5);

      // Update submersible spotlight to travel with camera
      subSpotLight.position.set(
        camera.position.x,
        camera.position.y + 0.6,
        camera.position.z - 1.2
      );

      // Dynamic depth-dependent lighting, fog & water column color
      const activeZone = getZoneForDepth(activeDepth);
      targetBgColor.set(activeZone.fogHex);
      currentBgColor.lerp(targetBgColor, isSoftwareGl ? 0.65 : Math.min(1, delta * 4.5));
      scene.background = currentBgColor;
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.copy(currentBgColor);
      }

      // Attenuate sunlight as camera descends past 200m -> 1000m
      const sunFactor = Math.max(0, 1 - activeDepth / 650);
      sunDirLight.intensity = 0.15 + sunFactor * 2.5;
      hemiLight.intensity = 0.3 + sunFactor * 1.25;
      beamMat.opacity = Math.max(0, (1 - activeDepth / 240) * 0.14);

      // Animate Ocean Surface waves when near surface
      if (smoothedY > -28) {
        const posAttr = surfaceGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const bx = surfaceBasePos.getX(i);
          const bz = surfaceBasePos.getZ(i);
          const waveY =
            Math.sin(bx * 0.35 + elapsed * 1.6) * 0.28 +
            Math.cos(bz * 0.45 + elapsed * 1.2) * 0.22;
          posAttr.setY(i, waveY);
        }
        posAttr.needsUpdate = true;
      }

      // Animate marine organisms
      const currentSelectedId = selectedIdRef.current;
      for (let i = 0; i < organismHandles.length; i++) {
        const handle = organismHandles[i];
        handle.animate(elapsed, handle.data.id === currentSelectedId);
      }

      // Project nearby 3D organisms to 2D screen coordinates at <= 10Hz for clickable labels
      if (elapsed - lastTagSyncTime > 0.12) {
        lastTagSyncTime = elapsed;
        const w = renderer.domElement.clientWidth || width;
        const h = renderer.domElement.clientHeight || height;
        const nextTags: ProjectedTag[] = [];

        for (let i = 0; i < organismHandles.length; i++) {
          const handle = organismHandles[i];
          const dy = Math.abs(handle.root.position.y - camera.position.y);
          if (dy < 12) {
            scratchProjVec.copy(handle.root.position);
            scratchProjVec.y += 0.75;
            scratchProjVec.project(camera);
            if (scratchProjVec.z < 1) {
              const sx = (scratchProjVec.x * 0.5 + 0.5) * w;
              const sy = (-scratchProjVec.y * 0.5 + 0.5) * h;
              // Keep projected labels strictly inside the central unobstructed 3D band
              if (sy >= 175 && sy <= h - 180) {
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

      {/* Screen-Projected 3D Organism Interactive Labels */}
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
              className={`pointer-events-auto absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md border text-left transition-colors ${
                isSelected
                  ? 'bg-cyan-950/95 border-cyan-400 text-white shadow-sm'
                  : 'bg-[#050d1a]/90 border-slate-700/80 text-slate-200 hover:border-cyan-400 hover:text-white'
              }`}
            >
              <div className="text-xs font-semibold whitespace-nowrap">
                {tag.org.commonName}
              </div>
              <div className="text-[11px] font-mono-tabular text-cyan-300/90 whitespace-nowrap">
                {tag.org.illustrativeMinDepth}–{tag.org.illustrativeMaxDepth} m
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
