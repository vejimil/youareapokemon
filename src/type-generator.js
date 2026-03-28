function round(value) {
  return Math.round(value * 100) / 100;
}

function sortEntries(scoreMap) {
  return Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
}

function translateTypeName(typeName) {
  const map = {
    Normal: '노말', Fire: '불꽃', Water: '물', Electric: '전기', Grass: '풀', Ice: '얼음',
    Fighting: '격투', Poison: '독', Ground: '땅', Flying: '비행', Psychic: '에스퍼', Bug: '벌레',
    Rock: '바위', Ghost: '고스트', Dragon: '드래곤', Dark: '악', Steel: '강철', Fairy: '페어리',
  };
  return map[typeName] ?? typeName;
}

export function generateTypes(features, types) {
  const s = features.scores;

  const scoreMap = {
    Normal: 0.65 + s.softness * 0.35 + (1 - s.intensity) * 0.25,
    Fire: 0.35 + s.warmth * 0.85 + s.energy * 0.5 + s.intensity * 0.25,
    Water: 0.35 + (1 - s.warmth) * 0.28 + s.elegance * 0.5 + (1 - s.intensity) * 0.28,
    Electric: 0.28 + s.energy * 0.82 + s.openness * 0.24 + s.saturation * 0.3,
    Grass: 0.28 + s.softness * 0.65 + s.brightness * 0.22 + s.elegance * 0.22,
    Ice: 0.22 + (1 - s.warmth) * 0.85 + s.symmetry * 0.22 + s.mystery * 0.2,
    Fighting: 0.2 + s.intensity * 0.88 + s.energy * 0.38 + (1 - s.softness) * 0.18,
    Poison: 0.15 + s.mystery * 0.72 + (1 - s.brightness) * 0.3 + s.saturation * 0.15,
    Ground: 0.22 + (1 - s.saturation) * 0.25 + (1 - s.openness) * 0.24 + s.intensity * 0.3,
    Flying: 0.25 + s.openness * 0.64 + s.elegance * 0.34 + s.curiosity * 0.16,
    Psychic: 0.3 + s.curiosity * 0.7 + s.elegance * 0.28 + (1 - s.energy) * 0.12,
    Bug: 0.12 + s.curiosity * 0.54 + s.energy * 0.2 + s.saturation * 0.16,
    Rock: 0.16 + s.symmetry * 0.3 + (1 - s.smile) * 0.18 + (1 - s.energy) * 0.18 + s.intensity * 0.24,
    Ghost: 0.15 + s.mystery * 0.92 + (1 - s.brightness) * 0.28 + (1 - s.smile) * 0.12,
    Dragon: 0.18 + s.intensity * 0.42 + s.elegance * 0.42 + s.symmetry * 0.2,
    Dark: 0.2 + s.mystery * 0.64 + s.sharpness * 0.36 + (1 - s.smile) * 0.18,
    Steel: 0.15 + s.symmetry * 0.56 + s.sharpness * 0.32 + (1 - s.smile) * 0.12,
    Fairy: 0.18 + s.smile * 0.7 + s.softness * 0.5 + s.brightness * 0.18,
  };

  const sorted = sortEntries(scoreMap);
  const primary = sorted[0][0];
  const secondaryCandidate = sorted[1][0];
  const secondaryScore = sorted[1][1];
  const primaryScore = sorted[0][1];

  const selected = [primary];
  if (secondaryScore > 0.72 && secondaryScore / primaryScore > 0.78) {
    selected.push(secondaryCandidate);
  }

  const typeLookup = new Map(types.map((type) => [type.name, type]));
  const reasons = selected.map((typeName) => {
    const typeData = typeLookup.get(typeName);
    return `${translateTypeName(typeName)}: ${typeData?.reasonTemplate ?? '가장 잘 맞는 분위기를 보인 타입이다.'} (${round(scoreMap[typeName])})`;
  });

  if (s.energy > 0.62) reasons.push('에너지가 높아 빠르고 폭발적인 타입의 점수가 더 올라간 상태이다.');
  if (s.mystery > 0.58) reasons.push('신비롭고 어두운 분위기가 숨겨진 느낌의 타입 선택에 영향을 준 상태이다.');
  if (s.smile > 0.52) reasons.push('친근한 표정이 부드럽고 가벼운 타입의 점수를 끌어올린 상태이다.');
  if (s.symmetry > 0.78) reasons.push('대칭감이 높아 정돈되고 절제된 타입 선택이 강화된 상태이다.');

  return {
    scoreMap,
    ranked: sorted,
    selected,
    reasons,
  };
}
