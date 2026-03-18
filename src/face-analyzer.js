const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const TASKS_VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest';

export async function createFaceAnalyzer() {
  const vision = await import(TASKS_VISION_URL);
  const { FilesetResolver, FaceLandmarker } = vision;

  const filesetResolver = await FilesetResolver.forVisionTasks(WASM_ROOT);

  const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_URL,
    },
    numFaces: 1,
    runningMode: 'IMAGE',
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  });

  return {
    async detect(imageElement) {
      return faceLandmarker.detect(imageElement);
    },
  };
}
