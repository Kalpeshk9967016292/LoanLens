'use server';
/**
 * @fileOverview An AI flow to suggest a currency based on a country code.
 *
 * - suggestCurrency - A function that suggests a currency.
 * - SuggestCurrencyInput - The input type for the suggestCurrency function.
 * - SuggestCurrencyOutput - The return type for the suggestCurrency function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestCurrencyInputSchema = z.object({
  countryCode: z.string().describe('A two-letter ISO 3166-1 alpha-2 country code.'),
});
export type SuggestCurrencyInput = z.infer<typeof SuggestCurrencyInputSchema>;

const SuggestCurrencyOutputSchema = z.object({
  currency: z.string().describe('The three-letter ISO 4217 currency code for the given country. For example, "USD" for the United States.'),
});
export type SuggestCurrencyOutput = z.infer<typeof SuggestCurrencyOutputSchema>;


export async function suggestCurrency(input: SuggestCurrencyInput): Promise<SuggestCurrencyOutput> {
  return suggestCurrencyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCurrencyPrompt',
  input: { schema: SuggestCurrencyInputSchema },
  output: { schema: SuggestCurrencyOutputSchema },
  prompt: `You are an expert on international finance. Given a country code, provide the official three-letter currency code.

Country Code: {{{countryCode}}}`,
});

const suggestCurrencyFlow = ai.defineFlow(
  {
    name: 'suggestCurrencyFlow',
    inputSchema: SuggestCurrencyInputSchema,
    outputSchema: SuggestCurrencyOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
