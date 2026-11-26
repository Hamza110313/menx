import * as THREE from 'three';
import { PLAYER_OUTFITS, VEHICLE_SPECS } from './gameConfig';
import type { VehicleClass, WeaponId } from '../types/game';

export interface CharacterTextureBundle {
  camo?: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };
  hoodie?: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };
  denim?: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };
}

export interface CharacterRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  shadowPlane: THREE.Mesh;
  head: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  jacketMat: THREE.MeshStandardMaterial;
  pantsMat: THREE.MeshStandardMaterial;
  hairMat: THREE.MeshStandardMaterial;
  skinMat: THREE.MeshStandardMaterial;
  tacticalGearGroup: THREE.Group;
  tacticalLegItems: THREE.Object3D[];
  hoodieGearGroup: THREE.Group;
  academyGearGroup: THREE.Group;
  academyStockings: THREE.Object3D[];
  casualLegMeshes: THREE.Mesh[];
  arachnidMaskGroup: THREE.Group;
  arachnidGearItems: THREE.Object3D[];
  hairMesh: THREE.Mesh;
  shadesMesh: THREE.Mesh | null;
  pistolGroup: THREE.Group;
  rifleGroup: THREE.Group;
  shotgunGroup: THREE.Group;
  muzzleSprite: THREE.Sprite | null;
  applyOutfit: (outfitId: string, textures?: CharacterTextureBundle) => void;
  setWeapon: (weaponId: WeaponId) => void;
}

export interface CatRig {
  group: THREE.Group;
  legs: THREE.Group[];
  tailPivot: THREE.Group;
}

export interface VehicleRig {
  group: THREE.Group;
  chassisGroup: THREE.Group;
  bodyPaintMat: THREE.MeshPhysicalMaterial;
  wheels: THREE.Group[];
  frontWheelSteers: THREE.Group[];
  steeringWheel?: THREE.Group;
  mainRotor?: THREE.Group;
  tailRotor?: THREE.Group;
  searchlightCone?: THREE.Mesh;
  headlightMat: THREE.MeshStandardMaterial;
  taillightMat: THREE.MeshStandardMaterial;
  leftSignalMat: THREE.MeshStandardMaterial;
  rightSignalMat: THREE.MeshStandardMaterial;
  headlightSprites: THREE.Sprite[];
  taillightSprites: THREE.Sprite[];
  sirenRedMat?: THREE.MeshStandardMaterial;
  sirenBlueMat?: THREE.MeshStandardMaterial;
  sirenRedSprite?: THREE.Sprite;
  sirenBlueSprite?: THREE.Sprite;
  headlightSpot?: THREE.SpotLight;
}

