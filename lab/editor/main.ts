// MarkovJunior Model Editor: split-screen code editor & real-time 3D Three.js viewport.

import * as THREE from 'three';
import { CATALOG, GROUPS } from '../3d/catalog';
import { highlightXml, validateMjx, type ValidationResult } from './syntax';
import type { EditorBuildRequest, EditorBuildResponse } from './worker';
import { Bloom } from '../../src/render/bloom';
import { glowing } from '../../src/render/materials';
import type { MeshData } from '../../src/mj/mesh';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// ------------------------------------------------------------------ Starter templates

const TEMPLATE_CUBE = `<!-- Cubo elementare con gradiente di colore -->
<sequence values="0BGY" size="12 12 12">
  <box at="6 6 0" size="10 10 2" color="B"/>
  <box at="6 6 2" size="8 8 4" color="G"/>
  <box at="6 6 6" size="6 6 4" color="Y"/>
</sequence>`;

// ------------------------------------------------------------------ Worker Pool

class WorkerClient {
  private worker: Worker;
  private currentId = 0;
  private pending: Map<number, (res: EditorBuildResponse) => void> = new Map();

  constructor() {
    this.worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (ev: MessageEvent<EditorBuildResponse>) => {
      const handler = this.pending.get(ev.data.id);
      if (handler) {
        this.pending.delete(ev.data.id);
        handler(ev.data);
      }
    };
  }

  build(req: Omit<EditorBuildRequest, 'id'>): Promise<EditorBuildResponse> {
    const id = ++this.currentId;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      this.worker.postMessage({ ...req, id } satisfies EditorBuildRequest);
    });
  }

  get latestId() {
    return this.currentId;
  }
}

const workerClient = new WorkerClient();

// ------------------------------------------------------------------ 3D Three.js Scene

const canvas = $<HTMLCanvasElement>('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0e14);

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500);

// Lighting
const hemiLight = new THREE.HemisphereLight(0xdcecff, 0x222a3a, 1.2);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff5e6, 2.2);
sun.position.set(12, 20, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun);

const fillLight = new THREE.DirectionalLight(0x6080b0, 0.6);
fillLight.position.set(-12, 10, -14);
scene.add(fillLight);

// Ground Grid Helper
const gridHelper = new THREE.GridHelper(16, 16, 0x38bdf8, 0x1e293b);
gridHelper.position.y = -0.001;
scene.add(gridHelper);

// Materials & Bloom
const matMesh = glowing(new THREE.MeshLambertMaterial({ vertexColors: true }), 'editor');
const bloom = new Bloom(renderer, scene, camera, 0.85, 0.4);

// Active model mesh & bounding box
let currentMesh: THREE.Mesh | null = null;
let currentBBox: THREE.Box3Helper | null = null;

function createBufferGeometry(m: MeshData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(m.colors, 3));
  if (m.glow) geo.setAttribute('glow', new THREE.BufferAttribute(m.glow, 1));
  geo.setIndex(new THREE.BufferAttribute(m.indices, 1));
  geo.computeBoundingSphere();
  geo.computeBoundingBox();
  return geo;
}

// ------------------------------------------------------------------ Orbit Controls

interface CamState {
  yaw: number;
  pitch: number;
  dist: number;
  target: THREE.Vector3;
}

const cam: CamState = {
  yaw: Math.PI / 4,
  pitch: 0.55,
  dist: 8,
  target: new THREE.Vector3(0, 0.5, 0),
};

