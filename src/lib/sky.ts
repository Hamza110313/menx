import * as THREE from 'three';

export interface SkyDomeController {
  mesh: THREE.Mesh;
  update: (
    cameraPos: THREE.Vector3,
    sunDirection: THREE.Vector3,
    dayFactor: number,
    sunsetFactor: number,
    rainFactor: number,
    fogFactor: number,
    elapsedTime: number
  ) => void;
  getHorizonColor: (target: THREE.Color) => THREE.Color;
  dispose: () => void;
}

export function createAtmosphericSkyDome(): SkyDomeController {
  const geo = new THREE.SphereGeometry(520, 32, 24);

  const uniforms = {
    uSunDir: { value: new THREE.Vector3(0.4, 0.7, 0.5).normalize() },
    uZenithColor: { value: new THREE.Color('#1d4ed8') },
    uMidColor: { value: new THREE.Color('#60a5fa') },
    uHorizonColor: { value: new THREE.Color('#bae6fd') },
    uSunColor: { value: new THREE.Color('#fff7ed') },
    uNightFactor: { value: 0.0 },
    uCloudOpacity: { value: 0.55 },
    uTime: { value: 0.0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vWorldDir;
      uniform vec3 uSunDir;
      uniform vec3 uZenithColor;
      uniform vec3 uMidColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunColor;
      uniform float uNightFactor;
      uniform float uCloudOpacity;
      uniform float uTime;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.04;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vWorldDir);
        float h = clamp(dir.y, 0.0, 1.0);

        // 3-stop atmospheric sky gradient
        vec3 sky = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.28, h));
        sky = mix(sky, uZenithColor, smoothstep(0.22, 0.88, h));

        // Mie scattering halo & crisp solar disc
        float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
        float sunHalo = pow(sunDot, 8.0) * 0.42 + pow(sunDot, 48.0) * 0.55;
        float sunDisc = smoothstep(0.9988, 0.9996, sunDot) * 2.2;
        sky += uSunColor * (sunHalo + sunDisc) * (1.0 - uNightFactor * 0.88);

        // Procedural clouds on upper hemisphere
        if (dir.y > 0.03 && uCloudOpacity > 0.01) {
          vec2 cloudUv = dir.xz / (dir.y + 0.18) * 1.15 + vec2(uTime * 0.008, uTime * 0.004);
          float c = fbm(cloudUv);
          float cloudMask = smoothstep(0.48, 0.78, c) * smoothstep(0.03, 0.22, dir.y);
          vec3 cloudCol = mix(vec3(0.96, 0.97, 0.99), uHorizonColor * 1.12, 0.35);
          cloudCol = mix(cloudCol, vec3(0.16, 0.2, 0.28), uNightFactor * 0.82);
          sky = mix(sky, cloudCol, cloudMask * uCloudOpacity);
        }

        // Starfield at night
        if (uNightFactor > 0.05 && dir.y > 0.05) {
          vec2 starUv = floor(dir.xz / (dir.y + 0.4) * 165.0);
          float s = hash21(starUv);
          if (s > 0.994) {
            float twinkle = 0.65 + 0.35 * sin(uTime * 2.4 + s * 100.0);
            sky += vec3(0.88, 0.93, 1.0) * uNightFactor * twinkle * smoothstep(0.05, 0.35, dir.y);
          }
        }

        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;

  const _zenDay = new THREE.Color('#1e40af');
  const _midDay = new THREE.Color('#60a5fa');
  const _horDay = new THREE.Color('#bae6fd');

  const _zenSet = new THREE.Color('#312e81');
  const _midSet = new THREE.Color('#c2410c');
  const _horSet = new THREE.Color('#fdba74');

  const _zenNight = new THREE.Color('#020617');
  const _midNight = new THREE.Color('#0f172a');
  const _horNight = new THREE.Color('#1e293b');

  const _overcast = new THREE.Color('#64748b');
  const _fogGrey = new THREE.Color('#94a3b8');

  return {
    mesh,
    update(cameraPos, sunDirection, dayFactor, sunsetFactor, rainFactor, fogFactor, elapsedTime) {
      mesh.position.copy(cameraPos);
      uniforms.uSunDir.value.copy(sunDirection).normalize();
      uniforms.uNightFactor.value = 1 - dayFactor;
      uniforms.uTime.value = elapsedTime;

      uniforms.uZenithColor.value
        .copy(_zenNight)
        .lerp(_zenDay, dayFactor)
        .lerp(_zenSet, sunsetFactor * 0.65);
      uniforms.uMidColor.value
        .copy(_midNight)
        .lerp(_midDay, dayFactor)
        .lerp(_midSet, sunsetFactor * 0.72);
      uniforms.uHorizonColor.value
        .copy(_horNight)
        .lerp(_horDay, dayFactor)
        .lerp(_horSet, sunsetFactor * 0.85);

      const weatherBlend = Math.max(rainFactor * 0.75, fogFactor * 0.72);
      if (weatherBlend > 0.01) {
        const wCol = rainFactor >= fogFactor ? _overcast : _fogGrey;
        uniforms.uZenithColor.value.lerp(wCol, weatherBlend);
        uniforms.uMidColor.value.lerp(wCol, weatherBlend);
        uniforms.uHorizonColor.value.lerp(wCol, weatherBlend);
      }

      uniforms.uCloudOpacity.value = 0.52 + rainFactor * 0.35 - fogFactor * 0.25;
    },
    getHorizonColor(target) {
      return target.copy(uniforms.uHorizonColor.value);
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
