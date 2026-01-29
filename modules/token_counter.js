/**
 * TokenCounter module
 * Provides high-speed token estimations for different LLM providers.
 */
export class TokenCounter {
    /**
     * Estimates token count based on character length and model-specific weights.
     * @param {string} text - The input text.
     * @param {string} model - 'claude', 'gpt', or 'gemini'.
     * @returns {number} Estimated tokens.
     */
    static estimate(text, model = 'claude') {
        if (!text) return 0;
        
        // Base ratios (Characters per token)
        // Values derived from benchmark averages for English text.
        const ratios = {
            'claude': 3.5, // Anthropic models are slightly more dense
            'gpt': 4.0,    // Standard CL100K estimation
            'gemini': 4.1  // Google tends to have higher char-per-token efficiency
        };

        const ratio = ratios[model] || 4.0;
        const charCount = text.length;
        
        // Basic calculation
        let tokens = Math.ceil(charCount / ratio);

        // Heuristic: Add 10% overhead for short prompts to account for system templates
        if (charCount < 100) tokens = Math.ceil(tokens * 1.1);
        
        return tokens;
    }
}
