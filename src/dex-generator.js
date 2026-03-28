
function pickByScore(list, score) {
  if (!list?.length) return '';
  const index = Math.min(list.length - 1, Math.floor(score * list.length));
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

export function generateSpeciesName() {
  return '';
}

export function generateDexEntry({ features, typeResult, ability, stats, dexTemplates }) {
  const s = features.scores;
  const [primary, secondary] = typeResult.selected;
  const mainTypeText = secondary
    ? `${translateTypeName(primary)}/${translateTypeName(secondary)}`
    : translateTypeName(primary);

  const opener = pickByScore(dexTemplates.openers, s.energy);
  const habit = pickByScore(
    s.mystery > 0.55 ? dexTemplates.habits.mysterious : dexTemplates.habits.gentle,
    s.smile,
  );
  const battle = pickByScore(
    stats.values.speed > 95 ? dexTemplates.battle.fast : dexTemplates.battle.steady,
    s.intensity,
  );

  const emotionTag =
    s.smile > 0.55 ? '밝은 감정' : s.mystery > 0.58 ? '숨겨진 감정' : '조용한 집중력';

  const text = `${mainTypeText} 타입의 분위기가 강하게 느껴지는 포켓몬입니다. ${opener} ${habit} 전투에서는 ${battle} ${ability.name} 특성은 ${emotionTag}에 반응한다고 전해집니다.`;

  return { text };
}
