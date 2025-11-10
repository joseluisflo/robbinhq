'use server';

import { genkit, type Plugin } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const plugins: Plugin<any>[] = [];

if (process.env.GEMINI_API_KEY) {
  plugins.push(googleAI());
} else {
  console.warn(
    'GEMINI_API_KEY is not set. Google AI plugin will not be available.'
  );
}

export const ai = genkit({
  plugins,
  model: plugins.length ? 'googleai/gemini-2.5-flash' : undefined,
});
