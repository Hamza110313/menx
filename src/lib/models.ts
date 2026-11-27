import * as THREE from 'three';
import { PLAYER_OUTFITS, VEHICLE_SPECS } from './gameConfig';
import type { VehicleClass, WeaponId } from '../types/game';

export interface CharacterTextureBundle {
  camo?: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };
  desertCamo?: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };
  hoodie?: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };
  denim?: { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture };
  paragonEmblem?: THREE.CanvasTexture;
  darkKnightEmblem?: THREE.CanvasTexture;
  uzumakiCrest?: THREE.CanvasTexture;
}

export interface VehicleDecalBundle {
  policeDoor?: THREE.CanvasTexture;
  muscle01?: THREE.CanvasTexture;
  expressSide?: THREE.CanvasTexture;
  expressHood?: THREE.CanvasTexture;
  skylineHood?: THREE.CanvasTexture;
  skylineSide?: THREE.CanvasTexture;
}

export interface CharacterRig {
  group: THREE.Group;
  bodyGroup: THREE.Group;
  shadowPlane: THREE.Mesh;
  head: THREE.Mesh;
  baseFaceGroup: THREE.Group;
  paragonHeadGroup: THREE.Group;
  sunburstHeadGroup: THREE.Group;
  sunburstCloudRing: THREE.Group;
  narutoHeadGroup: THREE.Group;
  gokuHeadGroup: THREE.Group;
  darkKnightHeadGroup: THREE.Group;
  desertHeadGroup: THREE.Group;
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
  paragonGearItems: THREE.Object3D[];
  darkKnightGearItems: THREE.Object3D[];
  desertGearItems: THREE.Object3D[];
  sunburstGearItems: THREE.Object3D[];
  narutoSageItems: THREE.Object3D[];
  narutoTrackItems: THREE.Object3D[];
  gokuGearItems: THREE.Object3D[];
  capeTopPivot: THREE.Group;
  capeBottomPivot: THREE.Group;
  paragonCapeMeshes: THREE.Mesh[];
  darkKnightCapeMeshes: THREE.Mesh[];
  hairMesh: THREE.Mesh;
  shadesMesh: THREE.Mesh | null;
  pistolGroup: THREE.Group;
  smgGroup: THREE.Group;
  rifleGroup: THREE.Group;
  shotgunGroup: THREE.Group;
  rpgGroup: THREE.Group;
  swordGroup: THREE.Group;
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
  horseLegs?: THREE.Group[];
  horseTailPivot?: THREE.Group;
  horseNeckPivot?: THREE.Group;
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

