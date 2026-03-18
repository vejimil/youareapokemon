function getBlendshapeScore(result, name) {
  const category = result.faceBlendshapes?.[0]?.categories?.find(
    (item) => item.categoryName === name,
  );
  return category?.score ?? 0;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function averagePoint(points) {
  const total = points.reduce(
    (acc, point) => {
      acc.x += point.x;
      acc.y += point.y;
      return acc;
    },
    { x: 0, y: 0 },
  );

  return {
    x: total.x / points.length,
    y: total.y / points.length,
  };
}

function averageRgb(imageData) {
  const data = imageData.data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 16) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }

  return {
    r: r / count,
    g: g / count,
    b: b / count,
  };
}

function luminance({ r, g, b }) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function buildTraitLabels(scores) {
  const traits = [];

  traits.push(scores.energy > 0.62 ? 'high energy' : scores.energy < 0.35 ? 'calm energy' : 'balanced energy');
  traits.push(scores.warmth > 0.58 ? 'warm color aura' : scores.warmth < 0.42 ? 'cool color aura' : 'neutral color aura');
  traits.push(scores.smile > 0.52 ? 'friendly expression' : scores.smile < 0.18 ? 'serious expression' : 'steady expression');
  traits.push(scores.sharpness > 0.58 ? 'sharp features' : scores.sharpness < 0.42 ? 'soft features' : 'balanced features');
  traits.push(scores.openness > 0.56 ? 'open gaze' : scores.openness < 0.4 ? 'guarded gaze' : 'focused gaze');
  traits.push(scores.symmetry > 0.76 ? 'strong symmetry' : 'slightly asymmetrical charm');

  return traits;
}

export function extractFeatures({ result, image, canvas }) {
  const landmarks = result.faceLandmarks[0];

  const smileLeft = getBlendshapeScore(result, 'mouthSmileLeft');
  const smileRight = getBlendshapeScore(result, 'mouthSmileRight');
  const browInnerUp = getBlendshapeScore(result, 'browInnerUp');
  const browDownLeft = getBlendshapeScore(result, 'browDownLeft');
  const browDownRight = getBlendshapeScore(result, 'browDownRight');
  const eyeWideLeft = getBlendshapeScore(result, 'eyeWideLeft');
  const eyeWideRight = getBlendshapeScore(result, 'eyeWideRight');
  const eyeBlinkLeft = getBlendshapeScore(result, 'eyeBlinkLeft');
  const eyeBlinkRight = getBlendshapeScore(result, 'eyeBlinkRight');
  const jawOpen = getBlendshapeScore(result, 'jawOpen');
  const mouthPucker = getBlendshapeScore(result, 'mouthPucker');
  const cheekSquintLeft = getBlendshapeScore(result, 'cheekSquintLeft');
  const cheekSquintRight = getBlendshapeScore(result, 'cheekSquintRight');

  const leftEyeCenter = averagePoint([landmarks[33], landmarks[133], landmarks[159], landmarks[145]]);
  const rightEyeCenter = averagePoint([landmarks[362], landmarks[263], landmarks[386], landmarks[374]]);
  const noseTip = landmarks[1];
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const chin = landmarks[152];
  const forehead = landmarks[10];
  const cheekLeft = landmarks[234];
  const cheekRight = landmarks[454];

  const faceHeight = distance(forehead, chin);
  const faceWidth = distance(cheekLeft, cheekRight);
  const eyeDistance = distance(leftEyeCenter, rightEyeCenter);
  const mouthWidth = distance(mouthLeft, mouthRight);
  const leftNoseDistance = distance(leftEyeCenter, noseTip);
  const rightNoseDistance = distance(rightEyeCenter, noseTip);

  const ratio = faceWidth / Math.max(faceHeight, 0.0001);
  const symmetry = 1 - Math.min(Math.abs(leftNoseDistance - rightNoseDistance) / Math.max(eyeDistance, 0.0001), 1);

  const offscreen = document.createElement('canvas');
  const size = 128;
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, size, size);
  const imageData = ctx.getImageData(0, 0, size, size);
  const avg = averageRgb(imageData);
  const brightness = luminance(avg);
  const warmth = clamp01((avg.r - avg.b + 120) / 240);
  const saturationProxy = clamp01((Math.max(avg.r, avg.g, avg.b) - Math.min(avg.r, avg.g, avg.b)) / 160);

  const smile = clamp01((smileLeft + smileRight + cheekSquintLeft + cheekSquintRight * 0.9) / 3.4);
  const openness = clamp01((eyeWideLeft + eyeWideRight + 1 - eyeBlinkLeft + 1 - eyeBlinkRight) / 4);
  const intensity = clamp01((browDownLeft + browDownRight + jawOpen + mouthPucker + (1 - smile)) / 4.2);
  const curiosity = clamp01((browInnerUp + eyeWideLeft + eyeWideRight) / 3);
  const energy = clamp01((jawOpen * 0.45 + openness * 0.35 + smile * 0.2 + saturationProxy * 0.15));
  const softness = clamp01((1 - intensity) * 0.45 + smile * 0.35 + clamp01(ratio) * 0.2);
  const sharpness = clamp01(intensity * 0.55 + (1 - ratio) * 0.15 + (mouthWidth / Math.max(faceWidth, 0.0001)) * 0.25 + 0.12);
  const elegance = clamp01(symmetry * 0.55 + (1 - jawOpen) * 0.15 + (1 - mouthPucker) * 0.1 + curiosity * 0.2);
  const mystery = clamp01((1 - brightness) * 0.35 + (1 - smile) * 0.25 + intensity * 0.2 + (1 - openness) * 0.2);

  const scores = {
    smile,
    openness,
    intensity,
    curiosity,
    energy,
    warmth,
    brightness,
    saturation: saturationProxy,
    symmetry,
    softness,
    sharpness,
    elegance,
    mystery,
  };

  return {
    ratios: {
      faceWidth,
      faceHeight,
      eyeDistance,
      mouthWidth,
      widthToHeight: ratio,
    },
    landmarks,
    scores,
    traitLabels: buildTraitLabels(scores),
    canvasSize: { width: canvas.width, height: canvas.height },
  };
}
