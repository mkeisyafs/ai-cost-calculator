import { useState, useCallback } from 'react';
import { fmtPricePerMillion } from '../currencies';

const ModelSearch = ({ onModelsSelected, selectedModels, onRemoveModel, currencyCtx }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const searchModels = useCallback(async () => {
        const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
            setError('Please set your OpenRouter API key in .env');
            return;
        }
        setLoading(true);
        setError('');
        setHasSearched(true);
        try {
            const res = await fetch('/api/openrouter/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` },
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const json = await res.json();
            const models = json.data || [];
            const filtered = query.trim()
                ? models.filter(m =>
                    m.name.toLowerCase().includes(query.toLowerCase()) ||
                    m.id.toLowerCase().includes(query.toLowerCase())
                )
                : models;
            const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50);
            setResults(sorted);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [query]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') searchModels();
    };

    const { displayCurrency, rates } = currencyCtx;

    const isSelected = (modelId) => selectedModels.some(m => m.id === modelId);

    return (
        <div className="glass-card fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">OpenRouter Models</h2>
            </div>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    placeholder="Search models... (e.g. gpt-4, claude, deepseek)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                    id="model-search-input"
                />
                <button
                    onClick={searchModels}
                    disabled={loading}
                    className="px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    id="search-models-btn"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                            </svg>
                            Searching...
                        </span>
                    ) : 'Search'}
                </button>
            </div>

            {error && (
                <div className="text-loss text-sm mb-3 p-2 rounded-lg bg-loss/10 border border-loss/20">
                    {error}
                </div>
            )}

            {selectedModels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selectedModels.map(model => (
                        <span key={model.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/20 text-accent-light text-xs border border-accent/30">
                            {model.name}
                            <button onClick={() => onRemoveModel(model.id)} className="hover:text-loss ml-1 cursor-pointer">×</button>
                        </span>
                    ))}
                </div>
            )}

            {results.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-1">
                    {results.map(model => (
                        <div
                            key={model.id}
                            onClick={() => !isSelected(model.id) && onModelsSelected(model)}
                            className={`flex items-center justify-between p-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${isSelected(model.id) ? 'bg-accent/15 border border-accent/30' : 'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-text-primary truncate">{model.name}</div>
                                <div className="text-xs text-text-muted truncate">{model.id}</div>
                            </div>
                            <div className="flex items-center gap-3 ml-3 shrink-0">
                                <div className="text-right">
                                    <div className="text-xs text-text-secondary">
                                        <span className="text-text-muted">in:</span> {fmtPricePerMillion(model.pricing?.prompt || '0', displayCurrency, rates)}/M
                                    </div>
                                    <div className="text-xs text-text-secondary">
                                        <span className="text-text-muted">out:</span> {fmtPricePerMillion(model.pricing?.completion || '0', displayCurrency, rates)}/M
                                    </div>
                                </div>
                                {isSelected(model.id) ? (
                                    <span className="text-accent-light text-sm">✓</span>
                                ) : (
                                    <span className="text-text-muted group-hover:text-accent-light text-sm transition-colors">+</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hasSearched && results.length === 0 && !loading && !error && (
                <div className="text-text-muted text-sm text-center py-4">
                    No models found. Try a different search term.
                </div>
            )}
        </div>
    );
};

export default ModelSearch;
