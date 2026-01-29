/**
 * Gemini Model Adapter
 */
export const GeminiAdapter = {
    name: 'Gemini 3',
    provider: 'Google',

    /**
     * Applies Gemini-specific optimizations.
     */
    optimize(prompt, analysis) {
        let result = prompt;

        // 1. Grounding emphasis
        if (!prompt.toLowerCase().includes('fact') && !prompt.toLowerCase().includes('source')) {
            result += `\n\nEnsure strict grounding in the provided context. Do not hallucinate details.`;
        }

        // 2. Clear delimiter injection
        if (analysis.wordCount > 100) {
            result = `[INSTRUCTIONS]\n${result}\n[/INSTRUCTIONS]`;
        }

        return result;
    }
};
