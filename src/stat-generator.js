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
  '초고속 특수 에이스형': { hp: 64, attack: 52, defense: 63, spAttack: 129, spDefense: 84, speed: 138 },
  '난전 돌격 물리형': { hp: 86, attack: 136, defense: 78, spAttack: 72, spDefense: 74, speed: 112 },
  '정밀 제압 특수형': { hp: 72, attack: 60, defense: 78, spAttack: 138, spDefense: 108, speed: 94 },
  '중장갑 탱커형': { hp: 102, attack: 104, defense: 138, spAttack: 62, spDefense: 118, speed: 44 },
  '교란 서포트형': { hp: 92, attack: 68, defense: 82, spAttack: 98, spDefense: 126, speed: 84 },
  '기습 교란형': { hp: 76, attack: 114, defense: 72, spAttack: 112, spDefense: 82, speed: 118 },
  '연속 전개형': { hp: 78, attack: 108, defense: 76, spAttack: 102, spDefense: 76, speed: 124 },
  '균형 에이스형': { hp: 90, attack: 104, defense: 92, spAttack: 104, spDefense: 92, speed: 98 },
};

function typeModifiers(types) {
  const mod = { hp: 0, attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0 };
  const apply = (key, value) => {
    mod[key] += value;
  };

  types.forEach((type) => {
    switch (type) {
      case 'Fire':
        apply('spAttack', 10);
        apply('speed', 12);
        apply('defense', -8);
        break;
      case 'Water':
        apply('hp', 10);
        apply('spDefense', 12);
        break;
      case 'Electric':
        apply('speed', 18);
        apply('hp', -6);
        break;
      case 'Grass':
        apply('spDefense', 12);
        apply('defense', 8);
        break;
      case 'Ice':
        apply('spAttack', 14);
        apply('defense', -10);
        break;
      case 'Fighting':
        apply('attack', 18);
        apply('spAttack', -8);
        break;
      case 'Poison':
        apply('speed', 8);
        apply('spAttack', 10);
        break;
      case 'Ground':
        apply('attack', 12);
        apply('defense', 14);
        apply('speed', -14);
        break;
      case 'Flying':
        apply('speed', 14);
        apply('hp', -4);
        break;
      case 'Psychic':
        apply('spAttack', 18);
        apply('spDefense', 8);
        apply('attack', -8);
        break;
      case 'Bug':
        apply('speed', 10);
        apply('attack', 8);
        break;
      case 'Rock':
        apply('defense', 20);
        apply('hp', 8);
        apply('speed', -16);
        break;
      case 'Ghost':
        apply('spAttack', 10);
        apply('speed', 12);
        apply('defense', -4);
        break;
      case 'Dragon':
        apply('attack', 10);
        apply('spAttack', 12);
        apply('hp', 10);
        break;
      case 'Dark':
        apply('attack', 14);
        apply('speed', 10);
        break;
      case 'Steel':
        apply('defense', 22);
        apply('spDefense', 10);
        apply('speed', -12);
        break;
      case 'Fairy':
        apply('spAttack', 10);
        apply('spDefense', 14);
        break;
      case 'Normal':
        apply('hp', 10);
        break;
      default:
        break;
    }
  });

  return mod;
}

function vibeModifiers(scores) {
  return {
    hp: Math.round((1 - scores.energy) * 14 + scores.softness * 10),
    attack: Math.round(scores.intensity * 24 + scores.sharpness * 16 - scores.smile * 10),
    defense: Math.round((1 - scores.openness) * 18 + scores.symmetry * 12),
    spAttack: Math.round(scores.curiosity * 22 + scores.elegance * 18 + scores.mystery * 6),
    spDefense: Math.round(scores.elegance * 16 + (1 - scores.intensity) * 12 + scores.softness * 8),
    speed: Math.round(scores.energy * 28 + scores.openness * 14 - (1 - scores.warmth) * 4),
  };
}

function qualityBonus(features, typeResult) {
  const s = features.scores;
  let bonus = 0;

  if (typeResult.selected.length === 2) bonus += 18;
  if (typeResult.selected.includes('Dragon')) bonus += 18;
  if (typeResult.selected.includes('Steel')) bonus += 10;
  if (s.energy > 0.78) bonus += 10;
  if (s.intensity > 0.74) bonus += 10;
  if (s.elegance > 0.78) bonus += 8;
  if (s.mystery > 0.76) bonus += 8;
  if (s.smile > 0.72 && s.softness > 0.72) bonus -= 8;

  return bonus;
}

function applyTargetTotal(values, targetTotal) {
  const adjusted = { ...values };
  let diff = targetTotal - sum(adjusted);
  let guard = 0;

  while (diff !== 0 && guard < 1000) {
    const order = Object.keys(adjusted).sort((a, b) => {
      if (diff > 0) return adjusted[b] - adjusted[a];
      return adjusted[a] - adjusted[b];
    });

    for (const key of order) {
      if (diff === 0) break;
      if (diff > 0 && adjusted[key] < 170) {
        adjusted[key] += 1;
        diff -= 1;
      } else if (diff < 0 && adjusted[key] > 35) {
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

  const rawValues = Object.fromEntries(
    Object.keys(baseSpread).map((key) => [
      key,
      clamp(baseSpread[key] + tMods[key] + vMods[key], 35, 170),
    ]),
  );

  const targetTotal = clamp(
    sum(baseSpread)
      + qualityBonus(features, typeResult)
      + Math.round(features.scores.curiosity * 12)
      - Math.round((1 - features.scores.symmetry) * 8),
    470,
    650,
  );

  const values = applyTargetTotal(rawValues, targetTotal);

  return {
    archetype,
    values,
    total: sum(values),
  };
}
