/**
 * V2 Engine Test Suite
 * Imports and verifies all core modules.
 */
import { TokenCounter } from './token_counter.js';
import { PromptAnalyzer } from './analyzer.js';
import { PromptOptimizer } from './optimizer.js';
import { ClaudeAdapter } from './adapters/claude.js';

export function runTests() {
    console.group('V2 Engine Test Suite');

    // 1. TokenCounter Test
    const tokens = TokenCounter.estimate('Hello world, I am a prompt.');
    console.log('TokenCounter Test:', tokens > 0 ? '✅' : '❌', `(${tokens} tokens)`);

    // 2. Analyzer Test
    const rawPrompt = "Act as an expert. Please help me write a poem.";
    const analyzer = new PromptAnalyzer(rawPrompt);
    const analysis = analyzer.fullReport();
    console.log('Analyzer Score Test:', analysis.score > 0 ? '✅' : '❌', `(${analysis.score}/100)`);
    console.log('Analyzer Role Test:', analysis.components.role.present ? '✅' : '❌');

    // 3. Optimizer Test
    const optimizer = new PromptOptimizer(rawPrompt, analysis, ClaudeAdapter);
    const result = optimizer.optimize('high');

    console.log('Optimizer Result Test:', result.optimized.includes('<task>') ? '✅' : '❌');
    console.log('Redundancy Removal Test:', !result.optimized.toLowerCase().includes('please') ? '✅' : '❌');
    console.log('Metrics Test:', result.metrics.efficiency >= 0 ? '✅' : '❌', `(${result.metrics.efficiency}% efficiency)`);

    console.groupEnd();
}
