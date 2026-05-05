const TokenInput = ({ inputTokens, outputTokens, onChange }) => {
    return (
        <div className="glass-card fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Token Usage</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wide">
                        Input Tokens
                    </label>
                    <input
                        type="number"
                        value={inputTokens}
                        onChange={(e) => onChange('inputTokens', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        id="input-tokens"
                    />
                </div>
                <div>
                    <label className="block text-xs text-text-secondary mb-1.5 font-medium uppercase tracking-wide">
                        Output Tokens
                    </label>
                    <input
                        type="number"
                        value={outputTokens}
                        onChange={(e) => onChange('outputTokens', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        min="0"
                        id="output-tokens"
                    />
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted uppercase tracking-wide">Total Tokens</span>
                    <span className="text-sm font-semibold text-accent-light">
                        {(inputTokens + outputTokens).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default TokenInput;
