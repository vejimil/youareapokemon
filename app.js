import { createFaceAnalyzer } from './src/face-analyzer.js';
import { extractFeatures } from './src/feature-extractor.js';
import { generateTypes } from './src/type-generator.js';
import { generateAbility } from './src/ability-generator.js';
import { generateStats } from './src/stat-generator.js';
import { generateMoves } from './src/move-generator.js';
import { generateDexEntry, generateSpeciesName } from './src/dex-generator.js';

const imageInput = document.querySelector('#imageInput');
const previewImage = document.querySelector('#previewImage');
const overlayCanvas = document.querySelector('#overlayCanvas');
const emptyPreview = document.querySelector('#emptyPreview');
const analyzeButton = document.querySelector('#analyzeButton');
const rerollButton = document.querySelector('#rerollButton');
const copySummaryButton = document.querySelector('#copySummaryButton');
const downloadProfileButton = document.querySelector('#downloadProfileButton');
const statusMessage = document.querySelector('#statusMessage');
const modelStatus = document.querySelector('#modelStatus');
const resultPlaceholder = document.querySelector('#resultPlaceholder');
const resultContent = document.querySelector('#resultContent');

const speciesName = document.querySelector('#speciesName');
const bstValue = document.querySelector('#bstValue');
const typeBadges = document.querySelector('#typeBadges');
const abilityBox = document.querySelector('#abilityBox');
const dexEntry = document.querySelector('#dexEntry');
const traitChips = document.querySelector('#traitChips');
const reasonList = document.querySelector('#reasonList');
const archetypeText = document.querySelector('#archetypeText');
const statRows = document.querySelector('#statRows');
const moveChips = document.querySelector('#moveChips');
const typeAffinityList = document.querySelector('#typeAffinityList');
const metricGrid = document.querySelector('#metricGrid');

const state = {
  data: null,
  analyzer: null,
  imageObjectUrl: null,
  lastFeatures: null,
  lastProfile: null,
};

const metricConfig = [
  ['energy', 'Energy'],
  ['smile', 'Smile'],
  ['mystery', 'Mystery'],
  ['elegance', 'Elegance'],
  ['intensity', 'Intensity'],
  ['symmetry', 'Symmetry'],
  ['warmth', 'Warmth'],
  ['openness', 'Openness'],
];

init().catch((error) => {
  console.error(error);
  setStatus(`Initialization failed: ${error.message}`, true);
});

async function init() {
  setStatus('Loading local data...', false);

  const [types, abilities, movePools, dexTemplates] = await Promise.all([
    fetch('./data/types.json').then((res) => res.json()),
    fetch('./data/abilities.json').then((res) => res.json()),
    fetch('./data/move-pools.json').then((res) => res.json()),
    fetch('./data/dex-templates.json').then((res) => res.json()),
  ]);

  state.data = { types, abilities, movePools, dexTemplates };

  setStatus('Loading MediaPipe Face Landmarker...', false);
  state.analyzer = await createFaceAnalyzer();
  modelStatus.textContent = 'Face model ready';
  setStatus('Ready. Upload a face image to generate a profile.', false);
}

imageInput.addEventListener('change', async (event) => {
  const [file] = event.target.files ?? [];
  if (!file) return;

  if (state.imageObjectUrl) {
    URL.revokeObjectURL(state.imageObjectUrl);
  }

  state.imageObjectUrl = URL.createObjectURL(file);
  previewImage.src = state.imageObjectUrl;
  previewImage.hidden = false;
  overlayCanvas.hidden = false;
  emptyPreview.hidden = true;
  rerollButton.disabled = true;
  analyzeButton.disabled = true;
  copySummaryButton.disabled = true;
  downloadProfileButton.disabled = true;
  clearResults();

  try {
    await previewImage.decode();
  } catch (error) {
    console.error(error);
    setStatus('This image could not be decoded by the browser. Try a JPG or PNG file.', true);
    return;
  }

  fitCanvasToImage();
  clearCanvas();

  analyzeButton.disabled = false;
  setStatus('Image loaded. Click “Analyze face”.', false);
});

