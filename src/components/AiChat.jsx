import { useState, useRef, useEffect } from 'react';
import { CURRENCIES } from '../currencies';

const SYSTEM_PROMPT = `You are an AI assistant embedded in an AI Cost Calculator tool. You help users understand their AI model costs, profit margins, and gem pricing strategies.

You have access to the user's current calculator data which will be provided with each message. Use this data to give specific, actionable advice.

Your capabilities:
- Explain cost breakdowns and profit margins
- Suggest optimal pricing strategies for gem packs
- Compare model costs and recommend the most cost-effective models
- Help users understand currency conversions
- Provide tips on maximizing profit from AI model usage
- Answer any questions about the calculator's features

Keep responses concise and helpful. Use numbers and calculations when relevant. Format with markdown for readability.`;

function buildContextMessage(calcData) {
    const { perPkgResults, allResults, gemPackages, totalGems, totalSpent, rates, displayCurrency, selectedModels, manualPricing, manualGemConfig, useManualPricing, useGemSystem } = calcData;
    const dc = CURRENCIES[displayCurrency];

    let ctx = `## Current Calculator State\n\n`;
    ctx += `**Display Currency:** ${dc.flag} ${dc.code}\n`;
    ctx += `**Pricing Mode:** ${useManualPricing ? 'Manual' : 'OpenRouter API'}\n`;
    ctx += `**Gem System:** ${useGemSystem ? 'Enabled' : 'Disabled'}\n\n`;

    if (useManualPricing && manualGemConfig) {
        ctx += `### Manual Pricing\n`;
        ctx += `- Input: $${manualPricing.pricePerKInput}/1K tokens\n`;
        ctx += `- Output: $${manualPricing.pricePerKOutput}/1K tokens\n`;
        ctx += `- Gems/Request: ${manualGemConfig.gemsPerRequest}, Input Tok: ${manualGemConfig.inputTokens.toLocaleString()}, Output Tok: ${manualGemConfig.outputTokens.toLocaleString()}\n\n`;
    }

    if (useGemSystem && gemPackages && perPkgResults) {
        ctx += `### Per-Package Results (${gemPackages.length} packages)\n\n`;
        perPkgResults.forEach((pkg, i) => {
            ctx += `#### Package ${i + 1}: ${gemPackages[i]?.gemsSold.toLocaleString()} gems = ${dc.symbol}${gemPackages[i]?.gemsPrice.toLocaleString()} × ${gemPackages[i]?.packsBought} bought\n`;
            ctx += `- Gems: ${pkg.pkgGems.toLocaleString()} 💎, Spent: ${dc.symbol}${pkg.pkgSpent.toLocaleString()}\n`;
            ctx += `- Tokens: ${pkg.totalInputTokens.toLocaleString()} in + ${pkg.totalOutputTokens.toLocaleString()} out\n`;
            ctx += `- Cost (USD): $${pkg.totalModelCost.toFixed(6)}\n`;
            ctx += `- Revenue (USD): $${pkg.gemRevenueUsd.toFixed(6)}\n`;
            ctx += `- Profit (USD): $${pkg.profitUsd.toFixed(6)} (${pkg.profitUsd >= 0 ? 'PROFIT' : 'LOSS'})\n`;
            if (pkg.modelCosts.length > 0) {
                pkg.modelCosts.forEach(mc => {
                    ctx += `  - ${mc.name}: ${mc.numRequests?.toLocaleString() || 0} req, $${mc.cost.toFixed(6)} cost, $${(mc.profitUsd || 0).toFixed(6)} profit\n`;
                });
            }
            ctx += `\n`;
        });

        ctx += `### Combined All Packages\n`;
        ctx += `- Total Gems: ${totalGems.toLocaleString()}, Total Spent: ${dc.symbol}${totalSpent.toLocaleString()}\n`;
    }

    if (allResults) {
        ctx += `- Tokens: ${allResults.totalInputTokens.toLocaleString()} in + ${allResults.totalOutputTokens.toLocaleString()} out\n`;
        ctx += `- Total Cost (USD): $${allResults.totalModelCost.toFixed(6)}\n`;
        if (useGemSystem) {
            ctx += `- Revenue (USD): $${allResults.gemRevenueUsd.toFixed(6)}\n`;
            ctx += `- Profit (USD): $${allResults.profitUsd.toFixed(6)} (${allResults.profitUsd >= 0 ? 'PROFIT' : 'LOSS'})\n`;
            if (allResults.gemRevenueUsd > 0) {
                ctx += `- Margin: ${((allResults.profitUsd / allResults.gemRevenueUsd) * 100).toFixed(1)}%\n`;
            }
        }
    }

    ctx += `\n### Exchange Rates\n`;
    ctx += `- 1 USD = ${rates.CNY} CNY\n`;
    ctx += `- 1 USD = ${rates.JPY} JPY\n`;
    ctx += `- 1 USD = ${rates.IDR} IDR\n`;

    return ctx;
}

