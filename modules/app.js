/**
 * Main V2 Application Controller
 */
import { store } from './state.js';
import { TokenCounter } from './token_counter.js';
import { PromptAnalyzer } from './analyzer.js';
import { PromptOptimizer } from './optimizer.js';

// Model Adapters
import { ClaudeAdapter } from './adapters/claude.js';
import { GPTAdapter } from './adapters/gpt.js';
import { GeminiAdapter } from './adapters/gemini.js';

const adapters = {
    claude: ClaudeAdapter,
    gpt: GPTAdapter,
    gemini: GeminiAdapter
};

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const views = {
        input: document.getElementById('view-input'),
        analysis: document.getElementById('view-analysis'),
        results: document.getElementById('view-results')
    };

    const promptInput = document.getElementById('prompt-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const modelCards = document.querySelectorAll('.model-card');
    const levelBtns = document.querySelectorAll('.level-btn');
    const componentList = document.getElementById('component-checklist');

    // --- INITIALIZATION ---
    function init() {
        setupEventListeners();
        store.subscribe(render);
    }

    function setupEventListeners() {
        // Theme Toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('prompt-theme', isLight ? 'light' : 'dark');
            const iconName = isLight ? 'moon' : 'sun';
            document.getElementById('theme-toggle').innerHTML = `<i data-lucide="${iconName}" id="theme-icon"></i>`;
            if (window.lucide) lucide.createIcons();
        });

        // Info Modal
        document.getElementById('info-btn').addEventListener('click', () => {
            document.getElementById('info-modal').style.display = 'block';
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('info-modal').style.display = 'none';
        });

        // Input detection
        promptInput.addEventListener('input', (e) => {
            const val = e.target.value;
            analyzeBtn.disabled = val.trim().length < 5;
            store.setState({ originalPrompt: val });
        });

        // Model selection
        modelCards.forEach(card => {
            card.addEventListener('click', () => {
                modelCards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                store.setState({ targetModel: card.dataset.model });
            });
        });

        // Level selection
        levelBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                levelBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                const level = btn.dataset.level;
                // We'll store level in a local closure or simple variable for the session
                window._optLevel = level;
            });
        });

        // VIEW NAVIGATION
        analyzeBtn.addEventListener('click', () => {
            const analyzer = new PromptAnalyzer(store.state.originalPrompt, store.state.targetModel);
            const report = analyzer.fullReport();
            store.setState({ analysis: report, step: 2 });
        });

        // Global Back Button Logic
        const goBack = () => {
            const currentStep = store.state.step;
            if (currentStep > 1) {
                store.setState({ step: currentStep - 1 });
            }
        };

        const backBtnAnalysis = document.getElementById('v2-back-btn-analysis');
        if (backBtnAnalysis) backBtnAnalysis.addEventListener('click', goBack);

        const backBtnResults = document.getElementById('v2-back-btn-results');
        if (backBtnResults) backBtnResults.addEventListener('click', goBack);

        document.getElementById('restart-btn')?.addEventListener('click', () => {
            window.location.reload();
        });

        document.getElementById('optimize-btn').addEventListener('click', () => {
            const adapter = adapters[store.state.targetModel];
            const optimizer = new PromptOptimizer(store.state.originalPrompt, store.state.analysis, adapter);
            const result = optimizer.optimize(window._optLevel || 'medium');
            store.setState({ optimizationResult: result, step: 3 });
        });

        // Copy button logic remains...
        document.getElementById('copy-v2-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(store.state.optimizationResult.optimized);
            alert('Optimized prompt copied to clipboard!');
        });

        // COMPONENT TOGGLE HANDLER (Delegation)
        componentList.addEventListener('click', (e) => {
            const tag = e.target.closest('.component-tag');
            if (!tag) return;

            const key = tag.dataset.key;
            const currentAnalysis = store.state.analysis;

            // Toggle state
            currentAnalysis.components[key].present = !currentAnalysis.components[key].present;

            // Re-render only the list (optimization: update state to trigger render)
            store.setState({ analysis: { ...currentAnalysis } });
        });
    }

    function render(state) {
        // Step 1 Persistence: Ensure textarea matches state when returning
        if (state.step === 1) {
            promptInput.value = state.originalPrompt;
            analyzeBtn.disabled = state.originalPrompt.trim().length < 5;
        }

        // Toggle Views
        Object.keys(views).forEach(key => {
            views[key].classList.toggle('active',
                (key === 'input' && state.step === 1) ||
                (key === 'analysis' && state.step === 2) ||
                (key === 'results' && state.step === 3)
            );
        });

        if (state.step === 2 && state.analysis) {
            document.querySelector('.score-display').innerText = `${state.analysis.score}/100`;
            document.querySelector('.altitude-value').innerText = state.analysis.altitude.toUpperCase();

            // Sync style dropdown
            const styleSelect = document.getElementById('output-style');
            if (styleSelect) styleSelect.value = state.preferredStyle;

            // Render component tags with data-key for interactivity
            componentList.innerHTML = Object.entries(state.analysis.components)
                .map(([key, data]) => `
                    <div class="component-tag ${data.present ? 'present' : ''}" data-key="${key}">
                        ${data.present ? '✓' : '○'} ${key.charAt(0).toUpperCase() + key.slice(1)}
                    </div>
                `).join('');
        }

        if (state.step === 3 && state.optimizationResult) {
            document.getElementById('efficiency-value').innerText = `${state.optimizationResult.metrics.efficiency}%`;
            document.getElementById('original-display').innerText = state.originalPrompt;
            document.getElementById('optimized-display').innerText = state.optimizationResult.optimized;
        }
    }

    init();
});
