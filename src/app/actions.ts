'use server';

import { analyzeFairnessOfTip, type AnalyzeFairnessOfTipInput, type AnalyzeFairnessOfTipOutput } from '@/ai/flows/analyze-fairness-of-tip';

export async function runFairnessAnalysis(input: AnalyzeFairnessOfTipInput): Promise<AnalyzeFairnessOfTipOutput> {
  try {
    const result = await analyzeFairnessOfTip(input);
    return result;
  } catch (error) {
    console.error('Error running fairness analysis:', error);
    // In a real app, you might want to return a more structured error object
    throw new Error('Failed to analyze fairness. Please try again.');
  }
}