  const baseFaceGroup = new THREE.Group();
  bodyGroup.add(baseFaceGroup);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.068, 6), skinMat);
  nose.rotation.x = Math.PI * 0.36;
  nose.position.set(0, 1.675, 0.158);
  baseFaceGroup.add(nose);

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
    baseFaceGroup.add(ear, sclera, iris, brow);
  }

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.008, 0.01),
    new THREE.MeshStandardMaterial({ color: '#8c5347', roughness: 0.6 })
  );
  mouth.position.set(0, 1.605, 0.146);
  baseFaceGroup.add(mouth);

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

  // 5. Paragon Hero Suit Group (Sculpted Head, Spiky Hair + S-Curl, Chest Crest, Dark Blue Flanks, Red Trunks/Cape)
  const paragonHeadGroup = new THREE.Group();
  bodyGroup.add(paragonHeadGroup);
  const paragonGearItems: THREE.Object3D[] = [];

  const paragonDarkBlueMat = new THREE.MeshStandardMaterial({
    color: '#1e3a8a',
    roughness: 0.55,
    metalness: 0.08,
  });
  const paragonCapeMat = new THREE.MeshPhysicalMaterial({
    color: '#dc2626',
    roughness: 0.6,
    metalness: 0.04,
    clearcoat: 0.12,
    side: THREE.DoubleSide,
  });
  const paragonGoldMat = new THREE.MeshStandardMaterial({
    color: '#facc15',
    roughness: 0.34,
    metalness: 0.55,
  });
  const paragonBuckleMat = new THREE.MeshStandardMaterial({
    color: '#fde047',
    roughness: 0.25,
    metalness: 0.72,
  });
  const paragonSkyEyeMat = new THREE.MeshStandardMaterial({
    color: '#38bdf8',
    emissive: '#0284c7',
    emissiveIntensity: 0.22,
    roughness: 0.15,
  });
  const paragonPupilMat = new THREE.MeshStandardMaterial({
    color: '#09090b',
    roughness: 0.1,
  });
  const paragonHairMat = new THREE.MeshStandardMaterial({
    color: '#18181b',
    roughness: 0.68,
    metalness: 0.1,
  });

  // Chiseled Square-Jaw Hero Head
  const pCranium = new THREE.Mesh(new THREE.SphereGeometry(0.162, 20, 16), skinMat);
  pCranium.scale.set(0.92, 1.04, 0.96);
  pCranium.position.set(0, 1.71, -0.005);
  pCranium.castShadow = !isNpc;

  const pJaw = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.135, 0.185), skinMat);
  pJaw.position.set(0, 1.615, 0.025);
  pJaw.castShadow = !isNpc;

  const pChin = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.068, 0.14), skinMat);
  pChin.position.set(0, 1.562, 0.048);

  const pNose = new THREE.Mesh(new THREE.ConeGeometry(0.021, 0.072, 6), skinMat);
  pNose.rotation.x = Math.PI * 0.32;
  pNose.position.set(0, 1.665, 0.156);

  const pMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.008, 0.01),
    new THREE.MeshStandardMaterial({ color: '#9f5d50', roughness: 0.58 })
  );
  pMouth.position.set(0, 1.592, 0.132);
  paragonHeadGroup.add(pCranium, pJaw, pChin, pNose, pMouth);

  // Expressive Sky-Blue Eyes, Bold Angled Dark Brows, Ears & Layered Temple Hair
  for (const side of [-1, 1]) {
    const pEar = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), skinMat);
    pEar.scale.set(0.45, 1.02, 0.65);
    pEar.position.set(side * 0.148, 1.665, -0.01);

    const pSclera = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 8), eyeWhiteMat);
    pSclera.scale.set(1.15, 0.92, 0.65);
    pSclera.position.set(side * 0.054, 1.698, 0.135);

    const pIris = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), paragonSkyEyeMat);
    pIris.scale.set(1, 1, 0.65);
    pIris.position.set(side * 0.053, 1.698, 0.147);

    const pPupil = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), paragonPupilMat);
    pPupil.position.set(side * 0.053, 1.698, 0.154);

    const pBrow = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.016, 0.02), paragonHairMat);
    pBrow.position.set(side * 0.056, 1.734, 0.144);
    pBrow.rotation.z = side * -0.14;

    paragonHeadGroup.add(pEar, pSclera, pIris, pPupil, pBrow);

    // Side temple feather hair locks
    for (let layer = 0; layer < 4; layer++) {
      const sideLock = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.072, 6), paragonHairMat);
      sideLock.position.set(side * (0.142 + layer * 0.002), 1.79 - layer * 0.032, 0.015 - layer * 0.014);
      sideLock.rotation.z = side * -0.78;
      sideLock.rotation.x = 0.25;
      paragonHeadGroup.add(sideLock);
    }
  }

  // Dark Charcoal Crown Hair Cap + Swept Spiky Tufts + Signature S-Curl Forelock
  const pHairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    paragonHairMat
  );
  pHairCap.scale.set(0.94, 1.04, 1.02);
  pHairCap.position.set(0, 1.725, -0.02);
  pHairCap.rotation.x = -0.2;
  paragonHeadGroup.add(pHairCap);

  const pBackHair = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.09), paragonHairMat);
  pBackHair.position.set(0, 1.69, -0.125);
  paragonHeadGroup.add(pBackHair);

  const tuftSpecs: Array<{ x: number; y: number; z: number; rx: number; ry: number; rz: number; h: number; r: number }> = [
    { x: -0.05, y: 1.88, z: 0.04, rx: -0.5, ry: 0.15, rz: 0.42, h: 0.11, r: 0.042 },
    { x: 0.045, y: 1.9, z: 0.03, rx: -0.42, ry: -0.2, rz: -0.28, h: 0.13, r: 0.048 },
    { x: 0.1, y: 1.86, z: -0.02, rx: -0.2, ry: 0, rz: -0.68, h: 0.1, r: 0.036 },
    { x: -0.1, y: 1.85, z: 0.01, rx: -0.3, ry: 0.2, rz: 0.72, h: 0.095, r: 0.035 },
    { x: 0.0, y: 1.89, z: -0.06, rx: -0.8, ry: 0, rz: 0.1, h: 0.11, r: 0.044 },
  ];
  for (const tf of tuftSpecs) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(tf.r, tf.h, 7), paragonHairMat);
    spike.position.set(tf.x, tf.y, tf.z);
    spike.rotation.set(tf.rx, tf.ry, tf.rz);
    paragonHeadGroup.add(spike);
  }

  // Curved S-Curl Forelock sweeping down across forehead
  const sCurlCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.018, 1.84, 0.09),
    new THREE.Vector3(-0.022, 1.815, 0.145),
    new THREE.Vector3(-0.038, 1.775, 0.156),
    new THREE.Vector3(-0.014, 1.748, 0.152),
  ]);
  const sCurlMesh = new THREE.Mesh(new THREE.TubeGeometry(sCurlCurve, 12, 0.018, 7, false), paragonHairMat);
  const sCurlTip = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.038, 6), paragonHairMat);
  sCurlTip.position.set(-0.01, 1.738, 0.151);
  sCurlTip.rotation.z = -0.35;
  sCurlTip.rotation.x = Math.PI * 0.88;
  paragonHeadGroup.add(sCurlMesh, sCurlTip);

  // Open Collarbone Skin Panel + Oblique Dark Blue Flanks + Pentagonal Chest Emblem
  const paragonCollarSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.155, 0.11, 14), skinMat);
  paragonCollarSkin.scale.set(1.2, 1, 0.75);
  paragonCollarSkin.position.set(0, 1.435, 0.015);
  bodyGroup.add(paragonCollarSkin);
  paragonGearItems.push(paragonCollarSkin);

  for (const side of [-1, 1]) {
    // Dark royal blue side-torso/oblique panels matching reference V-taper
    const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.36, 0.235), paragonDarkBlueMat);
    sidePanel.position.set(side * 0.212, 1.11, 0);
    sidePanel.rotation.z = side * 0.08;
    bodyGroup.add(sidePanel);
    paragonGearItems.push(sidePanel);

    // Crimson shoulder cape clasps draping into wide open neckline
    const shoulderClasp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.052, 0.19), suitRedMat);
    shoulderClasp.position.set(side * 0.225, 1.44, -0.025);
    shoulderClasp.rotation.z = side * -0.18;
    shoulderClasp.rotation.y = side * 0.14;
    bodyGroup.add(shoulderClasp);
    paragonGearItems.push(shoulderClasp);
  }

  const lowerTorsoDark = new THREE.Mesh(
    new THREE.CylinderGeometry(0.195, 0.202, 0.14, 14),
    paragonDarkBlueMat
  );
  lowerTorsoDark.scale.set(1.2, 1, 0.76);
  lowerTorsoDark.position.set(0, 0.96, 0);
  bodyGroup.add(lowerTorsoDark);
  paragonGearItems.push(lowerTorsoDark);

  // Pentagonal Crest Backing + Canvas Emblem Texture
  const crestShape = new THREE.Shape();
  crestShape.moveTo(-0.075, 0.068);
  crestShape.lineTo(0.075, 0.068);
  crestShape.lineTo(0.105, 0.018);
  crestShape.lineTo(0, -0.095);
  crestShape.lineTo(-0.105, 0.018);
  crestShape.closePath();
  const crestBacking = new THREE.Mesh(
    new THREE.ExtrudeGeometry(crestShape, { depth: 0.016, bevelEnabled: false }),
    suitRedMat
  );
  crestBacking.position.set(0, 1.245, 0.15);
  bodyGroup.add(crestBacking);
  paragonGearItems.push(crestBacking);

  const emblemMat = textures?.paragonEmblem
    ? new THREE.MeshStandardMaterial({
        map: textures.paragonEmblem,
        transparent: true,
        alphaTest: 0.2,
        roughness: 0.35,
        metalness: 0.15,
      })
    : paragonGoldMat;
  const crestFront = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.21), emblemMat);
  crestFront.position.set(0, 1.24, 0.168);
  bodyGroup.add(crestFront);
  paragonGearItems.push(crestFront);

  // Red Trunks + Yellow Waist Belt + Gold Buckle
  const redTrunks = new THREE.Mesh(new THREE.CylinderGeometry(0.214, 0.212, 0.16, 14), suitRedMat);
  redTrunks.scale.set(1.22, 1, 0.78);
  redTrunks.position.set(0, 0.83, 0);
  const redPelvisCap = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 10), suitRedMat);
  redPelvisCap.scale.set(1.2, 0.75, 0.85);
  redPelvisCap.position.set(0, 0.76, 0);
  const yellowBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.068, 14), paragonGoldMat);
  yellowBelt.scale.set(1.22, 1, 0.8);
  yellowBelt.position.set(0, 0.905, 0);
  const goldBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.072, 0.024), paragonBuckleMat);
  goldBuckle.position.set(0, 0.905, 0.168);
  bodyGroup.add(redTrunks, redPelvisCap, yellowBelt, goldBuckle);
  paragonGearItems.push(redTrunks, redPelvisCap, yellowBelt, goldBuckle);

  // 2-Segment Articulated Flowing Crimson Cape
  const capeTopPivot = new THREE.Group();
  capeTopPivot.position.set(0, 1.425, -0.15);
  bodyGroup.add(capeTopPivot);

  const upperCapeShape = new THREE.Shape();
  upperCapeShape.moveTo(-0.24, 0);
  upperCapeShape.lineTo(0.24, 0);
  upperCapeShape.lineTo(0.38, -0.58);
  upperCapeShape.lineTo(-0.38, -0.58);
  upperCapeShape.closePath();
  const upperCapeMesh = new THREE.Mesh(new THREE.ShapeGeometry(upperCapeShape), paragonCapeMat);
  upperCapeMesh.castShadow = !isNpc;
  capeTopPivot.add(upperCapeMesh);

  const capeBottomPivot = new THREE.Group();
  capeBottomPivot.position.set(0, -0.57, 0);
  capeTopPivot.add(capeBottomPivot);

  const lowerCapeShape = new THREE.Shape();
  lowerCapeShape.moveTo(-0.38, 0);
  lowerCapeShape.lineTo(0.38, 0);
  lowerCapeShape.lineTo(0.52, -0.66);
  lowerCapeShape.lineTo(-0.52, -0.66);
  lowerCapeShape.closePath();
  const lowerCapeMesh = new THREE.Mesh(new THREE.ShapeGeometry(lowerCapeShape), paragonCapeMat);
  lowerCapeMesh.castShadow = !isNpc;
  capeBottomPivot.add(lowerCapeMesh);

  // Scalloped Slate-Blue Bat Cape Shares capeTopPivot / capeBottomPivot Articulation
  const dkCapeMat = new THREE.MeshPhysicalMaterial({
    color: '#1c2f44',
    roughness: 0.56,
    metalness: 0.08,
    clearcoat: 0.14,
    side: THREE.DoubleSide,
  });
  const dkUpperCapeShape = new THREE.Shape();
  dkUpperCapeShape.moveTo(-0.27, 0);
  dkUpperCapeShape.lineTo(0.27, 0);
  dkUpperCapeShape.lineTo(0.42, -0.58);
  dkUpperCapeShape.lineTo(-0.42, -0.58);
  dkUpperCapeShape.closePath();
  const dkUpperCapeMesh = new THREE.Mesh(new THREE.ShapeGeometry(dkUpperCapeShape), dkCapeMat);
  dkUpperCapeMesh.castShadow = !isNpc;
  capeTopPivot.add(dkUpperCapeMesh);

  const dkLowerCapeShape = new THREE.Shape();
  dkLowerCapeShape.moveTo(-0.42, 0);
  dkLowerCapeShape.lineTo(0.42, 0);
  dkLowerCapeShape.lineTo(0.58, -0.68);
  dkLowerCapeShape.lineTo(0.42, -0.55);
  dkLowerCapeShape.lineTo(0.24, -0.71);
  dkLowerCapeShape.lineTo(0.08, -0.56);
  dkLowerCapeShape.lineTo(0.0, -0.73);
  dkLowerCapeShape.lineTo(-0.08, -0.56);
  dkLowerCapeShape.lineTo(-0.24, -0.71);
  dkLowerCapeShape.lineTo(-0.42, -0.55);
  dkLowerCapeShape.lineTo(-0.58, -0.68);
  dkLowerCapeShape.closePath();
  const dkLowerCapeMesh = new THREE.Mesh(new THREE.ShapeGeometry(dkLowerCapeShape), dkCapeMat);
  dkLowerCapeMesh.castShadow = !isNpc;
  capeBottomPivot.add(dkLowerCapeMesh);

  const paragonCapeMeshes: THREE.Mesh[] = [upperCapeMesh, lowerCapeMesh];
  const darkKnightCapeMeshes: THREE.Mesh[] = [dkUpperCapeMesh, dkLowerCapeMesh];

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

  // 6. Sunburst Hero Suit Group (Luminous White Flame Hair, Crimson Eyes, Floating Cloud Halo, Open White Cardigan + Bare Chest/Abs + X-Scar, Straw Hat on Back, Purple Sash, Cloud-Cuff Shorts & Sandals)
  const sunburstHeadGroup = new THREE.Group();
  bodyGroup.add(sunburstHeadGroup);
  const sunburstCloudRing = new THREE.Group();
  bodyGroup.add(sunburstCloudRing);
  const sunburstGearItems: THREE.Object3D[] = [];

  const sunburstWhiteMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#e2e8f0',
    emissiveIntensity: 0.22,
    roughness: 0.42,
    metalness: 0.02,
  });
  const sunburstScarMat = new THREE.MeshStandardMaterial({
    color: '#c27d63',
    roughness: 0.65,
  });
  const sunburstCrimsonEyeMat = new THREE.MeshStandardMaterial({
    color: '#dc2626',
    emissive: '#991b1b',
    emissiveIntensity: 0.3,
    roughness: 0.15,
  });
  const strawHatMat = new THREE.MeshStandardMaterial({
    color: '#eab308',
    roughness: 0.72,
  });
  const strawRibbonMat = new THREE.MeshStandardMaterial({
    color: '#991b1b',
    roughness: 0.6,
  });
  const hatCordMat = new THREE.MeshStandardMaterial({
    color: '#b45309',
    roughness: 0.7,
  });
  const purpleSashMat = new THREE.MeshStandardMaterial({
    color: '#9333ea',
    roughness: 0.55,
  });
  const sandalSoleMat = new THREE.MeshStandardMaterial({
    color: '#b45309',
    roughness: 0.75,
  });

  // Expressive Sunburst Head: Joyful Big Toothy Grin, Crimson Eyes, Curled White Brows & Cheek Scar
  const sbCranium = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 16), skinMat);
  sbCranium.scale.set(0.92, 1.04, 0.94);
  sbCranium.position.set(0, 1.69, 0);
  sbCranium.castShadow = !isNpc;
  const sbNose = new THREE.Mesh(new THREE.ConeGeometry(0.019, 0.052, 6), skinMat);
  sbNose.rotation.x = Math.PI * 0.34;
  sbNose.position.set(0, 1.668, 0.15);
  const sbGrin = new THREE.Mesh(new THREE.BoxGeometry(0.098, 0.036, 0.022), eyeWhiteMat);
  sbGrin.position.set(0, 1.612, 0.136);
  const sbTeethLine = new THREE.Mesh(new THREE.BoxGeometry(0.094, 0.005, 0.025), paragonPupilMat);
  sbTeethLine.position.set(0, 1.612, 0.138);
  const sbCheekScar = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.007, 0.01), sunburstScarMat);
  sbCheekScar.position.set(-0.072, 1.648, 0.138);
  sbCheekScar.rotation.z = -0.22;
  sunburstHeadGroup.add(sbCranium, sbNose, sbGrin, sbTeethLine, sbCheekScar);

  for (const side of [-1, 1]) {
    const sbEar = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), skinMat);
    sbEar.scale.set(0.45, 1.0, 0.65);
    sbEar.position.set(side * 0.145, 1.665, -0.01);

    const sbSclera = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), eyeWhiteMat);
    sbSclera.scale.set(1.1, 1.0, 0.62);
    sbSclera.position.set(side * 0.052, 1.698, 0.134);
    const sbIris = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), sunburstCrimsonEyeMat);
    sbIris.position.set(side * 0.052, 1.698, 0.147);
    const sbPupil = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), paragonPupilMat);
    sbPupil.position.set(side * 0.052, 1.698, 0.156);

    const sbBrowCurl = new THREE.Mesh(
      new THREE.TorusGeometry(0.024, 0.0075, 6, 12, Math.PI * 1.45),
      sunburstWhiteMat
    );
    sbBrowCurl.position.set(side * 0.054, 1.734, 0.142);
    sbBrowCurl.rotation.z = side === 1 ? 0.3 : Math.PI * 0.55;
    sunburstHeadGroup.add(sbEar, sbSclera, sbIris, sbPupil, sbBrowCurl);
  }

  // Luminous White Curly / Flame Hair Crown & Swirling Locks
  const sbHairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.172, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    sunburstWhiteMat
  );
  sbHairCap.position.set(0, 1.725, -0.015);
  sbHairCap.rotation.x = -0.18;
  sunburstHeadGroup.add(sbHairCap);

  const flameSpecs: Array<[number, number, number, number, number, number, number]> = [
    [0, 1.9, 0.01, -0.25, 0, 0, 0.072],
    [-0.085, 1.88, 0.04, -0.35, 0, 0.45, 0.062],
    [0.085, 1.88, 0.04, -0.35, 0, -0.45, 0.062],
    [-0.14, 1.82, 0.01, 0, 0, 0.85, 0.056],
    [0.14, 1.82, 0.01, 0, 0, -0.85, 0.056],
    [-0.07, 1.85, -0.09, -0.8, 0, 0.32, 0.068],
    [0.07, 1.85, -0.09, -0.8, 0, -0.32, 0.068],
    [0, 1.84, -0.13, -1.05, 0, 0, 0.07],
    [-0.1, 1.78, 0.11, 0.45, 0, 0.4, 0.042],
    [0.1, 1.78, 0.11, 0.45, 0, -0.4, 0.042],
  ];
  for (const [fx, fy, fz, rx, ry, rz, rad] of flameSpecs) {
    const curl = new THREE.Mesh(new THREE.ConeGeometry(rad, rad * 2.5, 7), sunburstWhiteMat);
    curl.position.set(fx, fy, fz);
    curl.rotation.set(rx, ry, rz);
    sunburstHeadGroup.add(curl);
  }

  // Floating Wispy White Cloud Halo (Hagoromo Scarf arching over shoulders & head)
  const cloudCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, 1.15, -0.14),
    new THREE.Vector3(-0.4, 1.48, -0.06),
    new THREE.Vector3(-0.34, 1.82, -0.08),
    new THREE.Vector3(-0.15, 2.02, -0.14),
    new THREE.Vector3(0.0, 2.05, -0.16),
    new THREE.Vector3(0.15, 2.02, -0.14),
    new THREE.Vector3(0.34, 1.82, -0.08),
    new THREE.Vector3(0.4, 1.48, -0.06),
    new THREE.Vector3(0.34, 1.15, -0.14),
  ]);
  const cloudHaloTube = new THREE.Mesh(
    new THREE.TubeGeometry(cloudCurve, 28, 0.078, 8, false),
    sunburstWhiteMat
  );
  sunburstCloudRing.add(cloudHaloTube);

  const cloudPuffPts = cloudCurve.getPoints(12);
  cloudPuffPts.forEach((pt, idx) => {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.085 + (idx % 3) * 0.022, 8, 8),
      sunburstWhiteMat
    );
    puff.position.set(
      pt.x + (idx % 2 === 0 ? 0.02 : -0.02),
      pt.y + ((idx % 3) - 1) * 0.025,
      pt.z - 0.02
    );
    sunburstCloudRing.add(puff);
  });

  // Bare Sculpted Tanned Chest, Abs, X-Scar & Open White Cardigan Buttons/Lapels
  const sbChest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.24), skinMat);
  sbChest.position.set(0, 1.16, 0.06);
  sunburstGearItems.push(sbChest);
  bodyGroup.add(sbChest);

  for (let row = 0; row < 3; row++) {
    for (const side of [-1, 1]) {
      const ab = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.062, 0.03), skinMat);
      ab.position.set(side * 0.05, 1.07 - row * 0.072, 0.178);
      sunburstGearItems.push(ab);
      bodyGroup.add(ab);
    }
  }
  for (const ang of [0.74, -0.74]) {
    const xScar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.024, 0.018), sunburstScarMat);
    xScar.position.set(0, 1.24, 0.179);
    xScar.rotation.z = ang;
    sunburstGearItems.push(xScar);
    bodyGroup.add(xScar);
  }
  for (const side of [-1, 1]) {
    const vestFlap = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.47, 0.27), sunburstWhiteMat);
    vestFlap.position.set(side * 0.165, 1.15, 0.02);
    vestFlap.castShadow = !isNpc;
    sunburstGearItems.push(vestFlap);
    bodyGroup.add(vestFlap);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.26, 6), hatCordMat);
    cord.position.set(side * 0.055, 1.44, 0.155);
    cord.rotation.z = side * 0.25;
    sunburstGearItems.push(cord);
    bodyGroup.add(cord);
  }
  for (let btnIdx = 0; btnIdx < 3; btnIdx++) {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.4 })
    );
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0.11, 1.28 - btnIdx * 0.11, 0.16);
    sunburstGearItems.push(btn);
    bodyGroup.add(btn);
  }

  // Straw Hat slung on Upper Back
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 1.38, -0.22);
  hatGroup.rotation.x = -0.82;
  const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.028, 18), strawHatMat);
  const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.18, 0.15, 16), strawHatMat);
  hatCrown.position.y = 0.078;
  const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.184, 0.186, 0.045, 16), strawRibbonMat);
  hatBand.position.y = 0.032;
  hatGroup.add(hatBrim, hatCrown, hatBand);
  sunburstGearItems.push(hatGroup);
  bodyGroup.add(hatGroup);

  const purpleSash = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.232, 0.11, 14), purpleSashMat);
  purpleSash.scale.set(1.22, 1, 0.8);
  purpleSash.position.set(0, 0.89, 0);
  const sashTail = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.36, 0.038), purpleSashMat);
  sashTail.position.set(-0.26, 0.72, 0.04);
  sashTail.rotation.z = -0.18;
  sunburstGearItems.push(purpleSash, sashTail);
  bodyGroup.add(purpleSash, sashTail);

  // 7. NARUTO UZUMAKI RIG (Spiky Blond Hair, Whiskers, Leaf Headband, Sage Crimson Scroll Cloak OR Black/Orange Tracksuit)
  const narutoHeadGroup = new THREE.Group();
  bodyGroup.add(narutoHeadGroup);
  const narutoSageItems: THREE.Object3D[] = [];
  const narutoTrackItems: THREE.Object3D[] = [];

  const narutoHairMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.56 });
  const narutoBandMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.68 });
  const narutoPlateMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.24, metalness: 0.85 });
  const narutoSageCoatMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.65, side: THREE.DoubleSide });
  const narutoFlameMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.72 });
  const narutoScrollTanMat = new THREE.MeshStandardMaterial({ color: '#d6bc92', roughness: 0.72 });
  const narutoTrackOrangeMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.62 });
  const narutoTrackBlackMat = new THREE.MeshStandardMaterial({ color: '#292524', roughness: 0.68 });
  const narutoBlueIrisMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.16 });
  const narutoPouchMat = new THREE.MeshStandardMaterial({ color: '#c4b8b0', roughness: 0.68 });

  const nrCranium = new THREE.Mesh(new THREE.SphereGeometry(0.158, 18, 14), skinMat);
  nrCranium.scale.set(0.92, 1.05, 0.94);
  nrCranium.position.set(0, 1.685, 0);
  nrCranium.castShadow = !isNpc;
  const nrNose = new THREE.Mesh(new THREE.ConeGeometry(0.017, 0.048, 6), skinMat);
  nrNose.rotation.x = Math.PI * 0.35;
  nrNose.position.set(0, 1.668, 0.148);
  const nrMouth = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.009, 0.014), new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.6 }));
  nrMouth.position.set(0, 1.615, 0.142);
  narutoHeadGroup.add(nrCranium, nrNose, nrMouth);

  for (const side of [-1, 1]) {
    const nrEar = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), skinMat);
    nrEar.scale.set(0.45, 1.0, 0.65);
    nrEar.position.set(side * 0.145, 1.665, -0.01);

    const nrSclera = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 8), eyeWhiteMat);
    nrSclera.scale.set(1.15, 0.9, 0.6);
    nrSclera.position.set(side * 0.052, 1.694, 0.132);
    const nrIris = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), narutoBlueIrisMat);
    nrIris.position.set(side * 0.052, 1.694, 0.144);
    const nrPupil = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 8, 6), paragonPupilMat);
    nrPupil.position.set(side * 0.052, 1.694, 0.153);
    const nrBrow = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.01, 0.014), narutoHairMat);
    nrBrow.position.set(side * 0.052, 1.724, 0.14);
    nrBrow.rotation.z = side * -0.16;
    narutoHeadGroup.add(nrEar, nrSclera, nrIris, nrPupil, nrBrow);

    // 3 Signature Cheek Whiskers
    for (let w = 0; w < 3; w++) {
      const whisker = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.005, 0.01), narutoFlameMat);
      whisker.position.set(side * 0.088, 1.662 - w * 0.014, 0.132);
      whisker.rotation.y = side * 0.45;
      whisker.rotation.z = side * (w - 1) * 0.1;
      narutoHeadGroup.add(whisker);
    }

    // Trailing black headband tails down the back
    const bandTail = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.36, 0.012), narutoBandMat);
    bandTail.position.set(side * 0.055, 1.56, -0.175);
    bandTail.rotation.x = 0.24;
    bandTail.rotation.z = side * 0.14;
    narutoHeadGroup.add(bandTail);
  }

  // Hidden Leaf Headband + Metal Plate
  const nrBand = new THREE.Mesh(new THREE.CylinderGeometry(0.156, 0.158, 0.056, 18), narutoBandMat);
  nrBand.scale.set(0.95, 1, 0.98);
  nrBand.position.set(0, 1.755, -0.004);
  const nrPlate = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.044, 0.022), narutoPlateMat);
  nrPlate.position.set(0, 1.755, 0.152);
  narutoHeadGroup.add(nrBand, nrPlate);

  // Spiky Golden Yellow Hair Crown
  const nrHairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    narutoHairMat
  );
  nrHairCap.position.set(0, 1.735, -0.015);
  nrHairCap.rotation.x = -0.22;
  narutoHeadGroup.add(nrHairCap);

  const narutoSpikes: Array<[number, number, number, number, number, number, number]> = [
    [0, 1.92, 0.01, -0.12, 0, 0, 0.068],
    [-0.085, 1.89, 0.03, -0.2, 0, 0.52, 0.062],
    [0.085, 1.89, 0.03, -0.2, 0, -0.52, 0.062],
    [-0.145, 1.82, 0.0, 0, 0, 0.96, 0.054],
    [0.145, 1.82, 0.0, 0, 0, -0.96, 0.054],
    [-0.075, 1.85, -0.1, -0.88, 0, 0.38, 0.064],
    [0.075, 1.85, -0.1, -0.88, 0, -0.38, 0.064],
    [0, 1.84, -0.145, -1.12, 0, 0, 0.066],
    [-0.105, 1.74, 0.12, 0.55, 0, 0.42, 0.034],
    [0.105, 1.74, 0.12, 0.55, 0, -0.42, 0.034],
    [0, 1.72, 0.145, 0.72, 0, 0, 0.028],
  ];
  for (const [sx, sy, sz, rx, ry, rz, rad] of narutoSpikes) {
    const sp = new THREE.Mesh(new THREE.ConeGeometry(rad, rad * 2.6, 6), narutoHairMat);
    sp.position.set(sx, sy, sz);
    sp.rotation.set(rx, ry, rz);
    narutoHeadGroup.add(sp);
  }

  // Naruto Sage Cloak + Giant Summoning Scroll on Back
  const sageTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.29, 0.68, 14), narutoSageCoatMat);
  sageTorso.scale.set(1.18, 1, 0.78);
  sageTorso.position.set(0, 1.12, -0.01);
  sageTorso.castShadow = !isNpc;
  const sageSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.38, 0.54, 14, 1, true), narutoSageCoatMat);
  sageSkirt.scale.set(1.18, 1, 0.8);
  sageSkirt.position.set(0, 0.54, -0.02);
  const sageFlameHem = new THREE.Mesh(new THREE.CylinderGeometry(0.365, 0.385, 0.12, 14, 1, true), narutoFlameMat);
  sageFlameHem.scale.set(1.18, 1, 0.8);
  sageFlameHem.position.set(0, 0.32, -0.02);
  const sageCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.16, 0.12, 14), narutoSageCoatMat);
  sageCollar.position.set(0, 1.48, -0.01);

  const giantScroll = new THREE.Group();
  giantScroll.position.set(0, 1.14, -0.27);
  giantScroll.rotation.z = -0.34;
  const scrollBody = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.74, 14), narutoScrollTanMat);
  scrollBody.rotation.z = Math.PI / 2;
  const scrollCapL = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.08, 14), narutoSageCoatMat);
  scrollCapL.rotation.z = Math.PI / 2;
  scrollCapL.position.x = -0.39;
  const scrollCapR = scrollCapL.clone();
  scrollCapR.position.x = 0.39;
  const scrollStrap = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.024, 6, 16), narutoScrollTanMat);
  scrollStrap.rotation.y = Math.PI / 2;
  scrollStrap.rotation.x = 0.48;
  scrollStrap.position.set(0, 0.02, 0.16);
  giantScroll.add(scrollBody, scrollCapL, scrollCapR, scrollStrap);
  narutoSageItems.push(sageTorso, sageSkirt, sageFlameHem, sageCollar, giantScroll);
  bodyGroup.add(sageTorso, sageSkirt, sageFlameHem, sageCollar, giantScroll);

  // Naruto Black & Orange Shinobi Tracksuit Jacket + Back Uzumaki Swirl Crest + Waist Pouch
  const trackUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.245, 0.25, 14), narutoTrackBlackMat);
  trackUpper.scale.set(1.22, 1, 0.78);
  trackUpper.position.set(0, 1.32, 0);
  trackUpper.castShadow = !isNpc;
  const trackLower = new THREE.Mesh(new THREE.CylinderGeometry(0.242, 0.23, 0.34, 14), narutoTrackOrangeMat);
  trackLower.scale.set(1.2, 1, 0.76);
  trackLower.position.set(0, 1.04, 0);
  const trackHem = new THREE.Mesh(new THREE.CylinderGeometry(0.228, 0.228, 0.08, 14), narutoTrackBlackMat);
  trackHem.scale.set(1.2, 1, 0.76);
  trackHem.position.set(0, 0.86, 0);
  const trackZipper = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.56, 0.02), narutoTrackBlackMat);
  trackZipper.position.set(0, 1.14, 0.185);
  const trackCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.145, 0.14, 14), narutoTrackBlackMat);
  trackCollar.position.set(0, 1.48, 0);
  const backCrestMat = new THREE.MeshStandardMaterial({
    map: textures?.uzumakiCrest ?? null,
    color: textures?.uzumakiCrest ? '#ffffff' : '#b91c1c',
    transparent: Boolean(textures?.uzumakiCrest),
    roughness: 0.5,
  });
  const backCrestPlane = new THREE.Mesh(new THREE.CircleGeometry(0.095, 16), backCrestMat);
  backCrestPlane.position.set(0, 1.24, -0.192);
  backCrestPlane.rotation.y = Math.PI;
  const waistPouch = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), narutoPouchMat);
  waistPouch.scale.set(1.0, 1.05, 0.58);
  waistPouch.position.set(-0.08, 0.79, -0.175);
  narutoTrackItems.push(trackUpper, trackLower, trackHem, trackZipper, trackCollar, backCrestPlane, waistPouch);
  bodyGroup.add(trackUpper, trackLower, trackHem, trackZipper, trackCollar, backCrestPlane, waistPouch);

  // 8. SON GOKU (BATTLE DAMAGED) RIG (Jet-Black Multi-Spike Hair, Muscular Chest/Abs, Torn Royal Blue Tunic, Wristbands, Tattered Orange Pants)
  const gokuHeadGroup = new THREE.Group();
  bodyGroup.add(gokuHeadGroup);
  const gokuGearItems: THREE.Object3D[] = [];

  const gokuHairMat = new THREE.MeshStandardMaterial({ color: '#111317', roughness: 0.58, metalness: 0.08 });
  const gokuBlueMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.62, side: THREE.DoubleSide });
  const gokuOrangeMat = new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.68, side: THREE.DoubleSide });
  const gokuNavyBootMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 });
  const gokuBootCordMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.65 });

  const gkCranium = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), skinMat);
  gkCranium.scale.set(0.92, 1.04, 0.94);
  gkCranium.position.set(0, 1.69, 0);
  gkCranium.castShadow = !isNpc;
  const gkNose = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 6), skinMat);
  gkNose.rotation.x = Math.PI * 0.35;
  gkNose.position.set(0, 1.67, 0.15);
  const gkMouth = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.008, 0.012), new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.6 }));
  gkMouth.position.set(0, 1.615, 0.144);
  gokuHeadGroup.add(gkCranium, gkNose, gkMouth);

  for (const side of [-1, 1]) {
    const gkEar = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), skinMat);
    gkEar.scale.set(0.45, 1.0, 0.65);
    gkEar.position.set(side * 0.145, 1.668, -0.01);

    const gkSclera = new THREE.Mesh(new THREE.SphereGeometry(0.023, 10, 8), eyeWhiteMat);
    gkSclera.scale.set(1.15, 0.85, 0.58);
    gkSclera.position.set(side * 0.052, 1.696, 0.134);
    const gkIris = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), paragonPupilMat);
    gkIris.position.set(side * 0.052, 1.696, 0.147);
    const gkBrow = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.014), gokuHairMat);
    gkBrow.position.set(side * 0.052, 1.725, 0.142);
    gkBrow.rotation.z = side * -0.22;
    gokuHeadGroup.add(gkEar, gkSclera, gkIris, gkBrow);
  }

  // Iconic Swept Multi-Spike Saiyan Hair
  const gkHairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.168, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58),
    gokuHairMat
  );
  gkHairCap.position.set(0, 1.735, -0.015);
  gkHairCap.rotation.x = -0.2;
  gokuHeadGroup.add(gkHairCap);

  const gokuSpikes: Array<[number, number, number, number, number, number, number, number]> = [
    [-0.08, 1.98, -0.02, -0.15, 0, 0.52, 0.075, 0.34],
    [-0.18, 1.88, -0.02, -0.08, 0, 1.02, 0.068, 0.3],
    [-0.16, 1.78, -0.04, 0.0, 0, 1.32, 0.056, 0.22],
    [0.14, 1.89, -0.02, -0.15, 0, -0.78, 0.068, 0.28],
    [0.19, 1.8, -0.02, -0.05, 0, -1.24, 0.058, 0.24],
    [0.02, 1.88, -0.14, -0.95, 0, -0.1, 0.072, 0.28],
    [-0.04, 1.74, 0.135, 0.68, 0, 0.22, 0.03, 0.12],
    [0.04, 1.74, 0.135, 0.68, 0, -0.24, 0.03, 0.12],
    [0.11, 1.73, 0.115, 0.55, 0, -0.58, 0.028, 0.11],
  ];
  for (const [gx, gy, gz, rx, ry, rz, rad, len] of gokuSpikes) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 6), gokuHairMat);
    spike.position.set(gx, gy, gz);
    spike.rotation.set(rx, ry, rz);
    gokuHeadGroup.add(spike);
  }

  // Sculpted Bare Muscular Saiyan Torso + Pec/Ab Definition + Torn Royal Blue Undershirt
  const gkTorsoBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.225, 0.36, 8, 14), skinMat);
  gkTorsoBase.scale.set(1.28, 1.02, 0.78);
  gkTorsoBase.position.y = 1.15;
  gkTorsoBase.castShadow = !isNpc;
  gokuGearItems.push(gkTorsoBase);
  bodyGroup.add(gkTorsoBase);

  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.SphereGeometry(0.115, 10, 8), skinMat);
    pec.scale.set(1.05, 0.75, 0.42);
    pec.position.set(side * 0.105, 1.27, 0.148);
    gokuGearItems.push(pec);
    bodyGroup.add(pec);
  }
  for (let row = 0; row < 3; row++) {
    for (const side of [-1, 1]) {
      const ab = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.06, 0.034), skinMat);
      ab.position.set(side * 0.052, 1.08 - row * 0.072, 0.174);
      gokuGearItems.push(ab);
      bodyGroup.add(ab);
    }
  }

  // Torn Blue Tunic draped over right shoulder & waist sash
  const gkTornShirt = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.44, 0.35), gokuBlueMat);
  gkTornShirt.position.set(-0.08, 1.18, 0.01);
  gkTornShirt.rotation.z = -0.36;
  const gkShoulderStrap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.34), gokuBlueMat);
  gkShoulderStrap.position.set(-0.17, 1.38, 0);
  gkShoulderStrap.rotation.z = 0.25;
  const gkTornBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.235, 0.09, 14), gokuBlueMat);
  gkTornBelt.scale.set(1.24, 1, 0.8);
  gkTornBelt.position.set(0, 0.89, 0);
  const gkSashRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.24, 0.032), gokuBlueMat);
  gkSashRibbon.position.set(-0.22, 0.75, 0.12);
  gkSashRibbon.rotation.z = -0.22;
  gokuGearItems.push(gkTornShirt, gkShoulderStrap, gkTornBelt, gkSashRibbon);
  bodyGroup.add(gkTornShirt, gkShoulderStrap, gkTornBelt, gkSashRibbon);

  // 9. DARK KNIGHT SUIT (Slate-Blue Pointed Cowl, White Slit Eyes, Gold-Rimmed Bat Chest Crest, Segmented Belt, Fin Gauntlets)
  const darkKnightHeadGroup = new THREE.Group();
  bodyGroup.add(darkKnightHeadGroup);
  const darkKnightGearItems: THREE.Object3D[] = [];

  const dkSlateMat = new THREE.MeshStandardMaterial({ color: '#1e354d', roughness: 0.44, metalness: 0.2 });
  const dkGoldMat = new THREE.MeshStandardMaterial({ color: '#c49d62', roughness: 0.28, metalness: 0.72 });
  const dkPouchBlackMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.55, metalness: 0.18 });
  const dkWhiteEyeMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    emissive: '#e2e8f0',
    emissiveIntensity: 0.65,
    roughness: 0.15,
  });
  const dkSeamMat = new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 0.4 });

  const dkCowlDome = new THREE.Mesh(new THREE.SphereGeometry(0.172, 20, 16), dkSlateMat);
  dkCowlDome.scale.set(0.93, 1.04, 0.98);
  dkCowlDome.position.set(0, 1.71, -0.008);
  dkCowlDome.castShadow = !isNpc;
  const dkCowlJaw = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.1, 0.14), skinMat);
  dkCowlJaw.position.set(0, 1.595, 0.048);
  const dkCowlMaskLower = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.14, 0.13), dkSlateMat);
  dkCowlMaskLower.position.set(0, 1.63, -0.045);
  const dkBrowPlate = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.042, 0.08), dkSlateMat);
  dkBrowPlate.position.set(0, 1.735, 0.12);
  const dkMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.007, 0.01),
    new THREE.MeshStandardMaterial({ color: '#8f5549', roughness: 0.6 })
  );
  dkMouth.position.set(0, 1.588, 0.12);
  const dkNeckCowl = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.125, 0.16, 14), dkSlateMat);
  dkNeckCowl.position.set(0, 1.495, -0.01);
  darkKnightHeadGroup.add(dkCowlDome, dkCowlJaw, dkCowlMaskLower, dkBrowPlate, dkMouth, dkNeckCowl);

  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.125, 6), dkSlateMat);
    ear.position.set(side * 0.115, 1.885, -0.015);
    ear.rotation.z = side * -0.06;
    const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.013, 0.016), dkWhiteEyeMat);
    eyeSlit.position.set(side * 0.055, 1.702, 0.145);
    eyeSlit.rotation.z = side * 0.2;
    darkKnightHeadGroup.add(ear, eyeSlit);
  }

  // Draped Slate-Blue Shoulder Cowl Mantle + Armor Piping + Gold-Rimmed Bat Chest Emblem + Utility Belt
  const dkShoulderMantle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.36, 0.22, 16, 1, false, 0, Math.PI * 2),
    dkSlateMat
  );
  dkShoulderMantle.scale.set(1.22, 1, 0.72);
  dkShoulderMantle.position.set(0, 1.41, -0.02);
  dkShoulderMantle.castShadow = !isNpc;
  darkKnightGearItems.push(dkShoulderMantle);
  bodyGroup.add(dkShoulderMantle);

  const dkCrestMat = textures?.darkKnightEmblem
    ? new THREE.MeshStandardMaterial({
        map: textures.darkKnightEmblem,
        transparent: true,
        alphaTest: 0.25,
        roughness: 0.34,
        metalness: 0.35,
      })
    : dkGoldMat;
  const dkChestCrest = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.14), dkCrestMat);
  dkChestCrest.position.set(0, 1.255, 0.168);
  darkKnightGearItems.push(dkChestCrest);
  bodyGroup.add(dkChestCrest);

  for (const side of [-1, 1]) {
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.26, 0.012), dkSeamMat);
    seam.position.set(side * 0.095, 1.07, 0.16);
    seam.rotation.z = side * 0.25;
    darkKnightGearItems.push(seam);
    bodyGroup.add(seam);
  }

  const dkBeltBand = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.222, 0.088, 14), dkGoldMat);
  dkBeltBand.scale.set(1.22, 1, 0.8);
  dkBeltBand.position.set(0, 0.89, 0);
  const dkBeltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.092, 0.028), dkGoldMat);
  dkBeltBuckle.position.set(0, 0.89, 0.172);
  const dkBuckleInner = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.068, 0.032), dkPouchBlackMat);
  dkBuckleInner.position.set(0, 0.89, 0.173);
  darkKnightGearItems.push(dkBeltBand, dkBeltBuckle, dkBuckleInner);
  bodyGroup.add(dkBeltBand, dkBeltBuckle, dkBuckleInner);

  for (let pIdx = -3; pIdx <= 3; pIdx++) {
    if (pIdx === 0) continue;
    const ang = pIdx * 0.38;
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.078, 0.034), dkPouchBlackMat);
    pouch.position.set(Math.sin(ang) * 0.255, 0.89, Math.cos(ang) * 0.175);
    pouch.rotation.y = ang;
    darkKnightGearItems.push(pouch);
    bodyGroup.add(pouch);
  }

  // 10. DESERT COMMANDO RIG (Black Mask, Blonde Buzzcut, Black Tee, Brown Leather Harness, Camo Pants, Slung Camo Rifle & Knife)
  const desertHeadGroup = new THREE.Group();
  bodyGroup.add(desertHeadGroup);
  const desertGearItems: THREE.Object3D[] = [];

  const dcBlondeMat = new THREE.MeshStandardMaterial({ color: '#cbb082', roughness: 0.78, metalness: 0.04 });
  const dcMaskMat = new THREE.MeshStandardMaterial({ color: '#141519', roughness: 0.85, metalness: 0.04 });
  const dcLeatherMat = new THREE.MeshStandardMaterial({ color: '#7d5233', roughness: 0.62, metalness: 0.1 });
  const dcTanBeltMat = new THREE.MeshStandardMaterial({ color: '#bfa17a', roughness: 0.72, metalness: 0.06 });
  const dcTanBootMat = new THREE.MeshStandardMaterial({ color: '#be8954', roughness: 0.76, metalness: 0.05 });
  const dcTeeBlackMat = new THREE.MeshStandardMaterial({ color: '#111216', roughness: 0.84, metalness: 0.03 });
  const dcTribalMat = new THREE.MeshStandardMaterial({ color: '#1f2937', roughness: 0.8 });

  const dcCranium = new THREE.Mesh(new THREE.SphereGeometry(0.162, 18, 14), skinMat);
  dcCranium.scale.set(0.92, 1.06, 0.96);
  dcCranium.position.set(0, 1.685, 0);
  dcCranium.castShadow = !isNpc;
  const dcBuzzCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.166, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    dcBlondeMat
  );
  dcBuzzCap.scale.set(0.92, 1.02, 0.98);
  dcBuzzCap.position.set(0, 1.725, -0.015);
  dcBuzzCap.rotation.x = -0.22;

  const dcBandanaCone = new THREE.Mesh(new THREE.CylinderGeometry(0.148, 0.125, 0.165, 14), dcMaskMat);
  dcBandanaCone.scale.set(0.95, 1, 1.02);
  dcBandanaCone.position.set(0, 1.605, 0.025);
  const dcBandanaTip = new THREE.Mesh(new THREE.ConeGeometry(0.082, 0.12, 6), dcMaskMat);
  dcBandanaTip.position.set(0, 1.64, 0.115);
  dcBandanaTip.rotation.x = 0.25;
  desertHeadGroup.add(dcCranium, dcBuzzCap, dcBandanaCone, dcBandanaTip);

  for (const side of [-1, 1]) {
    const dcEar = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), skinMat);
    dcEar.scale.set(0.45, 1.0, 0.65);
    dcEar.position.set(side * 0.148, 1.675, -0.01);
    const dcSclera = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 8), eyeWhiteMat);
    dcSclera.position.set(side * 0.054, 1.706, 0.136);
    const dcIris = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), irisMat);
    dcIris.position.set(side * 0.054, 1.706, 0.148);
    const dcBrow = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.011, 0.016), dcBlondeMat);
    dcBrow.position.set(side * 0.054, 1.732, 0.142);
    desertHeadGroup.add(dcEar, dcSclera, dcIris, dcBrow);
  }

  // Brown Leather Chest Harness + Buckles + Tan Utility Belt + Pouches + Back-Slung Camo Rifle & Knife
  for (const side of [-1, 1]) {
    const shoulderStrap = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.52, 0.34), dcLeatherMat);
    shoulderStrap.position.set(side * 0.11, 1.24, 0.0);
    desertGearItems.push(shoulderStrap);
    bodyGroup.add(shoulderStrap);
  }
  for (const cy of [1.31, 1.07]) {
    const chestCross = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.044, 0.33), dcLeatherMat);
    chestCross.position.set(0, cy, 0.0);
    const chestBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.052, 0.03), buckleMat);
    chestBuckle.position.set(0, cy, 0.165);
    desertGearItems.push(chestCross, chestBuckle);
    bodyGroup.add(chestCross, chestBuckle);
  }

  const dcWaistBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.222, 0.222, 0.075, 14), dcTanBeltMat);
  dcWaistBelt.scale.set(1.2, 1, 0.78);
  dcWaistBelt.position.set(0, 0.875, 0);
  const dcBeltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.072, 0.025), buckleMat);
  dcBeltBuckle.position.set(0, 0.875, 0.168);
  const dcHipPouch1 = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.11, 0.095), dcTanBeltMat);
  dcHipPouch1.position.set(-0.26, 0.86, 0.04);
  const dcHipPouch2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.075), dcTanBeltMat);
  dcHipPouch2.position.set(-0.24, 0.86, -0.06);
  desertGearItems.push(dcWaistBelt, dcBeltBuckle, dcHipPouch1, dcHipPouch2);
  bodyGroup.add(dcWaistBelt, dcBeltBuckle, dcHipPouch1, dcHipPouch2);

  // Back-Slung Desert Camo Rifle & Survival Knife Sheath (on character's back)
  const dcRifleStock = new THREE.Mesh(
    new THREE.BoxGeometry(0.046, 0.34, 0.09),
    textures?.desertCamo
      ? new THREE.MeshStandardMaterial({ map: textures.desertCamo.map, roughness: 0.65 })
      : dcTanBeltMat
  );
  dcRifleStock.position.set(0.14, 1.56, -0.2);
  dcRifleStock.rotation.z = -0.22;
  const dcGunSteelMat = new THREE.MeshStandardMaterial({ color: '#27272a', roughness: 0.34, metalness: 0.78 });
  const dcRifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.66, 8), dcGunSteelMat);
  dcRifleBarrel.position.set(0.07, 1.18, -0.2);
  dcRifleBarrel.rotation.z = -0.22;
  const dcRifleHolsterLoop = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.12, 0.06), dcLeatherMat);
  dcRifleHolsterLoop.position.set(0.11, 1.32, -0.19);
  dcRifleHolsterLoop.rotation.z = -0.22;
  const dcBackKnifeSheath = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.28, 0.034), dcTanBeltMat);
  dcBackKnifeSheath.position.set(-0.11, 1.24, -0.19);
  dcBackKnifeSheath.rotation.z = 0.24;
  const dcBackKnifeGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.12, 8), bootMat);
  dcBackKnifeGrip.position.set(-0.15, 1.41, -0.19);
  dcBackKnifeGrip.rotation.z = 0.24;
  desertGearItems.push(dcRifleStock, dcRifleBarrel, dcRifleHolsterLoop, dcBackKnifeSheath, dcBackKnifeGrip);
  bodyGroup.add(dcRifleStock, dcRifleBarrel, dcRifleHolsterLoop, dcBackKnifeSheath, dcBackKnifeGrip);

  // Articulated Arms + Tactical Pistol in Right Hand + Hero Sleeves/Wristbands
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

    // Sunburst 3/4 flared white cardigan sleeve + bare tanned lower forearm
    const sbShortSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.098, 0.22, 10), sunburstWhiteMat);
    sbShortSleeve.position.y = -0.12;
    const sbForearmSkin = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.2, 4, 8), skinMat);
    sbForearmSkin.position.y = -0.31;
    sunburstGearItems.push(sbShortSleeve, sbForearmSkin);

    // Naruto Sage Cloak wide crimson sleeves + Tracksuit black/orange sleeve
    const nrSageSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.115, 0.34, 10), narutoSageCoatMat);
    nrSageSleeve.position.y = -0.18;
    narutoSageItems.push(nrSageSleeve);
    const nrTrackSleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.076, 0.33, 4, 10), narutoTrackBlackMat);
    nrTrackSleeve.position.y = -0.19;
    narutoTrackItems.push(nrTrackSleeve);
    if (side === -1) {
      const miniScroll = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.075), narutoScrollTanMat);
      miniScroll.position.set(-0.078, -0.12, 0);
      narutoTrackItems.push(miniScroll);
      armPivot.add(miniScroll);
    }

    // Goku Bare Muscular Arm + Navy Fabric Wristband
    const gkBareArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.34, 6, 10), skinMat);
    gkBareArm.position.y = -0.2;
    gkBareArm.castShadow = !isNpc;
    const gkWristband = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.074, 0.11, 10), gokuBlueMat);
    gkWristband.position.y = -0.33;
    gokuGearItems.push(gkBareArm, gkWristband);

    // Dark Knight Slate-Blue Forearm Gauntlets with 3 Forearm Scallop Fins + Armored Gloves
    const dkGauntlet = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.076, 0.24, 10), dkSlateMat);
    dkGauntlet.position.y = -0.28;
    const dkGlove = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 8), dkSlateMat);
    dkGlove.position.y = -0.45;
    darkKnightGearItems.push(dkGauntlet, dkGlove);
    for (let f = 0; f < 3; f++) {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.062, 4), dkSlateMat);
      fin.position.set(side * 0.088, -0.21 - f * 0.055, -0.02);
      fin.rotation.z = side * -1.15;
      darkKnightGearItems.push(fin);
      armPivot.add(fin);
    }

    // Desert Commando Short Black T-Shirt Sleeve + Bare Forearm + Tribal Tattoo Band + Fingerless Tactical Glove
    const dcTeeSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.084, 0.18, 10), dcTeeBlackMat);
    dcTeeSleeve.position.y = -0.09;
    const dcBareForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.22, 4, 8), skinMat);
    dcBareForearm.position.y = -0.28;
    const dcGlove = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.062, 0.095, 10), dcMaskMat);
    dcGlove.position.y = -0.42;
    desertGearItems.push(dcTeeSleeve, dcBareForearm, dcGlove);
    if (side === 1) {
      const dcTribal = new THREE.Mesh(new THREE.CylinderGeometry(0.067, 0.065, 0.044, 10), dcTribalMat);
      dcTribal.position.y = -0.25;
      desertGearItems.push(dcTribal);
      armPivot.add(dcTribal);
    }

    armPivot.add(
      sleeve,
      hand,
      forearmBlack,
      redGlove,
      sbShortSleeve,
      sbForearmSkin,
      nrSageSleeve,
      nrTrackSleeve,
      gkBareArm,
      gkWristband,
      dkGauntlet,
      dkGlove,
      dcTeeSleeve,
      dcBareForearm,
      dcGlove
    );
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

  // MP5-K Tactical Suppressed SMG
  const smgGroup = new THREE.Group();
  const smgBody = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.076, 0.36), gunSteelMat);
  smgBody.position.set(0, 0.02, 0.12);
  const smgSuppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.26, 10), bootMat);
  smgSuppressor.rotation.x = Math.PI / 2;
  smgSuppressor.position.set(0, 0.024, 0.42);
  const smgStickMag = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.19, 0.048), bootMat);
  smgStickMag.position.set(0, -0.09, 0.18);
  smgStickMag.rotation.x = 0.24;
  const smgForegrip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.09, 0.04), bootMat);
  smgForegrip.position.set(0, -0.055, 0.28);
  const smgHolo = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.07), pistolTanMat);
  smgHolo.position.set(0, 0.076, 0.1);
  smgGroup.add(smgBody, smgSuppressor, smgStickMag, smgForegrip, smgHolo);

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

  // Solaris RPG-7 Rocket Launcher
  const rpgGroup = new THREE.Group();
  const rpgOliveMat = new THREE.MeshStandardMaterial({ color: '#4d5d3f', roughness: 0.48, metalness: 0.35 });
  const rpgWarheadMat = new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.4, metalness: 0.3 });
  const rpgTube = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.96, 12), rpgOliveMat);
  rpgTube.rotation.x = Math.PI / 2;
  rpgTube.position.set(0, 0.06, 0.18);
  const rpgShield = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.054, 0.32, 12), hatCordMat);
  rpgShield.rotation.x = Math.PI / 2;
  rpgShield.position.set(0, 0.06, 0.12);
  const rpgBell = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.064, 0.14, 12), gunSteelMat);
  rpgBell.rotation.x = Math.PI / 2;
  rpgBell.position.set(0, 0.06, -0.35);
  const rpgWarhead = new THREE.Mesh(new THREE.ConeGeometry(0.062, 0.28, 12), rpgWarheadMat);
  rpgWarhead.rotation.x = Math.PI / 2;
  rpgWarhead.position.set(0, 0.06, 0.78);
  const rpgGrip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.12, 0.05), bootMat);
  rpgGrip.position.set(0, -0.02, 0.18);
  rpgGroup.add(rpgTube, rpgShield, rpgBell, rpgWarhead, rpgGrip);

  // Medieval Steel Forged Broadsword (Fullered Steel Blade, Crossguard, Ribbed Leather Grip, Steel Pommel)
  const swordGroup = new THREE.Group();
  const swordSteelMat = new THREE.MeshStandardMaterial({
    color: '#d4d8df',
    roughness: 0.2,
    metalness: 0.92,
  });
  const swordFullerMat = new THREE.MeshStandardMaterial({
    color: '#64748b',
    roughness: 0.4,
    metalness: 0.8,
  });
  const swordGuardMat = new THREE.MeshStandardMaterial({
    color: '#9ca3af',
    roughness: 0.34,
    metalness: 0.84,
  });
  const swordGripMat = new THREE.MeshStandardMaterial({
    color: '#5b2b1d',
    roughness: 0.78,
    metalness: 0.08,
  });

  // Tapered Double-Edged Blade along +Z
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.028, 0);
  bladeShape.lineTo(0.028, 0);
  bladeShape.lineTo(0.017, 0.72);
  bladeShape.lineTo(0, 0.9);
  bladeShape.lineTo(-0.017, 0.72);
  bladeShape.closePath();
  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 1,
  });
  bladeGeo.translate(0, 0, -0.006);
  bladeGeo.rotateX(Math.PI / 2);
  const bladeMesh = new THREE.Mesh(bladeGeo, swordSteelMat);
  bladeMesh.position.set(0, 0, 0.12);
  swordGroup.add(bladeMesh);

  // Center fuller groove strip
  const fullerStrip = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.023, 0.56), swordFullerMat);
  fullerStrip.position.set(0, 0, 0.43);
  swordGroup.add(fullerStrip);

  // Steel Crossguard with flared tips
  const crossBar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.026, 0.03), swordGuardMat);
  crossBar.position.set(0, 0, 0.11);
  swordGroup.add(crossBar);
  for (const side of [-1, 1]) {
    const tipCap = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.036, 0.04), swordGuardMat);
    tipCap.position.set(side * 0.145, 0, 0.11);
    swordGroup.add(tipCap);
  }

  // Ribbed Brown Leather Grip + Cord Rings
  const gripCore = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.021, 0.22, 10), swordGripMat);
  gripCore.rotation.x = Math.PI / 2;
  gripCore.position.set(0, 0, -0.01);
  swordGroup.add(gripCore);
  for (let r = 0; r < 7; r++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.004, 6, 12), swordGripMat);
    rib.position.set(0, 0, -0.09 + r * 0.027);
    swordGroup.add(rib);
  }

  // Weighted Rounded Disc Pommel
  const pommelCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.034, 0.032, 12), swordGuardMat);
  pommelCollar.rotation.x = Math.PI / 2;
  pommelCollar.position.set(0, 0, -0.13);
  const pommelDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.034, 16), swordGuardMat);
  pommelDisc.position.set(0, 0, -0.16);
  swordGroup.add(pommelCollar, pommelDisc);

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
  smgGroup.visible = false;
  rifleGroup.visible = false;
  shotgunGroup.visible = false;
  rpgGroup.visible = false;
  swordGroup.visible = false;
  weaponAnchor.add(pistolGroup, smgGroup, rifleGroup, shotgunGroup, rpgGroup, swordGroup);
  rightArm.add(weaponAnchor);

  // Articulated Legs + Tactical Pads/Holster + Academy Stockings + Paragon Crimson Boots/Trunks
  const tacticalLegItems: THREE.Object3D[] = [];
  const academyStockings: THREE.Object3D[] = [];
  const casualLegMeshes: THREE.Mesh[] = [];
  const standardBootItems: THREE.Object3D[] = [];

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
    standardBootItems.push(bootShaft, bootFoot, sole);

    const redShin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.082, 0.3, 10), suitRedMat);
    redShin.position.set(0, -0.62, 0);
    const redFoot = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.115, 0.285), suitRedMat);
    redFoot.position.set(0, -0.77, 0.045);
    arachnidGearItems.push(redShin, redFoot);

    // Paragon Crimson Brief Upper-Thighs + Tall Crimson Mid-Calf Boots
    const pBriefLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.106, 0.102, 0.15, 12), suitRedMat);
    pBriefLeg.position.set(0, -0.05, 0);
    const pBootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.084, 0.42, 12), suitRedMat);
    pBootShaft.position.set(0, -0.535, 0);
    const pBootCuff = new THREE.Mesh(new THREE.TorusGeometry(0.092, 0.015, 6, 14), suitRedMat);
    pBootCuff.rotation.x = Math.PI / 2 + 0.16;
    pBootCuff.position.set(0, -0.33, 0.005);
    const pBootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.118, 0.29), suitRedMat);
    pBootFoot.position.set(0, -0.768, 0.045);
    const pBootSole = new THREE.Mesh(new THREE.BoxGeometry(0.172, 0.028, 0.298), paragonCapeMat);
    pBootSole.position.set(0, -0.825, 0.045);
    paragonGearItems.push(pBriefLeg, pBootShaft, pBootCuff, pBootFoot, pBootSole);

    // Sunburst White Calf-Length Cloud-Cuffed Shorts + Bare Calves + Sandals
    const sbShorts = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.132, 0.42, 12), sunburstWhiteMat);
    sbShorts.position.set(0, -0.22, 0);
    const sbCloudCuff = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.026, 7, 14), sunburstWhiteMat);
    sbCloudCuff.rotation.x = Math.PI / 2;
    sbCloudCuff.position.set(0, -0.43, 0);
    const sbBareCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.052, 0.34, 10), skinMat);
    sbBareCalf.position.set(0, -0.6, 0);
    const sbBareFoot = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.08, 0.25), skinMat);
    sbBareFoot.position.set(0, -0.77, 0.045);
    const sbSandalSole = new THREE.Mesh(new THREE.BoxGeometry(0.158, 0.034, 0.275), sandalSoleMat);
    sbSandalSole.position.set(0, -0.822, 0.045);
    const sbSandalStrap = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.022, 0.06), bootMat);
    sbSandalStrap.position.set(0, -0.735, 0.09);
    sunburstGearItems.push(sbShorts, sbCloudCuff, sbBareCalf, sbBareFoot, sbSandalSole, sbSandalStrap);

    // Naruto Orange Shinobi Pants + Right-Leg Bandage & Kunai Holster + Navy Shinobi Sandals
    const nrLegPants = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.44, 4, 10), narutoTrackOrangeMat);
    nrLegPants.position.y = -0.32;
    nrLegPants.castShadow = !isNpc;
    const nrSandalShoe = new THREE.Mesh(new THREE.BoxGeometry(0.158, 0.115, 0.275), gokuNavyBootMat);
    nrSandalShoe.position.set(0, -0.768, 0.045);
    const nrSandalToes = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.065, 0.08), skinMat);
    nrSandalToes.position.set(0, -0.785, 0.17);
    narutoSageItems.push(nrLegPants, nrSandalShoe, nrSandalToes);
    narutoTrackItems.push(nrLegPants, nrSandalShoe, nrSandalToes);
    if (side === 1) {
      const legBandage = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.104, 0.14, 10), whiteTrimMat);
      legBandage.position.set(0, -0.24, 0);
      const kunaiHolster = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.09), strapMat);
      kunaiHolster.position.set(0.112, -0.24, 0);
      narutoSageItems.push(legBandage, kunaiHolster);
      narutoTrackItems.push(legBandage, kunaiHolster);
      legPivot.add(legBandage, kunaiHolster);
    }

    // Goku Battle-Damaged Orange Martial Pants + Exposed Torn Knees + Navy Boots & Yellow Trim
    const gkUpperPants = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.142, 0.34, 12), gokuOrangeMat);
    gkUpperPants.position.set(0, -0.18, 0);
    const gkKneeSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.084, 0.18, 10), skinMat);
    gkKneeSkin.position.set(0, -0.4, 0);
    const gkLowerCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.11, 0.14, 10), gokuOrangeMat);
    gkLowerCuff.position.set(0, -0.5, 0);
    const gkBootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.088, 0.24, 12), gokuNavyBootMat);
    gkBootShaft.position.set(0, -0.66, 0);
    const gkBootStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.036, 12), gokuBootCordMat);
    gkBootStrap.position.set(0, -0.59, 0);
    const gkBootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.166, 0.118, 0.295), gokuNavyBootMat);
    gkBootFoot.position.set(0, -0.77, 0.048);
    gokuGearItems.push(gkUpperPants, gkKneeSkin, gkLowerCuff, gkBootShaft, gkBootStrap, gkBootFoot);

    // Dark Knight Slate-Blue Armored Boots
    const dkBootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.086, 0.38, 12), dkSlateMat);
    dkBootShaft.position.set(0, -0.54, 0);
    const dkBootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.166, 0.12, 0.295), dkSlateMat);
    dkBootFoot.position.set(0, -0.768, 0.046);
    const dkBootSole = new THREE.Mesh(new THREE.BoxGeometry(0.174, 0.028, 0.302), dkPouchBlackMat);
    dkBootSole.position.set(0, -0.825, 0.046);
    darkKnightGearItems.push(dkBootShaft, dkBootFoot, dkBootSole);

    // Desert Commando Cargo Thigh Pockets & Tan Timber-Style Boots
    const dcCargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.16, 0.115), pantsMat);
    dcCargoPocket.position.set(side * 0.105, -0.26, 0.0);
    const dcBootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.092, 0.2, 10), dcTanBootMat);
    dcBootShaft.position.set(0, -0.66, 0);
    const dcBootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.164, 0.118, 0.29), dcTanBootMat);
    dcBootFoot.position.set(0, -0.768, 0.046);
    const dcBootSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.174, 0.032, 0.302),
      new THREE.MeshStandardMaterial({ color: '#78502e', roughness: 0.9 })
    );
    dcBootSole.position.set(0, -0.824, 0.046);
    desertGearItems.push(dcCargoPocket, dcBootShaft, dcBootFoot, dcBootSole);

    legPivot.add(
      legMesh,
      kneePad,
      upperThigh,
      stockingShaft,
      bootShaft,
      bootFoot,
      sole,
      redShin,
      redFoot,
      pBriefLeg,
      pBootShaft,
      pBootCuff,
      pBootFoot,
      pBootSole,
      sbShorts,
      sbCloudCuff,
      sbBareCalf,
      sbBareFoot,
      sbSandalSole,
      sbSandalStrap,
      nrLegPants,
      nrSandalShoe,
      nrSandalToes,
      gkUpperPants,
      gkKneeSkin,
      gkLowerCuff,
      gkBootShaft,
      gkBootStrap,
      gkBootFoot,
      dkBootShaft,
      dkBootFoot,
      dkBootSole,
      dcCargoPocket,
      dcBootShaft,
      dcBootFoot,
      dcBootSole
    );
    bodyGroup.add(legPivot);
    return legPivot;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  const applyOutfit = (targetOutfitId: string, texBundle?: CharacterTextureBundle) => {
    const o = PLAYER_OUTFITS.find((x) => x.id === targetOutfitId) ?? PLAYER_OUTFITS[0];
    const isGoku = o.id === 'goku_damaged_gi';
    const isNarutoSage = o.id === 'naruto_sage_cloak';
    const isNarutoTrack = o.id === 'naruto_tracksuit';
    const isNaruto = isNarutoSage || isNarutoTrack;
    const isSunburst = o.id === 'sunburst_nika';
    const isParagon = o.id === 'paragon_suit';
    const isDarkKnight = o.id === 'dark_knight';
    const isDesert = o.id === 'desert_commando';
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
      isDesert && texBundle?.desertCamo
        ? texBundle.desertCamo.map
        : isTac && texBundle?.camo
          ? texBundle.camo.map
          : isHoodie && texBundle?.denim
            ? texBundle.denim.map
            : null;
    pantsMat.normalMap =
      isDesert && texBundle?.desertCamo
        ? texBundle.desertCamo.normalMap
        : isTac && texBundle?.camo
          ? texBundle.camo.normalMap
          : isHoodie && texBundle?.denim
            ? texBundle.denim.normalMap
            : null;
    pantsMat.color.set(
      isDesert && texBundle?.desertCamo
        ? '#ffffff'
        : isTac
          ? '#f4f4f0'
          : isHoodie && texBundle?.denim
            ? '#ffffff'
            : o.pantsColor
    );
    pantsMat.needsUpdate = true;

    hairMat.color.set(o.hairColor);
    skinMat.color.set(o.skinTone);

    const hideBaseTorso = isSunburst || isGoku || isNaruto;
    const hideBaseHead = isParagon || isDarkKnight || isDesert || isArachnid || isSunburst || isGoku || isNaruto;
    torso.visible = !hideBaseTorso;
    tacticalGearGroup.visible = isTac;
    tacticalLegItems.forEach((item) => (item.visible = isTac));
    hoodieGearGroup.visible = isHoodie;
    academyGearGroup.visible = isAcademy;
    academyStockings.forEach((item) => (item.visible = isAcademy));
    casualLegMeshes.forEach((m) => (m.visible = !isAcademy && !isSunburst && !isGoku && !isNaruto));
    arachnidMaskGroup.visible = isArachnid;
    arachnidGearItems.forEach((item) => (item.visible = isArachnid));
    paragonHeadGroup.visible = isParagon;
    paragonGearItems.forEach((item) => (item.visible = isParagon));
    darkKnightHeadGroup.visible = isDarkKnight;
    darkKnightGearItems.forEach((item) => (item.visible = isDarkKnight));
    desertHeadGroup.visible = isDesert;
    desertGearItems.forEach((item) => (item.visible = isDesert));
    capeTopPivot.visible = isParagon || isDarkKnight;
    paragonCapeMeshes.forEach((m) => (m.visible = isParagon));
    darkKnightCapeMeshes.forEach((m) => (m.visible = isDarkKnight));
    sunburstHeadGroup.visible = isSunburst;
    sunburstCloudRing.visible = isSunburst;
    sunburstGearItems.forEach((item) => (item.visible = isSunburst));

    narutoHeadGroup.visible = isNaruto;
    narutoSageItems.forEach((item) => (item.visible = isNarutoSage));
    narutoTrackItems.forEach((item) => (item.visible = isNarutoTrack));
    // Shared Naruto leg items belong to both arrays; ensure track-only/sage-only parts respect mode
    if (isNaruto) {
      narutoSageItems.forEach((item) => {
        if (narutoTrackItems.includes(item)) item.visible = true;
      });
    }

    gokuHeadGroup.visible = isGoku;
    gokuGearItems.forEach((item) => (item.visible = isGoku));

    // Toggle base arm sleeve visibility when custom anime arms replace them
    for (const arm of [leftArm, rightArm]) {
      const baseSleeve = arm.children[0];
      const baseHand = arm.children[1];
      if (baseSleeve) baseSleeve.visible = !isSunburst && !isGoku && !isNaruto && !isDesert;
      if (baseHand) baseHand.visible = !isArachnid && !isDarkKnight;
    }

    standardBootItems.forEach(
      (item) => (item.visible = !isArachnid && !isParagon && !isDarkKnight && !isDesert && !isSunburst && !isGoku && !isNaruto)
    );

    head.visible = !hideBaseHead;
    baseFaceGroup.visible = !hideBaseHead;
    hairMesh.visible = !isTac && !isHoodie && !isAcademy && !hideBaseHead;
    if (shadesMesh) {
      shadesMesh.visible = !isTac && !isHoodie && !isAcademy && !hideBaseHead;
    }
    collar.visible = !isAcademy && !hideBaseHead && !isDarkKnight && !isDesert;
    belt.visible = !isAcademy && !hideBaseHead && !isDarkKnight && !isDesert;
  };

  const setWeapon = (weaponId: WeaponId) => {
    if (isNpc) return;
    pistolGroup.visible = weaponId === 'pistol';
    smgGroup.visible = weaponId === 'smg';
    rifleGroup.visible = weaponId === 'rifle';
    shotgunGroup.visible = weaponId === 'shotgun';
    rpgGroup.visible = weaponId === 'rpg';
    swordGroup.visible = weaponId === 'sword';
    if (muzzleSprite) {
      muzzleSprite.position.z =
        weaponId === 'pistol'
          ? 0.24
          : weaponId === 'smg'
            ? 0.56
            : weaponId === 'rpg'
              ? 0.92
              : weaponId === 'rifle'
                ? 0.74
                : 0.7;
    }
  };

  applyOutfit(outfitId, textures);

  return {
    group,
    bodyGroup,
    shadowPlane,
    head,
    baseFaceGroup,
    paragonHeadGroup,
    sunburstHeadGroup,
    sunburstCloudRing,
    narutoHeadGroup,
    gokuHeadGroup,
    darkKnightHeadGroup,
    desertHeadGroup,
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
    paragonGearItems,
    darkKnightGearItems,
    desertGearItems,
    sunburstGearItems,
    narutoSageItems,
    narutoTrackItems,
    gokuGearItems,
    capeTopPivot,
    capeBottomPivot,
    paragonCapeMeshes,
    darkKnightCapeMeshes,
    hairMesh,
    shadesMesh,
    pistolGroup,
    smgGroup,
    rifleGroup,
    shotgunGroup,
    rpgGroup,
    swordGroup,
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
  glowSpriteTex?: THREE.Texture,
  vehicleTextures?: VehicleDecalBundle
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
  let horseLegs: THREE.Group[] | undefined;
  let horseTailPivot: THREE.Group | undefined;
  let horseNeckPivot: THREE.Group | undefined;

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

    if (specId === 'skyline_r34') caliperMat.color.set('#ea580c');
    const caliper = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.65, radius * 0.34, radius * 0.24),
      caliperMat
    );
    caliper.position.set(0, radius * 0.26, -radius * 0.22);
    steerGroup.add(caliper); // caliper stays fixed relative to steering knuckle!

    // 5-Spoke Alloy Rim (Deep-Dish Chrome Lip + Black/Gunmetal Spokes on Sovereign M5 & Skyline R34)
    const isSovereignRim = specId === 'sovereign_gt';
    const isSkylineRim = specId === 'skyline_r34';
    if (isSovereignRim || isSkylineRim) {
      const outerLip = new THREE.Mesh(
        new THREE.TorusGeometry(radius * 0.66, 0.032, 8, 18),
        chromeMat
      );
      outerLip.rotation.y = Math.PI / 2;
      outerLip.position.x = x < 0 ? -width * 0.5 : width * 0.5;
      spinGroup.add(outerLip);
    }
    const spokeCount = isSkylineRim ? 6 : 5;
    const spokeMat = isSkylineRim
      ? new THREE.MeshStandardMaterial({ color: '#3f444e', roughness: 0.32, metalness: 0.72 })
      : isSovereignRim
        ? trimMat
        : chromeMat;
    for (let s = 0; s < spokeCount; s++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.025, radius * 1.24, 0.052),
        spokeMat
      );
      spoke.rotation.x = (s * Math.PI) / spokeCount;
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

  if (specId === 'tiger_tank') {
    const tankMat = new THREE.MeshStandardMaterial({
      color: '#c2b280',
      roughness: 0.62,
      metalness: 0.28,
    });
    const trackMat = new THREE.MeshStandardMaterial({
      color: '#181716',
      roughness: 0.85,
      metalness: 0.35,
    });
    const wheelMat = new THREE.MeshStandardMaterial({
      color: '#8b8060',
      roughness: 0.58,
    });
    const barrelMat = new THREE.MeshStandardMaterial({
      color: '#474542',
      roughness: 0.32,
      metalness: 0.8,
    });

    // Lower hull tracks & interleaved road wheels
    const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.78, 5.4), tankMat);
    lowerHull.position.y = 0.58;
    lowerHull.castShadow = true;
    chassisGroup.add(lowerHull);

    for (const side of [-1, 1]) {
      const track = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.88, 5.6), trackMat);
      track.position.set(side * 1.65, 0.52, 0);
      chassisGroup.add(track);

      for (let i = -2.5; i <= 2.5; i += 1.0) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(side * 1.72, 0.42, i * 0.88);
        chassisGroup.add(wheel);
      }
    }

    // Upper sloped armored superstructure
    const upperHull = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.88, 4.4), tankMat);
    upperHull.position.set(0, 1.42, -0.15);
    upperHull.castShadow = true;
    chassisGroup.add(upperHull);

    // Rotating turret with cupola
    const turret = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.95, 2.4), tankMat);
    turret.position.set(0, 2.22, -0.25);
    turret.castShadow = true;
    chassisGroup.add(turret);

    const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.3, 14), tankMat);
    cupola.position.set(0.55, 2.82, -0.4);
    chassisGroup.add(cupola);

    // Long 88mm main gun barrel with muzzle brake
    const gunMantle = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.72, 0.82), barrelMat);
    gunMantle.position.set(0, 2.26, 1.25);
    const mainBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 3.6, 16), barrelMat);
    mainBarrel.rotation.x = Math.PI / 2;
    mainBarrel.position.set(0, 2.26, 3.05);
    const muzzleBrake = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 12), barrelMat);
    muzzleBrake.rotation.x = Math.PI / 2;
    muzzleBrake.position.set(0, 2.26, 4.75);
    chassisGroup.add(gunMantle, mainBarrel, muzzleBrake);
  } else if (vClass === 'motorcycle') {
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
  } else if (vClass === 'horse') {
    // Realistic Bay Chestnut Stallion (warm chestnut coat, dark points, forehead star, rear-left white sock, flowing mane & tail)
    bodyPaintMat.roughness = 0.54;
    bodyPaintMat.metalness = 0.04;
    bodyPaintMat.clearcoat = 0.12;
    const coatMat = bodyPaintMat;
    const darkBayMat = new THREE.MeshStandardMaterial({ color: '#5c2c12', roughness: 0.62 });
    const pointDarkMat = new THREE.MeshStandardMaterial({ color: '#1b130e', roughness: 0.72 });
    const hoofMat = new THREE.MeshStandardMaterial({ color: '#6b6357', roughness: 0.76 });
    const whiteMarkMat = new THREE.MeshStandardMaterial({ color: '#f4f4f5', roughness: 0.65 });
    const leatherMat = new THREE.MeshStandardMaterial({ color: '#3b2416', roughness: 0.55 });
    const eyeDarkMat = new THREE.MeshPhysicalMaterial({ color: '#09090b', roughness: 0.08, clearcoat: 1.0 });

    // Sculpted Muscular Torso: Barrel, Broad Chest/Shoulders, Rounded Croup/Hindquarters
    const barrel = new THREE.Mesh(new THREE.CapsuleGeometry(0.285, 0.86, 10, 16), coatMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.scale.set(0.84, 1.0, 1.04);
    barrel.position.set(0, 1.1, 0.02);
    barrel.castShadow = true;
    barrel.receiveShadow = true;

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 12), coatMat);
    chest.scale.set(0.86, 1.08, 0.96);
    chest.position.set(0, 1.14, 0.45);
    chest.castShadow = true;

    const croup = new THREE.Mesh(new THREE.SphereGeometry(0.315, 14, 12), coatMat);
    croup.scale.set(0.88, 1.04, 1.04);
    croup.position.set(0, 1.12, -0.44);
    croup.castShadow = true;

    // Withers crest & subtle riding girth pad
    const withers = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), coatMat);
    withers.scale.set(0.75, 0.9, 1.25);
    withers.position.set(0, 1.34, 0.34);

    const girthBand = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.12, 14), leatherMat);
    girthBand.rotation.x = Math.PI / 2;
    girthBand.scale.set(0.86, 1.0, 1.0);
    girthBand.position.set(0, 1.1, 0.08);
    const saddleBlanket = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.06, 0.54), leatherMat);
    saddleBlanket.position.set(0, 1.37, 0.04);

    chassisGroup.add(barrel, chest, croup, withers, girthBand, saddleBlanket);

    // Arched Neck, Flowing Dark Mane, Angular Head, Forehead White Star, Muzzle & Ears
    horseNeckPivot = new THREE.Group();
    horseNeckPivot.position.set(0, 1.22, 0.48);

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.245, 0.72, 12), coatMat);
    neckMesh.position.set(0, 0.26, 0.24);
    neckMesh.rotation.x = 0.62;
    neckMesh.scale.set(0.82, 1, 1.08);
    neckMesh.castShadow = true;
    horseNeckPivot.add(neckMesh);

    // Layered dark chocolate mane sweeping along left side of crest
    for (let m = 0; m < 6; m++) {
      const frac = m / 5;
      const maneLock = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.22 - frac * 0.04, 0.14), pointDarkMat);
      maneLock.position.set(-0.085, 0.16 + frac * 0.36, 0.02 + frac * 0.32);
      maneLock.rotation.x = 0.58;
      maneLock.rotation.z = 0.22;
      horseNeckPivot.add(maneLock);
    }

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.56, 0.45);
    headGroup.rotation.x = -0.58;

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), coatMat);
    cranium.scale.set(0.82, 0.96, 1.15);
    cranium.castShadow = true;
    const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.118, 0.38, 10), coatMat);
    bridge.rotation.x = Math.PI / 2;
    bridge.scale.set(0.86, 1, 0.92);
    bridge.position.set(0, -0.02, 0.21);
    bridge.castShadow = true;
    const jawCheek = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), darkBayMat);
    jawCheek.scale.set(0.92, 0.85, 0.9);
    jawCheek.position.set(0, -0.05, 0.04);
    const muzzleTip = new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), pointDarkMat);
    muzzleTip.scale.set(0.9, 0.86, 1.12);
    muzzleTip.position.set(0, -0.03, 0.39);
    // White diamond forehead star
    const starMark = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.052, 0.02), whiteMarkMat);
    starMark.position.set(0, 0.082, 0.115);
    starMark.rotation.z = Math.PI / 4;
    starMark.rotation.x = -0.22;
    // Forelock tuft
    const forelock = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.14, 5), pointDarkMat);
    forelock.position.set(0, 0.125, 0.08);
    forelock.rotation.x = Math.PI * 0.72;
    headGroup.add(cranium, bridge, jawCheek, muzzleTip, starMark, forelock);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.135, 6), coatMat);
      ear.position.set(side * 0.062, 0.155, -0.02);
      ear.rotation.z = -side * 0.18;
      ear.rotation.x = 0.18;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), eyeDarkMat);
      eye.position.set(side * 0.082, 0.035, 0.1);
      headGroup.add(ear, eye);
    }
    horseNeckPivot.add(headGroup);
    chassisGroup.add(horseNeckPivot);

    // Long Flowing Tail
    horseTailPivot = new THREE.Group();
    horseTailPivot.position.set(0, 1.24, -0.72);
    const tailUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 0.42, 8), pointDarkMat);
    tailUpper.position.set(0, -0.18, -0.06);
    tailUpper.rotation.x = 0.28;
    const tailLower = new THREE.Mesh(new THREE.ConeGeometry(0.115, 0.68, 8), pointDarkMat);
    tailLower.position.set(0, -0.58, -0.12);
    tailLower.rotation.x = Math.PI + 0.08;
    horseTailPivot.add(tailUpper, tailLower);
    chassisGroup.add(horseTailPivot);

    // 4 Articulated Anatomical Legs with Dark Points & Back-Left White Sock
    horseLegs = [];
    const legSpecs: Array<{ x: number; z: number; isFront: boolean }> = [
      { x: -0.165, z: 0.48, isFront: true },
      { x: 0.165, z: 0.48, isFront: true },
      { x: -0.175, z: -0.48, isFront: false },
      { x: 0.175, z: -0.48, isFront: false },
    ];
    for (const ls of legSpecs) {
      const legPivot = new THREE.Group();
      legPivot.position.set(ls.x, 0.96, ls.z);

      const upperLimb = new THREE.Mesh(
        new THREE.CylinderGeometry(ls.isFront ? 0.095 : 0.125, 0.058, 0.46, 10),
        coatMat
      );
      upperLimb.position.y = -0.21;
      upperLimb.rotation.x = ls.isFront ? 0.04 : -0.1;
      upperLimb.castShadow = true;

      const lowerCannon = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.48, 8), pointDarkMat);
      lowerCannon.position.set(0, -0.64, ls.isFront ? 0 : -0.03);
      lowerCannon.castShadow = true;

      // Signature white sock on back-left leg (x < 0 && !isFront) matching horse reference images
      if (!ls.isFront && ls.x < 0) {
        const whiteSock = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.046, 0.19, 8), whiteMarkMat);
        whiteSock.position.set(0, -0.78, -0.03);
        legPivot.add(whiteSock);
      }

      const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.064, 0.09, 10), hoofMat);
      hoof.position.set(0, -0.91, ls.isFront ? 0.01 : -0.02);

      legPivot.add(upperLimb, lowerCannon, hoof);
      chassisGroup.add(legPivot);
      horseLegs.push(legPivot);
    }
  } else if (vClass === 'helicopter') {
    // Sleek Pearl-White Bubble-Canopy Helicopter (Aerospatiale Gazelle style)
    const canopyGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#cbd5e1',
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.34,
    });
    const tanSeatMat = new THREE.MeshStandardMaterial({ color: '#d6be8a', roughness: 0.72 });

    // Sculpted Teardrop Mid/Aft Fuselage Pod + Belly Fairing
    const aftPod = new THREE.Mesh(new THREE.CapsuleGeometry(0.92, 1.45, 10, 18), bodyPaintMat);
    aftPod.rotation.x = Math.PI / 2;
    aftPod.scale.set(1.04, 1.0, 0.96);
    aftPod.position.set(0, 1.24, -0.05);
    aftPod.castShadow = true;
    chassisGroup.add(aftPod);

    const floorDeck = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 2.35), bodyPaintMat);
    floorDeck.position.set(0, 0.68, 0.9);
    chassisGroup.add(floorDeck);

    // Top Turbine Engine Nacelle + Oval Air Intake + Rear Exhaust Pipe
    const turbineCowling = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.3, 8, 14), bodyPaintMat);
    turbineCowling.rotation.x = Math.PI / 2;
    turbineCowling.position.set(0, 2.15, -0.55);
    turbineCowling.castShadow = true;
    const intakeRim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 14), trimMat);
    intakeRim.rotation.x = Math.PI / 2;
    intakeRim.position.set(0, 2.18, 0.25);
    const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.55, 12), chromeMat);
    exhaustPipe.rotation.x = Math.PI / 2;
    exhaustPipe.position.set(0, 2.15, -1.4);
    chassisGroup.add(turbineCowling, intakeRim, exhaustPipe);

    // Wrap-Around Curved Clear Bubble Canopy + Dark Mullion Frame + Visible Tan Bucket Seats
    const bubbleCanopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
      canopyGlassMat
    );
    bubbleCanopy.scale.set(0.98, 0.96, 1.28);
    bubbleCanopy.rotation.x = Math.PI * 0.42;
    bubbleCanopy.position.set(0, 1.28, 1.45);
    chassisGroup.add(bubbleCanopy);

    for (const side of [-1, 1]) {
      const archFrame = new THREE.Mesh(new THREE.TorusGeometry(0.94, 0.032, 6, 18, Math.PI * 0.85), trimMat);
      archFrame.position.set(side * 0.34, 1.26, 1.28);
      archFrame.rotation.y = Math.PI / 2 + side * 0.14;
      chassisGroup.add(archFrame);

      // Tan interior seats visible right through the glass bubble
      const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.44), tanSeatMat);
      seatBase.position.set(side * 0.34, 0.86, 1.15);
      const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.58, 0.11), tanSeatMat);
      seatBack.position.set(side * 0.34, 1.18, 0.92);
      seatBack.rotation.x = -0.14;
      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.1), tanSeatMat);
      headrest.position.set(side * 0.34, 1.52, 0.86);
      chassisGroup.add(seatBase, seatBack, headrest);
    }

    const consoleDash = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.38, 0.48), trimMat);
    consoleDash.position.set(0, 0.98, 1.72);
    chassisGroup.add(consoleDash);

    // Tapered Tailboom + Swept Vertical Fin + Ducted Fenestron Tail Rotor Shroud + Horizontal Winglets
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.36, 4.15, 12), bodyPaintMat);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 1.48, -2.65);
    tailBoom.castShadow = true;

    const fenestronShroud = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.085, 8, 20), bodyPaintMat);
    fenestronShroud.rotation.y = Math.PI / 2;
    fenestronShroud.position.set(0, 1.62, -4.65);

    const upperFin = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.92, 0.48), bodyPaintMat);
    upperFin.position.set(0, 2.24, -4.75);
    upperFin.rotation.x = -0.22;

    const hStab = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.055, 0.36), bodyPaintMat);
    hStab.position.set(0, 1.54, -4.1);
    chassisGroup.add(tailBoom, fenestronShroud, upperFin, hStab);
    for (const side of [-1, 1]) {
      const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.24), bodyPaintMat);
      endplate.position.set(side * 0.88, 1.56, -4.15);
      chassisGroup.add(endplate);
    }

    // Twin Curved Tubular Cross-Tubes & Black Landing Skids
    for (const side of [-1, 1]) {
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 3.65, 8), trimMat);
      skid.rotation.x = Math.PI / 2;
      skid.position.set(side * 0.98, 0.08, 0.55);
      const skidTip = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.34, 8), trimMat);
      skidTip.position.set(side * 0.98, 0.16, 2.42);
      skidTip.rotation.x = 0.72;
      const strutF = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.78, 8), bodyPaintMat);
      strutF.position.set(side * 0.8, 0.42, 1.35);
      strutF.rotation.z = side * 0.44;
      const strutR = strutF.clone();
      strutR.position.z = -0.25;
      chassisGroup.add(skid, skidTip, strutF, strutR);
    }

    // Main Rotor Mast + 4 Long Composite Blades
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.45, 10), trimMat);
    mast.position.set(0, 2.48, 0.05);
    chassisGroup.add(mast);

    mainRotor = new THREE.Group();
    mainRotor.position.set(0, 2.72, 0.05);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12), trimMat);
    mainRotor.add(hub);
    for (let b = 0; b < 4; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.028, 3.85), trimMat);
      blade.position.set(0, 0, 1.92);
      const pivot = new THREE.Group();
      pivot.rotation.y = (b * Math.PI) / 2;
      pivot.add(blade);
      mainRotor.add(pivot);
    }
    chassisGroup.add(mainRotor);

    // Fenestron Internal Tail Fan
    tailRotor = new THREE.Group();
    tailRotor.position.set(0.04, 1.62, -4.65);
    for (let b = 0; b < 3; b++) {
      const tb = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.56, 0.075), trimMat);
      tb.rotation.x = (b * Math.PI) / 3;
      tailRotor.add(tb);
    }
    chassisGroup.add(tailRotor);

    // Belly Searchlight Cone
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
  } else if (specId === 'red_baron_biplane') {
    // Red Baron Biplane Aircraft Model
    const biplaneBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.65, 3.2, 10, 16), bodyPaintMat);
    biplaneBody.rotation.x = Math.PI / 2;
    biplaneBody.position.set(0, 1.2, 0);
    biplaneBody.castShadow = true;
    chassisGroup.add(biplaneBody);

    const cowl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 0.65, 14), trimMat);
    cowl.rotation.x = Math.PI / 2;
    cowl.position.set(0, 1.2, 1.85);
    chassisGroup.add(cowl);

    const wingGeo = new THREE.BoxGeometry(7.2, 0.12, 1.35);
    const topWing = new THREE.Mesh(wingGeo, bodyPaintMat);
    topWing.position.set(0, 2.3, 0.2);
    topWing.castShadow = true;
    const botWing = new THREE.Mesh(wingGeo, bodyPaintMat);
    botWing.position.set(0, 0.72, 0.2);
    botWing.castShadow = true;
    chassisGroup.add(topWing, botWing);

    for (const side of [-1, 1]) {
      const tipTop = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 1.35), headlightMat);
      tipTop.position.set(side * 3.55, 2.3, 0.2);
      const tipBot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 1.35), headlightMat);
      tipBot.position.set(side * 3.55, 0.72, 0.2);
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.58, 8), trimMat);
      strut.position.set(side * 2.2, 1.51, 0.2);
      chassisGroup.add(tipTop, tipBot, strut);
    }

    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.15, 0.85), bodyPaintMat);
    tailFin.position.set(0, 1.85, -2.5);
    tailFin.rotation.x = -0.22;
    const tailStab = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.65), bodyPaintMat);
    tailStab.position.set(0, 1.45, -2.45);
    chassisGroup.add(tailFin, tailStab);

    mainRotor = new THREE.Group();
    mainRotor.position.set(0, 1.2, 2.22);
    const propBlade1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.04), trimMat);
    const propBlade2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.04), trimMat);
    const spinner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.32, 10), bodyPaintMat);
    spinner.rotation.x = Math.PI / 2;
    spinner.position.set(0, 0, 0.05);
    mainRotor.add(propBlade1, propBlade2, spinner);
    chassisGroup.add(mainRotor);

    for (const side of [-1, 1]) {
      const gearLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 8), trimMat);
      gearLeg.position.set(side * 0.75, 0.35, 1.1);
      gearLeg.rotation.z = side * 0.28;
      chassisGroup.add(gearLeg);
    }
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), trimMat);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, -0.05, 1.1);
    chassisGroup.add(axle);
    buildWheel(0.32, 0.15, 0.82, 1.1, true);
    buildWheel(0.32, 0.15, -0.82, 1.1, true);
  } else if (specId === 'vintage_beetle') {
    // Classic Vintage Beetle Car Model
    const beetleBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.72, 2.1, 12, 18), bodyPaintMat);
    beetleBody.rotation.x = Math.PI / 2;
    beetleBody.position.set(0, 0.68, 0);
    beetleBody.castShadow = true;
    chassisGroup.add(beetleBody);

    const beetleRoof = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), bodyPaintMat);
    beetleRoof.scale.set(0.92, 0.82, 1.35);
    beetleRoof.position.set(0, 1.05, -0.15);
    chassisGroup.add(beetleRoof);

    const frontBumper = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.85, 10), chromeMat);
    frontBumper.rotation.z = Math.PI / 2;
    frontBumper.position.set(0, 0.45, 2.05);
    const rearBumper = frontBumper.clone();
    rearBumper.position.set(0, 0.48, -2.05);
    chassisGroup.add(frontBumper, rearBumper);

    for (const side of [-1, 1]) {
      const headlamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), headlightMat);
      headlamp.position.set(side * 0.68, 0.68, 1.85);
      const fender = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), bodyPaintMat);
      fender.scale.set(0.7, 0.8, 1.2);
      fender.position.set(side * 0.82, 0.52, 1.25);
      chassisGroup.add(headlamp, fender);
    }
    buildWheel(0.36, 0.22, 0.84, 1.22, true);
    buildWheel(0.36, 0.22, -0.84, 1.22, true);
    buildWheel(0.36, 0.22, 0.84, -1.22, false);
    buildWheel(0.36, 0.22, -0.84, -1.22, false);
  } else if (vClass === 'boat') {
    if (specId === 'classic_sailboat') {
      // Classic Wooden Gaff-Rigged Sailboat (White planked upper hull, deep crimson bottom hull, timber thwarts, bowsprit, twin canvas sails)
      const woodTimberMat = new THREE.MeshStandardMaterial({ color: '#5c3d28', roughness: 0.78 });
      const crimsonKeelMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.52 });
      const hullWhiteMat = new THREE.MeshStandardMaterial({ color: '#e7e5e4', roughness: 0.62 });
      const sailCanvasMat = new THREE.MeshStandardMaterial({
        color: '#f5f5f4',
        roughness: 0.88,
        side: THREE.DoubleSide,
      });

      // Tapered plan-view sailboat outline extruded upward for crimson lower hull + white upper hull
      const boatPlan = new THREE.Shape();
      boatPlan.moveTo(-0.72, -2.35);
      boatPlan.lineTo(0.72, -2.35);
      boatPlan.quadraticCurveTo(1.06, -0.45, 0.96, 0.85);
      boatPlan.quadraticCurveTo(0.72, 1.95, 0, 2.62);
      boatPlan.quadraticCurveTo(-0.72, 1.95, -0.96, 0.85);
      boatPlan.quadraticCurveTo(-1.06, -0.45, -0.72, -2.35);

      const lowerGeo = new THREE.ExtrudeGeometry(boatPlan, {
        depth: 0.42,
        bevelEnabled: true,
        bevelThickness: 0.08,
        bevelSize: 0.08,
        bevelSegments: 2,
      });
      lowerGeo.rotateX(-Math.PI / 2);
      const lowerHull = new THREE.Mesh(lowerGeo, crimsonKeelMat);
      lowerHull.position.y = 0.08;
      lowerHull.castShadow = true;

      const upperGeo = new THREE.ExtrudeGeometry(boatPlan, {
        depth: 0.42,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.06,
        bevelSegments: 2,
      });
      upperGeo.rotateX(-Math.PI / 2);
      const upperHull = new THREE.Mesh(upperGeo, hullWhiteMat);
      upperHull.position.y = 0.48;
      upperHull.castShadow = true;

      // Dark stained oak interior floor + gunwale rub rail + 4 transverse bench thwarts
      const innerFloor = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.08, 3.85), woodTimberMat);
      innerFloor.position.set(0, 0.72, -0.15);
      chassisGroup.add(lowerHull, upperHull, innerFloor);

      for (const tz of [-1.85, -0.95, 0.15, 1.25]) {
        const thwartW = tz > 1.0 ? 1.05 : tz < -1.5 ? 1.32 : 1.56;
        const bench = new THREE.Mesh(new THREE.BoxGeometry(thwartW, 0.08, 0.34), woodTimberMat);
        bench.position.set(0, 0.86, tz);
        chassisGroup.add(bench);
      }

      // Wooden bowsprit spar extending forward + forestay
      const bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.062, 2.05, 8), woodTimberMat);
      bowsprit.rotation.x = Math.PI / 2 - 0.14;
      bowsprit.position.set(0, 1.08, 3.1);
      chassisGroup.add(bowsprit);

      // Tall central timber mast + lower boom + stern wooden rudder
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.068, 4.65, 10), woodTimberMat);
      mast.position.set(0, 2.95, 0.32);
      mast.castShadow = true;
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 2.55, 8), woodTimberMat);
      boom.rotation.x = Math.PI / 2;
      boom.position.set(0, 1.26, -0.92);
      const rudder = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.42), woodTimberMat);
      rudder.position.set(0, 0.55, -2.52);
      chassisGroup.add(mast, boom, rudder);

      // Fore Jib Triangle Sail (bowsprit tip -> mast top -> mast base)
      const jibShape = new THREE.Shape();
      jibShape.moveTo(0, 1.15);
      jibShape.lineTo(3.65, 1.15);
      jibShape.lineTo(0, 4.95);
      jibShape.closePath();
      const jibGeo = new THREE.ShapeGeometry(jibShape);
      jibGeo.rotateY(Math.PI / 2);
      const jibSail = new THREE.Mesh(jibGeo, sailCanvasMat);
      jibSail.position.set(0.02, 0, 0.36);
      jibSail.castShadow = true;

      // Main Triangular Gaff Sail (mast top -> mast boom -> boom aft)
      const mainShape = new THREE.Shape();
      mainShape.moveTo(0, 1.28);
      mainShape.lineTo(-2.38, 1.28);
      mainShape.lineTo(0, 4.88);
      mainShape.closePath();
      const mainGeo = new THREE.ShapeGeometry(mainShape);
      mainGeo.rotateY(Math.PI / 2);
      const mainSail = new THREE.Mesh(mainGeo, sailCanvasMat);
      mainSail.position.set(-0.02, 0, 0.28);
      mainSail.castShadow = true;
      chassisGroup.add(jibSail, mainSail);
    } else {
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
    }
  } else if (specId === 'shuttle_van') {
    // Metallic Blue-Grey Passenger Minibus / Shuttle Van (Fiat Ducato silhouette with clear cabin windows & 3 rows of seats)
    const w = spec.width;
    const l = spec.length;
    const matteGrayMat = new THREE.MeshStandardMaterial({ color: '#373a40', roughness: 0.82, metalness: 0.1 });
    const cabinClearGlassMat = new THREE.MeshPhysicalMaterial({
      color: '#1f2937',
      roughness: 0.08,
      metalness: 0.1,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.46,
    });
    const seatCharcoalMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.78 });

    // Lower chassis & full-length matte side trim skirt
    const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.34, l * 0.96), matteGrayMat);
    sideSkirt.position.set(0, 0.48, 0);
    chassisGroup.add(sideSkirt);

    // Tall rear cabin lower body + upper roof frame + sloped front hood
    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(w, 0.84, l * 0.8), bodyPaintMat);
    lowerBody.position.set(0, 0.92, -0.45);
    lowerBody.castShadow = true;
    const roofCap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.24, l * 0.72), bodyPaintMat);
    roofCap.position.set(0, 2.22, -0.62);
    roofCap.castShadow = true;
    const hoodBox = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.64, 1.05), bodyPaintMat);
    hoodBox.position.set(0, 0.9, l * 0.38);
    hoodBox.rotation.x = 0.24;
    hoodBox.castShadow = true;
    chassisGroup.add(lowerBody, roofCap, hoodBox);

    // Corner pillars + B/C/D window mullions
    for (const pz of [-2.46, -1.38, -0.3, 0.78]) {
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.96, 0.14), bodyPaintMat);
        pillar.position.set(side * (w * 0.48), 1.72, pz);
        chassisGroup.add(pillar);
      }
    }

    // Wrap-around clear-tinted passenger glass + steep windshield
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.86, l * 0.64), cabinClearGlassMat);
    sideGlass.position.set(0, 1.72, -0.78);
    const ws = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.98, 0.1), cabinClearGlassMat);
    ws.position.set(0, 1.7, l * 0.26);
    ws.rotation.x = -0.42;
    chassisGroup.add(sideGlass, ws);

    // 3 Rows of Visible Passenger Seats + Open Headrests inside the Cabin
    for (const sz of [-1.85, -0.78, 0.35]) {
      for (const side of [-0.52, 0.52]) {
        const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.56, 0.12), seatCharcoalMat);
        seatBack.position.set(side, 1.48, sz);
        const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.08), seatCharcoalMat);
        headrest.position.set(side, 1.84, sz - 0.02);
        chassisGroup.add(seatBack, headrest);
      }
    }

    // Sliding Door Rail Seam on passenger right rear flank + Wing Mirrors
    const railTrack = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 1.75), chromeMat);
    railTrack.position.set(w * 0.5 + 0.01, 1.24, -1.65);
    chassisGroup.add(railTrack);
    for (const side of [-1, 1]) {
      const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.12), matteGrayMat);
      mirror.position.set(side * (w * 0.53), 1.42, l * 0.2);
      chassisGroup.add(mirror);
    }

    // Matte Dark-Grey Front & Rear Molded Bumpers + Silver Slatted Grille + Red Emblem
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.42, 0.24), matteGrayMat);
    bumperF.position.set(0, 0.46, l * 0.49);
    const bumperR = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.34, 0.18), matteGrayMat);
    bumperR.position.set(0, 0.44, -l * 0.49);
    const grilleBar = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.22, 0.08), chromeMat);
    grilleBar.position.set(0, 0.78, l * 0.48);
    const grilleBadge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.09, 10),
      new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.3 })
    );
    grilleBadge.rotation.x = Math.PI / 2;
    grilleBadge.position.set(0, 0.78, l * 0.495);
    chassisGroup.add(bumperF, bumperR, grilleBar, grilleBadge);

    for (const side of [-1, 1]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.08), headlightMat);
      hl.position.set(side * w * 0.34, 0.78, l * 0.48);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.08), taillightMat);
      tl.position.set(side * w * 0.43, 0.92, -l * 0.48);
      chassisGroup.add(hl, tl);
    }

    buildWheel(0.41, 0.26, -w * 0.44, l * 0.32, true);
    buildWheel(0.41, 0.26, w * 0.44, l * 0.32, true);
    buildWheel(0.41, 0.26, -w * 0.44, -l * 0.3, false);
    buildWheel(0.41, 0.26, w * 0.44, -l * 0.3, false);
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
    // FedEx Express Cargo Step-Van Silhouette (sloped nose, split windshield, sliding side bay doors, roof AC + clearance lights)
    const vanWhiteMat = new THREE.MeshPhysicalMaterial({
      color: '#f8fafc',
      roughness: 0.28,
      metalness: 0.22,
      clearcoat: 0.72,
    });
    const vanBlackMat = trimMat;

    // Main high-roof cargo body
    const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.15, 4.7), vanWhiteMat);
    mainBody.position.set(0, 1.56, -0.58);
    mainBody.castShadow = true;
    mainBody.receiveShadow = true;
    chassisGroup.add(mainBody);

    // Lower forward engine & cab skirt
    const cabLower = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.92, 1.2), vanWhiteMat);
    cabLower.position.set(0, 0.94, 2.34);
    cabLower.castShadow = true;
    const slopedHood = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.28, 0.96), vanWhiteMat);
    slopedHood.position.set(0, 1.42, 2.38);
    slopedHood.rotation.x = 0.24;
    chassisGroup.add(cabLower, slopedHood);

    // Cab header + Roof AC Pod + 5 Amber Clearance Lights
    const roofHeader = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.34, 1.0), vanWhiteMat);
    roofHeader.position.set(0, 2.46, 1.65);
    const acPod = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.24, 1.08),
      new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 })
    );
    acPod.position.set(0, 2.74, 0.45);
    chassisGroup.add(roofHeader, acPod);

    const clearanceMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
    for (let i = -2; i <= 2; i++) {
      const cl = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.08), clearanceMat);
      cl.position.set(i * 0.28, 2.6, 2.12);
      chassisGroup.add(cl);
    }

    // Dual-pane split windshield + center mullion + side cab recessed windows + mirrors
    const wsFrame = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.88, 0.14), glassMat);
    wsFrame.position.set(0, 1.92, 2.02);
    wsFrame.rotation.x = -0.14;
    const wsMullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.16), vanBlackMat);
    wsMullion.position.set(0, 1.92, 2.02);
    wsMullion.rotation.x = -0.14;
    chassisGroup.add(wsFrame, wsMullion);

    for (const side of [-1, 1]) {
      const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.82, 0.92), glassMat);
      sideGlass.position.set(side * 1.13, 1.88, 1.38);
      const slideTrack = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.85, 0.06), vanBlackMat);
      slideTrack.position.set(side * 1.16, 1.48, 0.92);
      const mirrorArm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.05, 0.05), vanBlackMat);
      mirrorArm.position.set(side * 1.24, 1.92, 1.95);
      const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.12), vanBlackMat);
      mirrorHead.position.set(side * 1.38, 1.84, 1.95);
      chassisGroup.add(sideGlass, slideTrack, mirrorArm, mirrorHead);
    }

    // Crisp FedEx Express Side Panels & Front Hood Decal
    if (vehicleTextures?.expressSide) {
      const sideLiveryMat = new THREE.MeshStandardMaterial({
        map: vehicleTextures.expressSide,
        roughness: 0.35,
        metalness: 0.08,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const panelL = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.48), sideLiveryMat);
      panelL.rotation.y = -Math.PI / 2;
      panelL.position.set(-1.165, 1.66, -1.1);
      const panelR = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.48), sideLiveryMat);
      panelR.rotation.y = Math.PI / 2;
      panelR.position.set(1.165, 1.66, -1.1);
      chassisGroup.add(panelL, panelR);
    }
    if (vehicleTextures?.expressHood) {
      const hoodLiveryMat = new THREE.MeshStandardMaterial({
        map: vehicleTextures.expressHood,
        roughness: 0.35,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      });
      const hoodDecal = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.52), hoodLiveryMat);
      hoodDecal.rotation.x = -Math.PI / 2 + 0.24;
      hoodDecal.position.set(0, 1.575, 2.38);
      const rearDecal = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), hoodLiveryMat);
      rearDecal.rotation.y = Math.PI;
      rearDecal.position.set(0, 1.96, -2.945);
      chassisGroup.add(hoodDecal, rearDecal);
    }

    // 2-slat black front grille + black bumper + stacked twin headlamps
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.42, 0.1), vanBlackMat);
    grille.position.set(0, 1.0, 2.94);
    const grilleBar1 = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.05, 0.12), chromeMat);
    grilleBar1.position.set(0, 1.07, 2.95);
    const grilleBar2 = grilleBar1.clone();
    grilleBar2.position.y = 0.93;
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.26, 0.22), vanBlackMat);
    bumperF.position.set(0, 0.52, 2.96);
    const bumperR = new THREE.Mesh(new THREE.BoxGeometry(2.34, 0.22, 0.18), vanBlackMat);
    bumperR.position.set(0, 0.5, -2.96);
    chassisGroup.add(grille, grilleBar1, grilleBar2, bumperF, bumperR);

    for (const side of [-1, 1]) {
      const hlTop = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.08), headlightMat);
      hlTop.position.set(side * 0.82, 1.08, 2.94);
      const hlBot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.08), leftSignalMat);
      hlBot.position.set(side * 0.82, 0.92, 2.94);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.08), taillightMat);
      tl.position.set(side * 0.92, 0.78, -2.94);
      chassisGroup.add(hlTop, hlBot, tl);
    }

    buildWheel(0.46, 0.3, -1.04, 1.92, true);
    buildWheel(0.46, 0.3, 1.04, 1.92, true);
    buildWheel(0.46, 0.34, -1.04, -1.65, false);
    buildWheel(0.46, 0.34, 1.04, -1.65, false);
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
    const isSovereignM5 = specId === 'sovereign_gt';
    const isRetro80s = specId === 'retro_sedan_80s';
    const wheelR = isSuv ? 0.42 : 0.34;
    const baseY = wheelR * 0.72;

    if (isPolice) {
      bodyPaintMat.color.set('#f8fafc');
    }

    const profile = buildSculptedCarProfile(l, vClass);
    const bodyWidth = w - 0.12;
    const hullGeo = new THREE.ExtrudeGeometry(profile, {
      depth: bodyWidth,
      bevelEnabled: !isRetro80s,
      bevelThickness: isRetro80s ? 0 : 0.06,
      bevelSize: isRetro80s ? 0 : 0.055,
      bevelSegments: isRetro80s ? 1 : 3,
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

    // Boxy 1980s Retro Sedan details (matte wrap bumpers, side rub strip, boxy grille slats, quad rectangular lamps)
    if (isRetro80s) {
      const retroBumperF = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.17, 0.2), trimMat);
      retroBumperF.position.set(0, baseY + 0.18, l * 0.5 + 0.04);
      const retroBumperR = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.17, 0.18), trimMat);
      retroBumperR.position.set(0, baseY + 0.2, -l * 0.5 - 0.04);
      const rubStrip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.06, l * 0.92), trimMat);
      rubStrip.position.set(0, baseY + 0.27, 0);
      chassisGroup.add(retroBumperF, retroBumperR, rubStrip);
    }

    // Classic White & Blue POLICE Cruiser Livery + Red POLICE Side Door Decals + Heavy Chrome Push-Bumper
    if (isPolice) {
      const policeBlueMat = new THREE.MeshPhysicalMaterial({
        color: '#2563eb',
        roughness: 0.25,
        metalness: 0.35,
        clearcoat: 0.85,
      });
      const waistStripe = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, 0.14, l * 0.88), policeBlueMat);
      waistStripe.position.set(0, baseY + 0.42, 0);
      chassisGroup.add(waistStripe);

      if (vehicleTextures?.policeDoor) {
        const doorDecalMat = new THREE.MeshStandardMaterial({
          map: vehicleTextures.policeDoor,
          roughness: 0.32,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        });
        for (const side of [-1, 1]) {
          const doorDecal = new THREE.Mesh(new THREE.PlaneGeometry(1.52, 0.38), doorDecalMat);
          doorDecal.position.set(side * (w * 0.5 + 0.012), baseY + 0.31, -0.02);
          doorDecal.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2;
          chassisGroup.add(doorDecal);
        }
      }

      // Heavy Steel Front Push-Bumper + Upright Push Guards
      const pushBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.18, 0.2), chromeMat);
      pushBar.position.set(0, baseY + 0.22, l * 0.5 + 0.08);
      const rearSteelBumper = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.18, 0.18), chromeMat);
      rearSteelBumper.position.set(0, baseY + 0.22, -l * 0.5 - 0.06);
      chassisGroup.add(pushBar, rearSteelBumper);
      for (const side of [-1, 1]) {
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.24), trimMat);
        guard.position.set(side * w * 0.22, baseY + 0.26, l * 0.5 + 0.11);
        chassisGroup.add(guard);
      }
    }

    // Two-Tone Matte-Black & Charcoal Sovereign M5 Sport Sedan (Hood, Roof, Trunk, Silver Bumper Trim & Roof Pod)
    if (isSovereignM5) {
      const matteBlackMat = new THREE.MeshStandardMaterial({
        color: '#141418',
        roughness: 0.68,
        metalness: 0.18,
      });
      const matteHood = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.045, l * 0.31), matteBlackMat);
      matteHood.position.set(0, baseY + 0.585, l * 0.28);
      matteHood.rotation.x = 0.085;
      const matteRoof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.045, l * 0.34), matteBlackMat);
      matteRoof.position.set(0, baseY + 1.075, -l * 0.14);
      const matteTrunk = new THREE.Mesh(new THREE.BoxGeometry(w * 0.84, 0.045, l * 0.18), matteBlackMat);
      matteTrunk.position.set(0, baseY + 0.635, -l * 0.41);
      const roofPod = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.48), chromeMat);
      roofPod.position.set(0, baseY + 1.14, -l * 0.06);
      const silverIntakeRim = new THREE.Mesh(new THREE.BoxGeometry(w * 0.52, 0.14, 0.07), chromeMat);
      silverIntakeRim.position.set(0, baseY + 0.16, l * 0.505);
      chassisGroup.add(matteHood, matteRoof, matteTrunk, roofPod, silverIntakeRim);
    }

    // Vibrant Orange "01" Fastback Muscle Car Decals + Chrome Push-Bar
    if (isMuscle) {
      if (vehicleTextures?.muscle01) {
        const decal01Mat = new THREE.MeshStandardMaterial({
          map: vehicleTextures.muscle01,
          roughness: 0.28,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        });
        const roof01 = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), decal01Mat);
        roof01.rotation.x = -Math.PI / 2;
        roof01.position.set(0, baseY + 1.06, -l * 0.14);
        const hood01 = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.82), decal01Mat);
        hood01.rotation.x = -Math.PI / 2 + 0.08;
        hood01.position.set(0, baseY + 0.63, l * 0.28);
        chassisGroup.add(roof01, hood01);
        for (const side of [-1, 1]) {
          const door01 = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.46), decal01Mat);
          door01.position.set(side * (w * 0.5 + 0.012), baseY + 0.36, -0.02);
          door01.rotation.y = side === 1 ? Math.PI / 2 : -Math.PI / 2;
          chassisGroup.add(door01);
        }
      }
      const mPushBar = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.16, 0.18), chromeMat);
      mPushBar.position.set(0, baseY + 0.22, l * 0.5 + 0.06);
      chassisGroup.add(mPushBar);
    }

    // Nissan Skyline R34 GT-R Silver/Electric-Blue Racing Livery, Bumper Intakes, GT Wing & Twin Offset Exhausts
    const isSkylineR34 = specId === 'skyline_r34';
    if (isSkylineR34) {
      const r34BlueMat = new THREE.MeshPhysicalMaterial({
        color: '#1d5fe8',
        roughness: 0.22,
        metalness: 0.45,
        clearcoat: 0.9,
      });

      if (vehicleTextures?.skylineHood) {
        const hoodDecalMat = new THREE.MeshStandardMaterial({
          map: vehicleTextures.skylineHood,
          transparent: true,
          roughness: 0.24,
          metalness: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        });
        const hoodDecal = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.88, l * 0.34), hoodDecalMat);
        hoodDecal.rotation.x = -Math.PI / 2 + 0.085;
        hoodDecal.position.set(0, baseY + 0.525, l * 0.3);
        chassisGroup.add(hoodDecal);
      }

      if (vehicleTextures?.skylineSide) {
        const sideMat = new THREE.MeshStandardMaterial({
          map: vehicleTextures.skylineSide,
          transparent: true,
          roughness: 0.24,
          metalness: 0.35,
          polygonOffset: true,
          polygonOffsetFactor: -2,
        });
        // Right side (+X)
        const sideR = new THREE.Mesh(new THREE.PlaneGeometry(l * 0.88, 0.46), sideMat);
        sideR.rotation.y = Math.PI / 2;
        sideR.position.set(w * 0.5 - 0.045, baseY + 0.31, -l * 0.02);
        // Left side (-X) with flipped U so diagonal stripes sweep upward toward the rear
        const geoL = new THREE.PlaneGeometry(l * 0.88, 0.46);
        const uvAttr = geoL.attributes.uv;
        for (let i = 0; i < uvAttr.count; i++) uvAttr.setX(i, 1 - uvAttr.getX(i));
        const sideL = new THREE.Mesh(geoL, sideMat);
        sideL.rotation.y = -Math.PI / 2;
        sideL.position.set(-w * 0.5 + 0.045, baseY + 0.31, -l * 0.02);
        chassisGroup.add(sideR, sideL);
      }

      // Front Bumper Twin Blue Stripes + Intercooler Core + Side Aero Canards + Blue Rear Skirt
      for (const side of [-1, 1]) {
        const noseStripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.08), r34BlueMat);
        noseStripe.position.set(side * 0.2, baseY + 0.24, l * 0.5 + 0.01);
        const sideCanard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.26), bodyPaintMat);
        sideCanard.position.set(side * (w * 0.48), baseY + 0.12, l * 0.44);
        chassisGroup.add(noseStripe, sideCanard);
      }
      const intercooler = new THREE.Mesh(
        new THREE.BoxGeometry(0.84, 0.2, 0.1),
        new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.45, metalness: 0.6 })
      );
      intercooler.position.set(0, baseY + 0.16, l * 0.502);
      const rearBlueTrim = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.22, 0.08), r34BlueMat);
      rearBlueTrim.position.set(0, baseY + 0.24, -l * 0.5 - 0.01);
      chassisGroup.add(intercooler, rearBlueTrim);

      // Tall Electric-Blue GT Rear Wing on Silver Uprights
      const gtWingBlade = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.065, 0.3), r34BlueMat);
      gtWingBlade.position.set(0, baseY + 0.9, -l * 0.45);
      for (const side of [-1, 1]) {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.28, 0.14), chromeMat);
        upright.position.set(side * w * 0.31, baseY + 0.74, -l * 0.45);
        const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.34), r34BlueMat);
        endPlate.position.set(side * w * 0.49, baseY + 0.88, -l * 0.45);
        chassisGroup.add(upright, endPlate);
      }
      chassisGroup.add(gtWingBlade);
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
      // Wrap-around Tinted Windshield & Side Greenhouse (+ visible grey sport seats on Sovereign M5)
      const cabinGlass = new THREE.Mesh(
        new THREE.BoxGeometry(glassW, isSuv ? 0.46 : 0.32, glassL),
        isSovereignM5
          ? new THREE.MeshPhysicalMaterial({
              color: '#334155',
              roughness: 0.05,
              clearcoat: 1.0,
              transparent: true,
              opacity: 0.42,
            })
          : glassMat
      );
      cabinGlass.position.set(0, cabinY, glassZ);
      chassisGroup.add(cabinGlass);
      if (isSovereignM5) {
        const seatMat = new THREE.MeshStandardMaterial({ color: '#d4d4d8', roughness: 0.55 });
        for (const side of [-1, 1]) {
          const sHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.1), seatMat);
          sHead.position.set(side * 0.36, cabinY - 0.02, glassZ - 0.18);
          chassisGroup.add(sHead);
        }
      }
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

    // Front Splitter, Grille (Twin Kidneys on Sovereign M5, Slatted Chrome on Police) & Rear Diffuser
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.1, 0.24), trimMat);
    splitter.position.set(0, baseY + 0.06, l * 0.49);
    chassisGroup.add(splitter);

    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(w + 0.02, 0.16, 0.22), trimMat);
    diffuser.position.set(0, baseY + 0.1, -l * 0.49);
    chassisGroup.add(diffuser);

    if (isSovereignM5) {
      for (const side of [-1, 1]) {
        const kRing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.19, 0.07), chromeMat);
        kRing.position.set(side * 0.22, baseY + 0.36, l * 0.495);
        const kCore = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.085), trimMat);
        kCore.position.set(side * 0.22, baseY + 0.36, l * 0.497);
        chassisGroup.add(kRing, kCore);
      }
    } else {
      const grille = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.54, isMuscle || isPolice ? 0.22 : 0.17, 0.08),
        isMuscle ? trimMat : chromeMat
      );
      grille.position.set(0, baseY + (isMuscle || isPolice ? 0.36 : 0.24), l * 0.5 + 0.01);
      chassisGroup.add(grille);
      if (isPolice) {
        const grilleSlats = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, 0.16, 0.095), trimMat);
        grilleSlats.position.set(0, baseY + 0.36, l * 0.5 + 0.015);
        chassisGroup.add(grilleSlats);
      }
    }

    // Dual Chrome Exhausts (Twin Offset Left Exhausts on Skyline R34 GT-R)
    if (isSkylineR34) {
      for (const exOff of [-0.26, -0.37]) {
        const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.24, 10), chromeMat);
        ex.rotation.x = Math.PI / 2;
        ex.position.set(w * exOff, baseY + 0.09, -l * 0.5 - 0.05);
        chassisGroup.add(ex);
      }
    } else {
      for (const side of [-1, 1]) {
        const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 10), chromeMat);
        ex.rotation.x = Math.PI / 2;
        ex.position.set(side * w * 0.31, baseY + 0.09, -l * 0.5 - 0.04);
        chassisGroup.add(ex);
      }
    }

    // Rear Wing for Sports, Supercar & Sovereign M5 (Skyline uses its custom blue GT wing); Lip Spoiler for Muscle
    if ((isSuper && !isSkylineR34) || isSovereignM5) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.06, 0.28), trimMat);
      wing.position.set(0, baseY + (isSovereignM5 ? 0.84 : 0.72), -l * 0.44);
      const stL = new THREE.Mesh(new THREE.BoxGeometry(0.05, isSovereignM5 ? 0.24 : 0.18, 0.14), trimMat);
      stL.position.set(-w * 0.3, baseY + (isSovereignM5 ? 0.72 : 0.62), -l * 0.44);
      const stR = stL.clone();
      stR.position.x = w * 0.3;
      chassisGroup.add(wing, stL, stR);
    } else if (isMuscle) {
      const lip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.08, 0.16), bodyPaintMat);
      lip.position.set(0, baseY + 0.62, -l * 0.46);
      chassisGroup.add(lip);
    }

    // Classic Police Roof Crossbar + Twin Glowing Red Rotating Beacons
    if (isPolice) {
      const barY = baseY + 1.09;
      const barBase = new THREE.Mesh(new THREE.BoxGeometry(w * 0.58, 0.06, 0.14), chromeMat);
      barBase.position.set(0, barY, -0.14);
      sirenRedMat = new THREE.MeshStandardMaterial({
        color: '#ef4444',
        emissive: '#ef4444',
        emissiveIntensity: 1.9,
      });
      sirenBlueMat = new THREE.MeshStandardMaterial({
        color: '#dc2626',
        emissive: '#ef4444',
        emissiveIntensity: 0.45,
      });
      const leftPod = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.14, 12), sirenRedMat);
      leftPod.position.set(-w * 0.24, barY + 0.08, -0.14);
      const rightPod = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.14, 12), sirenBlueMat);
      rightPod.position.set(w * 0.24, barY + 0.08, -0.14);
      chassisGroup.add(barBase, leftPod, rightPod);

      const rs = makeGlowSprite('#ef4444', 1.6, 0.78);
      const bs = makeGlowSprite('#ef4444', 1.6, 0.78);
      if (rs && bs) {
        rs.position.set(-w * 0.24, barY + 0.17, -0.14);
        bs.position.set(w * 0.24, barY + 0.17, -0.14);
        chassisGroup.add(rs, bs);
        sirenRedSprite = rs;
        sirenBlueSprite = bs;
      }
    }

    // Headlights, Taillights & Working Turn Signals
    if (isMuscle) {
      headlightMat.color.set('#fde047');
      headlightMat.emissive.set('#facc15');
    }
    for (const side of [-1, 1]) {
      if (isPolice) {
        for (const offset of [-0.08, 0.08]) {
          const hlRound = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.08, 10), headlightMat);
          hlRound.rotation.x = Math.PI / 2;
          hlRound.position.set(side * w * 0.34 + offset, baseY + 0.36, l * 0.5 + 0.01);
          chassisGroup.add(hlRound);
        }
      } else {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.08), headlightMat);
        hl.position.set(side * w * 0.34, baseY + (isSuv ? 0.52 : 0.3), l * 0.5 + 0.01);
        chassisGroup.add(hl);
      }

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
    horseLegs,
    horseTailPivot,
    horseNeckPivot,
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
