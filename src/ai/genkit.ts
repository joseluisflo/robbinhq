import { genkit, type Plugin } from 'genkit';
import { googleAI, googleSearch } from '@genkit-ai/google-genai';

const plugins: Plugin<any>[] = [];

if (process.env.GEMINI_API_KEY) {
  // Configure the googleAI plugin with the googleSearch tool
  plugins.push(googleAI({
      tools: [googleSearch]
  }));
} else {
  console.warn(
    'GEMINI_API_KEY is not set. Google AI plugin will not be available.'
  );
}

export const ai = genkit({
  plugins,
  // The model definition here acts as a default.
  // Flows can still specify their own models.
  model: plugins.length ? 'googleai/gemini-2.5-flash' : undefined,
});