analyzeButton.addEventListener('click', async () => {
  if (!previewImage.src || !state.analyzer || !state.data) return;

  analyzeButton.disabled = true;
  rerollButton.disabled = true;
  copySummaryButton.disabled = true;
  downloadProfileButton.disabled = true;
  clearCanvas();
  setStatus('Analyzing face landmarks...', false);

  try {
    const analysis = await state.analyzer.detect(previewImage);

    if (!analysis.faceLandmarks?.length) {
      throw new Error('No face was detected. Try a clearer front-facing image.');
    }

    drawOverlay(analysis.faceLandmarks[0]);

    const features = extractFeatures({
      result: analysis,
      image: previewImage,
      canvas: overlayCanvas,
    });

    const typeResult = generateTypes(features, state.data.types);
    const ability = generateAbility({
      features,
      typeResult,
      abilities: state.data.abilities,
    });
    const stats = generateStats({ features, typeResult });
    const moves = generateMoves({
      features,
      typeResult,
      stats,
      movePools: state.data.movePools,
    });
    const name = generateSpeciesName({ features, typeResult });
    const dex = generateDexEntry({
      features,
      typeResult,
      ability,
      stats,
      dexTemplates: state.data.dexTemplates,
      speciesName: name,
    });

    state.lastFeatures = features;
    state.lastProfile = {
      name,
      typeResult,
      ability,
      stats,
      moves,
      dex,
      createdAt: new Date().toISOString(),
    };

    renderProfile(state.lastProfile, features, state.data.types);
    analyzeButton.disabled = false;
    rerollButton.disabled = false;
    copySummaryButton.disabled = false;
    downloadProfileButton.disabled = false;
    setStatus('Profile generated successfully.', false);
  } catch (error) {
    console.error(error);
    setStatus(error.message, true);
    analyzeButton.disabled = false;
  }
});

rerollButton.addEventListener('click', () => {
  if (!state.lastProfile || !state.lastFeatures || !state.data) return;

  state.lastProfile.dex = generateDexEntry({
    features: state.lastFeatures,
    typeResult: state.lastProfile.typeResult,
    ability: state.lastProfile.ability,
    stats: state.lastProfile.stats,
    dexTemplates: state.data.dexTemplates,
    speciesName: state.lastProfile.name,
  });

  dexEntry.textContent = state.lastProfile.dex.text;
  setStatus('Flavor text rerolled.', false);
});

copySummaryButton.addEventListener('click', async () => {
  if (!state.lastProfile || !state.lastFeatures) return;

  const summary = buildTextSummary(state.lastProfile, state.lastFeatures);

  try {
    await navigator.clipboard.writeText(summary);
    setStatus('Summary copied to clipboard.', false);
  } catch (error) {
    console.error(error);
    setStatus('Clipboard copy failed in this browser context.', true);
  }
});

downloadProfileButton.addEventListener('click', () => {
  if (!state.lastProfile || !state.lastFeatures) return;

  const payload = {
    generatedAt: state.lastProfile.createdAt,
    speciesName: state.lastProfile.name,
    selectedTypes: state.lastProfile.typeResult.selected,
    typeRanking: state.lastProfile.typeResult.ranked.map(([type, score]) => ({
      type,
      score: roundNumber(score, 4),
    })),
    ability: state.lastProfile.ability,
    archetype: state.lastProfile.stats.archetype,
    baseStats: state.lastProfile.stats.values,
    baseStatTotal: state.lastProfile.stats.total,
    traits: state.lastFeatures.traitLabels,
    metrics: Object.fromEntries(
      metricConfig.map(([key, label]) => [label, roundNumber(state.lastFeatures.scores[key] ?? 0, 4)]),
    ),
    moves: state.lastProfile.moves,
    dexEntry: state.lastProfile.dex.text,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = state.lastProfile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.href = url;
  link.download = `${safeName || 'pokesona-profile'}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus('Profile JSON downloaded.', false);
});

function renderProfile(profile, features, typeCatalog) {
  resultPlaceholder.hidden = true;
  resultContent.hidden = false;

  speciesName.textContent = profile.name;
  bstValue.textContent = profile.stats.total;
  dexEntry.textContent = profile.dex.text;
  archetypeText.textContent = `${profile.stats.archetype} archetype`;

  typeBadges.innerHTML = '';
  profile.typeResult.selected.forEach((typeName) => {
    const data = typeCatalog.find((item) => item.name === typeName);
    const badge = document.createElement('span');
    badge.className = 'type-badge';
    badge.textContent = typeName;
    badge.style.background = data?.color ?? '#666';
    typeBadges.appendChild(badge);
  });

  abilityBox.innerHTML = '';
  const abilityPill = document.createElement('span');
  abilityPill.className = 'ability-pill';
  abilityPill.textContent = `${profile.ability.name} — ${profile.ability.description}`;
  abilityBox.appendChild(abilityPill);

  traitChips.innerHTML = '';
  features.traitLabels.forEach((trait) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = trait;
    traitChips.appendChild(chip);
  });

  reasonList.innerHTML = '';
  profile.typeResult.reasons.slice(0, 5).forEach((reason) => {
    const li = document.createElement('li');
    li.textContent = reason;
    reasonList.appendChild(li);
  });

  statRows.innerHTML = '';
  Object.entries(profile.stats.values).forEach(([key, value]) => {
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <span class="stat-name">${formatStatName(key)}</span>
      <span class="stat-value">${value}</span>
      <div class="stat-bar"><span style="width:${Math.min((value / 160) * 100, 100)}%"></span></div>
    `;
    statRows.appendChild(row);
  });

  moveChips.innerHTML = '';
  profile.moves.forEach((move) => {
    const chip = document.createElement('span');
    chip.className = 'move-chip';
    chip.textContent = move;
    moveChips.appendChild(chip);
  });

  renderTypeRanking(profile.typeResult, typeCatalog);
  renderMetrics(features.scores);
}

