/**
 * PromptAnalyzer module
 * Analyzes prompts for structure, altitude, and component presence.
 */
export class PromptAnalyzer {
    constructor(prompt, model = 'claude') {
        this.prompt = prompt;
        this.model = model;

        // Core 10-Component Framework Patterns
        this.patterns = {
            role: /(?:act as|you are|senior|expert|role|persona|identity)/gi,
            task: /(?:task|goal|objective|your mission|write|create|analyze|build|develop)/gi,
            context: /(?:context|background|situation|the user is|given that|scenario)/gi,
            constraints: /(?:constraint|rule|never|always|must|should|don't|skip|avoid)/gi,
            examples: /(?:example|few-shot|sample|instance|here's how|reference)/gi,
            format: /(?:format|output|markdown|json|xml|structure|style guide)/gi,
            thinking: /(?:think step-by-step|reasoning|thinking|chain of thought|<thinking>)/gi,
            tone: /(?:tone|voice|style|personality|audience|friendly|professional)/gi,
            variables: /(?:{{.*?}}|\[.*?\]|<.*?>)/g, // Detects common placeholder syntaxes
            audience: /(?:target audience|users|readers|customers|demographic)/gi
        };
    }

    /**
     * Calculates an overall prompt score based on component density and structure.
     * @returns {number} Score from 0 to 100.
     */
    calculateScore() {
        const components = this.analyzeComponents();
        const foundCount = Object.values(components).filter(c => c.present).length;

        // Base score based on components present (60% weight)
        let score = (foundCount / Object.keys(this.patterns).length) * 60;

        // Structure analysis (40% weight)
        const lines = this.prompt.split('\n').filter(l => l.trim().length > 0).length;
        const words = this.prompt.split(/\s+/).length;

        if (lines > 3) score += 10;
        if (words > 50) score += 10;
        if (words > 150) score += 10;
        if (/[\[\]<>{}_]/.test(this.prompt)) score += 10; // Use of semantic delimiters

        return Math.min(Math.round(score), 100);
    }

    /**
     * Determines the prompt altitude.
     * @returns {'too-low'|'too-high'|'just-right'}
     */
    getAltitude() {
        const lowMarkers = [/step by step|detailed|every|exactly|how to/gi];
        const highMarkers = [/be helpful|do your best|summarize|write/gi];

        const lowCount = lowMarkers.reduce((acc, regex) => acc + (this.prompt.match(regex) || []).length, 0);
        const highCount = highMarkers.reduce((acc, regex) => acc + (this.prompt.match(regex) || []).length, 0);

        if (this.prompt.length < 50) return 'too-high'; // Short = too high (vague)
        if (lowCount > highCount + 2) return 'too-low';
        return 'just-right';
    }

    /**
     * Runs full analysis package.
     */
    fullReport() {
        return {
            score: this.calculateScore(),
            altitude: this.getAltitude(),
            components: this.analyzeComponents(),
            wordCount: this.prompt.split(/\s+/).length
        };
    }
}