let isDragging = false;
let isPanning = false;
let dragPrev = { x: 0, y: 0 };

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  dragPrev = { x: e.clientX, y: e.clientY };
  if (e.button === 2) {
    // Right button: free orbit
    isDragging = true;
    isPanning = false;
  } else if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
    // Middle button or Shift+Left: pan
    isPanning = true;
    isDragging = false;
  } else if (e.button === 0) {
    // Left button: orbit
    isDragging = true;
    isPanning = false;
  }
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!isDragging && !isPanning) return;
  const dx = e.clientX - dragPrev.x;
  const dy = e.clientY - dragPrev.y;
  dragPrev = { x: e.clientX, y: e.clientY };

  if (isDragging) {
    cam.yaw -= dx * 0.007;
    cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.005, 0.05, 1.55);
  } else if (isPanning) {
    // Move target parallel to camera view plane
    const right = new THREE.Vector3(Math.cos(cam.yaw), 0, -Math.sin(cam.yaw));
    const up = new THREE.Vector3(0, 1, 0);
    const factor = cam.dist * 0.0018;
    cam.target.addScaledVector(right, -dx * factor);
    cam.target.addScaledVector(up, dy * factor);
  }
});

const endDrag = (e: PointerEvent) => {
  isDragging = false;
  isPanning = false;
  try {
    canvas.releasePointerCapture(e.pointerId);
  } catch {}
};

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    cam.dist = THREE.MathUtils.clamp(cam.dist * factor, 1.2, 80);
  },
  { passive: false },
);

function fitCameraToMesh(box: THREE.Box3) {
  const center = new THREE.Vector3();
  box.getCenter(center);
  cam.target.copy(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z, 0.5);
  cam.dist = maxDim * 2.5;
}

// ------------------------------------------------------------------ Resize Handling

function updateViewportSize() {
  const container = $('pane-view');
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w <= 0 || h <= 0) return;
  renderer.setSize(w, h, false);
  bloom.setSize(w, h, renderer.getPixelRatio());
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(() => updateViewportSize());
resizeObserver.observe($('pane-view'));

// ------------------------------------------------------------------ Render Loop

let lastTime = performance.now();
let enableBloom = true;

function animate(now: number) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  const off = new THREE.Vector3(
    Math.sin(cam.yaw) * Math.cos(cam.pitch),
    Math.sin(cam.pitch),
    Math.cos(cam.yaw) * Math.cos(cam.pitch),
  ).multiplyScalar(cam.dist);

  camera.position.copy(cam.target).add(off);
  camera.lookAt(cam.target);

  if (enableBloom) {
    bloom.render(dt);
  } else {
    renderer.render(scene, camera);
  }
}

requestAnimationFrame(animate);

// ------------------------------------------------------------------ Resizable Splitter

const splitter = $('splitter');
const paneCode = $('pane-code');
let isSplitting = false;

splitter.addEventListener('pointerdown', (e) => {
  isSplitting = true;
  splitter.classList.add('dragging');
  splitter.setPointerCapture(e.pointerId);
  e.preventDefault();
});

window.addEventListener('pointermove', (e) => {
  if (!isSplitting) return;
  const containerWidth = $('main-split').clientWidth;
  const newWidth = THREE.MathUtils.clamp(e.clientX, 280, containerWidth - 280);
  const pct = (newWidth / containerWidth) * 100;
  paneCode.style.width = `${pct}%`;
  updateViewportSize();
});

window.addEventListener('pointerup', (e) => {
  if (!isSplitting) return;
  isSplitting = false;
  splitter.classList.remove('dragging');
  try {
    splitter.releasePointerCapture(e.pointerId);
  } catch {}
  updateViewportSize();
});

// ------------------------------------------------------------------ Code Editor & UI Sync

const codeInput = $<HTMLTextAreaElement>('code-input');
const codeOutput = $<HTMLElement>('code-output');
const highlightLayer = $<HTMLElement>('highlight-layer');
const gutter = $('gutter');
const statusPill = $('status-pill');
const statusText = $('status-text');
const diagnostics = $('diagnostics');
const presetSelect = $<HTMLSelectElement>('preset-select');
const seedInput = $<HTMLInputElement>('seed-input');
const vptSelect = $<HTMLSelectElement>('vpt-select');
const cursorPos = $('cursor-pos');
const loadingOverlay = $('loading-overlay');
const viewportInfo = $('viewport-info');

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function updateGutter(lineCount: number, errorLine?: number) {
  gutter.innerHTML = '';
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= lineCount; i++) {
    const lineEl = document.createElement('div');
    lineEl.className = 'gutter-line' + (errorLine === i ? ' error-line' : '');
    lineEl.textContent = String(i);
    lineEl.onclick = () => jumpToLine(i);
    frag.appendChild(lineEl);
  }
  gutter.appendChild(frag);
}

