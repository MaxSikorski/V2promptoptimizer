/**
 * Heuristics Engine for Prompt Optimizer
 * Handles real-time scoring and dynamic question generation
 */

const Heuristics = {
    /**
     * Calculates a quality score from 1-10 based on the prompt text
     */
    calculateScore: (text) => {
        if (!text || text.trim().length === 0) return 0;

        let score = 1;
        const words = text.trim().split(/\s+/).length;

        // 1. Length-based scoring (up to 3 points)
        if (words > 10) score += 1;
        if (words > 30) score += 1;
        if (words > 60) score += 1;

        // 2. Specificity/Keyword discovery (up to 4 points)
        const specificKeywords = [
            'format', 'style', 'avoid', 'never', 'must', 'should',
            'json', 'markdown', 'code', 'python', 'javascript',
            'audience', 'persona', 'expert', 'detailed', 'brief'
        ];

        const foundKeywords = specificKeywords.filter(kw => text.toLowerCase().includes(kw));
        score += Math.min(foundKeywords.length / 2, 4);

        // 3. Structural detection (up to 2 points)
        if (text.includes('\n')) score += 1; // Presence of line breaks
        if (/[\[\]\(\)\-\>\:]/.test(text)) score += 1; // Use of delimiters/structure marks

        // 4. Clarity/Goal markers (1 point)
        const goals = ['write', 'create', 'explain', 'analyze', 'solve', 'help', 'act as'];
        if (goals.some(g => text.toLowerCase().startsWith(g) || text.toLowerCase().includes(g))) {
            score += 1;
        }

        return Math.min(Math.round(score), 10);
    },

    /**
     * Gets follow-up questions based on context detected in the text
     */
    getFollowUpQuestions: (text) => {
        const lower = text.toLowerCase();
        const questions = [];

        // Topic-based detection
        if (lower.includes('code') || lower.includes('script') || lower.includes('program') || lower.includes('app')) {
            questions.push({
                id: 'language',
                label: 'Technical Stack',
                question: 'Which programming language or framework should be used?',
                placeholder: 'e.g., Python 3.12, React, Vanilla JS...'
            });
            questions.push({
                id: 'library',
                label: 'External Tools',
                question: 'Are there any specific libraries allowed (or forbidden)?',
                placeholder: 'e.g., Use only standard library, or: use Pandas...'
            });
        } else if (lower.includes('email') || lower.includes('letter') || lower.includes('message')) {
            questions.push({
                id: 'tone',
                label: 'Voice & Tone',
                question: 'How should the message sound?',
                placeholder: 'e.g., Professional, friendly, apologetic, urgent...'
            });
            questions.push({
                id: 'recipient',
                label: 'Target Audience',
                question: 'Who exactly is receiving this?',
                placeholder: 'e.g., My boss, a customer who is angry, a close friend...'
            });
        } else if (lower.includes('write') || lower.includes('article') || lower.includes('blog') || lower.includes('summary')) {
            questions.push({
                id: 'length',
                label: 'Desired Length',
                question: 'What is the word count or structure requirement?',
                placeholder: 'e.g., Under 300 words, 3 distinct paragraphs...'
            });
            questions.push({
                id: 'style',
                label: 'Writing Style',
                question: 'Is there a specific person\'s style to mimic?',
                placeholder: 'e.g., Like Hemingway, academic, or high-energy marketing...'
            });
        }

        // Generic fallback / Reinforcement questions
        if (questions.length < 2) {
            questions.push({
                id: 'goal',
                label: 'Primary Goal',
                question: 'What is the single most important thing the AI must get right?',
                placeholder: 'e.g., Accuracy of facts, speed of code, or matching the tone...'
            });
        }

        if (questions.length < 3) {
            questions.push({
                id: 'negative',
                label: 'Strict Boundary',
                question: 'What should the AI specifically NOT do?',
                placeholder: 'e.g., No jargon, no preamble, don\'t mention competitors...'
            });
        }

        return questions.slice(0, 3); // Always return top 3 relevant ones
    },

    /**
     * Returns a colored string and label for the score
     */
    getScoreFeedback: (score) => {
        if (score <= 3) return { color: '#ef4444', label: 'Weak (Vague)', message: 'Add more details about the task and format.' };
        if (score <= 6) return { color: '#f59e0b', label: 'Moderate', message: 'Good, but could use more constraints.' };
        if (score <= 8) return { color: '#38bdf8', label: 'Strong', message: 'Solid prompt! The optimizer will polish it further.' };
        return { color: '#10b981', label: 'Pro Architect', message: 'Excellent specificity and structure.' };
    }
};
