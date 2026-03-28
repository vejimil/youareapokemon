function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildArchetype(features, typeResult) {
  const s = features.scores;
  const types = typeResult.selected;

  if (s.energy > 0.64 && (types.includes('Electric') || types.includes('Flying'))) {
    return '고속 특수형';
  }

  if (s.intensity > 0.62 && (types.includes('Fighting') || types.includes('Dark') || types.includes('Fire'))) {
    return '공격적 쌍두형';
  }

  if (s.elegance > 0.62 && (types.includes('Psychic') || types.includes('Fairy') || types.includes('Dragon'))) {
    return '정제된 특수형';
  }

  if (types.includes('Steel') || types.includes('Rock') || types.includes('Ground')) {
    return '내구 탱커형';
  }

  if (s.smile > 0.54 || types.includes('Grass') || types.includes('Water')) {
    return '서포트형';
  }

  return '밸런스형';
}

function typeModifiers(types) {
  const mod = {
    hp: 0,
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    speed: 0,
  };

  const apply = (target, amount) => {
    mod[target] += amount;
  };

  types.forEach((type) => {
    switch (type) {
      case 'Fire':
        apply('spAttack', 10);
        apply('speed', 8);
        break;
      case 'Water':
        apply('spDefense', 8);
        apply('hp', 6);
        break;
      case 'Electric':
        apply('speed', 12);
        apply('spAttack', 6);
        break;
      case 'Grass':
        apply('spDefense', 8);
        apply('defense', 6);
        break;
      case 'Ice':
        apply('spAttack', 8);
        apply('defense', -4);
        break;
      case 'Fighting':
        apply('attack', 12);
        apply('hp', 6);
        break;
      case 'Poison':
        apply('spAttack', 6);
        apply('speed', 4);
        break;
      case 'Ground':
        apply('defense', 10);
        apply('hp', 6);
        break;
      case 'Flying':
        apply('speed', 10);
        break;
      case 'Psychic':
        apply('spAttack', 12);
        apply('spDefense', 6);
        break;
      case 'Bug':
        apply('speed', 6);
        apply('attack', 4);
        break;
      case 'Rock':
        apply('defense', 14);
        apply('speed', -8);
        break;
      case 'Ghost':
        apply('spAttack', 8);
        apply('speed', 6);
        break;
      case 'Dragon':
        apply('attack', 8);
        apply('spAttack', 8);
        break;
      case 'Dark':
        apply('attack', 8);
        apply('speed', 6);
        break;
      case 'Steel':
        apply('defense', 14);
        apply('spDefense', 4);
        break;
      case 'Fairy':
        apply('spDefense', 8);
        apply('spAttack', 6);
        break;
      case 'Normal':
        apply('hp', 6);
        break;
      default:
        break;
    }
  });

  return mod;
}

export function generateStats({ features, typeResult }) {
  const s = features.scores;
  const types = typeResult.selected;
  const archetype = buildArchetype(features, typeResult);

  const bases = {
    hp: 72,
    attack: 72,
    defense: 72,
    spAttack: 72,
    spDefense: 72,
    speed: 72,
  };

  const archetypeMods = {
    '고속 특수형': { hp: -8, attack: -8, defense: -8, spAttack: 24, spDefense: 4, speed: 26 },
    '공격적 쌍두형': { hp: 4, attack: 22, defense: -4, spAttack: 14, spDefense: -6, speed: 14 },
    '정제된 특수형': { hp: -4, attack: -10, defense: 0, spAttack: 26, spDefense: 14, speed: 12 },
    '내구 탱커형': { hp: 18, attack: 8, defense: 24, spAttack: -8, spDefense: 16, speed: -20 },
    '서포트형': { hp: 10, attack: -10, defense: 8, spAttack: 12, spDefense: 18, speed: 2 },
    '밸런스형': { hp: 8, attack: 8, defense: 8, spAttack: 8, spDefense: 8, speed: 8 },
  };

  const vibeMods = {
    hp: Math.round((1 - s.energy) * 8 + s.softness * 4),
    attack: Math.round(s.intensity * 14 + s.sharpness * 8 - s.smile * 4),
    defense: Math.round((1 - s.openness) * 8 + s.symmetry * 6),
    spAttack: Math.round(s.curiosity * 14 + s.elegance * 10),
    spDefense: Math.round(s.elegance * 10 + (1 - s.intensity) * 8),
    speed: Math.round(s.energy * 18 + s.openness * 8 - (1 - s.warmth) * 2),
  };

  const tMods = typeModifiers(types);
  const aMods = archetypeMods[archetype];

  const values = Object.fromEntries(
    Object.keys(bases).map((key) => {
      const value = bases[key] + aMods[key] + vibeMods[key] + tMods[key];
      return [key, clamp(value, 35, 150)];
    }),
  );

  const total = Object.values(values).reduce((sum, value) => sum + value, 0);

  return {
    archetype,
    values,
    total,
  };
}
