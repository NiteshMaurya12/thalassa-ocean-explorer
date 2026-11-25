import * as THREE from 'three';
import { MarineOrganismData } from '../types/ocean';

export interface AnimatedOrganismHandle {
  data: MarineOrganismData;
  root: THREE.Group;
  hitProxy: THREE.Mesh;
  animate: (elapsed: number, isSelected: boolean) => void;
}

/**
 * Builds a multi-part procedural 3D model (5-12 distinct parts per species)
 * with calibrated PBR materials (varied roughness, metalness, and bioluminescence)
 * and a dedicated animation function.
 */
export function createMarineOrganismMesh(
  org: MarineOrganismData,
  sharedProxyGeo: THREE.SphereGeometry
): AnimatedOrganismHandle {
  const root = new THREE.Group();
  root.name = `organism-${org.id}`;

  const primaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(org.primaryColor),
    roughness: 0.45,
    metalness: 0.2,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(org.secondaryColor),
    roughness: 0.72,
    metalness: 0.1,
  });

  const darkEyeMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.15,
    metalness: 0.6,
  });

  const glowMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(org.emissiveColor || '#22d3ee'),
    emissive: new THREE.Color(org.emissiveColor || '#22d3ee'),
    emissiveIntensity: org.bioluminescent ? 2.2 : 0.3,
    roughness: 0.2,
    metalness: 0.1,
  });

  const translucentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(org.primaryColor),
    emissive: new THREE.Color(org.emissiveColor || org.secondaryColor),
    emissiveIntensity: org.bioluminescent ? 0.65 : 0.15,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.78,
  });

  const animParts: THREE.Object3D[] = [];

  switch (org.modelType) {
    case 'blue_whale':
    case 'sperm_whale': {
      const isSperm = org.modelType === 'sperm_whale';
      // 1. Primary torso hull
      const bodyGeo = isSperm
        ? new THREE.BoxGeometry(2.6, 0.95, 0.9, 4, 2, 2)
        : new THREE.CapsuleGeometry(0.55, 2.4, 8, 16);
      const body = new THREE.Mesh(bodyGeo, primaryMat);
      if (!isSperm) body.rotation.z = Math.PI / 2;
      root.add(body);

      // 2. Ventral underbelly / lower jaw
      const bellyGeo = new THREE.CapsuleGeometry(isSperm ? 0.22 : 0.44, 1.9, 6, 12);
      const belly = new THREE.Mesh(bellyGeo, secondaryMat);
      belly.rotation.z = Math.PI / 2;
      belly.position.set(isSperm ? 0.2 : 0.15, -0.22, 0);
      root.add(belly);

      // 3. Tail peduncle (animated)
      const tailGroup = new THREE.Group();
      tailGroup.position.set(-1.35, 0, 0);
      const peduncle = new THREE.Mesh(
        new THREE.ConeGeometry(0.42, 1.3, 10),
        primaryMat
      );
      peduncle.rotation.z = Math.PI / 2;
      peduncle.position.x = -0.5;
      tailGroup.add(peduncle);

      // 4 & 5. Horizontal tail flukes
      const flukeGeo = new THREE.BoxGeometry(0.45, 0.08, 1.45);
      const flukes = new THREE.Mesh(flukeGeo, secondaryMat);
      flukes.position.set(-1.15, 0, 0);
      tailGroup.add(flukes);
      root.add(tailGroup);
      animParts.push(tailGroup);

      // 6 & 7. Left & right pectoral flippers
      const flipperGeo = new THREE.BoxGeometry(0.4, 0.08, 1.1);
      const leftFlipper = new THREE.Mesh(flipperGeo, secondaryMat);
      leftFlipper.position.set(0.45, -0.28, 0.65);
      leftFlipper.rotation.y = -0.35;
      leftFlipper.rotation.x = 0.25;
      const rightFlipper = leftFlipper.clone();
      rightFlipper.position.z = -0.65;
      rightFlipper.rotation.y = 0.35;
      rightFlipper.rotation.x = -0.25;
      root.add(leftFlipper, rightFlipper);

      // 8. Dorsal fin
      const dorsal = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.38, 6),
        primaryMat
      );
      dorsal.position.set(-0.7, 0.55, 0);
      dorsal.rotation.z = 0.35;
      root.add(dorsal);

      // 9 & 10. Eyes
      const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const eyeL = new THREE.Mesh(eyeGeo, darkEyeMat);
      eyeL.position.set(1.05, 0.05, 0.48);
      const eyeR = eyeL.clone();
      eyeR.position.z = -0.48;
      root.add(eyeL, eyeR);
      break;
    }

    case 'sea_turtle': {
      // 1. Domed carapace shell
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 16, 12),
        primaryMat
      );
      shell.scale.set(1.25, 0.42, 0.95);
      root.add(shell);

      // 2. Ventral plastron
      const plastron = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.58, 0.14, 12),
        secondaryMat
      );
      plastron.scale.set(1.2, 1, 0.9);
      plastron.position.y = -0.15;
      root.add(plastron);

      // 3. Head
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 10),
        secondaryMat
      );
      head.scale.set(1.3, 0.9, 0.9);
      head.position.set(1.05, 0.02, 0);
      root.add(head);

      // 4 & 5. Wing-like foreflippers (animated)
      const foreFlipperGeo = new THREE.BoxGeometry(0.38, 0.06, 1.05);
      const flipperL = new THREE.Mesh(foreFlipperGeo, secondaryMat);
      flipperL.position.set(0.55, -0.05, 0.95);
      flipperL.rotation.y = -0.25;
      const flipperR = new THREE.Mesh(foreFlipperGeo, secondaryMat);
      flipperR.position.set(0.55, -0.05, -0.95);
      flipperR.rotation.y = 0.25;
      root.add(flipperL, flipperR);
      animParts.push(flipperL, flipperR);

      // 6 & 7. Hind flippers
      const hindGeo = new THREE.BoxGeometry(0.3, 0.05, 0.45);
      const hindL = new THREE.Mesh(hindGeo, primaryMat);
      hindL.position.set(-0.85, -0.08, 0.45);
      const hindR = hindL.clone();
      hindR.position.z = -0.45;
      root.add(hindL, hindR);
      break;
    }

    case 'dolphin':
    case 'tuna': {
      const isTuna = org.modelType === 'tuna';
      const count = isTuna ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const subGroup = new THREE.Group();
        if (count > 1) {
          subGroup.position.set(
            (i - 1) * 0.85,
            (i % 2 === 0 ? 0.35 : -0.25),
            (i - 1) * 0.45
          );
          subGroup.scale.setScalar(0.75);
        }
        // 1. Torso
        const torso = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.32, 1.25, 8, 14),
          primaryMat
        );
        torso.rotation.z = Math.PI / 2;
        subGroup.add(torso);

        // 2. Rostrum / Snout
        const snout = new THREE.Mesh(
          new THREE.ConeGeometry(0.16, 0.55, 10),
          secondaryMat
        );
        snout.rotation.z = -Math.PI / 2;
        snout.position.set(0.95, -0.04, 0);
        subGroup.add(snout);

        // 3. Dorsal fin
        const dorsal = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.48, 6),
          primaryMat
        );
        dorsal.position.set(-0.05, 0.44, 0);
        dorsal.rotation.z = 0.3;
        subGroup.add(dorsal);

        // 4. Tail fin assembly
        const tail = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, isTuna ? 0.75 : 0.1, isTuna ? 0.08 : 0.75),
          secondaryMat
        );
        tail.position.set(-0.98, 0, 0);
        subGroup.add(tail);
        animParts.push(tail);

        // 5 & 6. Pectoral fins
        const pecGeo = new THREE.BoxGeometry(0.28, 0.05, 0.55);
        const pecL = new THREE.Mesh(pecGeo, secondaryMat);
        pecL.position.set(0.3, -0.2, 0.38);
        const pecR = pecL.clone();
        pecR.position.z = -0.38;
        subGroup.add(pecL, pecR);

        root.add(subGroup);
      }
      break;
    }

    case 'lanternfish': {
      // School of 4 bioluminescent myctophids with ventral photophores
      const offsets = [
        [0, 0, 0],
        [-0.9, 0.4, -0.4],
        [0.75, -0.35, 0.35],
        [-0.4, -0.5, 0.5],
      ];
      const photophoreGeo = new THREE.SphereGeometry(0.045, 6, 6);
      offsets.forEach(([ox, oy, oz]) => {
        const fish = new THREE.Group();
        fish.position.set(ox, oy, oz);

        const body = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.16, 0.55, 6, 10),
          primaryMat
        );
        body.rotation.z = Math.PI / 2;
        fish.add(body);

        const tail = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.32, 4),
          secondaryMat
        );
        tail.rotation.z = -Math.PI / 2;
        tail.position.set(-0.48, 0, 0);
        fish.add(tail);

        // Glowing ventral photophores
        for (let p = -2; p <= 2; p++) {
          const dot = new THREE.Mesh(photophoreGeo, glowMat);
          dot.position.set(p * 0.12, -0.15, 0);
          fish.add(dot);
        }

        // Large tubular eyes
        const eyeL = new THREE.Mesh(photophoreGeo, glowMat);
        eyeL.position.set(0.3, 0.06, 0.12);
        const eyeR = eyeL.clone();
        eyeR.position.z = -0.12;
        fish.add(eyeL, eyeR);

        root.add(fish);
        animParts.push(fish);
      });
      break;
    }

    case 'jellyfish':
    case 'deep_jellyfish': {
      const isCrown = org.modelType === 'deep_jellyfish';
      // 1. Translucent bell dome
      const bellGeo = isCrown
        ? new THREE.CylinderGeometry(0.35, 0.88, 0.45, 18)
        : new THREE.ConeGeometry(0.75, 1.05, 16);
      const bell = new THREE.Mesh(bellGeo, translucentMat);
      bell.position.y = 0.35;
      root.add(bell);
      animParts.push(bell);

      // 2. Bioluminescent coronal ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.055, 8, 24),
        glowMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.05;
      root.add(ring);

      // 3. Oral core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 10, 10),
        glowMat
      );
      core.position.y = 0.22;
      root.add(core);

      // 4..12. Trailing tentacles
      const tentacleCount = 10;
      const tentacleGeo = new THREE.CylinderGeometry(0.022, 0.008, 1.45, 6);
      for (let i = 0; i < tentacleCount; i++) {
        const angle = (i / tentacleCount) * Math.PI * 2;
        const radius = 0.58;
        const tentacle = new THREE.Mesh(
          tentacleGeo,
          i % 2 === 0 ? glowMat : secondaryMat
        );
        tentacle.position.set(
          Math.cos(angle) * radius,
          -0.65,
          Math.sin(angle) * radius
        );
        if (isCrown && i === 0) {
          // Hypertrophied trailing tentacle characteristic of Atolla wyvillei
          tentacle.scale.y = 1.9;
          tentacle.position.y = -1.15;
        }
        root.add(tentacle);
        animParts.push(tentacle);
      }
      break;
    }

    case 'anglerfish': {
      // 1. Globular bathypelagic body
      const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.68, 16, 14),
        primaryMat
      );
      body.scale.set(1.22, 0.95, 0.85);
      root.add(body);

      // 2. Lower jaw rim
      const jaw = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.07, 8, 16, Math.PI),
        secondaryMat
      );
      jaw.position.set(0.55, -0.18, 0);
      jaw.rotation.x = Math.PI / 2;
      jaw.rotation.z = -Math.PI / 2;
      root.add(jaw);

      // 3..6. Translucent fangs
      const fangGeo = new THREE.ConeGeometry(0.03, 0.18, 5);
      const fangMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.2,
      });
      for (let i = -2; i <= 2; i++) {
        if (i === 0) continue;
        const fang = new THREE.Mesh(fangGeo, fangMat);
        fang.position.set(0.76, -0.08, i * 0.11);
        root.add(fang);
      }

      // 7. Curved illicium dorsal fishing rod
      const stalk = new THREE.Mesh(
        new THREE.TorusGeometry(0.48, 0.025, 6, 16, Math.PI * 0.75),
        secondaryMat
      );
      stalk.position.set(0.65, 0.45, 0);
      root.add(stalk);

      // 8. Bioluminescent esca lure bulb
      const esca = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 12, 12),
        glowMat
      );
      esca.position.set(1.12, 0.35, 0);
      root.add(esca);
      animParts.push(esca);

      // 9. Tail fin
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.55, 0.06),
        secondaryMat
      );
      tail.position.set(-0.95, 0, 0);
      root.add(tail);
      animParts.push(tail);
      break;
    }

    case 'vampire_squid': {
      // 1. Conical crimson mantle
      const mantle = new THREE.Mesh(
        new THREE.ConeGeometry(0.48, 1.15, 14),
        primaryMat
      );
      mantle.rotation.z = -Math.PI / 2;
      mantle.position.set(0.35, 0, 0);
      root.add(mantle);

      // 2 & 3. Paddle-like ear fins
      const finGeo = new THREE.BoxGeometry(0.28, 0.04, 0.55);
      const finL = new THREE.Mesh(finGeo, secondaryMat);
      finL.position.set(0.6, 0.18, 0.38);
      const finR = finL.clone();
      finR.position.z = -0.38;
      root.add(finL, finR);
      animParts.push(finL, finR);

      // 4. Webbed arm cloak skirt
      const cloak = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 0.85, 12, 1, true),
        translucentMat
      );
      cloak.rotation.z = Math.PI / 2;
      cloak.position.set(-0.45, 0, 0);
      root.add(cloak);

      // 5 & 6. Glowing blue eyes & arm-tip photophores
      const eyeGeo = new THREE.SphereGeometry(0.1, 10, 10);
      const eyeL = new THREE.Mesh(eyeGeo, glowMat);
      eyeL.position.set(0.05, 0.12, 0.36);
      const eyeR = eyeL.clone();
      eyeR.position.z = -0.36;
      root.add(eyeL, eyeR);

      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const tip = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 6, 6),
          glowMat
        );
        tip.position.set(-0.88, Math.cos(a) * 0.58, Math.sin(a) * 0.58);
        root.add(tip);
      }
      break;
    }

    case 'giant_isopod':
    case 'amphipod': {
      const isAmphipod = org.modelType === 'amphipod';
      // 7 articulated armor tergite plates
      for (let s = 0; s < 7; s++) {
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.38 - s * 0.02,
            0.42 - s * 0.02,
            0.22,
            10,
            1,
            false,
            0,
            Math.PI
          ),
          s % 2 === 0 ? primaryMat : secondaryMat
        );
        seg.rotation.z = Math.PI / 2;
        seg.rotation.x = -Math.PI / 2;
        seg.position.set(0.55 - s * 0.2, isAmphipod ? Math.sin(s * 0.4) * 0.12 : 0, 0);
        root.add(seg);
      }

      // Compound eyes & sensory antennae
      const antGeo = new THREE.CylinderGeometry(0.015, 0.005, 0.85, 6);
      const antL = new THREE.Mesh(antGeo, glowMat);
      antL.rotation.z = Math.PI / 2.4;
      antL.position.set(1.05, 0.05, 0.22);
      const antR = antL.clone();
      antR.position.z = -0.22;
      root.add(antL, antR);
      animParts.push(antL, antR);

      // Articulated walking pereiopods
      const legGeo = new THREE.CylinderGeometry(0.02, 0.01, 0.45, 5);
      for (let l = 0; l < 6; l++) {
        const legL = new THREE.Mesh(legGeo, secondaryMat);
        legL.position.set(0.45 - l * 0.2, -0.22, 0.35);
        legL.rotation.x = 0.45;
        const legR = legL.clone();
        legR.position.z = -0.35;
        legR.rotation.x = -0.45;
        root.add(legL, legR);
      }
      break;
    }

    case 'sea_cucumber': {
      // 1. Translucent gelatinous cylinder body
      const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.38, 0.85, 10, 14),
        translucentMat
      );
      body.rotation.z = Math.PI / 2.5;
      root.add(body);

      // 2. Anterior swimming veil collar
      const veil = new THREE.Mesh(
        new THREE.ConeGeometry(0.68, 0.35, 16, 1, true),
        glowMat
      );
      veil.rotation.z = -Math.PI / 2.5;
      veil.position.set(0.52, 0.2, 0);
      root.add(veil);
      animParts.push(veil);

      // 3. Visible internal coiled digestive tract
      const coil = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.18, 0.045, 24, 6),
        secondaryMat
      );
      root.add(coil);
      break;
    }

    case 'deep_crab': {
      // 1. Pyriform spiny carapace
      const carapace = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 12, 10),
        primaryMat
      );
      carapace.scale.set(1.15, 0.55, 0.95);
      root.add(carapace);

      // 2..9. Eight elongated stilt walking legs
      const legGeo = new THREE.CylinderGeometry(0.03, 0.015, 1.35, 6);
      for (let i = 0; i < 4; i++) {
        const offset = (i - 1.5) * 0.24;
        const legL = new THREE.Mesh(legGeo, secondaryMat);
        legL.position.set(offset, -0.35, 0.72);
        legL.rotation.x = 0.82;
        const legR = legL.clone();
        legR.position.z = -0.72;
        legR.rotation.x = -0.82;
        root.add(legL, legR);
        animParts.push(legL, legR);
      }
      break;
    }

    case 'hadal_snailfish':
    default: {
      // 1. Translucent gelatinous head & trunk
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 14, 12),
        translucentMat
      );
      head.scale.set(1.3, 0.9, 0.85);
      head.position.set(0.45, 0, 0);
      root.add(head);

      // 2. Tapering ribbon tail
      const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 1.35, 12),
        translucentMat
      );
      tail.rotation.z = Math.PI / 2;
      tail.scale.set(1, 1, 0.35);
      tail.position.set(-0.35, 0, 0);
      root.add(tail);
      animParts.push(tail);

      // 3 & 4. Broad fan-like pectoral fins
      const finGeo = new THREE.SphereGeometry(0.24, 8, 8);
      const finL = new THREE.Mesh(finGeo, secondaryMat);
      finL.scale.set(1.2, 0.7, 0.15);
      finL.position.set(0.35, -0.1, 0.36);
      const finR = finL.clone();
      finR.position.z = -0.36;
      root.add(finL, finR);

      // 5. Internal glowing core
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 8, 8),
        glowMat
      );
      core.position.set(0.4, 0, 0);
      root.add(core);
      break;
    }
  }

  // Invisible hit proxy sphere on layer 1 for high-performance raycasting
  const hitProxy = new THREE.Mesh(
    sharedProxyGeo,
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitProxy.layers.set(1);
  hitProxy.userData = { organismId: org.id };
  root.add(hitProxy);

  // Selection highlight ring around the organism
  const selectionRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.035, 8, 32),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.85,
    })
  );
  selectionRing.visible = false;
  root.add(selectionRing);

  const phaseOffset = org.characteristicDepth * 0.13;

  const animate = (elapsed: number, isSelected: boolean) => {
    const t = elapsed + phaseOffset;
    // Gentle natural swimming trajectory
    root.position.x = org.sceneOffsetX + Math.sin(t * 0.55) * 0.85;
    root.position.z = org.sceneOffsetZ + Math.cos(t * 0.4) * 0.45;
    root.rotation.y = Math.cos(t * 0.55) * 0.22;
    root.rotation.z = Math.sin(t * 0.7) * 0.06;

    // Species-specific appendage / bell animation
    for (let i = 0; i < animParts.length; i++) {
      const part = animParts[i];
      if (
        org.modelType === 'jellyfish' ||
        org.modelType === 'deep_jellyfish' ||
        org.modelType === 'sea_cucumber'
      ) {
        const pulse = 1 + Math.sin(t * 2.2 + i * 0.3) * 0.12;
        part.scale.set(pulse, 1 / pulse, pulse);
      } else {
        part.rotation.y = Math.sin(t * 3.2 + i * 0.5) * 0.25;
      }
    }

    selectionRing.visible = isSelected;
    if (isSelected) {
      selectionRing.rotation.z = elapsed * 0.9;
      selectionRing.rotation.y = Math.sin(elapsed * 0.7) * 0.35;
    }
  };

  return {
    data: org,
    root,
    hitProxy,
    animate,
  };
}
