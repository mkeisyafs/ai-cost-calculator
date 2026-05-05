const currencies = [
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
];

const CurrencyRates = ({ rates, onChange }) => {
    return (
        <div className="glass-card fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Exchange Rates</h2>
            </div>

            <div className="text-xs text-text-muted mb-3 uppercase tracking-wide font-medium">
                1 USD = ...
            </div>

            <div className="space-y-3">
                {currencies.map(({ code, name, symbol, flag }) => (
                    <div key={code} className="flex items-center gap-3">
                        <span className="text-lg" title={name}>{flag}</span>
                        <div className="flex-1">
                            <label className="block text-xs text-text-secondary mb-1">{code}</label>
                            <input
                                type="number"
                                value={rates[code]}
                                onChange={(e) => onChange(code, parseFloat(e.target.value) || 0)}
                                step="0.01"
                                min="0"
                                id={`rate-${code.toLowerCase()}`}
                            />
                        </div>
                        <span className="text-xs text-text-muted w-8">{symbol}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CurrencyRates;
