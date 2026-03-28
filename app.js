import { createFaceAnalyzer } from './src/face-analyzer.js';
import { extractFeatures } from './src/feature-extractor.js';
import { generateTypes } from './src/type-generator.js';
import { generateAbility } from './src/ability-generator.js';
import { generateStats } from './src/stat-generator.js';
import { generateMoves } from './src/move-generator.js';
import { generateDexEntry } from './src/dex-generator.js';

const imageInput = document.querySelector('#imageInput');
const previewImage = document.querySelector('#previewImage');
const overlayCanvas = document.querySelector('#overlayCanvas');
const emptyPreview = document.querySelector('#emptyPreview');
const analyzeButton = document.querySelector('#analyzeButton');
const statusMessage = document.querySelector('#statusMessage');
const modelStatus = document.querySelector('#modelStatus');
const resultPlaceholder = document.querySelector('#resultPlaceholder');
const resultContent = document.querySelector('#resultContent');

const bstValue = document.querySelector('#bstValue');
const typeBadges = document.querySelector('#typeBadges');
const abilityBox = document.querySelector('#abilityBox');
const dexEntry = document.querySelector('#dexEntry');
const reasonList = document.querySelector('#reasonList');
const archetypeText = document.querySelector('#archetypeText');
const statRows = document.querySelector('#statRows');
const moveChips = document.querySelector('#moveChips');
const metricGrid = document.querySelector('#metricGrid');

const TYPE_LABELS = {
  Normal: '노말', Fire: '불꽃', Water: '물', Electric: '전기', Grass: '풀', Ice: '얼음',
  Fighting: '격투', Poison: '독', Ground: '땅', Flying: '비행', Psychic: '에스퍼', Bug: '벌레',
  Rock: '바위', Ghost: '고스트', Dragon: '드래곤', Dark: '악', Steel: '강철', Fairy: '페어리',
};

const state = {
  data: null,
  analyzer: null,
  imageObjectUrl: null,
};

const metricConfig = [
  ['energy', '에너지'],
  ['smile', '미소'],
  ['mystery', '신비로움'],
  ['elegance', '우아함'],
  ['intensity', '강렬함'],
  ['symmetry', '대칭감'],
  ['warmth', '따뜻함'],
  ['openness', '개방감'],
];

init().catch((error) => {
  console.error(error);
  setStatus(`초기화에 실패한 상태이다: ${error.message}`, true);
});

async function init() {
  setStatus('로컬 데이터를 불러오는 중이다.', false);

  const [types, abilities, movePools, dexTemplates] = await Promise.all([
    fetch('./data/types.json').then((res) => res.json()),
    fetch('./data/abilities.json').then((res) => res.json()),
    fetch('./data/move-pools.json').then((res) => res.json()),
    fetch('./data/dex-templates.json').then((res) => res.json()),
  ]);

  state.data = { types, abilities, movePools, dexTemplates };

  setStatus('얼굴 분석 모델을 불러오는 중이다.', false);
  state.analyzer = await createFaceAnalyzer();
  modelStatus.textContent = '얼굴 모델 준비 완료';
  setStatus('준비가 끝난 상태이다. 얼굴 사진을 업로드하면 된다.', false);
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
  analyzeButton.disabled = true;
  clearResults();

  try {
    await previewImage.decode();
  } catch (error) {
    console.error(error);
    setStatus('브라우저가 이 이미지를 읽지 못한 상태이다. JPG나 PNG 파일을 사용하는 편이 좋다.', true);
    return;
  }

  fitCanvasToImage();
  clearCanvas();

  analyzeButton.disabled = false;
  setStatus('이미지를 불러온 상태이다. 이제 얼굴 분석을 실행하면 된다.', false);
});

analyzeButton.addEventListener('click', async () => {
  if (!previewImage.src || !state.analyzer || !state.data) return;

  analyzeButton.disabled = true;
  clearCanvas();
  setStatus('얼굴 랜드마크를 분석하는 중이다.', false);

  try {
    const analysis = await state.analyzer.detect(previewImage);

    if (!analysis.faceLandmarks?.length) {
      throw new Error('얼굴을 찾지 못한 상태이다. 정면에 가깝고 선명한 사진으로 다시 시도하는 편이 좋다.');
    }

    drawOverlay(analysis.faceLandmarks[0]);

    const features = extractFeatures({
      result: analysis,
      image: previewImage,
      canvas: overlayCanvas,
    });

    const typeResult = generateTypes(features, state.data.types);
    const ability = generateAbility({ features, typeResult, abilities: state.data.abilities });
    const stats = generateStats({ features, typeResult });
    const moves = generateMoves({ features, typeResult, stats, movePools: state.data.movePools });
    const dex = generateDexEntry({
      features,
      typeResult,
      ability,
      stats,
      dexTemplates: state.data.dexTemplates,
    });

    renderProfile({ typeResult, ability, stats, moves, dex }, features, state.data.types);
    analyzeButton.disabled = false;
    setStatus('프로필 생성이 완료된 상태이다.', false);
  } catch (error) {
    console.error(error);
    setStatus(error.message, true);
    analyzeButton.disabled = false;
  }
});

function renderProfile(profile, features, typeCatalog) {
  resultPlaceholder.hidden = true;
  resultContent.hidden = false;

  bstValue.textContent = profile.stats.total;
  dexEntry.textContent = profile.dex.text;
  archetypeText.textContent = profile.stats.archetype;

  typeBadges.innerHTML = '';
  profile.typeResult.selected.forEach((typeName) => {
    const data = typeCatalog.find((item) => item.name === typeName);
    const badge = document.createElement('span');
    badge.className = 'type-badge';
    badge.textContent = translateTypeName(typeName);
    badge.style.background = data?.color ?? '#666';
    typeBadges.appendChild(badge);
  });

  abilityBox.innerHTML = '';
  const abilityPill = document.createElement('span');
  abilityPill.className = 'ability-pill';
  abilityPill.textContent = `${profile.ability.name} · ${profile.ability.description}`;
  abilityBox.appendChild(abilityPill);

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
      <div class="stat-bar"><span style="width:${Math.min((value / 180) * 100, 100)}%"></span></div>
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

  renderMetrics(features.scores);
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

function translateTypeName(typeName) {
  return TYPE_LABELS[typeName] ?? typeName;
}

function formatStatName(key) {
  const map = {
    hp: 'HP',
    attack: '공격',
    defense: '방어',
    spAttack: '특수공격',
    spDefense: '특수방어',
    speed: '스피드',
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
  resultPlaceholder.hidden = true;
  resultContent.hidden = true;
  metricGrid.innerHTML = '';
}
