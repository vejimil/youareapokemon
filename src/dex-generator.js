function pickByScore(list, score, offset = 0) {
  if (!list?.length) return '';
  const shifted = Math.max(0, Math.min(0.9999, score + offset));
  const index = Math.min(list.length - 1, Math.floor(shifted * list.length));
  return list[index];
}

function translateTypeName(typeName) {
  const map = {
    Normal: '노말', Fire: '불꽃', Water: '물', Electric: '전기', Grass: '풀', Ice: '얼음',
    Fighting: '격투', Poison: '독', Ground: '땅', Flying: '비행', Psychic: '에스퍼', Bug: '벌레',
    Rock: '바위', Ghost: '고스트', Dragon: '드래곤', Dark: '악', Steel: '강철', Fairy: '페어리',
  };
  return map[typeName] ?? typeName;
}

function buildTypeText(types) {
  if (types.length === 1) return `${translateTypeName(types[0])} 타입`;
  return `${translateTypeName(types[0])}/${translateTypeName(types[1])} 타입`;
}

function chooseTemperament(scores, dexTemplates) {
  if (scores.mystery > 0.58) return pickByScore(dexTemplates.temperament.mysterious, scores.mystery);
  if (scores.smile > 0.48) return pickByScore(dexTemplates.temperament.bright, scores.smile);
  return pickByScore(dexTemplates.temperament.calm, 1 - scores.energy);
}

function chooseBattle(stats, scores, dexTemplates) {
  if (stats.values.speed >= 120) return pickByScore(dexTemplates.battle.fast, scores.energy);
  if (stats.values.attack >= 125 || stats.values.spAttack >= 125) {
    return pickByScore(dexTemplates.battle.power, Math.max(scores.intensity, scores.curiosity));
  }
  if (stats.values.defense >= 115 || stats.values.spDefense >= 115 || stats.values.hp >= 110) {
    return pickByScore(dexTemplates.battle.tank, 1 - scores.energy);
  }
  return pickByScore(dexTemplates.battle.clever, scores.elegance);
}

function chooseRumor(scores, dexTemplates) {
  if (scores.mystery > 0.58) return pickByScore(dexTemplates.rumors.eerie, scores.mystery);
  if (scores.intensity > 0.62 || scores.sharpness > 0.62) return pickByScore(dexTemplates.rumors.wild, scores.intensity);
  if (scores.elegance > 0.62 || scores.symmetry > 0.8) return pickByScore(dexTemplates.rumors.regal, scores.elegance);
  return pickByScore(dexTemplates.rumors.friendly, scores.smile);
}

export function generateSpeciesName() {
  return '';
}

export function generateDexEntry({ features, typeResult, ability, stats, dexTemplates }) {
  const s = features.scores;
  const [primary] = typeResult.selected;
  const typeText = buildTypeText(typeResult.selected);
  const lore = pickByScore(dexTemplates.typeLore[primary], Math.max(s.energy, s.mystery, s.elegance));
  const temperament = chooseTemperament(s, dexTemplates);
  const battle = chooseBattle(stats, s, dexTemplates);
  const rumor = chooseRumor(s, dexTemplates);

  const text = `${typeText} 포켓몬이다. ${lore} ${temperament} ${battle} ${ability.name} 특성 덕분에 승부가 길어질수록 존재감이 더 강해지는 편이다. ${rumor}`;

  return { text };
}
