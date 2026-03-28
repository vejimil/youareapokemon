function unique(array) {
  return [...new Set(array)];
}

function pickTop(array, count) {
  return array.slice(0, count);
}

export function generateMoves({ features, typeResult, stats, movePools }) {
  const types = typeResult.selected;
  const s = features.scores;

  let pool = [];
  types.forEach((type) => {
    pool = pool.concat(movePools.byType[type] ?? []);
  });

  pool = pool.concat(movePools.common ?? []);

  if (s.energy > 0.62) {
    pool = pool.concat(movePools.tags.fast ?? []);
  }

  if (s.smile > 0.52 || stats.archetype === '서포트형') {
    pool = pool.concat(movePools.tags.support ?? []);
  }

  if (s.mystery > 0.58) {
    pool = pool.concat(movePools.tags.shadowy ?? []);
  }

  if (stats.values.attack > stats.values.spAttack + 8) {
    pool = pool.concat(movePools.tags.physical ?? []);
  } else {
    pool = pool.concat(movePools.tags.special ?? []);
  }

  return pickTop(unique(pool), 8);
}