export function createCharacterModel(
  outfitId: string,
  shadowTex: THREE.Texture,
  isNpc = false,
  textures?: CharacterTextureBundle,
  glowSpriteTex?: THREE.Texture
): CharacterRig {
  const initialOutfit = PLAYER_OUTFITS.find((o) => o.id === outfitId) ?? PLAYER_OUTFITS[0];
  const group = new THREE.Group();

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.2),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  group.add(shadowPlane);

  const bodyGroup = new THREE.Group();
  group.add(bodyGroup);

  const jacketMat = new THREE.MeshStandardMaterial({
    color: initialOutfit.jacketColor,
    roughness: 0.72,
    metalness: 0.04,
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: initialOutfit.pantsColor,
    roughness: 0.82,
    metalness: 0.03,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: initialOutfit.skinTone,
    roughness: 0.54,
    metalness: 0.02,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: initialOutfit.hairColor,
    roughness: 0.74,
    metalness: 0.08,
  });
  const oliveGearMat = new THREE.MeshStandardMaterial({
    color: '#6e735c',
    roughness: 0.52,
    metalness: 0.18,
  });
  const strapMat = new THREE.MeshStandardMaterial({
    color: '#4a4e41',
    roughness: 0.78,
    metalness: 0.08,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: '#a1a1aa',
    roughness: 0.35,
    metalness: 0.75,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.55,
    metalness: 0.14,
  });
  const navySailorMat = new THREE.MeshStandardMaterial({
    color: '#172554',
    roughness: 0.65,
    metalness: 0.05,
  });
  const whiteTrimMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.55,
  });
  const stockingMat = new THREE.MeshPhysicalMaterial({
    color: '#0f1014',
    roughness: 0.28,
    metalness: 0.12,
    clearcoat: 0.45,
  });

  // Sculpted Torso + Raised Collar
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.36, 8, 14), jacketMat);
  torso.scale.set(1.25, 1.0, 0.76);
  torso.position.y = 1.15;
  torso.castShadow = !isNpc;
  bodyGroup.add(torso);

  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.145, 0.11, 14, 1, true),
    jacketMat
  );
  collar.position.y = 1.46;
  bodyGroup.add(collar);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.07, 14), strapMat);
  belt.scale.set(1.18, 1, 0.75);
  belt.position.y = 0.87;
  bodyGroup.add(belt);

  // Neck & Sculpted Realistic Head with Nose, Ears, Eyes & Brows
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.092, 0.14, 12), skinMat);
  neck.position.y = 1.5;
  bodyGroup.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 16), skinMat);
  head.scale.set(0.9, 1.08, 0.96);
  head.position.y = 1.68;
  head.castShadow = !isNpc;
  bodyGroup.add(head);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.068, 6), skinMat);
  nose.rotation.x = Math.PI * 0.36;
  nose.position.set(0, 1.675, 0.158);
  bodyGroup.add(nose);

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2 });
  const irisMat = new THREE.MeshStandardMaterial({ color: '#1c1917', roughness: 0.15 });
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), skinMat);
    ear.scale.set(0.45, 1.0, 0.65);
    ear.position.set(side * 0.15, 1.675, -0.01);

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeWhiteMat);
    sclera.position.set(side * 0.056, 1.705, 0.135);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), irisMat);
    iris.position.set(side * 0.056, 1.705, 0.148);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.011, 0.016), hairMat);
    brow.position.set(side * 0.056, 1.732, 0.142);
    bodyGroup.add(ear, sclera, iris, brow);
  }

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.008, 0.01),
    new THREE.MeshStandardMaterial({ color: '#8c5347', roughness: 0.6 })
  );
  mouth.position.set(0, 1.605, 0.146);
  bodyGroup.add(mouth);

  const hairMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.172, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.56),
    hairMat
  );
  hairMesh.position.set(0, 1.72, -0.015);
  hairMesh.rotation.x = -0.18;
  bodyGroup.add(hairMesh);

  // 1. Tactical Gear Group (Ballistic Helmet, Comms Headset, Amber Visor, Plate Carrier)
  const tacticalGearGroup = new THREE.Group();
  bodyGroup.add(tacticalGearGroup);

  const helmetShell = new THREE.Mesh(
    new THREE.SphereGeometry(0.198, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
    oliveGearMat
  );
  helmetShell.position.set(0, 1.725, -0.01);
  helmetShell.rotation.x = -0.12;
  helmetShell.castShadow = !isNpc;
  tacticalGearGroup.add(helmetShell);

  const nvgShroud = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.075, 0.032), strapMat);
  nvgShroud.position.set(0, 1.805, 0.178);
  nvgShroud.rotation.x = -0.25;
  tacticalGearGroup.add(nvgShroud);

  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.045, 0.16), strapMat);
    rail.position.set(side * 0.185, 1.74, -0.01);
    const earcup = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.105, 0.082), oliveGearMat);
    earcup.position.set(side * 0.175, 1.66, -0.01);
    tacticalGearGroup.add(rail, earcup);
  }

  const micCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.165, 1.64, 0.01),
    new THREE.Vector3(-0.145, 1.585, 0.11),
    new THREE.Vector3(-0.045, 1.565, 0.165),
  ]);
  const boomMic = new THREE.Mesh(new THREE.TubeGeometry(micCurve, 8, 0.008, 6, false), bootMat);
  const micTip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.024), bootMat);
  micTip.position.set(-0.042, 1.565, 0.168);
  tacticalGearGroup.add(boomMic, micTip);

  const chinStrap = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.011, 6, 14, Math.PI),
    strapMat
  );
  chinStrap.position.set(0, 1.62, 0.03);
  chinStrap.rotation.x = Math.PI * 0.68;
  tacticalGearGroup.add(chinStrap);

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: '#d97706',
    emissive: '#78350f',
    emissiveIntensity: 0.25,
    roughness: 0.06,
    metalness: 0.45,
    clearcoat: 1.0,
    transparent: true,
    opacity: 0.88,
  });
  const visor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.152, 0.068, 16, 1, true, -Math.PI * 0.34, Math.PI * 0.68),
    visorMat
  );
  visor.position.set(0, 1.705, 0.028);
  tacticalGearGroup.add(visor);

  const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.065), oliveGearMat);
  frontPlate.position.set(0, 1.15, 0.158);
  frontPlate.castShadow = !isNpc;
  const backPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.06), oliveGearMat);
  backPlate.position.set(0, 1.16, -0.155);
  tacticalGearGroup.add(frontPlate, backPlate);

  for (const side of [-1, 1]) {
    const shStrap = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.055, 0.33), strapMat);
    shStrap.position.set(side * 0.13, 1.41, 0);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.04, 0.03), buckleMat);
    buckle.position.set(side * 0.13, 1.35, 0.175);
    tacticalGearGroup.add(shStrap, buckle);
  }

  for (const px of [-0.1, 0, 0.1]) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.14, 0.055), strapMat);
    pouch.position.set(px, 1.01, 0.195);
    const magTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.045, 0.032), bootMat);
    magTop.position.set(px, 1.095, 0.195);
    tacticalGearGroup.add(pouch, magTop);
  }

  // 2. Street Hoodie Gear Group ("Charged 89" Olive Zip-Up Hoodie + Raised Hood + Drawstrings)
  const hoodieGearGroup = new THREE.Group();
  bodyGroup.add(hoodieGearGroup);

  const hoodShellMat = new THREE.MeshStandardMaterial({
    color: '#9c9668',
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const hoodOuter = new THREE.Mesh(
    new THREE.SphereGeometry(0.205, 16, 12, Math.PI * 0.15, Math.PI * 1.7, 0, Math.PI * 0.72),
    hoodShellMat
  );
  hoodOuter.position.set(0, 1.69, -0.025);
  hoodOuter.rotation.y = Math.PI * 0.5;
  hoodOuter.rotation.x = -0.15;
  hoodieGearGroup.add(hoodOuter);

  const hoodNeckWrap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.175, 0.14, 14, 1, true),
    hoodShellMat
  );
  hoodNeckWrap.position.set(0, 1.48, -0.01);
  hoodieGearGroup.add(hoodNeckWrap);

  for (const side of [-1, 1]) {
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), whiteTrimMat);
    string.position.set(side * 0.045, 1.33, 0.168);
    string.rotation.z = side * 0.08;
    hoodieGearGroup.add(string);
  }
  const kangarooPocket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.04), hoodShellMat);
  kangarooPocket.position.set(0, 0.99, 0.155);
  hoodieGearGroup.add(kangarooPocket);

  // 3. Academy Sailor Gear Group (Bob Hair + Sailor Collar + Pleated Skirt)
  const academyGearGroup = new THREE.Group();
  bodyGroup.add(academyGearGroup);

  const bobTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.184, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.66),
    hairMat
  );
  bobTop.position.set(0, 1.705, -0.018);
  const bobBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.175, 0.195, 0.18, 14, 1, false, Math.PI * 0.5, Math.PI),
    hairMat
  );
  bobBack.position.set(0, 1.61, -0.025);
  const bangs = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.07), hairMat);
  bangs.position.set(0, 1.765, 0.13);
  bangs.rotation.x = 0.24;
  academyGearGroup.add(bobTop, bobBack, bangs);

  // Sailor Collar Flap + White Trim Stripes + Ribbon Tie
  const sailorBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.24), navySailorMat);
  sailorBack.position.set(0, 1.45, -0.09);
  sailorBack.rotation.x = 0.18;
  const sailorStripeBack = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.04, 0.022), whiteTrimMat);
  sailorStripeBack.position.set(0, 1.43, -0.195);
  const sailorRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.03), navySailorMat);
  sailorRibbon.position.set(0, 1.37, 0.165);
  for (const side of [-1, 1]) {
    const vFlap = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.24), navySailorMat);
    vFlap.position.set(side * 0.085, 1.435, 0.05);
    vFlap.rotation.y = side * -0.42;
    vFlap.rotation.x = 0.35;
    academyGearGroup.add(vFlap);
  }
  academyGearGroup.add(sailorBack, sailorStripeBack, sailorRibbon);

  // Pleated Navy Mini-Skirt
  const skirtBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.21, 0.34, 0.34, 18),
    navySailorMat
  );
  skirtBase.position.set(0, 0.72, 0);
  skirtBase.castShadow = !isNpc;
  academyGearGroup.add(skirtBase);
  for (let p = 0; p < 12; p++) {
    const a = (p / 12) * Math.PI * 2;
    const pleat = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.33, 0.04), navySailorMat);
    pleat.position.set(Math.sin(a) * 0.26, 0.72, Math.cos(a) * 0.24);
    pleat.rotation.y = a;
    pleat.rotation.x = -0.22;
    academyGearGroup.add(pleat);
  }

  // 4. Arachnid Vigilante Suit Group (Full Red Mask + Angular White Lenses + Spider Emblems)
  const arachnidMaskGroup = new THREE.Group();
  bodyGroup.add(arachnidMaskGroup);
  const arachnidGearItems: THREE.Object3D[] = [];

  const suitRedMat = new THREE.MeshPhysicalMaterial({
    color: '#dc2626',
    roughness: 0.42,
    metalness: 0.08,
    clearcoat: 0.25,
  });
  const suitBlackMat = new THREE.MeshStandardMaterial({
    color: '#111827',
    roughness: 0.48,
    metalness: 0.14,
  });
  const lensWhiteMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#f8fafc',
    emissiveIntensity: 0.45,
    roughness: 0.12,
  });

  const maskHead = new THREE.Mesh(new THREE.SphereGeometry(0.175, 20, 16), suitRedMat);
  maskHead.scale.set(0.92, 1.09, 0.98);
  maskHead.position.y = 1.68;
  maskHead.castShadow = !isNpc;
  const maskNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.102, 0.16, 12), suitRedMat);
  maskNeck.position.y = 1.5;
  arachnidMaskGroup.add(maskHead, maskNeck);

  for (const side of [-1, 1]) {
    const lensRim = new THREE.Mesh(new THREE.BoxGeometry(0.084, 0.048, 0.028), suitBlackMat);
    lensRim.position.set(side * 0.062, 1.705, 0.148);
    lensRim.rotation.z = side * 0.28;
    lensRim.rotation.y = side * 0.22;
    const lensCore = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.03, 0.032), lensWhiteMat);
    lensCore.position.copy(lensRim.position);
    lensCore.rotation.copy(lensRim.rotation);
    arachnidMaskGroup.add(lensRim, lensCore);
  }

  // Black Side Rib Panels, Chest Spider Emblem & White Back Spider Emblem
  for (const side of [-1, 1]) {
    const sideRib = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.34, 0.24), suitBlackMat);
    sideRib.position.set(side * 0.215, 1.12, 0);
    bodyGroup.add(sideRib);
    arachnidGearItems.push(sideRib);
  }
  const lowerAb = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.18, 14), suitBlackMat);
  lowerAb.scale.set(1.22, 1, 0.76);
  lowerAb.position.y = 0.94;
  const redBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.218, 0.218, 0.075, 14), suitRedMat);
  redBelt.scale.set(1.2, 1, 0.78);
  redBelt.position.y = 0.87;
  const chestSpider = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), suitBlackMat);
  chestSpider.scale.set(0.85, 1.35, 0.35);
  chestSpider.position.set(0, 1.24, 0.16);
  const backSpider = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), lensWhiteMat);
  backSpider.scale.set(0.95, 1.45, 0.35);
  backSpider.position.set(0, 1.24, -0.158);
  bodyGroup.add(lowerAb, redBelt, chestSpider, backSpider);
  arachnidGearItems.push(lowerAb, redBelt, chestSpider, backSpider);
  for (const legIdx of [-1, 1]) {
    for (const row of [-0.025, 0.025]) {
      const fLeg = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.014, 0.015), suitBlackMat);
      fLeg.position.set(legIdx * 0.048, 1.24 + row, 0.162);
      fLeg.rotation.z = legIdx * (row > 0 ? 0.55 : -0.55);
      const bLeg = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.016, 0.015), lensWhiteMat);
      bLeg.position.set(legIdx * 0.06, 1.24 + row * 1.2, -0.16);
      bLeg.rotation.z = legIdx * (row > 0 ? -0.55 : 0.55);
      bodyGroup.add(fLeg, bLeg);
      arachnidGearItems.push(fLeg, bLeg);
    }
  }

  let shadesMesh: THREE.Mesh | null = null;
  if (!isNpc) {
    shadesMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.055, 0.06),
      new THREE.MeshPhysicalMaterial({
        color: '#09090b',
        roughness: 0.08,
        metalness: 0.65,
        clearcoat: 1.0,
      })
    );
    shadesMesh.position.set(0, 1.705, 0.145);
    bodyGroup.add(shadesMesh);
  }

  // Articulated Arms + Tactical Pistol in Right Hand + Arachnid Gauntlet Accents
  const makeArm = (side: -1 | 1) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.315, 1.38, 0);
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.34, 4, 10), jacketMat);
    sleeve.position.y = -0.2;
    sleeve.castShadow = !isNpc;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    hand.position.y = -0.45;

    const forearmBlack = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.072, 0.24, 10), suitBlackMat);
    forearmBlack.position.y = -0.28;
    const redGlove = new THREE.Mesh(new THREE.SphereGeometry(0.066, 8, 8), suitRedMat);
    redGlove.position.y = -0.45;
    arachnidGearItems.push(forearmBlack, redGlove);

    armPivot.add(sleeve, hand, forearmBlack, redGlove);
    bodyGroup.add(armPivot);
    return armPivot;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  const pistolGroup = new THREE.Group();
  const pistolTanMat = new THREE.MeshStandardMaterial({ color: '#b09973', roughness: 0.35, metalness: 0.55 });
  const gunSteelMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.32, metalness: 0.78 });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.052, 0.24), pistolTanMat);
  slide.position.set(0, 0.025, 0.075);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.036, 0.22), pistolTanMat);
  frame.position.set(0, -0.01, 0.065);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.12, 0.058), bootMat);
  grip.position.set(0, -0.068, -0.015);
  grip.rotation.x = 0.22;
  pistolGroup.add(slide, frame, grip);

  // M4A1 Carbine Rifle
  const rifleGroup = new THREE.Group();
  const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.58), gunSteelMat);
  rUpper.position.set(0, 0.02, 0.18);
  const rBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.38, 8), gunSteelMat);
  rBarrel.rotation.x = Math.PI / 2;
  rBarrel.position.set(0, 0.025, 0.54);
  const rStock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.22), bootMat);
  rStock.position.set(0, 0.0, -0.16);
  const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.16, 0.068), bootMat);
  rMag.position.set(0, -0.09, 0.16);
  rMag.rotation.x = -0.16;
  const rOptic = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.055, 0.12), bootMat);
  rOptic.position.set(0, 0.085, 0.12);
  rifleGroup.add(rUpper, rBarrel, rStock, rMag, rOptic);

  // M870 Tactical Shotgun
  const shotgunGroup = new THREE.Group();
  const sgBody = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.082, 0.44), gunSteelMat);
  sgBody.position.set(0, 0.02, 0.14);
  const sgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.48, 8), gunSteelMat);
  sgBarrel.rotation.x = Math.PI / 2;
  sgBarrel.position.set(0, 0.038, 0.46);
  const sgPump = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.22, 8), pistolTanMat);
  sgPump.rotation.x = Math.PI / 2;
  sgPump.position.set(0, -0.005, 0.4);
  const sgStock = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.11, 0.24), bootMat);
  sgStock.position.set(0, -0.01, -0.15);
  sgStock.rotation.x = 0.15;
  shotgunGroup.add(sgBody, sgBarrel, sgPump, sgStock);

  const weaponAnchor = new THREE.Group();
  weaponAnchor.position.set(0, -0.46, 0.06);
  weaponAnchor.rotation.x = Math.PI / 2;

  let muzzleSprite: THREE.Sprite | null = null;
  if (glowSpriteTex && !isNpc) {
    muzzleSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowSpriteTex,
        color: '#fbbf24',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    muzzleSprite.position.set(0, 0.03, 0.48);
    muzzleSprite.scale.set(0.75, 0.75, 1);
    weaponAnchor.add(muzzleSprite);
  }
  pistolGroup.visible = !isNpc;
  rifleGroup.visible = false;
  shotgunGroup.visible = false;
  weaponAnchor.add(pistolGroup, rifleGroup, shotgunGroup);
  rightArm.add(weaponAnchor);

  // Articulated Legs + Tactical Pads/Holster + Academy Stockings
  const tacticalLegItems: THREE.Object3D[] = [];
  const academyStockings: THREE.Object3D[] = [];
  const casualLegMeshes: THREE.Mesh[] = [];

  const makeLeg = (side: -1 | 1) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.135, 0.84, 0);

    const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.52, 4, 10), pantsMat);
    legMesh.position.y = -0.35;
    legMesh.castShadow = !isNpc;
    casualLegMeshes.push(legMesh);

    const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.06), oliveGearMat);
    kneePad.position.set(0, -0.37, 0.088);
    tacticalLegItems.push(kneePad);

    if (side === 1) {
      const holster = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.16, 0.11), strapMat);
      holster.position.set(0.095, -0.18, 0);
      tacticalLegItems.push(holster);
      legPivot.add(holster);
    }

    // Thigh-high stocking + exposed upper thigh for Academy Sailor outfit
    const upperThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.078, 0.2, 10), skinMat);
    upperThigh.position.set(0, -0.14, 0);
    const stockingShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.077, 0.056, 0.48, 10), stockingMat);
    stockingShaft.position.set(0, -0.46, 0);
    academyStockings.push(upperThigh, stockingShaft);

    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.18, 10), bootMat);
    bootShaft.position.set(0, -0.68, 0);
    const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.28), bootMat);
    bootFoot.position.set(0, -0.77, 0.045);
    const sole = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.032, 0.29),
      new THREE.MeshStandardMaterial({ color: '#09090b', roughness: 0.9 })
    );
    sole.position.set(0, -0.825, 0.045);

    const redShin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.082, 0.3, 10), suitRedMat);
    redShin.position.set(0, -0.62, 0);
    const redFoot = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.115, 0.285), suitRedMat);
    redFoot.position.set(0, -0.77, 0.045);
    arachnidGearItems.push(redShin, redFoot);

    legPivot.add(legMesh, kneePad, upperThigh, stockingShaft, bootShaft, bootFoot, sole, redShin, redFoot);
    bodyGroup.add(legPivot);
    return legPivot;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const applyOutfit = (targetOutfitId: string, texBundle?: CharacterTextureBundle) => {
    const o = PLAYER_OUTFITS.find((x) => x.id === targetOutfitId) ?? PLAYER_OUTFITS[0];
    const isArachnid = o.id === 'arachnid_suit';
    const isTac = o.id === 'tactical_operator';
    const isHoodie = o.id === 'street_hoodie';
    const isAcademy = o.id === 'academy_sailor';

    jacketMat.map =
      isTac && texBundle?.camo
        ? texBundle.camo.map
        : isHoodie && texBundle?.hoodie
          ? texBundle.hoodie.map
          : null;
    jacketMat.normalMap =
      isTac && texBundle?.camo
        ? texBundle.camo.normalMap
        : isHoodie && texBundle?.hoodie
          ? texBundle.hoodie.normalMap
          : null;
    jacketMat.color.set(isTac || (isHoodie && texBundle?.hoodie) ? '#ffffff' : o.jacketColor);
    jacketMat.needsUpdate = true;

    pantsMat.map =
      isTac && texBundle?.camo
        ? texBundle.camo.map
        : isHoodie && texBundle?.denim
          ? texBundle.denim.map
          : null;
    pantsMat.normalMap =
      isTac && texBundle?.camo
        ? texBundle.camo.normalMap
        : isHoodie && texBundle?.denim
          ? texBundle.denim.normalMap
          : null;
    pantsMat.color.set(
      isTac ? '#f4f4f0' : isHoodie && texBundle?.denim ? '#ffffff' : o.pantsColor
    );
    pantsMat.needsUpdate = true;

    hairMat.color.set(o.hairColor);
    skinMat.color.set(o.skinTone);

    tacticalGearGroup.visible = isTac;
    tacticalLegItems.forEach((item) => (item.visible = isTac));
    hoodieGearGroup.visible = isHoodie;
    academyGearGroup.visible = isAcademy;
    academyStockings.forEach((item) => (item.visible = isAcademy));
    casualLegMeshes.forEach((m) => (m.visible = !isAcademy));
    arachnidMaskGroup.visible = isArachnid;
    arachnidGearItems.forEach((item) => (item.visible = isArachnid));

    hairMesh.visible = !isTac && !isHoodie && !isAcademy && !isArachnid;
    if (shadesMesh) shadesMesh.visible = !isTac && !isHoodie && !isAcademy && !isArachnid;
    collar.visible = !isAcademy && !isArachnid;
    belt.visible = !isAcademy && !isArachnid;
  };

  const setWeapon = (weaponId: WeaponId) => {
    if (isNpc) return;
    pistolGroup.visible = weaponId === 'pistol';
    rifleGroup.visible = weaponId === 'rifle';
    shotgunGroup.visible = weaponId === 'shotgun';
    if (muzzleSprite) {
      muzzleSprite.position.z = weaponId === 'pistol' ? 0.24 : weaponId === 'rifle' ? 0.74 : 0.7;
    }
  };

  applyOutfit(outfitId, textures);

  return {
    group,
    bodyGroup,
    shadowPlane,
    head,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    jacketMat,
    pantsMat,
    hairMat,
    skinMat,
    tacticalGearGroup,
    tacticalLegItems,
    hoodieGearGroup,
    academyGearGroup,
    academyStockings,
    casualLegMeshes,
    arachnidMaskGroup,
    arachnidGearItems,
    hairMesh,
    shadesMesh,
    pistolGroup,
    rifleGroup,
    shotgunGroup,
    muzzleSprite,
    applyOutfit,
    setWeapon,
  };
}

