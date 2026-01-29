/**
 * State module
 * Simple reactive store for the V2 application.
 */
export const store = {
    state: {
        mode: 'optimize', // 'optimize' or 'scratch'
        step: 1, // 1: Input, 2: Analysis, 3: Results
        originalPrompt: '',
        optimizedPrompt: '',
        targetModel: 'claude',
        preferredStyle: 'markdown', // NEW: Persists the dropdown value
        analysis: null,
        optimizationResult: null,
        theme: localStorage.getItem('prompt-theme') || 'dark'
    },

    listeners: [],

    subscribe(fn) {
        this.listeners.push(fn);
    },

    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    },

    notify() {
        this.listeners.forEach(fn => fn(this.state));
    }
};
