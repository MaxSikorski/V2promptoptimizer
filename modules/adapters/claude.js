/**
 * Claude Model Adapter
 */
export const ClaudeAdapter = {
    name: 'Claude 4.5',
    provider: 'Anthropic',

    /**
     * Applies Claude-specific optimizations.
     */
    optimize(prompt, analysis) {
        let result = prompt;

        // 1. Add XML tags if missing
        if (!prompt.includes('<task>') && !prompt.includes('<context>')) {
            result = `<task>\n${result}\n</task>`;
        }

        // 2. Inject thinking block request for reasoning tasks
        if (analysis.score < 80) {
            result += `\n\nAnalyze the request carefully in a <thinking> block before providing your final response.`;
        }

        return result;
    }
};