function buildSculptedCarProfile(length: number, vClass: VehicleClass): THREE.Shape {
  const hl = length * 0.5;
  const s = new THREE.Shape();

  if (vClass === 'convertible') {
    // Open-Top Sculpted Sports Roadster Profile (low beltline, sloped nose, rear deck)
    s.moveTo(-hl, 0.08);
    s.lineTo(hl - 0.14, 0.05);
    s.lineTo(hl, 0.22);
    s.lineTo(hl - 0.12, 0.48);
    s.lineTo(hl * 0.36, 0.56);
    s.lineTo(-hl * 0.65, 0.58);
    s.lineTo(-hl, 0.52);
    s.closePath();
  } else if (vClass === 'supercar' || vClass === 'sports' || vClass === 'police') {
    const hoodH = vClass === 'supercar' ? 0.42 : 0.48;
    const roofH = vClass === 'supercar' ? 0.88 : 0.98;
    s.moveTo(-hl, 0.08);
    s.lineTo(hl - 0.15, 0.05);
    s.lineTo(hl, 0.22);
    s.lineTo(hl - 0.12, hoodH);
    s.lineTo(hl * 0.34, hoodH + 0.07);
    s.lineTo(hl * 0.06, roofH);
    s.lineTo(-hl * 0.38, roofH);
    s.lineTo(-hl * 0.82, hoodH + 0.14);
    s.lineTo(-hl, hoodH + 0.08);
    s.closePath();
  } else if (vClass === 'muscle') {
    // Sculpted Front-Engine Fastback Profile (long power-bulge hood + sweeping fastback rear)
    s.moveTo(-hl, 0.1);
    s.lineTo(hl - 0.14, 0.07);
    s.lineTo(hl, 0.28);
    s.lineTo(hl - 0.08, 0.58);
    s.lineTo(hl * 0.28, 0.66);
    s.lineTo(hl * 0.02, 1.05);
    s.lineTo(-hl * 0.34, 1.05);
    s.lineTo(-hl * 0.88, 0.66);
    s.lineTo(-hl, 0.58);
    s.closePath();
  } else if (vClass === 'suv') {
    s.moveTo(-hl, 0.08);
    s.lineTo(hl - 0.1, 0.08);
    s.lineTo(hl, 0.32);
    s.lineTo(hl - 0.08, 0.72);
    s.lineTo(hl * 0.42, 0.78);
    s.lineTo(hl * 0.22, 1.38);
    s.lineTo(-hl * 0.86, 1.38);
    s.lineTo(-hl, 0.82);
    s.closePath();
  } else {
    // Sedan / Police Interceptor
    s.moveTo(-hl, 0.08);
    s.lineTo(hl - 0.12, 0.08);
    s.lineTo(hl, 0.28);
    s.lineTo(hl - 0.1, 0.56);
    s.lineTo(hl * 0.36, 0.62);
    s.lineTo(hl * 0.12, 1.08);
    s.lineTo(-hl * 0.44, 1.08);
    s.lineTo(-hl * 0.68, 0.66);
    s.lineTo(-hl, 0.62);
    s.closePath();
  }
  return s;
}

