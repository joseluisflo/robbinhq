
'use server';

export async function getGeminiApiKey(): Promise<{ apiKey?: string; error?: string }> {
    return {
        error: 'Browser-side voice preview is temporarily unavailable while the realtime auth flow is being secured.',
    };
}