function renderTypeRanking(typeResult, typeCatalog) {
  typeAffinityList.innerHTML = '';
  const typeLookup = new Map(typeCatalog.map((type) => [type.name, type]));
  const topScore = Math.max(typeResult.ranked[0]?.[1] ?? 1, 0.0001);

  typeResult.ranked.forEach(([typeName, score], index) => {
    const percent = Math.max(4, (score / topScore) * 100);
    const color = typeLookup.get(typeName)?.color ?? '#666';
    const row = document.createElement('div');
    row.className = 'affinity-row';
    row.innerHTML = `
      <div class="affinity-label-wrap">
        <span class="affinity-rank">#${index + 1}</span>
        <span class="affinity-name">${typeName}</span>
      </div>
      <div class="affinity-bar">
        <span style="width:${percent}%; background:${color}"></span>
      </div>
      <span class="affinity-value">${Math.round(percent)}%</span>
    `;
    typeAffinityList.appendChild(row);
  });
}

function renderMetrics(scores) {
  metricGrid.innerHTML = '';

  metricConfig.forEach(([key, label]) => {
    const value = Math.max(0, Math.min(1, scores[key] ?? 0));
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <div class="metric-card__top">
        <span class="metric-label">${label}</span>
        <span class="metric-score">${Math.round(value * 100)}%</span>
      </div>
      <div class="metric-bar"><span style="width:${value * 100}%"></span></div>
    `;
    metricGrid.appendChild(card);
  });
}

function buildTextSummary(profile, features) {
  return [
    `${profile.name} — Pokésona Summary`,
    `Types: ${profile.typeResult.selected.join(' / ')}`,
    `Ability: ${profile.ability.name}`,
    `Archetype: ${profile.stats.archetype}`,
    `Base Stats: ${Object.entries(profile.stats.values)
      .map(([key, value]) => `${formatStatName(key)} ${value}`)
      .join(', ')}`,
    `Traits: ${features.traitLabels.join(', ')}`,
    `Moves: ${profile.moves.join(', ')}`,
    `Dex Entry: ${profile.dex.text}`,
  ].join('\n');
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatStatName(key) {
  const map = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    spAttack: 'SpA',
    spDefense: 'SpD',
    speed: 'SPD',
  };
  return map[key] ?? key;
}

function fitCanvasToImage() {
  overlayCanvas.width = previewImage.naturalWidth;
  overlayCanvas.height = previewImage.naturalHeight;
  overlayCanvas.style.aspectRatio = `${previewImage.naturalWidth} / ${previewImage.naturalHeight}`;
}

function clearCanvas() {
  const ctx = overlayCanvas.getContext('2d');
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
}

function drawOverlay(landmarks) {
  const ctx = overlayCanvas.getContext('2d');
  ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  ctx.lineWidth = Math.max(1.5, overlayCanvas.width * 0.0022);
  ctx.strokeStyle = 'rgba(212, 172, 94, 0.95)';
  ctx.fillStyle = 'rgba(127, 215, 255, 0.75)';

  const points = landmarks.map((point) => ({
    x: point.x * overlayCanvas.width,
    y: point.y * overlayCanvas.height,
  }));

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  ctx.strokeRect(minX - 12, minY - 12, maxX - minX + 24, maxY - minY + 24);

  points.slice(0, 48).forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(1.5, overlayCanvas.width * 0.0021), 0, Math.PI * 2);
    ctx.fill();
  });
}

function setStatus(message, isError) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? 'var(--danger)' : 'var(--muted)';
}

function clearResults() {
  state.lastFeatures = null;
  state.lastProfile = null;
  resultPlaceholder.hidden = false;
  resultContent.hidden = true;
  resultPlaceholder.textContent = 'Your generated profile will appear here after analysis.';
  typeAffinityList.innerHTML = '';
  metricGrid.innerHTML = '';
}
