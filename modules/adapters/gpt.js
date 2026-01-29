/**
 * GPT Model Adapter
 */
export const GPTAdapter = {
    name: 'GPT-5',
    provider: 'OpenAI',

    /**
     * Applies GPT-specific optimizations.
     */
    optimize(prompt, analysis) {
        let result = prompt;

        // 1. Markdown Structuring
        if (!prompt.includes('#')) {
            result = `### Task Overview\n${result}`;
        }

        // 2. Reasoning effort control
        if (analysis.altitude === 'too-high') {
            result += `\n\nReason step-by-step and verify your logic for accuracy.`;
        }

        return result;
    }
};
