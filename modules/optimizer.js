/**
 * PromptOptimizer module
 * Orchestrates the transformation of prompts based on analysis and model targets.
 */
import { TokenCounter } from './token_counter.js';

export class PromptOptimizer {
    constructor(prompt, analysis, modelAdapter) {
        this.original = prompt;
        this.analysis = analysis;
        this.adapter = modelAdapter;
        this.appliedTechniques = [];
    }

    /**
     * Runs the optimization pipeline based on the selected level.
     * @param {'low'|'medium'|'high'} level 
     * @returns {Object} { optimized, metrics, techniques }
     */
    optimize(level = 'medium') {
        let result = this.original;

        // 1. Core Transformations (Always applied)
        result = this.removeRedundancy(result);

        // 2. Altitude & Component Tuning (Medium+)
        if (level !== 'low') {
            result = this.adjustAltitude(result);
        }

        // 3. Model Specific Polish
        result = this.adapter.optimize(result, this.analysis);

        const originalTokens = TokenCounter.estimate(this.original, this.adapter.provider.toLowerCase());
        const optimizedTokens = TokenCounter.estimate(result, this.adapter.provider.toLowerCase());

        return {
            optimized: result,
            techniques: this.appliedTechniques,
            metrics: {
                originalTokens,
                optimizedTokens,
                efficiency: Math.round(((originalTokens - optimizedTokens) / originalTokens) * 100) || 0
            }
        };
    }

    /**
     * Step 2.2: Redundancy Removal
     * Strips "yapping", filler phrases, and noise.
     */
    removeRedundancy(text) {
        const fillers = [
            /please /gi,
            /i want you to /gi,
            /can you /gi,
            /i need help with /gi,
            /write a /gi,
            /help me /gi,
            /basically /gi,
            /just /gi
        ];

        let result = text;
        let found = false;
        fillers.forEach(regex => {
            if (regex.test(result)) {
                result = result.replace(regex, '');
                found = true;
            }
        });

        if (found) this.appliedTechniques.push('Redundancy Removal');

        // Capitalize first letter if it was stripped
        return result.charAt(0).toUpperCase() + result.slice(1);
    }

    /**
     * Step 2.3: Altitude Adjustment
     * Elevates generic language to specific architectural terms.
     */
    adjustAltitude(text) {
        if (this.analysis.altitude === 'too-high') {
            this.appliedTechniques.push('Altitude Elevation');
            return `Analyze and implement the following task with high precision: ${text}`;
        }
        return text;
    }
}
