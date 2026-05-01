import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/postprocessing/UnrealBloomPass.js";

const canvas = document.querySelector("#optimization-canvas");
const tooltip = document.querySelector("[data-tooltip]");
const detailPanel = document.querySelector("[data-detail-panel]");
const labelsLayer = document.querySelector(".category-labels");
const resetButton = document.querySelector("[data-reset-view]");
const scoreButtons = [...document.querySelectorAll("[data-category-button]")];
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ─── Paleta verde Maioli ───────────────────────────────────────────
// Antes: #38bdf8 (azul), #31f7a1 (verde-água), #a855f7 (roxo)
// Agora: #35c878 (verde primário), #9be7b5 (menta), #1ead8a (verde profundo)
const PALETTE = {
  primary: "#35c878",   // verde Maioli — cor base da marca
  mint:    "#9be7b5",   // verde menta — destaques, acessibilidade
  deep:    "#1ead8a",   // verde profundo — contraste, profundidade
};

const categories = [
  {
    id: "acessibilidade",
    label: "Acessibilidade",
    score: 92,
    accent: PALETTE.mint,       // menta — score alto, identidade inclusiva
    angle: 0,
    summary: "Experiência inclusiva, semântica e navegável.",
    explanation: "Garante que o site seja claro, acessível por teclado e compatível com tecnologias assistivas.",
    tips: ["Contraste visual claro para leitura rápida.", "Navegação por teclado e foco visível.", "Estrutura semântica preparada para leitores de tela."]
  },
  {
    id: "seo",
    label: "SEO",
    score: 88,
    accent: PALETTE.primary,    // verde principal — score bom, visibilidade
    angle: Math.PI / 2,
    summary: "Estrutura preparada para descoberta orgânica.",
    explanation: "Organiza conteúdo e metadados para ajudar mecanismos de busca a entenderem melhor cada página.",
    tips: ["Títulos e descrições únicos por página.", "Hierarquia de headings consistente.", "URLs, imagens e marcação semântica otimizadas."]
  },
  {
    id: "performance",
    label: "Performance",
    score: 75,
    accent: "#facc15",           // âmbar — score médio, alerta construtivo
    angle: Math.PI,
    summary: "Carregamento rápido e renderização fluida.",
    explanation: "Reduz bloqueios, peso de assets e atrasos visuais para entregar uma navegação mais rápida.",
    tips: ["Imagens leves e carregamento sob demanda.", "CSS e JavaScript sem bloqueios desnecessários.", "Animações otimizadas para manter FPS alto."]
  },
  {
    id: "boas-praticas",
    label: "Boas práticas",
    score: 95,
    accent: PALETTE.deep,       // verde profundo — score excelente, solidez técnica
    angle: Math.PI * 1.5,
    summary: "Base técnica moderna, segura e confiável.",
    explanation: "Mantém a experiência estável usando APIs atuais, HTTPS e padrões seguros de front-end.",
    tips: ["Sem erros críticos no console.", "Recursos servidos com segurança.", "APIs modernas e compatíveis com navegadores atuais."]
  }
];

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  hovered: null,
  selected: categories[0],
  targetCameraPosition: new THREE.Vector3(0, 1.15, 7.2),
  targetLookAt: new THREE.Vector3(0, 0, 0),
  currentLookAt: new THREE.Vector3(0, 0, 0),
  pointer: new THREE.Vector2(),
  lastPointer: { x: 0, y: 0 },
  isVisible: true,
  isMobile: window.innerWidth < 720
};

let scene;
let camera;
let renderer;
let composer;
let controls;
let raycaster;
let coreGroup;
let particleField;
let categoryRoot;
let bloomPass;

const clock = new THREE.Clock();
const interactiveObjects = [];
const labelElements = new Map();
const tempVector = new THREE.Vector3();

init();

function init() {
  initScene();
  initCamera();
  initRenderer();
  initControls();
  initPostProcessing();
  createLights();
  createCore();
  createCategoryNodes();
  createParticles();
  bindEvents();
  setupZoomControls();
  setupZoomHint();
  updateDetailPanel(categories[0]);
  resetCamera(false);
  animate();
}

