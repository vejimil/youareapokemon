function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sum(values) {
  return Object.values(values).reduce((acc, value) => acc + value, 0);
}

function buildArchetype(features, typeResult) {
  const s = features.scores;
  const types = typeResult.selected;

  if (s.energy > 0.74 && (types.includes('Electric') || types.includes('Flying'))) {
    return '초고속 특수 에이스형';
  }
  if (s.intensity > 0.68 && (types.includes('Fighting') || types.includes('Dark') || types.includes('Fire'))) {
    return '난전 돌격 물리형';
  }
  if (s.elegance > 0.7 && (types.includes('Psychic') || types.includes('Fairy') || types.includes('Dragon'))) {
    return '정밀 제압 특수형';
  }
  if (types.includes('Steel') || types.includes('Rock') || types.includes('Ground')) {
    return '중장갑 탱커형';
  }
  if ((s.smile > 0.56 || s.softness > 0.62) && (types.includes('Grass') || types.includes('Water') || types.includes('Fairy'))) {
    return '교란 서포트형';
  }
  if (s.mystery > 0.64 && (types.includes('Ghost') || types.includes('Poison') || types.includes('Dark'))) {
    return '기습 교란형';
  }
  if (s.curiosity > 0.64 || types.includes('Bug')) {
    return '연속 전개형';
  }
  return '균형 에이스형';
}

const ARCHETYPE_SPREADS = {
  '초고속 특수 에이스형': { hp: 64, attack: 48, defense: 56, spAttack: 132, spDefense: 78, speed: 142 },
  '난전 돌격 물리형': { hp: 88, attack: 144, defense: 72, spAttack: 64, spDefense: 68, speed: 116 },
  '정밀 제압 특수형': { hp: 70, attack: 54, defense: 72, spAttack: 144, spDefense: 112, speed: 92 },
  '중장갑 탱커형': { hp: 108, attack: 108, defense: 146, spAttack: 54, spDefense: 124, speed: 38 },
  '교란 서포트형': { hp: 96, attack: 62, defense: 76, spAttack: 94, spDefense: 132, speed: 80 },
  '기습 교란형': { hp: 72, attack: 118, defense: 64, spAttack: 112, spDefense: 76, speed: 126 },
  '연속 전개형': { hp: 74, attack: 112, defense: 70, spAttack: 100, spDefense: 70, speed: 130 },
  '균형 에이스형': { hp: 88, attack: 102, defense: 88, spAttack: 102, spDefense: 88, speed: 96 },
};

function typeModifiers(types) {
  const mod = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  const apply = (key, value) => {
    mod[key] += value;
  };

  types.forEach((type) => {
    switch (type) {
      case 'Fire':
        apply('spAttack', 12);
        apply('speed', 16);
        apply('defense', -10);
        break;
      case 'Water':
        apply('hp', 12);
        apply('spDefense', 14);
        break;
      case 'Electric':
        apply('speed', 24);
        apply('hp', -8);
        break;
      case 'Grass':
        apply('spDefense', 14);
        apply('defense', 10);
        break;
      case 'Ice':
        apply('spAttack', 16);
        apply('defense', -12);
        break;
      case 'Fighting':
        apply('attack', 22);
        apply('spAttack', -10);
        break;
      case 'Poison':
        apply('speed', 10);
        apply('spAttack', 12);
        break;
      case 'Ground':
        apply('attack', 14);
        apply('defense', 18);
        apply('speed', -18);
        break;
      case 'Flying':
        apply('speed', 18);
        apply('hp', -6);
        break;
      case 'Psychic':
        apply('spAttack', 22);
        apply('spDefense', 10);
        apply('attack', -10);
        break;
      case 'Bug':
        apply('speed', 12);
        apply('attack', 10);
        break;
      case 'Rock':
        apply('defense', 24);
        apply('hp', 10);
        apply('speed', -20);
        break;
      case 'Ghost':
        apply('spAttack', 12);
        apply('speed', 16);
        apply('defense', -6);
        break;
      case 'Dragon':
        apply('attack', 12);
        apply('spAttack', 14);
        apply('hp', 12);
        break;
      case 'Dark':
        apply('attack', 16);
        apply('speed', 12);
        break;
      case 'Steel':
        apply('defense', 28);
        apply('spDefense', 12);
        apply('speed', -14);
        break;
      case 'Fairy':
        apply('spAttack', 12);
        apply('spDefense', 16);
        break;
      case 'Normal':
        apply('hp', 12);
        break;
      default:
        break;
    }
  });

  return mod;
}

function vibeModifiers(scores) {
  return {
    hp: Math.round((1 - scores.energy) * 18 + scores.softness * 12),
    attack: Math.round(scores.intensity * 30 + scores.sharpness * 20 - scores.smile * 12),
    defense: Math.round((1 - scores.openness) * 22 + scores.symmetry * 14),
    spAttack: Math.round(scores.curiosity * 26 + scores.elegance * 22 + scores.mystery * 10),
    spDefense: Math.round(scores.elegance * 20 + (1 - scores.intensity) * 14 + scores.softness * 10),
    speed: Math.round(scores.energy * 34 + scores.openness * 18 - (1 - scores.warmth) * 6),
  };
}

