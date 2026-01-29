/**
 * PromptOptimizer module
 * Orchestrates the transformation of prompts based on analysis and model targets.
 * V2.1: Active Component Injection
 */
import { TokenCounter } from './token_counter.js';

export class PromptOptimizer {
    constructor(prompt, analysis, modelAdapter) {
        this.original = prompt;
        this.analysis = analysis;
        this.adapter = modelAdapter;
        this.appliedTechniques = [];

        // Templates for component injection
        this.templates = {
            role: "Act as an expert [EXPERT ROLE] with deep knowledge in this domain.",
            context: "CONTEXT: Provide background information and the specific situation requiring this task.",
            constraints: "CONSTRAINTS: \n- Follow best practices.\n- Avoid generic or filler content.\n- [ADD SPECIFIC RULES HERE]",
            examples: "EXAMPLE / REFERENCE:\n[Insert sample of desired output style or content here]",
            thinking: "Provide a detailed step-by-step reasoning process in a <thinking> section before the final response.",
            format: "OUTPUT FORMAT:\nPresent the final response in [Markdown/JSON/Bullet Points].",
            tone: "TONE & VOICE:\nMaintain a [Professional/Friendly/Authoritative] communication style.",
            audience: "TARGET AUDIENCE:\nThis response is intended for [Specify Target Readers].",
            variables: "USE THESE VARIABLES: [Input Data / Placeholder Tags]"
        };
    }

    /**
     * Runs the optimization pipeline based on the selected level.
     * @param {'low'|'medium'|'high'} level 
     * @param {string} preferredStyle - markdown, json, bullets, prose
     * @returns {Object} { optimized, metrics, techniques }
     */
    optimize(level = 'medium', preferredStyle = 'markdown') {
        this.preferredStyle = preferredStyle;

        let result = this.original;

        // 1. Core Transformations (Always applied)
        result = this.removeRedundancy(result);

        // 2. Active Component Injection (Medium+)
        // This is the "Builder" logic that was missing in V2.0
        if (level !== 'low') {
            result = this.injectMissingStructure(result);
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
     * Step 2.1: Active Injection
     * Force-injects structural blocks for components the user enabled manually.
     */
    injectMissingStructure(text) {
        let headerBlocks = [];
        let footerBlocks = [];
        const components = this.analysis.components;

        // Map preferredStyle to specific templates
        const styleMap = {
            json: "OUTPUT FORMAT:\nProvide the final output in valid RFC-8259 JSON format. Do not include markdown code blocks or preambles.",
            bullets: "OUTPUT FORMAT:\nPresent the information as a clean, hierarchical list of bullet points.",
            prose: "OUTPUT FORMAT:\nWrite in professional, flowing prose suitable for formal correspondence.",
            markdown: this.templates.format
        };

        // Check each component. If user says it's "Present" (Green) but it's not detected in the raw text pattern,
        // we architect a placeholder for it.

        // --- NEW: Smart Role Inference ---
        if (components.role?.present && !text.match(/(?:act as|you are|expert)/gi)) {
            const smartRole = this.detectExpertRole(text);
            headerBlocks.push(`Act as a ${smartRole} with deep knowledge in this domain.`);
            this.appliedTechniques.push('Contextual Role Inference');
        }

        if (components.context?.present && !text.toLowerCase().includes('context')) {
            headerBlocks.push(this.templates.context);
            this.appliedTechniques.push('Context Architecture');
        }

        if (components.thinking?.present && !text.toLowerCase().includes('think')) {
            footerBlocks.push(this.templates.thinking);
            this.appliedTechniques.push('Chain of Thought Injection');
        }

        if (components.constraints?.present && !text.toLowerCase().includes('constraint')) {
            footerBlocks.push(this.templates.constraints);
            this.appliedTechniques.push('Constraint Structuring');
        }

        if (components.format?.present && !text.toLowerCase().includes('format')) {
            const formatTemplate = styleMap[this.preferredStyle] || styleMap.markdown;
            footerBlocks.push(formatTemplate);
            this.appliedTechniques.push(`Format Injection (${this.preferredStyle})`);
        }

        // Combine parts
        let final = "";
        if (headerBlocks.length > 0) final += headerBlocks.join('\n\n') + '\n\n---\n\n';
        final += `TASK: ${text}`;
        if (footerBlocks.length > 0) final += '\n\n---\n\n' + footerBlocks.join('\n\n');

        return final;
    }

    /**
     * Infers a professional role based on keyword density.
     */
    detectExpertRole(text) {
        const lower = text.toLowerCase();
        const roleMap = [
            { role: "Senior Software Engineer", keywords: ['code', 'app', 'bug', 'react', 'function', 'develop', 'script', 'python', 'javascript'] },
            { role: "Conversion-Focused Marketing Strategist", keywords: ['marketing', 'landing page', 'sales', 'ad', 'conversion', 'campaign', 'brand'] },
            { role: "Senior Copywriter & Communications Expert", keywords: ['write', 'email', 'blog', 'article', 'prose', 'letter', 'tone'] },
            { role: "Data Science & Analysis Specialist", keywords: ['data', 'analyze', 'science', 'spreadsheet', 'graph', 'json', 'csv', 'sql'] },
            { role: "Strategic Legal & Compliance Consultant", keywords: ['legal', 'contract', 'terms', 'privacy', 'agreement', 'clause'] },
            { role: "Full-Stack UI/UX Designer", keywords: ['pretty', 'beautiful', 'ui', 'ux', 'design', 'layout', 'graphic', 'visual'] }
        ];

        let bestMatch = "Senior Subject Matter Expert";
        let maxScore = 0;

        roleMap.forEach(item => {
            const score = item.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
            if (score > maxScore) {
                maxScore = score;
                bestMatch = item.role;
            }
        });

        return bestMatch;
    }

    /**
     * Step 2.2: Redundancy Removal
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

        if (found) this.appliedTechniques.push('Signal Amplification');

        return result.charAt(0).toUpperCase() + result.slice(1);
    }

    /**
     * Step 2.3: Altitude Adjustment
     */
    adjustAltitude(text) {
        if (this.analysis.altitude === 'too-high') {
            this.appliedTechniques.push('Altitude Elevation');
            return text.replace('TASK:', 'ARCHITECTED MISSION:');
        }
        return text;
    }
}
