function abilityVariance(name, seed) {
  let value = Math.round(seed * 100000);
  for (let i = 0; i < name.length; i += 1) {
    value += name.charCodeAt(i) * (i + 11);
  }
  return ((Math.sin(value) + 1) / 2);
}

function featureSeed(features, selectedTypes) {
  const s = features.scores;
  const values = [
    s.energy, s.smile, s.mystery, s.elegance, s.intensity, s.symmetry,
    s.warmth, s.openness, s.curiosity, s.softness, s.sharpness,
  ];
  const base = values.reduce((acc, item, index) => acc + Math.round(item * 1000) * (index + 5), 0)
    + selectedTypes.join('').split('').reduce((acc, ch, index) => acc + ch.charCodeAt(0) * (index + 3), 0);
  return ((Math.sin(base) + 1) / 2);
}

function scoreAbility(ability, features, selectedTypes) {
  const s = features.scores;
  let score = 0.1;

  if (ability.types?.some((type) => selectedTypes.includes(type))) score += 1.35;
  if (ability.types?.length === 0) score += 0.35;

  ability.tags.forEach((tag) => {
    switch (tag) {
      case 'energetic':
        score += s.energy * 1.15;
        break;
      case 'warm':
        score += s.warmth * 0.95;
        break;
      case 'cool':
        score += (1 - s.warmth) * 0.95;
        break;
      case 'mysterious':
        score += s.mystery * 1.15;
        break;
      case 'friendly':
        score += s.smile * 1.0 + s.softness * 0.25;
        break;
      case 'sharp':
        score += s.sharpness * 1.05;
        break;
      case 'elegant':
        score += s.elegance * 1.05;
        break;
      case 'soft':
        score += s.softness * 1.0;
        break;
      case 'steady':
        score += (1 - s.energy) * 0.65 + s.symmetry * 0.45;
        break;
      case 'curious':
        score += s.curiosity * 1.0;
        break;
      case 'intense':
        score += s.intensity * 1.05;
        break;
      case 'bulky':
        score += (1 - s.openness) * 0.7 + s.symmetry * 0.35;
        break;
      case 'tricky':
        score += s.mystery * 0.7 + s.curiosity * 0.4;
        break;
      default:
        score += 0.05;
    }
  });

  return score;
}

function chooseAbility(scored, seed) {
  const topScore = scored[0]?.matchScore ?? 0;
  const candidates = scored
    .filter((ability, index) => index < 10 && ability.matchScore >= topScore - 0.65)
    .map((ability) => ({
      ...ability,
      weightedScore: ability.matchScore + (abilityVariance(ability.name, seed) * 0.28),
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore);

  const lane = Math.min(candidates.length - 1, Math.floor(seed * Math.min(candidates.length, 4)));
  return candidates[lane] ?? scored[0];
}

export function generateAbility({ features, typeResult, abilities }) {
  const selectedTypes = typeResult.selected;
  const seed = featureSeed(features, selectedTypes);
  const scored = abilities
    .map((ability) => ({
      ...ability,
      matchScore: scoreAbility(ability, features, selectedTypes),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  return chooseAbility(scored, seed);
}