function syncScroll() {
  highlightLayer.scrollTop = codeInput.scrollTop;
  highlightLayer.scrollLeft = codeInput.scrollLeft;
  gutter.scrollTop = codeInput.scrollTop;
}

function updateCursorPos() {
  const pos = codeInput.selectionStart;
  const textBefore = codeInput.value.slice(0, pos);
  const lines = textBefore.split('\n');
  const line = lines.length;
  const col = lines[lines.length - 1].length + 1;
  cursorPos.textContent = `Riga ${line}, Col ${col}`;
}

function jumpToLine(line: number) {
  const lines = codeInput.value.split('\n');
  let offset = 0;
  for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
    offset += lines[i].length + 1;
  }
  const lineLen = lines[line - 1]?.length ?? 0;
  codeInput.focus();
  codeInput.setSelectionRange(offset, offset + lineLen);

  const lineHeight = 20;
  codeInput.scrollTop = Math.max(0, (line - 4) * lineHeight);
  syncScroll();
}

function renderDiagnostics(
  res: ValidationResult,
  buildRes?: EditorBuildResponse,
) {
  diagnostics.innerHTML = '';

  if (!res.ok) {
    statusPill.className = 'status-pill error';
    statusText.textContent = `Errore (riga ${res.line})`;

    const errEl = document.createElement('div');
    errEl.className = 'diag-error';
    errEl.innerHTML = `<span>✕</span><div><strong>Riga ${res.line}:</strong> ${res.error}</div>`;
    errEl.onclick = () => jumpToLine(res.line);
    diagnostics.appendChild(errEl);
    return;
  }

  if (res.warnings.length > 0) {
    statusPill.className = 'status-pill warning';
    statusText.textContent = `${res.warnings.length} avviso/i`;
    for (const w of res.warnings) {
      const warnEl = document.createElement('div');
      warnEl.className = 'diag-warning';
      warnEl.innerHTML = `<span>⚠</span><div>${w}</div>`;
      diagnostics.appendChild(warnEl);
    }
  } else {
    statusPill.className = 'status-pill valid';
    statusText.textContent = 'Valido';
  }

  if (buildRes && buildRes.ok) {
    const statsEl = document.createElement('div');
    statsEl.className = 'diag-stats';
    const g = buildRes.grid;
    const info = buildRes.info;
    statsEl.innerHTML = `
      <div>Griglia: <b>${g.X}×${g.Y}×${g.Z}</b></div>
      <div>Voxel: <b>${g.solidCount.toLocaleString('it')}</b></div>
      <div>Triangoli: <b>${info.triangles.toLocaleString('it')}</b></div>
      <div>Passi: <b>${info.steps}</b></div>
      <div>Tempo: <b>${info.ms} ms</b></div>
      <div>Stato: <b>${info.finished ? 'Completato' : 'Limite passi'}</b></div>
    `;
    diagnostics.appendChild(statsEl);
  }
}