export function createVehicleModel(
  specId: string,
  colorHex: string,
  shadowTex: THREE.Texture,
  isSoftwareGl: boolean,
  withDynamicHeadlight = false,
  glowSpriteTex?: THREE.Texture
): VehicleRig {
  const spec = VEHICLE_SPECS[specId] ?? VEHICLE_SPECS.veloce_gt;
  const vClass: VehicleClass = spec.vehicleClass;
  const group = new THREE.Group();

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 1.48, spec.length * 1.28),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.62,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.025;
  group.add(shadowPlane);

  const chassisGroup = new THREE.Group();
  group.add(chassisGroup);

  const bodyPaintMat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: vClass === 'truck' ? 0.35 : 0.76,
    roughness: vClass === 'truck' ? 0.4 : 0.18,
    clearcoat: vClass === 'truck' ? 0.4 : 1.0,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: '#141418',
    roughness: 0.58,
    metalness: 0.32,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: '#e4e4e7',
    roughness: 0.14,
    metalness: 0.94,
  });

  const caliperMat = new THREE.MeshStandardMaterial({
    color: '#dc2626',
    roughness: 0.35,
    metalness: 0.4,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#090d16',
    roughness: 0.05,
    metalness: 0.18,
    clearcoat: 1.0,
    transparent: true,
    opacity: isSoftwareGl ? 0.68 : 0.58,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#fefce8',
    emissive: '#fef08a',
    emissiveIntensity: 0.65,
    roughness: 0.15,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: '#7f1d1d',
    emissive: '#ef4444',
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });

  const leftSignalMat = new THREE.MeshStandardMaterial({
    color: '#b45309',
    emissive: '#f59e0b',
    emissiveIntensity: 0.1,
    roughness: 0.2,
  });

  const rightSignalMat = new THREE.MeshStandardMaterial({
    color: '#b45309',
    emissive: '#f59e0b',
    emissiveIntensity: 0.1,
    roughness: 0.2,
  });

  const wheels: THREE.Group[] = [];
  const frontWheelSteers: THREE.Group[] = [];
  const headlightSprites: THREE.Sprite[] = [];
  const taillightSprites: THREE.Sprite[] = [];
  let steeringWheel: THREE.Group | undefined;
  let mainRotor: THREE.Group | undefined;
  let tailRotor: THREE.Group | undefined;
  let searchlightCone: THREE.Mesh | undefined;
  let sirenRedMat: THREE.MeshStandardMaterial | undefined;
  let sirenBlueMat: THREE.MeshStandardMaterial | undefined;
  let sirenRedSprite: THREE.Sprite | undefined;
  let sirenBlueSprite: THREE.Sprite | undefined;

  const tireMat = new THREE.MeshStandardMaterial({ color: '#0f0f12', roughness: 0.86, metalness: 0.08 });

  const makeGlowSprite = (color: string, scale: number, opacity: number) => {
    if (!glowSpriteTex) return null;
    const spMat = new THREE.SpriteMaterial({
      map: glowSpriteTex,
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sp = new THREE.Sprite(spMat);
    sp.scale.set(scale, scale, 1);
    return sp;
  };

  const buildWheel = (radius: number, width: number, x: number, z: number, isFront: boolean) => {
    const steerGroup = new THREE.Group();
    steerGroup.position.set(x, radius, z);
    const spinGroup = new THREE.Group();
    steerGroup.add(spinGroup);

    // Tire outer + sidewall bevel
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, width, 22),
      tireMat
    );
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    spinGroup.add(tire);

    // Dark wheel barrel
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.68, radius * 0.68, width + 0.015, 16),
      trimMat
    );
    barrel.rotation.z = Math.PI / 2;
    spinGroup.add(barrel);

    // Brake disc + red brake caliper
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.48, radius * 0.48, width * 0.55, 14),
      chromeMat
    );
    disc.rotation.z = Math.PI / 2;
    spinGroup.add(disc);

    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.65, radius * 0.34, radius * 0.24),
      caliperMat
    );
    caliper.position.set(0, radius * 0.26, -radius * 0.22);
    steerGroup.add(caliper); // caliper stays fixed relative to steering knuckle!

    // 5-Spoke Alloy Rim
    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.025, radius * 1.24, 0.055),
        chromeMat
      );
      spoke.rotation.x = (s * Math.PI) / 5;
      spinGroup.add(spoke);
    }

    const centerCap = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.18, radius * 0.18, width + 0.035, 10),
      trimMat
    );
    centerCap.rotation.z = Math.PI / 2;
    spinGroup.add(centerCap);

    group.add(steerGroup);
    wheels.push(spinGroup);
    if (isFront) frontWheelSteers.push(steerGroup);
  };

  if (vClass === 'motorcycle') {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.4, 1.48), trimMat);
    frame.position.set(0, 0.56, 0);
    frame.castShadow = true;
    chassisGroup.add(frame);

    const fairing = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.72, 6, 12), bodyPaintMat);
    fairing.rotation.x = Math.PI / 2 + 0.16;
    fairing.scale.set(0.95, 1, 0.85);
    fairing.position.set(0, 0.84, 0.36);
    fairing.castShadow = true;
    chassisGroup.add(fairing);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.08), glassMat);
    visor.position.set(0, 1.04, 0.75);
    visor.rotation.x = -0.52;
    chassisGroup.add(visor);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.62), trimMat);
    seat.position.set(0, 0.78, -0.35);
    chassisGroup.add(seat);

    const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.7, 10), chromeMat);
    muffler.rotation.x = Math.PI / 2 - 0.15;
    muffler.position.set(0.2, 0.45, -0.55);
    chassisGroup.add(muffler);

    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.11, 0.08), headlightMat);
    hl.position.set(0, 0.76, 0.96);
    chassisGroup.add(hl);

    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.07, 0.08), taillightMat);
    tl.position.set(0, 0.78, -0.92);
    chassisGroup.add(tl);

    const hs = makeGlowSprite('#fef08a', 1.4, 0.5);
    if (hs) {
      hs.position.set(0, 0.76, 1.06);
      chassisGroup.add(hs);
      headlightSprites.push(hs);
    }

    buildWheel(0.34, 0.18, 0, 0.78, true);
    buildWheel(0.35, 0.22, 0, -0.78, false);
  } else if (vClass === 'bicycle') {
    const frameMat = bodyPaintMat;
    const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.68, 8), frameMat);
    seatTube.position.set(0, 0.56, -0.15);
    seatTube.rotation.x = -0.22;
    const topTube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.68, 8), frameMat);
    topTube.rotation.x = Math.PI / 2;
    topTube.position.set(0, 0.78, 0.12);
    const downTube = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.76, 8), frameMat);
    downTube.rotation.x = Math.PI * 0.34;
    downTube.position.set(0, 0.54, 0.14);
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.62, 8), chromeMat);
    fork.rotation.x = -0.22;
    fork.position.set(0, 0.54, 0.45);
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.54, 8), trimMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0, 0.94, 0.38);
    const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.24), trimMat);
    saddle.position.set(0, 0.92, -0.25);
    chassisGroup.add(seatTube, topTube, downTube, fork, handlebar, saddle);

    buildWheel(0.34, 0.08, 0, 0.56, true);
    buildWheel(0.34, 0.08, 0, -0.56, false);
  } else if (vClass === 'helicopter') {
    // Twin-Turbine Utility / Police Helicopter
    const cabin = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 2.2, 8, 16), bodyPaintMat);
    cabin.rotation.x = Math.PI / 2;
    cabin.scale.set(1.05, 1.0, 0.92);
    cabin.position.set(0, 1.35, 0.45);
    cabin.castShadow = true;
    chassisGroup.add(cabin);

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.96, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
      glassMat
    );
    canopy.rotation.x = Math.PI * 0.38;
    canopy.position.set(0, 1.45, 1.45);
    chassisGroup.add(canopy);

    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.38, 4.1, 10), bodyPaintMat);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 1.55, -2.55);
    tailBoom.castShadow = true;
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.25, 0.72), bodyPaintMat);
    tailFin.position.set(0, 2.05, -4.45);
    tailFin.rotation.x = -0.28;
    chassisGroup.add(tailBoom, tailFin);

    // Tubular Landing Skids
    for (const side of [-1, 1]) {
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 3.8, 8), trimMat);
      skid.rotation.x = Math.PI / 2;
      skid.position.set(side * 0.95, 0.08, 0.35);
      const strutF = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.72, 6), trimMat);
      strutF.position.set(side * 0.8, 0.38, 1.2);
      strutF.rotation.z = side * 0.35;
      const strutR = strutF.clone();
      strutR.position.z = -0.5;
      chassisGroup.add(skid, strutF, strutR);
    }

    // Main 4-Blade Rotor + Tail Rotor
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 10), trimMat);
    mast.position.set(0, 2.42, 0.25);
    chassisGroup.add(mast);

    mainRotor = new THREE.Group();
    mainRotor.position.set(0, 2.66, 0.25);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), chromeMat);
    mainRotor.add(hub);
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 3.6), trimMat);
      blade.position.set(0, 0, 1.8);
      const pivot = new THREE.Group();
      pivot.rotation.y = (b * Math.PI) / 2;
      pivot.add(blade);
      mainRotor.add(pivot);
    }
    chassisGroup.add(mainRotor);

    tailRotor = new THREE.Group();
    tailRotor.position.set(0.18, 2.15, -4.55);
    for (let b = 0; b < 2; b++) {
      const tb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.9, 0.1), chromeMat);
      tb.rotation.x = (b * Math.PI) / 2;
      tailRotor.add(tb);
    }
    chassisGroup.add(tailRotor);

    // Belly Searchlight Cone (useful at night & Police Air-1)
    const coneGeo = new THREE.ConeGeometry(4.5, 22, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: '#fef08a',
      transparent: true,
      opacity: specId === 'police_heli' ? 0.14 : 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    searchlightCone = new THREE.Mesh(coneGeo, coneMat);
    searchlightCone.position.set(0, -10.5, 2.2);
    chassisGroup.add(searchlightCone);
  } else if (vClass === 'boat') {
    // Twin-Outboard V-Hull Speedboat
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-2.7, 0.25);
    hullShape.lineTo(2.2, 0.15);
    hullShape.lineTo(2.9, 0.65);
    hullShape.lineTo(1.2, 0.92);
    hullShape.lineTo(-2.7, 0.85);
    hullShape.closePath();
    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      depth: 1.85,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 2,
    });
    hullGeo.translate(0, 0, -0.925);
    hullGeo.rotateY(-Math.PI / 2);
    const hullMesh = new THREE.Mesh(hullGeo, bodyPaintMat);
    hullMesh.castShadow = true;
    chassisGroup.add(hullMesh);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.18, 4.8), trimMat);
    stripe.position.set(0, 0.72, -0.1);
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.12, 3.6),
      new THREE.MeshStandardMaterial({ color: '#d4a373', roughness: 0.75 })
    );
    deck.position.set(0, 0.88, -0.4);
    const ws = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.36, 0.75), glassMat);
    ws.position.set(0, 1.12, 0.65);
    ws.rotation.x = 0.65;
    chassisGroup.add(stripe, deck, ws);

    for (const side of [-0.45, 0.45]) {
      const outboard = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.68, 0.42), trimMat);
      outboard.position.set(side, 0.78, -2.95);
      chassisGroup.add(outboard);
    }
  } else if (vClass === 'bus' || vClass === 'ambulance') {
    const isBus = vClass === 'bus';
    const w = spec.width;
    const l = spec.length;
    const h = spec.height;

    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h - 0.5, l), bodyPaintMat);
    body.position.set(0, h * 0.5 + 0.15, 0);
    body.castShadow = true;
    chassisGroup.add(body);

    const sideGlass = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.03, isBus ? 0.92 : 0.48, l * (isBus ? 0.86 : 0.34)),
      glassMat
    );
    sideGlass.position.set(0, isBus ? 1.85 : 1.72, isBus ? 0.15 : l * 0.24);
    chassisGroup.add(sideGlass);

    const ws = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, isBus ? 1.05 : 0.68, 0.1), glassMat);
    ws.position.set(0, isBus ? 1.75 : 1.65, l * 0.5);
    chassisGroup.add(ws);

    if (!isBus) {
      const medStripe = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.04, 0.28, l * 0.96),
        new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 })
      );
      medStripe.position.set(0, 1.12, 0);
      sirenRedMat = new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.6 });
      const lightbar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.6, 0.16, 0.28), sirenRedMat);
      lightbar.position.set(0, h + 0.02, l * 0.24);
      chassisGroup.add(medStripe, lightbar);
    }

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.08), headlightMat);
    hlL.position.set(-w * 0.36, 0.78, l * 0.5 + 0.02);
    const hlR = hlL.clone();
    hlR.position.x = w * 0.36;
    chassisGroup.add(hlL, hlR);

    buildWheel(0.45, 0.32, -w * 0.45, l * 0.33, true);
    buildWheel(0.45, 0.32, w * 0.45, l * 0.33, true);
    buildWheel(0.45, 0.34, -w * 0.45, -l * 0.32, false);
    buildWheel(0.45, 0.34, w * 0.45, -l * 0.32, false);
  } else if (vClass === 'truck') {
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.26, 1.85, 1.98), bodyPaintMat);
    cab.position.set(0, 1.44, 1.95);
    cab.castShadow = true;
    chassisGroup.add(cab);

    const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.76, 0.08), glassMat);
    windshield.position.set(0, 1.84, 2.94);
    chassisGroup.add(windshield);

    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.78, 0.12), chromeMat);
    grille.position.set(0, 1.02, 2.94);
    chassisGroup.add(grille);

    const cargoBox = new THREE.Mesh(
      new THREE.BoxGeometry(2.36, 2.34, 3.88),
      new THREE.MeshStandardMaterial({ color: '#e4e4e7', roughness: 0.55, metalness: 0.2 })
    );
    cargoBox.position.set(0, 1.74, -1.05);
    cargoBox.castShadow = true;
    chassisGroup.add(cargoBox);

    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.34, 0.22), chromeMat);
    bumperF.position.set(0, 0.54, 2.98);
    chassisGroup.add(bumperF);

    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.18, 0.08), headlightMat);
    hlL.position.set(-0.84, 0.92, 2.97);
    const hlR = hlL.clone();
    hlR.position.x = 0.84;
    chassisGroup.add(hlL, hlR);

    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.08), taillightMat);
    tlL.position.set(-0.92, 0.78, -3.0);
    const tlR = tlL.clone();
    tlR.position.x = 0.92;
    chassisGroup.add(tlL, tlR);

    buildWheel(0.48, 0.34, -1.08, 2.05, true);
    buildWheel(0.48, 0.34, 1.08, 2.05, true);
    buildWheel(0.48, 0.36, -1.08, -1.85, false);
    buildWheel(0.48, 0.36, 1.08, -1.85, false);
  } else if (vClass === 'pickup') {
    // Crew-Cab Heavy-Duty Dually Pickup (GMC Sierra HD style)
    const w = spec.width;
    const l = spec.length;
    const wheelR = 0.44;
    const baseY = 0.38;

    // Lower chassis frame + dark front air dam
    const frameRail = new THREE.Mesh(new THREE.BoxGeometry(w * 0.76, 0.22, l * 0.92), trimMat);
    frameRail.position.set(0, baseY + 0.05, 0);
    chassisGroup.add(frameRail);

    // Sculpted Front Hood + Crew Cab Box + 4-Door Window Greenhouse
    const hood = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.66, 1.55), bodyPaintMat);
    hood.position.set(0, baseY + 0.48, l * 0.35);
    hood.castShadow = true;
    chassisGroup.add(hood);

    const cabBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 1.24, 2.15), bodyPaintMat);
    cabBody.position.set(0, baseY + 0.77, 0.38);
    cabBody.castShadow = true;
    chassisGroup.add(cabBody);

    const cabGlass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.8, 0.48, 1.92), glassMat);
    cabGlass.position.set(0, baseY + 1.06, 0.36);
    chassisGroup.add(cabGlass);

    const ws = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.07, 0.72), glassMat);
    ws.position.set(0, baseY + 1.05, 1.38);
    ws.rotation.x = 0.68;
    chassisGroup.add(ws);

    // Open Cargo Bed Sides, Floor & Tailgate + Wide Dually Rear Fenders
    const bedZ = -1.78;
    const bedL = 2.08;
    const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.14, bedL), trimMat);
    bedFloor.position.set(0, baseY + 0.26, bedZ);
    const sideWallL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, bedL), bodyPaintMat);
    sideWallL.position.set(-w * 0.39, baseY + 0.56, bedZ);
    const sideWallR = sideWallL.clone();
    sideWallR.position.x = w * 0.39;
    const tailgate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.62, 0.14), bodyPaintMat);
    tailgate.position.set(0, baseY + 0.56, bedZ - bedL * 0.5 + 0.05);
    chassisGroup.add(bedFloor, sideWallL, sideWallR, tailgate);

    // Flared Wide Dually Rear Fenders
    for (const side of [-1, 1]) {
      const duallyFlare = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.44, 1.22), bodyPaintMat);
      duallyFlare.position.set(side * (w * 0.48), baseY + 0.38, -1.78);
      duallyFlare.castShadow = true;
      const runBoard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 2.05), trimMat);
      runBoard.position.set(side * (w * 0.46), baseY + 0.04, 0.38);
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.14), bodyPaintMat);
      mirror.position.set(side * (w * 0.51), baseY + 0.92, 1.15);
      chassisGroup.add(duallyFlare, runBoard, mirror);
    }

    // Bold Chrome Front Grille Surround + Dark Vertical Slats + Chrome Bumpers
    const grilleSurround = new THREE.Mesh(new THREE.BoxGeometry(w * 0.64, 0.5, 0.1), chromeMat);
    grilleSurround.position.set(0, baseY + 0.48, l * 0.5 - 0.02);
    const grilleCore = new THREE.Mesh(new THREE.BoxGeometry(w * 0.56, 0.4, 0.11), trimMat);
    grilleCore.position.set(0, baseY + 0.48, l * 0.5 - 0.01);
    chassisGroup.add(grilleSurround, grilleCore);

    const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.24, 0.18), chromeMat);
    frontBumper.position.set(0, baseY + 0.16, l * 0.5 + 0.02);
    const airDam = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.14, 0.16), trimMat);
    airDam.position.set(0, baseY - 0.02, l * 0.5);
    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.22, 0.16), chromeMat);
    rearBumper.position.set(0, baseY + 0.18, -l * 0.5 - 0.02);
    chassisGroup.add(frontBumper, airDam, rearBumper);

    // Stacked Amber/White Headlights + Taillights + Sprites
    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.08), headlightMat);
      hl.position.set(side * w * 0.38, baseY + 0.5, l * 0.5);
      chassisGroup.add(hl);
      const hs = makeGlowSprite('#fef9c3', 1.45, 0.38);
      if (hs) {
        hs.position.set(side * w * 0.38, baseY + 0.5, l * 0.5 + 0.12);
        chassisGroup.add(hs);
        headlightSprites.push(hs);
      }

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.08), taillightMat);
      tl.position.set(side * w * 0.39, baseY + 0.54, -l * 0.5);
      chassisGroup.add(tl);
      const ts = makeGlowSprite('#ef4444', 1.1, 0.28);
      if (ts) {
        ts.position.set(side * w * 0.39, baseY + 0.54, -l * 0.5 - 0.1);
        chassisGroup.add(ts);
        taillightSprites.push(ts);
      }
    }

    buildWheel(wheelR, 0.3, -w * 0.43, l * 0.33, true);
    buildWheel(wheelR, 0.3, w * 0.43, l * 0.33, true);
    buildWheel(wheelR, 0.46, -w * 0.46, -1.78, false);
    buildWheel(wheelR, 0.46, w * 0.46, -1.78, false);
  } else {
    // Sculpted ExtrudeGeometry Automotive Body
    const w = spec.width;
    const l = spec.length;
    const isSuv = vClass === 'suv';
    const isSuper = vClass === 'supercar' || vClass === 'sports';
    const isConvertible = vClass === 'convertible';
    const isPolice = vClass === 'police';
    const isMuscle = vClass === 'muscle';
    const wheelR = isSuv ? 0.42 : 0.34;
    const baseY = wheelR * 0.72;

    const profile = buildSculptedCarProfile(l, vClass);
    const bodyWidth = w - 0.12;
    const hullGeo = new THREE.ExtrudeGeometry(profile, {
      depth: bodyWidth,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.055,
      bevelSegments: 3,
      curveSegments: 8,
    });
    hullGeo.translate(0, 0, -bodyWidth * 0.5);
    hullGeo.rotateY(-Math.PI / 2); // Align profile +X to +Z (front nose)
    hullGeo.computeVertexNormals();

    const hullMesh = new THREE.Mesh(hullGeo, bodyPaintMat);
    hullMesh.position.y = baseY;
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    chassisGroup.add(hullMesh);

    // Silver & Green Polizei Sports Livery (Green Hood + Side Stripes + White Pin-Stripes)
    if (isPolice) {
      const polizeiGreenMat = new THREE.MeshPhysicalMaterial({
        color: '#15803d',
        roughness: 0.22,
        metalness: 0.45,
        clearcoat: 0.9,
      });
      const hoodPanel = new THREE.Mesh(new THREE.BoxGeometry(w * 0.62, 0.04, l * 0.28), polizeiGreenMat);
      hoodPanel.position.set(0, baseY + 0.54, l * 0.31);
      hoodPanel.rotation.x = 0.08;
      const sideBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.24, l * 0.74), polizeiGreenMat);
      sideBand.position.set(0, baseY + 0.34, -0.04);
      const pinStripe = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.04, 0.045, l * 0.76),
        new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 })
      );
      pinStripe.position.set(0, baseY + 0.48, -0.04);
      chassisGroup.add(hoodPanel, sideBand, pinStripe);
    }

    const glassW = w * 0.84;
    const cabinY = isSuv ? baseY + 1.04 : baseY + 0.78;
    const glassL = isSuv ? l * 0.5 : l * 0.4;
    const glassZ = isSuv ? -0.32 : -0.14;

    if (isConvertible) {
      // Open-Top Roadster Interior Tub + Vibrant Red Leather Bucket Seats
      const redLeatherMat = new THREE.MeshPhysicalMaterial({
        color: '#dc2626',
        roughness: 0.42,
        metalness: 0.06,
        clearcoat: 0.25,
      });
      const cockpitFloor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.08, l * 0.36), trimMat);
      cockpitFloor.position.set(0, baseY + 0.57, -0.12);
      const consoleBox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, l * 0.36), redLeatherMat);
      consoleBox.position.set(0, baseY + 0.68, -0.06);
      const rearDeckPad = new THREE.Mesh(new THREE.BoxGeometry(w * 0.76, 0.1, 0.55), redLeatherMat);
      rearDeckPad.position.set(0, baseY + 0.62, -l * 0.24);
      chassisGroup.add(cockpitFloor, consoleBox, rearDeckPad);

      for (const side of [-1, 1]) {
        const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.48), redLeatherMat);
        seatBase.position.set(side * 0.38, baseY + 0.64, -0.05);
        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.54, 0.12), redLeatherMat);
        seatBack.position.set(side * 0.38, baseY + 0.86, -0.26);
        seatBack.rotation.x = -0.18;
        const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.11), redLeatherMat);
        headrest.position.set(side * 0.38, baseY + 1.15, -0.31);
        const rollHoop = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.024, 6, 12, Math.PI), chromeMat);
        rollHoop.position.set(side * 0.38, baseY + 0.88, -0.44);
        chassisGroup.add(seatBase, seatBack, headrest, rollHoop);
      }
    } else {
      // Wrap-around Tinted Windshield & Side Greenhouse
      const cabinGlass = new THREE.Mesh(
        new THREE.BoxGeometry(glassW, isSuv ? 0.46 : 0.32, glassL),
        glassMat
      );
      cabinGlass.position.set(0, cabinY, glassZ);
      chassisGroup.add(cabinGlass);
    }

    // Sloped Front Windshield Pane (+ Silver Frame on Convertible)
    const ws = new THREE.Mesh(
      new THREE.BoxGeometry(glassW * 0.94, 0.06, isSuv ? 0.62 : 0.78),
      glassMat
    );
    ws.position.set(0, isConvertible ? baseY + 0.76 : cabinY + 0.02, isSuv ? l * 0.24 : l * 0.16);
    ws.rotation.x = isSuper || isConvertible || isPolice ? 0.54 : 0.66;
    chassisGroup.add(ws);

    if (isConvertible) {
      const wsTopFrame = new THREE.Mesh(new THREE.BoxGeometry(glassW * 0.96, 0.055, 0.07), chromeMat);
      wsTopFrame.position.set(0, baseY + 0.96, l * 0.01);
      chassisGroup.add(wsTopFrame);
    }

    // Side Mirrors
    for (const side of [-1, 1]) {
      const mirror = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.09, 0.12),
        isConvertible || isPolice ? bodyPaintMat : trimMat
      );
      mirror.position.set(side * (w * 0.52), baseY + (isSuv ? 0.8 : 0.56), l * 0.15);
      chassisGroup.add(mirror);
    }

    // Front Splitter, Grille & Rear Diffuser
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.1, 0.24), trimMat);
    splitter.position.set(0, baseY + 0.06, l * 0.49);
    chassisGroup.add(splitter);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.16, 0.22), trimMat);
    diffuser.position.set(0, baseY + 0.1, -l * 0.49);
    chassisGroup.add(diffuser);

    const grille = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.54, isMuscle ? 0.22 : 0.17, 0.08),
      isMuscle ? trimMat : chromeMat
    );
    grille.position.set(0, baseY + (isMuscle ? 0.32 : 0.24), l * 0.5 + 0.01);
    chassisGroup.add(grille);

    // Dual Chrome Exhausts
    for (const side of [-1, 1]) {
      const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 10), chromeMat);
      ex.rotation.x = Math.PI / 2;
      ex.position.set(side * w * 0.31, baseY + 0.09, -l * 0.5 - 0.04);
      chassisGroup.add(ex);
    }

    // Rear Wing for Sports, Supercar & Polizei Interceptor; Lip Spoiler for Muscle
    if (isSuper || isPolice) {
      const wingMat = isPolice
        ? new THREE.MeshPhysicalMaterial({ color: '#15803d', roughness: 0.22, clearcoat: 0.9 })
        : trimMat;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.06, 0.28), wingMat);
      wing.position.set(0, baseY + 0.72, -l * 0.44);
      const stL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.14), trimMat);
      stL.position.set(-w * 0.3, baseY + 0.62, -l * 0.44);
      const stR = stL.clone();
      stR.position.x = w * 0.3;
      chassisGroup.add(wing, stL, stR);
    } else if (isMuscle) {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.08, 0.16), bodyPaintMat);
      lip.position.set(0, baseY + 0.62, -l * 0.46);
      chassisGroup.add(lip);
    }

    // Polizei Roof Lightbar (Blue & Cyan LED Pods + Glow Halos)
    if (isPolice) {
      const barY = baseY + 1.03;
      const barBase = new THREE.Mesh(new THREE.BoxGeometry(w * 0.64, 0.06, 0.22), chromeMat);
      barBase.position.set(0, barY, -0.14);
      sirenRedMat = new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#0ea5e9',
        emissiveIntensity: 1.8,
      });
      sirenBlueMat = new THREE.MeshStandardMaterial({
        color: '#2563eb',
        emissive: '#3b82f6',
        emissiveIntensity: 0.3,
      });
      const leftPod = new THREE.Mesh(new THREE.BoxGeometry(w * 0.25, 0.1, 0.2), sirenRedMat);
      leftPod.position.set(-w * 0.18, barY + 0.06, -0.14);
      const rightPod = new THREE.Mesh(new THREE.BoxGeometry(w * 0.25, 0.1, 0.2), sirenBlueMat);
      rightPod.position.set(w * 0.18, barY + 0.06, -0.14);
      chassisGroup.add(barBase, leftPod, rightPod);

      const rs = makeGlowSprite('#38bdf8', 1.6, 0.75);
      const bs = makeGlowSprite('#3b82f6', 1.6, 0.75);
      if (rs && bs) {
        rs.position.set(-w * 0.18, barY + 0.14, -0.14);
        bs.position.set(w * 0.18, barY + 0.14, -0.14);
        chassisGroup.add(rs, bs);
        sirenRedSprite = rs;
        sirenBlueSprite = bs;
      }
    }

    // Headlights, Taillights & Working Turn Signals
    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.08), headlightMat);
      hl.position.set(side * w * 0.34, baseY + (isSuv ? 0.52 : 0.3), l * 0.5 + 0.01);
      chassisGroup.add(hl);

      const sigMat = side === -1 ? leftSignalMat : rightSignalMat;
      const sigF = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.09), sigMat);
      sigF.position.set(side * w * 0.46, baseY + (isSuv ? 0.5 : 0.28), l * 0.49);
      const sigR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.09), sigMat);
      sigR.position.set(side * w * 0.46, baseY + (isSuv ? 0.56 : 0.36), -l * 0.49);
      chassisGroup.add(sigF, sigR);

      const hs = makeGlowSprite('#fef9c3', 1.35, 0.35);
      if (hs) {
        hs.position.set(side * w * 0.34, baseY + (isSuv ? 0.52 : 0.3), l * 0.5 + 0.12);
        chassisGroup.add(hs);
        headlightSprites.push(hs);
      }

      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.08), taillightMat);
      tl.position.set(side * w * 0.33, baseY + (isSuv ? 0.58 : 0.38), -l * 0.5 - 0.01);
      chassisGroup.add(tl);

      const ts = makeGlowSprite('#ef4444', 1.1, 0.28);
      if (ts) {
        ts.position.set(side * w * 0.33, baseY + (isSuv ? 0.58 : 0.38), -l * 0.5 - 0.1);
        chassisGroup.add(ts);
        taillightSprites.push(ts);
      }
    }

    // Working Interior Steering Wheel (visible in First-Person Cockpit View)
    steeringWheel = new THREE.Group();
    const swRim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 6, 16), trimMat);
    const swSpoke = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.025), chromeMat);
    steeringWheel.add(swRim, swSpoke);
    steeringWheel.position.set(w * 0.22, cabinY - 0.12, l * 0.12);
    steeringWheel.rotation.x = -0.35;
    chassisGroup.add(steeringWheel);

    const wheelX = w * 0.45;
    const wheelZ = l * 0.31;
    buildWheel(wheelR, 0.28, -wheelX, wheelZ, true);
    buildWheel(wheelR, 0.28, wheelX, wheelZ, true);
    buildWheel(wheelR, 0.3, -wheelX, -wheelZ, false);
    buildWheel(wheelR, 0.3, wheelX, -wheelZ, false);
  }

  let headlightSpot: THREE.SpotLight | undefined;
  if (withDynamicHeadlight && !isSoftwareGl) {
    headlightSpot = new THREE.SpotLight(0xfffbeb, 0, 46, Math.PI / 4.8, 0.55, 1.4);
    headlightSpot.position.set(0, 1.1, spec.length * 0.48);
    headlightSpot.target.position.set(0, 0.05, spec.length * 0.5 + 18);
    chassisGroup.add(headlightSpot);
    chassisGroup.add(headlightSpot.target);
  }

  return {
    group,
    chassisGroup,
    bodyPaintMat,
    wheels,
    frontWheelSteers,
    steeringWheel,
    mainRotor,
    tailRotor,
    searchlightCone,
    headlightMat,
    taillightMat,
    leftSignalMat,
    rightSignalMat,
    headlightSprites,
    taillightSprites,
    sirenRedMat,
    sirenBlueMat,
    sirenRedSprite,
    sirenBlueSprite,
    headlightSpot,
  };
}