function profileSeed(features, typeResult) {
  const s = features.scores;
  const core = [
    s.energy, s.smile, s.mystery, s.elegance, s.intensity, s.symmetry, s.warmth, s.openness,
    s.curiosity, s.softness, s.sharpness, s.brightness, s.saturation,
  ];
  const value = core.reduce((acc, item, index) => acc + Math.round(item * 1000) * (index + 3), 0)
    + typeResult.selected.join('').split('').reduce((acc, ch, index) => acc + ch.charCodeAt(0) * (index + 7), 0);
  return ((Math.sin(value) + 1) / 2);
}

function powerScore(features, typeResult) {
  const s = features.scores;
  const typeWeight = {
    Normal: 0.06,
    Fire: 0.18,
    Water: 0.16,
    Electric: 0.2,
    Grass: 0.12,
    Ice: 0.16,
    Fighting: 0.19,
    Poison: 0.11,
    Ground: 0.18,
    Flying: 0.17,
    Psychic: 0.22,
    Bug: 0.08,
    Rock: 0.15,
    Ghost: 0.22,
    Dragon: 0.3,
    Dark: 0.21,
    Steel: 0.25,
    Fairy: 0.2,
  };

  const selectedTypePower = typeResult.selected.reduce((acc, type) => acc + (typeWeight[type] ?? 0.1), 0);
  const topScore = typeResult.ranked[0]?.[1] ?? 0.8;
  const secondScore = typeResult.ranked[1]?.[1] ?? topScore * 0.8;
  const coherence = Math.max(0, Math.min(1, secondScore / Math.max(topScore, 0.0001)));
  const aura = (s.energy * 0.18) + (s.intensity * 0.18) + (s.elegance * 0.15) + (s.mystery * 0.15) + (s.curiosity * 0.1);
  const polish = (s.symmetry * 0.08) + (s.openness * 0.06) + (s.softness * 0.04);
  const dualBonus = typeResult.selected.length === 2 ? 0.1 : 0;
  const raw = selectedTypePower + aura + polish + (coherence * 0.08) + dualBonus;
  return clamp(raw / 1.45, 0, 1);
}

function emphasizeSpread(values, archetype, seed) {
  const adjusted = { ...values };
  const order = Object.entries(adjusted).sort((a, b) => b[1] - a[1]);
  const boost = 10 + Math.round(seed * 18);
  const cut = 6 + Math.round((1 - seed) * 14);

  order.slice(0, 2).forEach(([key], index) => {
    adjusted[key] = clamp(adjusted[key] + boost - (index * 4), 25, 190);
  });
  order.slice(-2).forEach(([key], index) => {
    adjusted[key] = clamp(adjusted[key] - cut + (index * 3), 20, 190);
  });

  if (archetype === '중장갑 탱커형') {
    adjusted.speed = clamp(adjusted.speed - 10, 20, 190);
    adjusted.defense = clamp(adjusted.defense + 12, 20, 190);
  } else if (archetype === '초고속 특수 에이스형') {
    adjusted.speed = clamp(adjusted.speed + 14, 20, 190);
    adjusted.spAttack = clamp(adjusted.spAttack + 8, 20, 190);
  } else if (archetype === '난전 돌격 물리형') {
    adjusted.attack = clamp(adjusted.attack + 12, 20, 190);
    adjusted.spDefense = clamp(adjusted.spDefense - 8, 20, 190);
  } else if (archetype === '교란 서포트형') {
    adjusted.attack = clamp(adjusted.attack - 10, 20, 190);
    adjusted.spDefense = clamp(adjusted.spDefense + 10, 20, 190);
  }

  return adjusted;
}

function applyTargetTotal(values, targetTotal) {
  const adjusted = { ...values };
  let diff = targetTotal - sum(adjusted);
  let guard = 0;

  while (diff !== 0 && guard < 1500) {
    const order = Object.keys(adjusted).sort((a, b) => {
      if (diff > 0) return adjusted[b] - adjusted[a];
      return adjusted[a] - adjusted[b];
    });

    for (const key of order) {
      if (diff === 0) break;
      if (diff > 0 && adjusted[key] < 190) {
        adjusted[key] += 1;
        diff -= 1;
      } else if (diff < 0 && adjusted[key] > 20) {
        adjusted[key] -= 1;
        diff += 1;
      }
    }
    guard += 1;
  }

  return adjusted;
}

export function generateStats({ features, typeResult }) {
  const archetype = buildArchetype(features, typeResult);
  const baseSpread = ARCHETYPE_SPREADS[archetype];
  const tMods = typeModifiers(typeResult.selected);
  const vMods = vibeModifiers(features.scores);
  const seed = profileSeed(features, typeResult);

  const rawValues = Object.fromEntries(
    Object.keys(baseSpread).map((key) => [
      key,
      clamp(baseSpread[key] + tMods[key] + vMods[key], 20, 190),
    ]),
  );

  const shapedValues = emphasizeSpread(rawValues, archetype, seed);
  const totalBand = powerScore(features, typeResult);
  const swing = Math.round((seed - 0.5) * 180);
  const targetTotal = clamp(
    300 + Math.round(totalBand * 260) + swing,
    300,
    660,
  );

  const values = applyTargetTotal(shapedValues, targetTotal);

  return {
    archetype,
    values,
    total: sum(values),
  };
}