function initScene() {
  scene = new THREE.Scene();
  // Fog levemente esverdeada para coerência com a paleta
  scene.fog = new THREE.FogExp2(0x060e0a, 0.035);
  raycaster = new THREE.Raycaster();
  categoryRoot = new THREE.Group();
  scene.add(categoryRoot);
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(46, state.width / state.height, 0.1, 100);
  camera.position.copy(state.targetCameraPosition);
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(state.width, state.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, state.isMobile ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
}

function initControls() {
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 3.2;
  controls.maxDistance = 9.5;
  controls.autoRotate = !prefersReducedMotion;
  controls.autoRotateSpeed = 0.55;
  controls.target.copy(state.currentLookAt);
}

function initPostProcessing() {
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, state.isMobile ? 1.15 : 1.5));
  composer.setSize(state.width, state.height);
  composer.addPass(new RenderPass(scene, camera));

  bloomPass = new UnrealBloomPass(new THREE.Vector2(state.width, state.height), state.isMobile ? 0.55 : 0.85, 0.62, 0.12);
  composer.addPass(bloomPass);
}

function createLights() {
  // Ambient esverdeada
  scene.add(new THREE.AmbientLight(0x8fffc4, 0.24));

  // Luz principal: verde primário
  const mainLight = new THREE.PointLight(0x35c878, 4.2, 12);
  mainLight.position.set(0, 1.2, 1.8);
  scene.add(mainLight);

  // Luz secundária: verde profundo (substituí roxo)
  const deepLight = new THREE.PointLight(0x1ead8a, 3.0, 12);
  deepLight.position.set(-4, 3, -3);
  scene.add(deepLight);

  // Luz terciária: menta (substituí verde-água puro)
  const mintLight = new THREE.PointLight(0x9be7b5, 2.8, 12);
  mintLight.position.set(4, -2, 3);
  scene.add(mintLight);
}

function createCore() {
  coreGroup = new THREE.Group();
  scene.add(coreGroup);

  // Esfera interna com tint verde escuro
  const innerMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a1a0f,
    roughness: 0.18,
    metalness: 0.42,
    transmission: 0.18,
    transparent: true,
    opacity: 0.78,
    emissive: 0x0f2d18,
    emissiveIntensity: 0.38
  });
  const innerSphere = new THREE.Mesh(new THREE.SphereGeometry(1.08, 72, 72), innerMaterial);
  coreGroup.add(innerSphere);

  // Wireframe em verde primário
  const wireSphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.22, 36, 36),
    new THREE.MeshBasicMaterial({ color: 0x35c878, wireframe: true, transparent: true, opacity: 0.22 })
  );
  coreGroup.add(wireSphere);

  // Núcleo pulsante em menta
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x9be7b5, transparent: true, opacity: 0.72 })
  );
  glow.userData.pulse = true;
  coreGroup.add(glow);

  // Anéis em verde primário, menta e verde profundo
  const ringColors = [0x35c878, 0x9be7b5, 0x1ead8a];
  ringColors.forEach((color, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.5 + index * 0.18, 0.012, 16, 160),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.52 })
    );
    ring.rotation.x = Math.PI / 2 + index * 0.55;
    ring.rotation.y = index * 0.72;
    ring.userData.speed = 0.18 + index * 0.08;
    coreGroup.add(ring);
  });

  // Scanline branca sutil
  const scanLine = new THREE.Mesh(
    new THREE.TorusGeometry(1.28, 0.008, 12, 120),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 })
  );
  scanLine.rotation.x = Math.PI / 2;
  scanLine.userData.scan = true;
  coreGroup.add(scanLine);
}