export function createBlackCatModel(shadowTex: THREE.Texture): CatRig {
  const group = new THREE.Group();

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.95),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.45,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.02;
  group.add(shadowPlane);

  const furMat = new THREE.MeshPhysicalMaterial({
    color: '#111116',
    roughness: 0.38,
    metalness: 0.08,
    clearcoat: 0.45,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: '#4ade80',
    emissive: '#22c55e',
    emissiveIntensity: 0.55,
    roughness: 0.15,
  });
  const noseMat = new THREE.MeshStandardMaterial({ color: '#fda4af', roughness: 0.5 });

  // Sleek arched cat torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.34, 6, 12), furMat);
  torso.rotation.x = Math.PI / 2;
  torso.position.set(0, 0.3, 0);
  torso.castShadow = true;
  group.add(torso);

  // Neck + Sculpted Head + Pointed Ears + Emerald Eyes
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.14, 10), furMat);
  neck.position.set(0, 0.39, 0.21);
  neck.rotation.x = 0.45;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), furMat);
  head.position.set(0, 0.46, 0.26);
  head.castShadow = true;
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), furMat);
  muzzle.position.set(0, 0.435, 0.335);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), noseMat);
  nose.position.set(0, 0.445, 0.375);
  group.add(neck, head, muzzle, nose);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.085, 4), furMat);
    ear.position.set(side * 0.055, 0.555, 0.245);
    ear.rotation.z = -side * 0.22;
    ear.rotation.y = side * 0.25;
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 8), eyeMat);
    eye.position.set(side * 0.042, 0.47, 0.34);
    group.add(ear, eye);
  }

  // 4 Articulated Legs
  const legs: THREE.Group[] = [];
  const legCoords: Array<[number, number]> = [
    [-0.065, 0.16],
    [0.065, 0.16],
    [-0.065, -0.16],
    [0.065, -0.16],
  ];
  for (const [lx, lz] of legCoords) {
    const legPivot = new THREE.Group();
    legPivot.position.set(lx, 0.26, lz);
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.24, 8), furMat);
    limb.position.y = -0.12;
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), furMat);
    paw.scale.set(1, 0.7, 1.3);
    paw.position.set(0, -0.24, 0.018);
    legPivot.add(limb, paw);
    group.add(legPivot);
    legs.push(legPivot);
  }

  // Curved Upright Tail
  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.33, -0.22);
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0.14, -0.14),
    new THREE.Vector3(0, 0.32, -0.12),
    new THREE.Vector3(0, 0.4, -0.05),
  ]);
  const tailMesh = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 10, 0.022, 7, false), furMat);
  tailPivot.add(tailMesh);
  group.add(tailPivot);

  return { group, legs, tailPivot };
}