const AiChat = ({ calcData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! 👋 I can help you analyze your AI costs and suggest optimization strategies. Ask me anything about your current setup!' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const apiKey = import.meta.env.VITE_HALU_API_KEY;
        if (!apiKey || apiKey === 'your-halu-api-key-here') {
            setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: '⚠️ Please set your Halu API key in the `.env` file (`VITE_HALU_API_KEY`).' }]);
            setInput('');
            return;
        }

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const contextMsg = buildContextMessage(calcData);
            const apiMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'system', content: contextMsg },
                ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMessage },
            ];

            const res = await fetch('/api/halu/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gemini-3.1-pro-high',
                    messages: apiMessages,
                    max_tokens: 10240,
                    temperature: 0.7,
                }),
            });

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }

            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
            setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const suggestions = [
        'Is my gem pricing profitable?',
        'How can I reduce costs?',
        'Which model is cheapest?',
        'Explain my profit margin',
    ];

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer z-50 ${isOpen
                    ? 'bg-white/10 border border-border rotate-0'
                    : 'bg-accent hover:bg-accent-light pulse-glow'
                    }`}
                id="ai-chat-toggle"
            >
                {isOpen ? (
                    <svg className="w-6 h-6 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                )}
            </button>

            {/* Chat panel */}
            {isOpen && (
                <div className="fixed bottom-20 right-3 left-3 sm:left-auto sm:bottom-24 sm:right-6 sm:w-96 max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] h-[28rem] sm:h-[32rem] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden z-50 fade-in"
                    style={{ background: 'rgba(10, 10, 26, 0.95)', backdropFilter: 'blur(20px)' }}
                >
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                            <svg className="w-4 h-4 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary">AI Assistant</h3>
                            <p className="text-xs text-text-muted">Powered by Halu AI</p>
                        </div>
                        <button
                            onClick={() => setMessages([messages[0]])}
                            className="ml-auto text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer px-2 py-1 rounded hover:bg-white/5"
                            title="Clear chat"
                        >
                            Clear
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-accent/20 text-text-primary border border-accent/20'
                                    : 'bg-white/5 text-text-secondary border border-border'
                                    }`}>
                                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-border rounded-xl px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-accent-light animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-accent-light animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-accent-light animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestions (show only when few messages) */}
                    {messages.length <= 2 && !loading && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setInput(s); }}
                                    className="text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent-light border border-accent/20 hover:bg-accent/20 transition-colors cursor-pointer"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-3 py-3 border-t border-border shrink-0">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about your costs..."
                                className="flex-1 !rounded-full !px-4 !py-2 !text-sm"
                                disabled={loading}
                                id="ai-chat-input"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                className="w-9 h-9 rounded-full bg-accent hover:bg-accent-light text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 cursor-pointer shrink-0"
                                id="ai-chat-send"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiChat;