function createCategoryNodes() {
  const orbitRadius = state.isMobile ? 2.65 : 3.35;

  categories.forEach((category) => {
    const group = new THREE.Group();
    const color = new THREE.Color(category.accent);
    const scoreColor = new THREE.Color(getScoreColor(category.score));
    const basePosition = new THREE.Vector3(
      Math.cos(category.angle) * orbitRadius,
      Math.sin(category.angle * 1.45) * 0.44,
      Math.sin(category.angle) * orbitRadius
    );

    group.position.copy(basePosition);
    group.userData.category = category;
    group.userData.baseAngle = category.angle;
    group.userData.radius = orbitRadius;

    const node = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.34, 3),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.25,
        roughness: 0.22,
        metalness: 0.55
      })
    );
    node.userData.category = category;
    node.userData.parentGroup = group;
    group.add(node);
    interactiveObjects.push(node);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.54, 36, 36),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    group.add(halo);

    const scoreRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.018, 14, 120, Math.PI * 2 * (category.score / 100)),
      new THREE.MeshBasicMaterial({ color: scoreColor, transparent: true, opacity: 0.94 })
    );
    scoreRing.rotation.z = -Math.PI / 2;
    group.add(scoreRing);

    const ringBack = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.009, 10, 120),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.10 })
    );
    group.add(ringBack);

    const trail = new THREE.Mesh(
      new THREE.TorusGeometry(orbitRadius, 0.004, 8, 220),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.11 })
    );
    trail.rotation.x = Math.PI / 2;
    scene.add(trail);

    const pointLight = new THREE.PointLight(color, 1.2, 3.2);
    group.add(pointLight);

    const label = document.createElement("span");
    label.className = "category-label";
    label.textContent = `${category.label} · ${category.score}`;
    label.style.setProperty("--label-color", category.accent);
    labelsLayer.appendChild(label);
    labelElements.set(category.id, label);

    categoryRoot.add(group);
    category.group = group;
    category.node = node;
    category.halo = halo;
    category.scoreRing = scoreRing;
  });
}

function createParticles() {
  const count = state.isMobile ? 420 : 1200;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  // Partículas totalmente na paleta verde
  const palette = [
    new THREE.Color(PALETTE.primary),
    new THREE.Color(PALETTE.mint),
    new THREE.Color(PALETTE.deep)
  ];

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * 20;
    positions[i3 + 1] = (Math.random() - 0.5) * 12;
    positions[i3 + 2] = (Math.random() - 0.5) * 20;

    const color = palette[i % palette.length];
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  particleField = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: state.isMobile ? 0.022 : 0.03, vertexColors: true, transparent: true, opacity: 0.68, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(particleField);
}

// ─── Controles de zoom por botão ─────────────────────────────────
function setupZoomControls() {
  const zoomIn  = document.querySelector("[data-zoom-in]");
  const zoomOut = document.querySelector("[data-zoom-out]");
  if (!zoomIn || !zoomOut) return;

  const STEP = 0.8;

  zoomIn.addEventListener("click", () => {
    const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
    const dist = camera.position.distanceTo(controls.target);
    if (dist - STEP >= controls.minDistance) {
      state.targetCameraPosition.addScaledVector(dir, STEP);
    }
    controls.autoRotate = false;
  });

  zoomOut.addEventListener("click", () => {
    const dir = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
    const dist = camera.position.distanceTo(controls.target);
    if (dist + STEP <= controls.maxDistance) {
      state.targetCameraPosition.addScaledVector(dir, -STEP);
    }
    controls.autoRotate = false;
  });
}

// ─── Hint de zoom (desaparece após interação) ─────────────────────
function setupZoomHint() {
  const hint = document.querySelector(".zoom-hint");
  if (!hint) return;

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    hint.classList.add("is-hidden");
  };

  // Esconde após primeira interação com o canvas ou após 5s
  canvas.addEventListener("pointerdown", dismiss, { once: true });
  canvas.addEventListener("wheel", dismiss, { once: true });
  setTimeout(dismiss, 5000);
}

function bindEvents() {
  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") resetCamera();
    // Zoom por teclado (+/-)
    if (event.key === "+" || event.key === "=") document.querySelector("[data-zoom-in]")?.click();
    if (event.key === "-") document.querySelector("[data-zoom-out]")?.click();
  });
  document.addEventListener("visibilitychange", () => {
    state.isVisible = document.visibilityState === "visible";
  });

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", clearHover);
  canvas.addEventListener("pointerdown", (event) => {
    state.pointerDown = { x: event.clientX, y: event.clientY };
    canvas.classList.add("is-dragging");
  });
  window.addEventListener("pointerup", onPointerUp);

  resetButton.addEventListener("click", () => resetCamera());
  scoreButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const category = categories.find((item) => item.id === button.dataset.categoryButton);
      if (category) selectCategory(category);
    });
  });

  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });
}

