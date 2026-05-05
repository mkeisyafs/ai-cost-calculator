import { CURRENCIES, convertToDisplay } from '../currencies';

const SelectedModels = ({ models, totalGems, onUpdateModel, onRemoveModel, currencyCtx }) => {
    const { displayCurrency, rates } = currencyCtx;
    const dc = CURRENCIES[displayCurrency];

    if (models.length === 0) return null;

    const fmtPricePerM = (perToken) => {
        const num = parseFloat(perToken || '0');
        if (num === 0) return 'Free';
        const perMillion = convertToDisplay(num * 1_000_000, displayCurrency, rates);
        if (perMillion >= 1) return `${dc.symbol}${perMillion % 1 === 0 ? perMillion.toFixed(0) : perMillion.toFixed(2)}`;
        return `${dc.symbol}${perMillion.toFixed(4)}`;
    };

    return (
        <div className="glass-card fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Selected Models</h2>
                <span className="ml-auto text-xs text-text-muted">{totalGems.toLocaleString()} 💎 available</span>
            </div>

            <div className="space-y-3">
                {models.map((model) => {
                    const gc = model.gemConfig;
                    const maxRequests = gc.gemsPerRequest > 0 ? Math.floor(totalGems / gc.gemsPerRequest) : 0;

                    return (
                        <div key={model.id} className="rounded-xl border border-border bg-white/[0.02] p-3 fade-in">
                            {/* Model header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-text-primary truncate">{model.name}</div>
                                    <div className="text-[10px] sm:text-xs text-text-muted truncate">
                                        {model.id} · in: {fmtPricePerM(model.pricing?.prompt)}/M · out: {fmtPricePerM(model.pricing?.completion)}/M
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRemoveModel(model.id)}
                                    className="ml-2 w-6 h-6 rounded-full flex items-center justify-center text-text-muted hover:text-loss hover:bg-loss/10 transition-colors cursor-pointer shrink-0"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Per-model gem config (no requests field — it's calculated) */}
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] text-text-muted mb-1 uppercase tracking-wider">💎 Gems/Req</label>
                                    <input
                                        type="number"
                                        value={gc.gemsPerRequest}
                                        onChange={(e) => onUpdateModel(model.id, 'gemsPerRequest', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="any"
                                        className="!text-xs !py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-muted mb-1 uppercase tracking-wider">Input Tok</label>
                                    <input
                                        type="number"
                                        value={gc.inputTokens}
                                        onChange={(e) => onUpdateModel(model.id, 'inputTokens', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        className="!text-xs !py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-muted mb-1 uppercase tracking-wider">Output Tok</label>
                                    <input
                                        type="number"
                                        value={gc.outputTokens}
                                        onChange={(e) => onUpdateModel(model.id, 'outputTokens', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        className="!text-xs !py-1.5"
                                    />
                                </div>
                            </div>

                            {/* Calculated requests from available gems */}
                            <div className="mt-2 py-1.5 px-2 rounded-md bg-accent/5 border border-accent/10">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-text-muted">Max requests from {totalGems.toLocaleString()} gems</span>
                                    <span className="text-accent-light font-semibold">{maxRequests.toLocaleString()} requests</span>
                                </div>
                                <div className="flex justify-between text-[11px] mt-0.5">
                                    <span className="text-text-muted">Gems used</span>
                                    <span className="text-gem">{(maxRequests * gc.gemsPerRequest).toLocaleString()} 💎</span>
                                </div>
                                <div className="flex justify-between text-[11px] mt-0.5">
                                    <span className="text-text-muted">Tokens used</span>
                                    <span className="text-text-secondary">
                                        {(maxRequests * gc.inputTokens).toLocaleString()} in + {(maxRequests * gc.outputTokens).toLocaleString()} out
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SelectedModels;
