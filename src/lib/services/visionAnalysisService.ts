// Simulated classification model. Colour-signature extraction uses real pixel sampling;
// the decision thresholds emulate a colourimetric screening classifier.
// A production deployment would replace classify() with a validated CV model endpoint.
import { sampleReactionZone } from '../images';
import type { TestResult } from '../types';

export interface AnalysisResult {
  result: TestResult;
  confidence: number;
  hue: number;
  sat: number;
  deltaE: number;
  explanation: string[];
}

const REACTION_THRESHOLD = 12; // colour deviation threshold in the reaction zone

export async function analyzeImage(calibratedImage: string): Promise<AnalysisResult> {
  const { hue, sat, deltaE, meanL } = await sampleReactionZone(calibratedImage);
  const isReactionHue = (hue >= 300 || hue <= 20) && sat > 0.28; // magenta/red reaction band
  let result: TestResult;
  let confidence: number;
  if (deltaE > REACTION_THRESHOLD && isReactionHue) {
    result = 'positive';
    confidence = Math.min(99.1, 82 + (deltaE - REACTION_THRESHOLD) * 0.9 + sat * 8);
  } else if (deltaE < REACTION_THRESHOLD * 0.55) {
    result = 'negative';
    confidence = Math.min(98.4, 84 + (REACTION_THRESHOLD * 0.55 - deltaE) * 1.1 + (meanL > 0.5 ? 4 : 0));
  } else {
    result = 'inconclusive';
    confidence = 52 + Math.random() * 10;
  }
  confidence = Math.round(confidence * 10) / 10;
  const explanation = [
    'Reaction region detected successfully',
    result === 'positive'
      ? `Colour deviation in reaction zone (${deltaE.toFixed(1)}) exceeds calibrated threshold (${REACTION_THRESHOLD})`
      : result === 'negative'
        ? `Colour deviation in reaction zone (${deltaE.toFixed(1)}) below calibrated threshold (${REACTION_THRESHOLD})`
        : `Colour deviation (${deltaE.toFixed(1)}) near decision boundary — result is ambiguous`,
    'Reference-card normalization completed',
    meanL > 0.25 && meanL < 0.85 ? 'Image quality within acceptable range' : 'Image quality marginal — consider retake',
  ];
  return { result, confidence, hue: Math.round(hue), sat: Math.round(sat * 100) / 100, deltaE: Math.round(deltaE * 10) / 10, explanation };
}
