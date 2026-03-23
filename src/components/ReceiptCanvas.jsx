import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ClothSimulation from '../physics/ClothSimulation';
import createReceiptTexture from '../utils/receiptTexture';

/* ── Receipt dimensions ── */
const RW = 0.14;   // width  (meters)
const RH = 0.20;   // height (meters)
const NX = 25;     // grid cols
const NY = 50;     // grid rows

export default function ReceiptCanvas({ className }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    /* ══════════════════════════════════════════
     *  RENDERER
     * ══════════════════════════════════════════ */
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    /* ══════════════════════════════════════════
     *  SCENE & CAMERA
     * ══════════════════════════════════════════ */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFAF8F5);

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.01, 50);
    camera.position.set(0, 0.02, 0.55);

    const lookTarget = new THREE.Vector3(0, -0.09, 0);
    camera.lookAt(lookTarget);

    /* ══════════════════════════════════════════
     *  LIGHTS
     * ══════════════════════════════════════════ */
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.6));

    const sun = new THREE.DirectionalLight(0xfff5e8, 1.25);
    sun.position.set(0.35, 0.7, 0.55);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.01;
    sun.shadow.camera.far = 3;
    sun.shadow.camera.left = -0.4;
    sun.shadow.camera.right = 0.4;
    sun.shadow.camera.top = 0.4;
    sun.shadow.camera.bottom = -0.4;
    sun.shadow.bias = -0.0008;
    sun.shadow.radius = 4;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xe8f0ff, 0.28);
    fill.position.set(-0.3, 0.15, 0.35);
    scene.add(fill);

    const rim = new THREE.PointLight(0xffeedd, 0.35, 1.5);
    rim.position.set(0, -0.12, -0.3);
    scene.add(rim);

    /* ══════════════════════════════════════════
     *  GROUND
     * ══════════════════════════════════════════ */
    const groundShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.ShadowMaterial({ opacity: 0.07 }),
    );
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.y = -0.24;
    groundShadow.receiveShadow = true;
    scene.add(groundShadow);

    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshStandardMaterial({ color: 0xF5F0EA, roughness: 1, metalness: 0 }),
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.2401;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    /* ══════════════════════════════════════════
     *  CLOTH SIMULATION
     * ══════════════════════════════════════════ */
    const sim = new ClothSimulation({ width: RW, height: RH, cols: NX, rows: NY });

    /* ══════════════════════════════════════════
     *  RECEIPT MESH
     * ══════════════════════════════════════════ */
    const geometry = new THREE.PlaneGeometry(RW, RH, NX, NY);

    // Override UVs: compute from original positions (canvas top → v=0)
    const uvArr = geometry.getAttribute('uv').array;
    for (let i = 0; i < sim.particles.length; i++) {
      uvArr[i * 2] = sim.particles[i].u;
      uvArr[i * 2 + 1] = 1 - sim.particles[i].v;
    }
    geometry.getAttribute('uv').needsUpdate = true;

    // Initial vertex positions
    const posArr = geometry.getAttribute('position').array;
    for (let i = 0; i < sim.particles.length; i++) {
      posArr[i * 3] = sim.particles[i].pos.x;
      posArr[i * 3 + 1] = sim.particles[i].pos.y;
      posArr[i * 3 + 2] = sim.particles[i].pos.z;
    }
    geometry.computeVertexNormals();

    const texture = createReceiptTexture();
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.82,
      metalness: 0.0,
      side: THREE.DoubleSide,
      color: 0xFCF9F3,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    /* ══════════════════════════════════════════
     *  DRAG CURSOR INDICATOR
     * ══════════════════════════════════════════ */
    const cursorMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.003, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xC4956A, transparent: true, opacity: 0.55 }),
    );
    cursorMesh.visible = false;
    scene.add(cursorMesh);

    /* ══════════════════════════════════════════
     *  INTERACTION STATE
     * ══════════════════════════════════════════ */
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const intersectPoint = new THREE.Vector3();
    const dragOffset = new THREE.Vector3();

    let isDragging = false;
    let dragParticleIdx = -1;
    let isOrbiting = false;
    let orbitStartX = 0;
    let orbitStartY = 0;
    let orbitTheta = 0;
    let orbitPhi = 0.05;
    const orbitRadius = 0.55;

    /* ── Helpers ── */

    function updateMouseNDC(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function findNearestParticle(point) {
      let best = Infinity, idx = 0;
      for (let i = 0; i < sim.particles.length; i++) {
        const d = sim.particles[i].pos.distanceToSquared(point);
        if (d < best) { best = d; idx = i; }
      }
      return idx;
    }

    function updateCameraOrbit() {
      camera.position.set(
        lookTarget.x + orbitRadius * Math.sin(orbitTheta) * Math.cos(orbitPhi),
        lookTarget.y + orbitRadius * Math.sin(orbitPhi),
        lookTarget.z + orbitRadius * Math.cos(orbitTheta) * Math.cos(orbitPhi),
      );
      camera.lookAt(lookTarget);
    }

    /* ── Pointer event handlers ── */

    function onPointerDown(e) {
      if (e.button === 0) {
        // Left-click: start drag
        updateMouseNDC(e);
        raycaster.setFromCamera(mouseNDC, camera);
        const hits = raycaster.intersectObject(mesh);
        if (!hits.length) return;

        isDragging = true;
        container.style.cursor = 'grabbing';

        const hitPoint = hits[0].point;
        dragParticleIdx = findNearestParticle(hitPoint);
        dragOffset.copy(hitPoint).sub(sim.particles[dragParticleIdx].pos);
        dragPlane.setFromNormalAndCoplanarPoint(
          camera.getWorldDirection(new THREE.Vector3()).negate(),
          hitPoint,
        );
        cursorMesh.visible = true;
        cursorMesh.position.copy(hitPoint);
      } else if (e.button === 2) {
        // Right-click: start orbit
        isOrbiting = true;
        orbitStartX = e.clientX;
        orbitStartY = e.clientY;
      }
    }

    function onPointerMove(e) {
      if (isDragging) {
        updateMouseNDC(e);
        raycaster.setFromCamera(mouseNDC, camera);
        if (!raycaster.ray.intersectPlane(dragPlane, intersectPoint)) return;

        const target = intersectPoint.sub(dragOffset);
        const ri = dragParticleIdx % sim.sx;
        const rj = Math.floor(dragParticleIdx / sim.sx);

        // Apply drag force to 3×3 neighborhood with falloff
        for (let di = -3; di <= 3; di++) {
          for (let dj = -3; dj <= 3; dj++) {
            const ci = ri + di, cj = rj + dj;
            if (ci < 0 || ci >= sim.sx || cj < 0 || cj >= sim.sy) continue;
            const pi = cj * sim.sx + ci;
            if (sim.particles[pi].pin) continue;
            const dist = Math.sqrt(di * di + dj * dj);
            if (dist > 3.5) continue;
            const w = Math.max(0, 1 - dist / 3.5) * 0.65;
            sim.particles[pi].pos.lerp(target, w);
          }
        }
        cursorMesh.position.copy(target);
      }

      if (isOrbiting) {
        orbitTheta += (e.clientX - orbitStartX) * 0.005;
        orbitPhi = Math.max(-0.4, Math.min(0.6, orbitPhi + (e.clientY - orbitStartY) * 0.005));
        orbitStartX = e.clientX;
        orbitStartY = e.clientY;
        updateCameraOrbit();
      }
    }

    function onPointerUp(e) {
      if (e.button === 0 && isDragging) {
        isDragging = false;
        dragParticleIdx = -1;
        cursorMesh.visible = false;
        container.style.cursor = 'grab';
      }
      if (e.button === 2) {
        isOrbiting = false;
      }
    }

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('contextmenu', (e) => e.preventDefault());

    /* ── Resize ── */
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    /* ══════════════════════════════════════════
     *  ANIMATION LOOP
     * ══════════════════════════════════════════ */
    const clock = new THREE.Clock();
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.025);
      sim.step(dt);

      // Sync geometry vertices
      const positions = geometry.getAttribute('position').array;
      for (let i = 0; i < sim.particles.length; i++) {
        positions[i * 3] = sim.particles[i].pos.x;
        positions[i * 3 + 1] = sim.particles[i].pos.y;
        positions[i * 3 + 2] = sim.particles[i].pos.z;
      }
      geometry.getAttribute('position').needsUpdate = true;
      geometry.computeVertexNormals();

      renderer.render(scene, camera);
    }
    animate();

    /* ══════════════════════════════════════════
     *  CLEANUP
     * ══════════════════════════════════════════ */
    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%', cursor: 'grab' }} />;
}