function onPointerMove(event) {
  state.lastPointer.x = event.clientX;
  state.lastPointer.y = event.clientY;
  updatePointer(event);
  raycaster.setFromCamera(state.pointer, camera);
  const [hit] = raycaster.intersectObjects(interactiveObjects, false);

  if (!hit) {
    clearHover();
    return;
  }

  const category = hit.object.userData.category;
  if (state.hovered?.id !== category.id) {
    state.hovered = category;
    canvas.classList.add("is-hovering");
    showTooltip(category, event.clientX, event.clientY);
  } else {
    moveTooltip(event.clientX, event.clientY);
  }
}

function onPointerUp(event) {
  canvas.classList.remove("is-dragging");
  const start = state.pointerDown;
  state.pointerDown = null;
  const dragDistance = start ? Math.hypot(event.clientX - start.x, event.clientY - start.y) : 0;
  if (dragDistance > 8) return;

  updatePointer(event);
  raycaster.setFromCamera(state.pointer, camera);
  const [hit] = raycaster.intersectObjects(interactiveObjects, false);
  if (hit) selectCategory(hit.object.userData.category);
}

function updatePointer(event) {
  const rect = canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function clearHover() {
  state.hovered = null;
  canvas.classList.remove("is-hovering");
  tooltip.classList.remove("is-visible");
}

function showTooltip(category, x, y) {
  tooltip.style.setProperty("--tooltip-color", category.accent);
  tooltip.innerHTML = `<strong>${category.label} · ${category.score}</strong><span>${category.summary}</span>`;
  tooltip.classList.add("is-visible");
  moveTooltip(x, y);
}

function moveTooltip(x, y) {
  const offset = 18;
  const maxX = window.innerWidth - tooltip.offsetWidth - 16;
  const maxY = window.innerHeight - tooltip.offsetHeight - 16;
  const nextX = Math.min(x + offset, maxX);
  const nextY = Math.min(y + offset, maxY);
  tooltip.style.transform = `translate3d(${Math.max(16, nextX)}px, ${Math.max(16, nextY)}px, 0) scale(1)`;
}

function selectCategory(category) {
  state.selected = category;
  controls.autoRotate = false;
  updateDetailPanel(category);
  updateActiveUi(category);

  category.group.getWorldPosition(tempVector);
  const direction = tempVector.clone().normalize();
  const sideOffset = new THREE.Vector3(-direction.z, 0.22, direction.x).multiplyScalar(state.isMobile ? 0.4 : 0.72);
  state.targetLookAt.copy(tempVector).multiplyScalar(0.72);
  state.targetCameraPosition.copy(tempVector).add(direction.multiplyScalar(state.isMobile ? 2.8 : 2.35)).add(sideOffset);
}

function resetCamera(smooth = true) {
  state.selected = null;
  controls.autoRotate = !prefersReducedMotion;
  state.targetCameraPosition.set(0, state.isMobile ? 1.5 : 1.15, state.isMobile ? 8.2 : 7.2);
  state.targetLookAt.set(0, 0, 0);
  updateActiveUi(null);

  if (!smooth) {
    camera.position.copy(state.targetCameraPosition);
    state.currentLookAt.copy(state.targetLookAt);
    controls.target.copy(state.currentLookAt);
  }
}

function updateDetailPanel(category) {
  const scoreColor = getScoreColor(category.score);
  detailPanel.style.setProperty("--detail-color", category.accent);
  detailPanel.innerHTML = `
    <div class="score-ring" style="--score: ${category.score}; --score-color: ${scoreColor}">
      <span>${category.score}</span>
    </div>
    <div>
      <h2>${category.label}</h2>
      <p>${category.explanation}</p>
    </div>
    <ul>
      ${category.tips.map((tip) => `<li>${tip}</li>`).join("")}
    </ul>
  `;
}

function updateActiveUi(category) {
  scoreButtons.forEach((button) => {
    const item = categories.find((metric) => metric.id === button.dataset.categoryButton);
    button.classList.toggle("is-active", Boolean(category && item.id === category.id));
    button.style.setProperty("--card-color", item.accent);
  });

  labelElements.forEach((label, id) => {
    label.classList.toggle("is-active", Boolean(category && id === category.id));
  });
}

function getScoreColor(score) {
  if (score >= 90) return PALETTE.mint;    // menta — excelente
  if (score >= 70) return "#facc15";       // âmbar — médio
  return "#fb7185";                        // rosa-vermelho — baixo
}

function onResize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.isMobile = state.width < 720;

  camera.aspect = state.width / state.height;
  camera.updateProjectionMatrix();

  renderer.setSize(state.width, state.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, state.isMobile ? 1.35 : 1.75));

  composer.setSize(state.width, state.height);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, state.isMobile ? 1.15 : 1.5));
  bloomPass.strength = state.isMobile ? 0.55 : 0.85;
}

