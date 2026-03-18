function scoreAbility(ability, features, selectedTypes) {
  const s = features.scores;
  let score = 0;

  if (ability.types?.some((type) => selectedTypes.includes(type))) score += 1.2;

  ability.tags.forEach((tag) => {
    switch (tag) {
      case 'energetic':
        score += s.energy * 1.1;
        break;
      case 'warm':
        score += s.warmth * 0.9;
        break;
      case 'cool':
        score += (1 - s.warmth) * 0.9;
        break;
      case 'mysterious':
        score += s.mystery * 1.1;
        break;
      case 'friendly':
        score += s.smile * 1.05;
        break;
      case 'sharp':
        score += s.sharpness * 0.9;
        break;
      case 'elegant':
        score += s.elegance * 1.0;
        break;
      case 'steady':
        score += (1 - s.energy) * 0.55 + s.symmetry * 0.4;
        break;
      case 'curious':
        score += s.curiosity * 0.9;
        break;
      case 'intense':
        score += s.intensity * 1.0;
        break;
      default:
        score += 0.08;
    }
  });

  return score;
}

export function generateAbility({ features, typeResult, abilities }) {
  const selectedTypes = typeResult.selected;
  const scored = abilities
    .map((ability) => ({
      ...ability,
      matchScore: scoreAbility(ability, features, selectedTypes),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  return scored[0];
}
