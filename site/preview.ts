// Interactive 3D Hero and Theme Showcase (T97, ADR-0095)
// Demonstrates Three.js usage outside the game, with retro-synthwave voxel artifacts and responsive controls.

import * as THREE from 'three';

export function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const parent = canvas.parentElement;
  const width = parent?.clientWidth || 500;
  const height = parent?.clientHeight || 500;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 18);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // --- Lighting ---
  const ambientLight = new THREE.AmbientLight(0x221133, 2.5);
  scene.add(ambientLight);

  const cyanPoint = new THREE.PointLight(0x00f0ff, 4, 30);
  cyanPoint.position.set(-6, 6, 8);
  scene.add(cyanPoint);

  const pinkPoint = new THREE.PointLight(0xff2a85, 5, 30);
  pinkPoint.position.set(6, -6, 8);
  scene.add(pinkPoint);

  const yellowKey = new THREE.DirectionalLight(0xffe600, 1.2);
  yellowKey.position.set(0, 10, 5);
  scene.add(yellowKey);

  // --- 3D MarkovJunior-style Voxel Artifact Group ---
  const artifactGroup = new THREE.Group();
  scene.add(artifactGroup);

  // Central Runic Monolith / Voxel Core
  const boxGeo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f0b18,
    roughness: 0.2,
    metalness: 0.8,
  });

  const cyanMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 0.8,
    roughness: 0.1,
  });

  const pinkMaterial = new THREE.MeshStandardMaterial({
    color: 0xff2a85,
    emissive: 0xff2a85,
    emissiveIntensity: 0.7,
    roughness: 0.1,
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xffe600,
    emissive: 0xffe600,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  // Assemble a cluster of voxels representing a runic MarkovJunior creation
  const voxelCoords = [
    // Core
    [0, 0, 0, 'gold'],
    [1, 0, 0, 'dark'], [-1, 0, 0, 'dark'], [0, 1, 0, 'dark'], [0, -1, 0, 'dark'], [0, 0, 1, 'cyan'], [0, 0, -1, 'pink'],
    // Outer wings
    [2, 0, 0, 'cyan'], [-2, 0, 0, 'pink'], [0, 2, 0, 'cyan'], [0, -2, 0, 'pink'],
    [1, 1, 0, 'dark'], [-1, 1, 0, 'dark'], [1, -1, 0, 'dark'], [-1, -1, 0, 'dark'],
    // Floating satellite voxels
    [2, 2, 1, 'pink'], [-2, 2, -1, 'cyan'], [2, -2, -1, 'cyan'], [-2, -2, 1, 'gold'],
    [0, 3, 0, 'gold'], [0, -3, 0, 'cyan'], [3, 0, 0, 'pink'], [-3, 0, 0, 'gold']
  ] as const;

  voxelCoords.forEach(([x, y, z, type]) => {
    let mat = darkMaterial;
    if (type === 'cyan') mat = cyanMaterial;
    else if (type === 'pink') mat = pinkMaterial;
    else if (type === 'gold') mat = goldMaterial;

    const mesh = new THREE.Mesh(boxGeo, mat);
    mesh.position.set(x, y, z);
    artifactGroup.add(mesh);
  });

  // Surrounding neon orbit rings
  const ringGeo = new THREE.TorusGeometry(5, 0.06, 8, 48);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
  const ring1 = new THREE.Mesh(ringGeo, ringMat);
  ring1.rotation.x = Math.PI / 3;
  scene.add(ring1);

  const ringGeo2 = new THREE.TorusGeometry(6.2, 0.05, 8, 48);
  const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xff2a85, transparent: true, opacity: 0.5 });
  const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
  ring2.rotation.y = Math.PI / 4;
  scene.add(ring2);

  // Floating ambient particles
  const particleCount = 60;
  const partGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 24;
    positions[i + 1] = (Math.random() - 0.5) * 24;
    positions[i + 2] = (Math.random() - 0.5) * 16;
  }
  partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const partMat = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 0.15,
    transparent: true,
    opacity: 0.7,
  });
  const particles = new THREE.Points(partGeo, partMat);
  scene.add(particles);

  // Mouse interaction
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (
      e.clientX >= rect.left - 200 &&
      e.clientX <= rect.right + 200 &&
      e.clientY >= rect.top - 200 &&
      e.clientY <= rect.bottom + 200
    ) {
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    }
  });

  // Responsive resize
  window.addEventListener('resize', () => {
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animation Loop
  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse follow
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;

    artifactGroup.rotation.y = elapsed * 0.35 + mouseX * 0.8;
    artifactGroup.rotation.x = Math.sin(elapsed * 0.25) * 0.2 - mouseY * 0.6;
    artifactGroup.position.y = Math.sin(elapsed * 1.2) * 0.3;

    ring1.rotation.z = elapsed * 0.2;
    ring2.rotation.z = -elapsed * 0.15;
    particles.rotation.y = elapsed * 0.05;

    renderer.render(scene, camera);
  }

  animate();
}

// Interactive card click flip
export function initCardInteractions() {
  const card = document.getElementById('demo-card');
  if (card) {
    let flipped = false;
    card.addEventListener('click', () => {
      flipped = !flipped;
      card.style.transform = flipped
        ? 'rotateY(180deg) scale(1.06)'
        : '';
    });
  }
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    initHeroCanvas();
    initCardInteractions();
  });
}
