import { CURRENCIES, convertToDisplay } from '../currencies';

const ResultsDisplay = ({ results, rates, currencyCtx, label, gatewayFee }) => {
    const { displayCurrency } = currencyCtx;
    const dc = CURRENCIES[displayCurrency];

    const {
        totalInputTokens, totalOutputTokens, totalTokens,
        modelCosts, totalModelCost, gemRevenue, gemsConsumed, profitUsd, useGemSystem,
        gatewayFeeLocal, netGemRevenueUsd,
    } = results;

    const showFee = !!(gatewayFee?.enabled && useGemSystem && gatewayFeeLocal > 0);

    const modelCostDisplay = convertToDisplay(totalModelCost, displayCurrency, rates);
    const feeDisplay = showFee ? (gatewayFeeLocal || 0) : 0;
    const revenueForProfit = showFee
        ? convertToDisplay(netGemRevenueUsd || 0, displayCurrency, rates)
        : (gemRevenue || 0);
    const profitDisplay = revenueForProfit - modelCostDisplay;
    const isProfit = profitDisplay >= 0;

    const fmtLocal = (val) => {
        if (dc.decimals === 0) return `${dc.symbol}${Math.round(val).toLocaleString()}`;
        return `${dc.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: dc.decimals, maximumFractionDigits: dc.decimals })}`;
    };

    const allCurrencies = Object.values(CURRENCIES);

    return (
        <div className="glass-card fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Results</h2>
                {label && <span className="text-xs text-text-muted">— {label}</span>}
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-light border border-accent/30">
                    {dc.flag} {dc.code}
                </span>
                {useGemSystem && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gem/15 text-gem border border-gem/30">
                        Gem Mode
                    </span>
                )}
            </div>

            {/* Token Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="glass-card-compact text-center">
                    <div className="text-xs text-text-muted mb-1">Input Tokens</div>
                    <div className="text-sm font-semibold text-blue-400">{totalInputTokens.toLocaleString()}</div>
                </div>
                <div className="glass-card-compact text-center">
                    <div className="text-xs text-text-muted mb-1">Output Tokens</div>
                    <div className="text-sm font-semibold text-purple-400">{totalOutputTokens.toLocaleString()}</div>
                </div>
                <div className="glass-card-compact text-center">
                    <div className="text-xs text-text-muted mb-1">Total Tokens</div>
                    <div className="text-sm font-semibold text-accent-light">{totalTokens.toLocaleString()}</div>
                </div>
            </div>

            {/* Gems consumed */}
            {useGemSystem && gemsConsumed > 0 && (
                <div className="mb-4 py-2 px-3 rounded-lg bg-gem/5 border border-gem/15">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-muted">Total Gems Consumed</span>
                        <span className="text-sm font-semibold text-gem">{gemsConsumed.toLocaleString()} 💎</span>
                    </div>
                </div>
            )}

            {/* Per-Model Breakdown */}
            {modelCosts.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs text-text-muted uppercase tracking-wide font-medium mb-2">Per-Model Breakdown</div>
                    <div className="space-y-1.5">
                        {modelCosts.map((mc) => {
                            const costD = convertToDisplay(mc.cost, displayCurrency, rates);
                            const revenueD = mc.revenue || 0;
                            const profitD = revenueD - costD;
                            return (
                                <div key={mc.id} className="py-2 px-2.5 rounded-lg bg-white/[0.02] space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-text-primary font-medium truncate mr-2">{mc.name}</span>
                                        <span className="text-xs text-text-muted shrink-0">
                                            {mc.numRequests != null && <>{mc.numRequests.toLocaleString()} req · </>}
                                            {useGemSystem && <>{(mc.gemsUsed || 0).toLocaleString()} 💎</>}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-text-muted">API Cost</span>
                                        <span className="text-loss">{fmtLocal(costD)}</span>
                                    </div>
                                    {useGemSystem && (
                                        <>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-text-muted">Revenue</span>
                                                <span className="text-gem">{fmtLocal(revenueD)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-text-muted">Profit</span>
                                                <span className={`font-medium ${profitD >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                    {profitD >= 0 ? '+' : ''}{fmtLocal(profitD)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Total Summary */}
            <div className="space-y-2 mb-4 pt-3 border-t border-border">
                <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Total Model Cost</span>
                    <span className="text-sm font-semibold text-loss">{fmtLocal(modelCostDisplay)}</span>
                </div>
                {useGemSystem && (
                    <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">Gross Gem Revenue</span>
                        <span className="text-sm font-semibold text-gem">{fmtLocal(gemRevenue || 0)}</span>
                    </div>
                )}
                {showFee && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Gateway Fee
                            <span className="text-[10px] text-text-muted">({results.numWithdrawals ?? 1}×)</span>
                        </span>
                        <span className="text-sm font-semibold text-orange-400">−{fmtLocal(feeDisplay)}</span>
                    </div>
                )}
                {showFee && (
                    <div className="flex justify-between">
                        <span className="text-sm text-text-secondary">Net Revenue</span>
                        <span className="text-sm font-semibold text-gem">{fmtLocal(revenueForProfit)}</span>
                    </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                    <span className="text-sm font-semibold text-text-primary">
                        {useGemSystem ? 'Profit / Loss' : 'Total Cost'}
                    </span>
                    {useGemSystem ? (
                        <span className={`text-lg font-bold ${isProfit ? 'text-profit' : 'text-loss'}`}>
                            {isProfit ? '+' : ''}{fmtLocal(profitDisplay)}
                        </span>
                    ) : (
                        <span className="text-lg font-bold text-loss">{fmtLocal(modelCostDisplay)}</span>
                    )}
                </div>
            </div>

            {/* Multi-Currency Table */}
            <div className="pt-3 border-t border-border">
                <div className="text-xs text-text-muted uppercase tracking-wide font-medium mb-2">All Currencies</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-text-muted">
                                <th className="text-left font-medium py-1.5 pr-2">Currency</th>
                                <th className="text-right font-medium py-1.5 px-2">Cost</th>
                                {useGemSystem && <th className="text-right font-medium py-1.5 px-2">Revenue</th>}
                                {showFee && <th className="text-right font-medium py-1.5 px-2 text-orange-400">Fee</th>}
                                {useGemSystem && <th className="text-right font-medium py-1.5 pl-2">Profit</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {allCurrencies.map((c) => {
                                const isActive = c.code === displayCurrency;
                                const costInC = convertToDisplay(totalModelCost, c.code, rates);
                                const grossRevenueInC = convertToDisplay(results.gemRevenueUsd || 0, c.code, rates);
                                const feeInC = showFee ? convertToDisplay(results.gatewayFeeUsd || 0, c.code, rates) : 0;
                                const netRevenueInC = grossRevenueInC - feeInC;
                                const profitInC = netRevenueInC - costInC;
                                const fmt = (val) => {
                                    const decimals = c.decimals;
                                    return `${c.symbol}${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
                                };
                                return (
                                    <tr key={c.code} className={`border-t border-border/50 ${isActive ? 'bg-accent/5' : ''}`}>
                                        <td className="py-1.5 pr-2 text-text-secondary"><span className="mr-1">{c.flag}</span>{c.code}</td>
                                        <td className="py-1.5 px-2 text-right text-loss">{fmt(costInC)}</td>
                                        {useGemSystem && <td className="py-1.5 px-2 text-right text-gem">{fmt(grossRevenueInC)}</td>}
                                        {showFee && <td className="py-1.5 px-2 text-right text-orange-400">−{fmt(feeInC)}</td>}
                                        {useGemSystem && (
                                            <td className={`py-1.5 pl-2 text-right font-medium ${profitInC >= 0 ? 'text-profit' : 'text-loss'}`}>
                                                {profitInC >= 0 ? '+' : '−'}{fmt(Math.abs(profitInC))}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResultsDisplay;
