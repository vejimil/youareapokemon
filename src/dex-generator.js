function pickByScore(list, score) {
  if (!list?.length) return '';
  const index = Math.min(list.length - 1, Math.floor(score * list.length));
  return list[index];
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function generateSpeciesName({ features, typeResult }) {
  const rootsA = {
    Fire: ['Cinder', 'Pyra', 'Flare', 'Ember'],
    Water: ['Aqua', 'Tide', 'Neri', 'Ripple'],
    Grass: ['Verd', 'Moss', 'Luma', 'Bloom'],
    Electric: ['Volt', 'Spark', 'Zera', 'Amp'],
    Ice: ['Glace', 'Frost', 'Rime', 'Cryo'],
    Fighting: ['Strik', 'Brawl', 'Krav', 'Valor'],
    Poison: ['Ven', 'Toxi', 'Mire', 'Nox'],
    Ground: ['Terra', 'Dust', 'Geo', 'Strata'],
    Flying: ['Aero', 'Skye', 'Wing', 'Zeph'],
    Psychic: ['Mira', 'Psy', 'Astra', 'Rune'],
    Bug: ['Nym', 'Chiti', 'Mite', 'Silka'],
    Rock: ['Crag', 'Slate', 'Gran', 'Shard'],
    Ghost: ['Wisp', 'Spect', 'Umbr', 'Phanto'],
    Dragon: ['Drako', 'Scale', 'Rexa', 'Vyr'],
    Dark: ['Noir', 'Shade', 'Umbra', 'Dusk'],
    Steel: ['Ferr', 'Chrome', 'Alloy', 'Metra'],
    Fairy: ['Fae', 'Lumi', 'Gleam', 'Pixa'],
    Normal: ['Melo', 'Mira', 'Nobi', 'Kindra'],
  };

  const suffixes = features.scores.elegance > 0.58
    ? ['elle', 'ion', 'ora', 'eon']
    : features.scores.energy > 0.6
      ? ['zap', 'rush', 'volt', 'dash']
      : features.scores.mystery > 0.58
        ? ['veil', 'shade', 'mourn', 'hex']
        : ['let', 'mon', 'kin', 'tail'];

  const [primary, secondary = primary] = typeResult.selected;
  const rootAList = rootsA[primary] ?? ['Astra'];
  const rootBList = rootsA[secondary] ?? rootAList;

  const rootA = rootAList[Math.floor(features.scores.energy * rootAList.length) % rootAList.length];
  const rootB = rootBList[Math.floor(features.scores.curiosity * rootBList.length) % rootBList.length];
  const suffix = suffixes[Math.floor(features.scores.smile * suffixes.length) % suffixes.length];

  const merged = `${rootA.slice(0, 4)}${rootB.slice(-2)}${suffix}`.replace(/(.)\1{2,}/g, '$1$1');
  return capitalize(merged.slice(0, 12));
}

export function generateDexEntry({ features, typeResult, ability, stats, dexTemplates, speciesName }) {
  const s = features.scores;
  const [primary, secondary] = typeResult.selected;
  const mainTypeText = secondary ? `${primary}/${secondary}` : primary;

  const opener = pickByScore(dexTemplates.openers, s.energy);
  const habit = pickByScore(s.mystery > 0.55 ? dexTemplates.habits.mysterious : dexTemplates.habits.gentle, s.smile);
  const battle = pickByScore(stats.values.speed > 95 ? dexTemplates.battle.fast : dexTemplates.battle.steady, s.intensity);

  const emotionTag =
    s.smile > 0.55 ? 'warm emotions' : s.mystery > 0.58 ? 'hidden emotions' : 'quiet focus';

  const text = `${speciesName}, the ${mainTypeText} Aura Pokémon. ${opener} ${habit} In battle, it ${battle} Trainers say its ${ability.name.toLowerCase()} ability reacts to ${emotionTag}.`;

  return { text };
}
