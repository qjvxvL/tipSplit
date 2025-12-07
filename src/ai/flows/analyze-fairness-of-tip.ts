'use server';
/**
 * @fileOverview Analyzes the fairness of a tip split among friends, considering individual contributions.
 *
 * - analyzeFairnessOfTip - A function that analyzes the fairness of the tip.
 * - AnalyzeFairnessOfTipInput - The input type for the analyzeFairnessOfTip function.
 * - AnalyzeFairnessOfTipOutput - The return type for the analyzeFairnessOfTip function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFairnessOfTipInputSchema = z.object({
  totalBill: z.number().describe('The total bill amount.'),
  tipPercentage: z.number().describe('The tip percentage.'),
  individualContributions: z
    .array(
      z.object({
        name: z.string().describe('The name of the person.'),
        contribution: z.number().describe('The amount contributed by the person.'),
        relativeCost: z
          .number()
          .optional()
          .describe('An estimate of how much each person utilized the service. Defaults to 1.'),
      })
    )
    .describe('An array of individual contributions.'),
});
export type AnalyzeFairnessOfTipInput = z.infer<typeof AnalyzeFairnessOfTipInputSchema>;

const AnalyzeFairnessOfTipOutputSchema = z.object({
  isFair: z.boolean().describe('Whether the tip split is considered fair.'),
  explanation: z.string().describe('An explanation of the fairness analysis.'),
  suggestedAdjustments: z
    .array(
      z.object({
        name: z.string().describe('The name of the person.'),
        adjustment: z
          .number()
          .describe('The suggested adjustment to the person contribution.'),
      })
    )
    .optional()
    .describe('Suggested adjustments to individual contributions.'),
});

export type AnalyzeFairnessOfTipOutput = z.infer<typeof AnalyzeFairnessOfTipOutputSchema>;

export async function analyzeFairnessOfTip(
  input: AnalyzeFairnessOfTipInput
): Promise<AnalyzeFairnessOfTipOutput> {
  return analyzeFairnessOfTipFlow(input);
}

const analyzeFairnessOfTipPrompt = ai.definePrompt({
  name: 'analyzeFairnessOfTipPrompt',
  input: {schema: AnalyzeFairnessOfTipInputSchema},
  output: {schema: AnalyzeFairnessOfTipOutputSchema},
  prompt: `You are an expert in fairness and resource allocation.

You are provided with the total bill amount, the tip percentage, and a list of individual contributions.

Analyze whether the current tip split is fair, taking into account the individual contributions and, if provided, each person's relative cost of the service.

Consider factors such as:

- Did anyone contribute significantly less or more than their fair share?
- If relativeCost is provided, is there an appropriate mapping to each person's cost of service and the tip they are paying?

Provide a detailed explanation of your analysis.

If the split is unfair, suggest adjustments to individual contributions to make it more fair.

Total bill amount: {{{totalBill}}}
Tip percentage: {{{tipPercentage}}}
Individual contributions:
{{#each individualContributions}}
- Name: {{{name}}}, Contribution: {{{contribution}}}{{#if relativeCost}}, Relative Cost: {{{relativeCost}}}{{/if}}
{{/each}}

Is the tip split fair? Give a one-sentence answer. After that, provide a detailed explanation.

Ensure the suggestedAdjustments, if any, sums to zero.

Output in the requested JSON format.
`,
});

const analyzeFairnessOfTipFlow = ai.defineFlow(
  {
    name: 'analyzeFairnessOfTipFlow',
    inputSchema: AnalyzeFairnessOfTipInputSchema,
    outputSchema: AnalyzeFairnessOfTipOutputSchema,
  },
  async input => {
    const {output} = await analyzeFairnessOfTipPrompt(input);
    return output!;
  }
);
