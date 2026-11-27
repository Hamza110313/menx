import * as THREE from 'three';

export interface AtmosphericSkyRig {
  mesh: THREE.Mesh;
  update: (
    cameraPos: THREE.Vector3,
    sunDir: THREE.Vector3,
    dayFactor: number,
    sunsetFactor: number,
    rainFactor: number,
    fogFactor: number,
    elapsed: number,
    lightningFlash?: number
  ) => void;
  getHorizonColor: (target: THREE.Color) => THREE.Color;
  dispose: () => void;
}

const SKY_VERTEX_SHADER = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uDayFactor;
  uniform float uSunsetFactor;
  uniform float uRainFactor;
  uniform float uFogFactor;
  uniform float uTime;
  uniform float uLightning;
  varying vec3 vWorldDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vWorldDir);
    float up = clamp(dir.y, -0.2, 1.0);
    float skyElev = clamp(dir.y, 0.0, 1.0);

    // Rich Rayleigh sky palette across Day / Sunset / Night
    vec3 dayZenith = vec3(0.08, 0.34, 0.78);
    vec3 dayHorizon = vec3(0.64, 0.84, 0.98);
    vec3 sunsetZenith = vec3(0.14, 0.17, 0.44);
    vec3 sunsetHorizon = vec3(0.98, 0.50, 0.22);
    vec3 nightZenith = vec3(0.015, 0.025, 0.075);
    vec3 nightHorizon = vec3(0.055, 0.09, 0.18);

    vec3 zenith = mix(nightZenith, dayZenith, uDayFactor);
    zenith = mix(zenith, sunsetZenith, uSunsetFactor * 0.75);

    vec3 horizon = mix(nightHorizon, dayHorizon, uDayFactor);
    horizon = mix(horizon, sunsetHorizon, uSunsetFactor * 0.90);

    // Overcast storm & fog modulation
    float overcast = clamp(uRainFactor * 0.8 + uFogFactor * 0.65, 0.0, 0.92);
    vec3 overcastColor = mix(vec3(0.10, 0.13, 0.18), vec3(0.46, 0.52, 0.59), uDayFactor);
    zenith = mix(zenith, overcastColor * 0.76, overcast);
    horizon = mix(horizon, overcastColor, overcast);

    vec3 col = mix(horizon, zenith, pow(skyElev, 0.52));

    // Mie forward scatter & crisp solar disc
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    float sunGlow = pow(sunDot, 12.0) * (0.28 + uSunsetFactor * 0.48) * (1.0 - overcast * 0.72);
    float sunCorona = pow(sunDot, 160.0) * 0.9 * (1.0 - overcast * 0.85);
    float sunDisc = smoothstep(0.9991, 0.9997, sunDot) * 2.4 * uDayFactor * (1.0 - overcast * 0.95);
    vec3 sunTint = mix(vec3(1.0, 0.95, 0.82), vec3(1.0, 0.54, 0.22), uSunsetFactor);
    col += sunTint * (sunGlow + sunCorona + sunDisc);

    // Night starfield & moon glow opposite sun
    float nightMask = clamp(1.0 - uDayFactor * 1.4, 0.0, 1.0) * (1.0 - overcast * 0.92);
    if (nightMask > 0.01 && dir.y > 0.03) {
      vec2 starUv = dir.xz / (dir.y + 0.35) * 95.0;
      float st = hash(floor(starUv));
      float twinkle = 0.65 + 0.35 * sin(uTime * 2.6 + st * 90.0);
      float starBright = smoothstep(0.992, 0.9995, st) * twinkle * smoothstep(0.03, 0.35, dir.y);
      col += vec3(0.85, 0.92, 1.0) * starBright * nightMask * 1.4;

      vec3 moonDir = normalize(vec3(-uSunDir.x, max(0.32, -uSunDir.y + 0.55), -uSunDir.z * 0.8));
      float moonDot = max(dot(dir, moonDir), 0.0);
      float moonHalo = pow(moonDot, 36.0) * 0.28;
      float moonDisc = smoothstep(0.9986, 0.9992, moonDot) * 1.35;
      col += vec3(0.78, 0.88, 1.0) * (moonHalo + moonDisc) * nightMask;
    }

    // Two-layer volumetric-style drifting clouds with sunlit silver/gold rim lighting
    if (dir.y > 0.015) {
      vec2 cloudUv1 = dir.xz / (dir.y + 0.16) * 1.32 + vec2(uTime * 0.0085, uTime * 0.0042);
      vec2 cloudUv2 = dir.xz / (dir.y + 0.22) * 2.45 - vec2(uTime * 0.005, uTime * 0.003);
      float c1 = fbm(cloudUv1);
      float c2 = fbm(cloudUv2);
      float cloudField = c1 * 0.72 + c2 * 0.28;
      float coverage = mix(0.49, 0.31, uRainFactor);
      float cloudMask = smoothstep(coverage, coverage + 0.22, cloudField) * smoothstep(0.015, 0.18, dir.y);

      vec3 cloudBase = mix(vec3(0.11, 0.14, 0.20), vec3(0.94, 0.96, 1.0), uDayFactor);
      cloudBase = mix(cloudBase, vec3(0.98, 0.66, 0.44), uSunsetFactor * 0.68);
      cloudBase = mix(cloudBase, vec3(0.28, 0.32, 0.38), uRainFactor * 0.75);

      // Sunlit cloud silver/amber rim + self-shadow underside
      float cloudRim = pow(sunDot, 5.0) * (1.0 - c2 * 0.45) * (0.45 + 0.55 * uDayFactor);
      vec3 cloudLit = cloudBase + sunTint * cloudRim * 0.55;
      float cloudShadow = smoothstep(coverage + 0.08, coverage + 0.34, cloudField);
      cloudLit = mix(cloudLit, cloudLit * 0.78, cloudShadow * (0.35 + uRainFactor * 0.35));

      col = mix(col, cloudLit, cloudMask * (0.86 - uFogFactor * 0.32));
    }

    // Storm lightning flash illumination
    if (uLightning > 0.01) {
      float flashGlow = (0.35 + pow(skyElev, 0.4) * 0.65) * uLightning;
      col += vec3(0.75, 0.86, 1.0) * flashGlow * 0.75;
    }

    // Horizon haze blend for seamless distant fog integration
    float horizonBlend = smoothstep(0.14, -0.04, up);
    col = mix(col, horizon, horizonBlend * 0.88);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function createAtmosphericSkyDome(): AtmosphericSkyRig {
  const geo = new THREE.SphereGeometry(520, 40, 28);
  const uniforms = {
    uSunDir: { value: new THREE.Vector3(0.6, 0.7, 0.4).normalize() },
    uDayFactor: { value: 1.0 },
    uSunsetFactor: { value: 0.0 },
    uRainFactor: { value: 0.0 },
    uFogFactor: { value: 0.0 },
    uTime: { value: 0.0 },
    uLightning: { value: 0.0 },
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERTEX_SHADER,
    fragmentShader: SKY_FRAGMENT_SHADER,
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;

  const dayH = new THREE.Color(0.64, 0.84, 0.98);
  const sunsetH = new THREE.Color(0.98, 0.50, 0.22);
  const nightH = new THREE.Color(0.055, 0.09, 0.18);
  const overcastCol = new THREE.Color();

  return {
    mesh,
    update: (cameraPos, sunDir, dayFactor, sunsetFactor, rainFactor, fogFactor, elapsed, lightningFlash = 0) => {
      mesh.position.copy(cameraPos);
      uniforms.uSunDir.value.copy(sunDir).normalize();
      uniforms.uDayFactor.value = dayFactor;
      uniforms.uSunsetFactor.value = sunsetFactor;
      uniforms.uRainFactor.value = rainFactor;
      uniforms.uFogFactor.value = fogFactor;
      uniforms.uTime.value = elapsed;
      uniforms.uLightning.value = lightningFlash;
    },
    getHorizonColor: (target: THREE.Color) => {
      target.copy(nightH).lerp(dayH, uniforms.uDayFactor.value);
      target.lerp(sunsetH, uniforms.uSunsetFactor.value * 0.85);
      const overcast = Math.min(0.92, uniforms.uRainFactor.value * 0.8 + uniforms.uFogFactor.value * 0.65);
      const ocVal = 0.12 + uniforms.uDayFactor.value * 0.42;
      overcastCol.setRGB(ocVal * 0.92, ocVal * 0.98, ocVal * 1.08);
      target.lerp(overcastCol, overcast);
      return target;
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}
