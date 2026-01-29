/**
 * Main application logic for Frontier Prompt Architect
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    const state = {
        currentStep: 1,
        selectedModel: 'claude',
        promptData: {
            initial: '',
            questions: {}, // Dynamic answers
            constraints: [],
            negativeConstraints: [],
            beginnerOptions: {
                noYapping: false,
                keepShort: false,
                customFormat: 'standard'
            }
        },
        dynamicQuestions: []
    };

    // DOM Elements
    const steps = document.querySelectorAll('.step-container');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    const modelCards = document.querySelectorAll('.model-card');

    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const closeModal = document.querySelector('.close-modal');

    const initialPromptInput = document.getElementById('initial-prompt');
    const scoreFill = document.querySelector('.score-fill');
    const scoreNumeric = document.querySelector('.score-numeric');
    const scoreLabel = document.querySelector('.score-label');
    const scoreMessage = document.querySelector('.score-message');

    const questionsContainer = document.getElementById('dynamic-questions-list');
    const previewArea = document.getElementById('final-prompt-preview');
    const copyBtn = document.getElementById('copy-btn');
    const copyBadge = document.querySelector('.copy-badge');

    // --- INITIALIZATION ---
    function init() {
        updateStep();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Theme Toggle
        themeToggle.addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('prompt-theme', isLight ? 'light' : 'dark');
            refreshThemeIcon();
        });

        function refreshThemeIcon() {
            const isLight = document.body.classList.contains('light-mode');
            // Show Moon when in Light mode, Sun when in Dark mode
            const iconName = isLight ? 'moon' : 'sun';
            themeToggle.innerHTML = `<i data-lucide="${iconName}" id="theme-icon"></i>`;
            if (window.lucide) {
                lucide.createIcons();
            }
        }

        // Load saved theme
        if (localStorage.getItem('prompt-theme') === 'light') {
            document.body.classList.add('light-mode');
        }

        // Initial render
        refreshThemeIcon();

        // Modal Toggle
        infoBtn.addEventListener('click', () => infoModal.style.display = 'block');
        closeModal.addEventListener('click', () => infoModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.style.display = 'none';
        });

        // Model selection
        modelCards.forEach(card => {
            card.addEventListener('click', () => {
                modelCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                state.selectedModel = card.dataset.model;
            });
        });

        // Scoring engine
        initialPromptInput.addEventListener('input', (e) => {
            state.promptData.initial = e.target.value;
            const score = Heuristics.calculateScore(state.promptData.initial);
            updateScoreUI(score);
            nextBtn.disabled = state.promptData.initial.trim().length < 5;
        });

        // Navigation
        nextBtn.addEventListener('click', () => {
            if (state.currentStep === 1) {
                prepareQuestions();
            } else if (state.currentStep === 3) {
                generateFinalPrompt();
            }

            if (state.currentStep < 4) {
                state.currentStep++;
                updateStep();
            }
        });

        backBtn.addEventListener('click', () => {
            if (state.currentStep > 1) {
                state.currentStep--;
                updateStep();
            }
        });

        // Copy button
        copyBtn.addEventListener('click', () => {
            const text = previewArea.innerText;
            navigator.clipboard.writeText(text).then(() => {
                copyBadge.classList.add('visible');
                setTimeout(() => copyBadge.classList.remove('visible'), 2000);
            });
        });
    }

    // --- CORE LOGIC ---

    function updateStep() {
        steps.forEach((step, idx) => {
            step.classList.toggle('active', (idx + 1) === state.currentStep);
        });

        progressSteps.forEach((step, idx) => {
            step.classList.toggle('active', (idx + 1) === state.currentStep);
            step.classList.toggle('completed', (idx + 1) < state.currentStep);
        });

        backBtn.style.visibility = state.currentStep === 1 ? 'hidden' : 'visible';

        if (state.currentStep === 4) {
            nextBtn.innerText = 'Start Over';
            nextBtn.onclick = () => window.location.reload();
        } else {
            nextBtn.innerText = state.currentStep === 3 ? 'Generate Architect Prompt' : 'Next Step';
            nextBtn.onclick = null; // Reset to default listener
        }
    }

    function updateScoreUI(score) {
        const feedback = Heuristics.getScoreFeedback(score);
        scoreFill.style.width = `${score * 10}%`;
        scoreFill.style.backgroundColor = feedback.color;
        scoreNumeric.innerText = `${score}/10`;
        scoreNumeric.style.color = feedback.color;
        scoreLabel.innerText = feedback.label;
        scoreMessage.innerText = feedback.message;
    }

    function prepareQuestions() {
        state.dynamicQuestions = Heuristics.getFollowUpQuestions(state.promptData.initial);
        questionsContainer.innerHTML = '';

        state.dynamicQuestions.forEach(q => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.innerHTML = `
                <label>${q.label}</label>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${q.question}</p>
                <input type="text" data-id="${q.id}" placeholder="${q.placeholder}" class="dynamic-input">
            `;
            questionsContainer.appendChild(card);
        });

        // Map internal inputs to state
        document.querySelectorAll('.dynamic-input').forEach(input => {
            input.addEventListener('input', (e) => {
                state.promptData.questions[e.target.dataset.id] = e.target.value;
            });
        });
    }

    function generateFinalPrompt() {
        // Collect constraints from Step 3
        state.promptData.beginnerOptions.noYapping = document.getElementById('opt-noyap').checked;
        state.promptData.beginnerOptions.keepShort = document.getElementById('opt-short').checked;
        state.promptData.beginnerOptions.customFormat = document.getElementById('opt-format').value;

        // The "Compiler"
        let final = `[ROLE]: You are a Senior Expert Architect.\n`;

        if (state.promptData.questions.tone) {
            final = `[ROLE]: You are an expert at communication with a ${state.promptData.questions.tone} tone.\n`;
        } else if (state.promptData.questions.language) {
            final = `[ROLE]: You are a Senior ${state.promptData.questions.language} Engineer with 15+ years of experience.\n`;
        }

        final += `[TASK]: ${state.promptData.initial}\n\n`;

        // Context / Details from questions
        let context = [];
        if (state.promptData.questions.recipient) context.push(`Target: ${state.promptData.questions.recipient}`);
        if (state.promptData.questions.goal) context.push(`Main Priority: ${state.promptData.questions.goal}`);
        if (state.promptData.questions.style) context.push(`Style Guide: ${state.promptData.questions.style}`);

        if (context.length > 0) {
            final += `[CONTEXT]:\n${context.map(c => `- ${c}`).join('\n')}\n\n`;
        }

        // Hard Constraints
        let hard = [];
        if (state.promptData.questions.length) hard.push(state.promptData.questions.length);
        if (state.promptData.beginnerOptions.keepShort) hard.push("Be concise and avoid filler words.");

        // Format mapping
        const formatMap = {
            'standard': 'Markdown',
            'article': 'well-structured paragraphs with headings',
            'data': 'raw JSON format',
            'bullets': 'a clear bulleted list'
        };
        hard.push(`Output MUST be in ${formatMap[state.promptData.beginnerOptions.customFormat]}.`);

        final += `[HARD CONSTRAINTS]:\n${hard.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n`;

        // Negative Constraints
        let negative = [];
        if (state.promptData.questions.negative) negative.push(state.promptData.questions.negative);
        if (state.promptData.beginnerOptions.noYapping) negative.push("No preamble, no conversational filler, go straight to the answer.");

        if (negative.length > 0) {
            final += `[NEVER]:\n${negative.map(n => `- ${n}`).join('\n')}\n`;
        }

        // Model Specific Rules
        final += `\n[THINKING RULE]:\n`;
        if (state.selectedModel === 'claude') {
            final += `Before providing the final output, analyze the logic in a <thinking> block, identifying potential edge cases.`;
        } else if (state.selectedModel === 'gpt') {
            final += `Think step-by-step. First draft the core logic, then review it for flaws, then provide the final optimized output.`;
        } else if (state.selectedModel === 'gemini') {
            final += `Strict Grounding: Use ONLY the context provided or implied by the core task. If details are missing, state them rather than guessing.`;
        }

        final += `\n\n[OUTPUT]: Provide the result in ${formatMap[state.promptData.beginnerOptions.customFormat]}. No preamble.`;

        previewArea.innerText = final;
    }

    init();
});