function animate() {
  requestAnimationFrame(animate);
  if (!state.isVisible) return;

  const elapsed = clock.getElapsedTime();
  const delta = clock.getDelta();

  animateCore(elapsed, delta);
  animateCategories(elapsed);
  animateParticles(delta);
  updateLabels();

  camera.position.lerp(state.targetCameraPosition, prefersReducedMotion ? 0.22 : 0.055);
  state.currentLookAt.lerp(state.targetLookAt, prefersReducedMotion ? 0.22 : 0.07);
  controls.target.lerp(state.currentLookAt, 0.16);
  controls.update();
  camera.lookAt(state.currentLookAt);

  composer.render();
}

function animateCore(elapsed, delta) {
  coreGroup.rotation.y += delta * 0.16;
  coreGroup.rotation.x = Math.sin(elapsed * 0.28) * 0.05;

  coreGroup.children.forEach((child) => {
    if (child.userData.speed) {
      child.rotation.z += delta * child.userData.speed;
      child.rotation.y += delta * child.userData.speed * 0.55;
    }
    if (child.userData.pulse) {
      const pulse = 1 + Math.sin(elapsed * 2.4) * 0.12;
      child.scale.setScalar(pulse);
      child.material.opacity = 0.56 + Math.sin(elapsed * 2.4) * 0.12;
    }
    if (child.userData.scan) {
      child.position.y = Math.sin(elapsed * 1.25) * 0.72;
      child.scale.setScalar(0.86 + Math.cos(elapsed * 1.25) * 0.08);
    }
  });
}

function animateCategories(elapsed) {
  categories.forEach((category, index) => {
    const group = category.group;
    const speed = prefersReducedMotion ? 0 : 0.14;
    const angle = category.angle + elapsed * speed;
    const y = Math.sin(elapsed * 0.8 + index) * 0.22 + Math.sin(category.angle * 1.45) * 0.44;

    group.position.set(Math.cos(angle) * group.userData.radius, y, Math.sin(angle) * group.userData.radius);
    group.rotation.y += 0.01;
    group.rotation.x = Math.sin(elapsed + index) * 0.18;

    const isHovered = state.hovered?.id === category.id;
    const isSelected = state.selected?.id === category.id;
    const targetScale = isHovered || isSelected ? 1.32 : 1;
    group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
    category.node.material.emissiveIntensity = isHovered || isSelected ? 2.6 : 1.25;
    category.halo.material.opacity = isHovered || isSelected ? 0.34 : 0.16;
    category.scoreRing.rotation.z += 0.012;
  });
}

function animateParticles(delta) {
  if (!particleField) return;
  particleField.rotation.y += delta * 0.018;
  particleField.rotation.x += delta * 0.006;
}

function updateLabels() {
  categories.forEach((category) => {
    const label = labelElements.get(category.id);
    category.group.getWorldPosition(tempVector);
    tempVector.project(camera);

    const x = (tempVector.x * 0.5 + 0.5) * state.width;
    const y = (-tempVector.y * 0.5 + 0.5) * state.height;
    const hidden = tempVector.z > 1 || x < -80 || x > state.width + 80 || y < -80 || y > state.height + 80;

    label.style.transform = `translate3d(${x}px, ${y - 58}px, 0) translate(-50%, -50%)${state.selected?.id === category.id ? " scale(1.12)" : ""}`;
    label.classList.toggle("is-hidden", hidden);
  });
}