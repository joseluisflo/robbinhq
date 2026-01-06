
'use server';

export async function getGeminiApiKey(): Promise<{ apiKey?: string; error?: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { error: 'Gemini API key is not configured on the server.' };
    }
    return { apiKey };
}