async function triggerBuild() {
  const xml = codeInput.value;
  const seed = parseInt(seedInput.value, 10) || 1;
  const vpt = parseInt(vptSelect.value, 10) || 20;

  // Immediate synchronous validation
  const val = validateMjx(xml);

  const lines = xml.split('\n');
  updateGutter(lines.length, val.ok ? undefined : val.line);

  if (!val.ok) {
    renderDiagnostics(val);
    loadingOverlay.classList.add('hidden');
    return;
  }

  loadingOverlay.classList.remove('hidden');

  try {
    const res = await workerClient.build({ xml, seed, vpt });
    loadingOverlay.classList.add('hidden');

    if (!res.ok) {
      renderDiagnostics({ ok: false, error: res.error, line: res.errorLine });
      updateGutter(lines.length, res.errorLine);
      return;
    }

    renderDiagnostics(val, res);

    // Update Three.js mesh
    if (currentMesh) {
      scene.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh = null;
    }
    if (currentBBox) {
      scene.remove(currentBBox);
      currentBBox.dispose();
      currentBBox = null;
    }

    const geo = createBufferGeometry(res.mesh);
    currentMesh = new THREE.Mesh(geo, matMesh);
    currentMesh.castShadow = true;
    currentMesh.receiveShadow = true;
    scene.add(currentMesh);

    // Bounding Box Helper
    const box = new THREE.Box3().setFromObject(currentMesh);
    currentBBox = new THREE.Box3Helper(box, new THREE.Color(0x38bdf8));
    scene.add(currentBBox);

    viewportInfo.textContent = `Griglia ${res.grid.X}×${res.grid.Y}×${res.grid.Z} · ${res.grid.solidCount.toLocaleString('it')} voxel · ${res.info.triangles.toLocaleString('it')} triangoli`;
  } catch (err: unknown) {
    loadingOverlay.classList.add('hidden');
    renderDiagnostics({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      line: 1,
    });
  }
}

function onCodeChange() {
  const code = codeInput.value;
  codeOutput.innerHTML = highlightXml(code) + '\n';
  syncScroll();
  updateCursorPos();

  const lines = code.split('\n');
  const val = validateMjx(code);
  updateGutter(lines.length, val.ok ? undefined : val.line);
  renderDiagnostics(val);

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void triggerBuild();
  }, 350);
}

// ------------------------------------------------------------------ Event Listeners

codeInput.addEventListener('input', onCodeChange);
codeInput.addEventListener('scroll', syncScroll);
codeInput.addEventListener('click', updateCursorPos);
codeInput.addEventListener('keyup', updateCursorPos);

codeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeInput.selectionStart;
    const end = codeInput.selectionEnd;
    codeInput.setRangeText('  ', start, end, 'end');
    onCodeChange();
  } else if (e.key === 'Enter') {
    // Preserve auto-indentation
    const start = codeInput.selectionStart;
    const textBefore = codeInput.value.slice(0, start);
    const lastLine = textBefore.split('\n').pop() || '';
    const match = /^(\s+)/.exec(lastLine);
    if (match) {
      e.preventDefault();
      const indent = match[1];
      codeInput.setRangeText('\n' + indent, start, codeInput.selectionEnd, 'end');
      onCodeChange();
    }
  } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    void triggerBuild();
  }
});

// Seed controls
seedInput.addEventListener('change', () => void triggerBuild());

$('btn-rand-seed').addEventListener('click', () => {
  seedInput.value = String(Math.floor(Math.random() * 99999) + 1);
  void triggerBuild();
});

vptSelect.addEventListener('change', () => void triggerBuild());
$('btn-run').addEventListener('click', () => void triggerBuild());

// Format XML
$('btn-format').addEventListener('click', () => {
  try {
    const raw = codeInput.value;
    // Format simple indentation
    let formatted = '';
    let indent = 0;
    const tokens = raw.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/g);
    for (const t of tokens) {
      if (!t.trim()) continue;
      if (t.startsWith('</')) {
        indent = Math.max(0, indent - 1);
      }
      formatted += '  '.repeat(indent) + t.trim() + '\n';
      if (t.startsWith('<') && !t.startsWith('</') && !t.endsWith('/>') && !t.startsWith('<!--') && !t.startsWith('<?')) {
        indent++;
      }
    }
    codeInput.value = formatted.trim();
    onCodeChange();
  } catch {}
});

// Copy XML
$('btn-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(codeInput.value);
    const btn = $('btn-copy');
    const oldText = btn.textContent;
    btn.textContent = 'Copiato!';
    setTimeout(() => (btn.textContent = oldText), 1500);
  } catch {}
});

// Export XML
$('btn-export').addEventListener('click', () => {
  const blob = new Blob([codeInput.value], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${presetSelect.value || 'modello'}.xml`;
  a.click();
  URL.revokeObjectURL(url);
});

// Viewport Camera Controls
$('btn-cam-reset').addEventListener('click', () => {
  if (currentMesh) {
    const box = new THREE.Box3().setFromObject(currentMesh);
    fitCameraToMesh(box);
  } else {
    cam.target.set(0, 0.5, 0);
    cam.dist = 8;
  }
});

$('btn-cam-iso').addEventListener('click', () => {
  cam.yaw = Math.PI / 4;
  cam.pitch = 0.55;
});

$('btn-cam-top').addEventListener('click', () => {
  cam.yaw = 0;
  cam.pitch = 1.54;
});

$('btn-cam-front').addEventListener('click', () => {
  cam.yaw = 0;
  cam.pitch = 0.05;
});

$('btn-cam-side').addEventListener('click', () => {
  cam.yaw = Math.PI / 2;
  cam.pitch = 0.05;
});

$('btn-toggle-grid').addEventListener('click', () => {
  gridHelper.visible = !gridHelper.visible;
  $('btn-toggle-grid').classList.toggle('active', gridHelper.visible);
});

$('btn-toggle-bounds').addEventListener('click', () => {
  if (currentBBox) {
    currentBBox.visible = !currentBBox.visible;
    $('btn-toggle-bounds').classList.toggle('active', currentBBox.visible);
  }
});

$('btn-toggle-wireframe').addEventListener('click', () => {
  matMesh.wireframe = !matMesh.wireframe;
  $('btn-toggle-wireframe').classList.toggle('active', matMesh.wireframe);
});

$('btn-toggle-bloom').addEventListener('click', () => {
  enableBloom = !enableBloom;
  $('btn-toggle-bloom').classList.toggle('active', enableBloom);
});

// ------------------------------------------------------------------ Preset Catalog

function populatePresets() {
  presetSelect.innerHTML = '';

  const optBlank = document.createElement('option');
  optBlank.value = 'template:cube';
  optBlank.textContent = '★ Cubo base (template)';
  presetSelect.appendChild(optBlank);

  for (const [groupName, filter] of GROUPS) {
    const groupEl = document.createElement('optgroup');
    groupEl.label = groupName;
    const items = CATALOG.filter(filter);
    for (const e of items) {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.name;
      groupEl.appendChild(opt);
    }
    presetSelect.appendChild(groupEl);
  }

  presetSelect.addEventListener('change', () => {
    loadSelectedPreset();
  });
}

function loadSelectedPreset() {
  const val = presetSelect.value;
  if (val === 'template:cube') {
    codeInput.value = TEMPLATE_CUBE;
    vptSelect.value = '20';
    seedInput.value = '1';
    onCodeChange();
    void triggerBuild().then(() => {
      if (currentMesh) fitCameraToMesh(new THREE.Box3().setFromObject(currentMesh));
    });
    return;
  }

  const entry = CATALOG.find((e) => e.id === val);
  if (!entry) return;

  codeInput.value = entry.xml.trim();
  vptSelect.value = String(entry.vpt || 20);
  seedInput.value = '1';
  onCodeChange();
  void triggerBuild().then(() => {
    if (currentMesh) fitCameraToMesh(new THREE.Box3().setFromObject(currentMesh));
  });
}

// ------------------------------------------------------------------ Initial Setup

populatePresets();

// Choose 'casetta' or 'barile' as default if available, otherwise template
const defaultEntry = CATALOG.find((e) => e.id === 'casetta') || CATALOG.find((e) => e.id === 'barile');
if (defaultEntry) {
  presetSelect.value = defaultEntry.id;
  loadSelectedPreset();
} else {
  presetSelect.value = 'template:cube';
  loadSelectedPreset();
}

updateViewportSize();
