import { CURRENCIES } from '../currencies';

const GemsSystem = ({ packages, onPkgChange, onAddPackage, onRemovePackage, totalGems, totalSpent, currencyCtx, gatewayFee, onGatewayFeeChange }) => {
    const { displayCurrency } = currencyCtx;
    const dc = CURRENCIES[displayCurrency];
    const avgPricePerGem = totalGems > 0 ? totalSpent / totalGems : 0;

    const fmtLocal = (val) => {
        if (dc.decimals === 0) return `${dc.symbol}${Math.round(val).toLocaleString()}`;
        return `${dc.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: dc.decimals, maximumFractionDigits: dc.decimals })}`;
    };

    const gf = gatewayFee || {};

    return (
        <div className="glass-card fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gem/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gem" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.5 4.5L20 9l-4 3.5L17 18l-5-3-5 3 1-5.5L4 9l5.5-1.5z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Gem Top-Up Packages</h2>
                <button
                    onClick={onAddPackage}
                    className="ml-auto px-3 py-1 rounded-lg bg-gem/15 text-gem text-xs font-medium border border-gem/25 hover:bg-gem/25 transition-colors cursor-pointer"
                >
                    + Add Package
                </button>
            </div>

            {/* Package list */}
            <div className="space-y-3 mb-4">
                {packages.map((pkg, idx) => {
                    const pkgGems = (pkg.packsBought || 0) * (pkg.gemsSold || 0);
                    const pkgSpent = (pkg.packsBought || 0) * (pkg.gemsPrice || 0);
                    const perGem = pkg.gemsSold > 0 ? pkg.gemsPrice / pkg.gemsSold : 0;

                    return (
                        <div key={pkg.id} className="rounded-lg border border-border bg-white/[0.02] p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Package {idx + 1}</span>
                                {packages.length > 1 && (
                                    <button
                                        onClick={() => onRemovePackage(pkg.id)}
                                        className="w-5 h-5 rounded-full flex items-center justify-center text-text-muted hover:text-loss hover:bg-loss/10 transition-colors cursor-pointer text-xs"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] text-text-muted mb-1">Gems</label>
                                    <input
                                        type="number"
                                        value={pkg.gemsSold}
                                        onChange={(e) => onPkgChange(pkg.id, 'gemsSold', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        className="!text-xs !py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-muted mb-1">Price ({dc.code})</label>
                                    <input
                                        type="number"
                                        value={pkg.gemsPrice}
                                        onChange={(e) => onPkgChange(pkg.id, 'gemsPrice', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        step="1"
                                        className="!text-xs !py-1.5"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] text-text-muted mb-1">Qty Bought</label>
                                    <input
                                        type="number"
                                        value={pkg.packsBought}
                                        onChange={(e) => onPkgChange(pkg.id, 'packsBought', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        className="!text-xs !py-1.5"
                                    />
                                </div>
                            </div>
                            <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
                                <span>{fmtLocal(perGem)}/gem</span>
                                <span>{pkgGems.toLocaleString()} 💎 = {fmtLocal(pkgSpent)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Totals */}
            <div className="py-2.5 px-3 rounded-lg bg-gem/5 border border-gem/15 mb-4">
                <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-text-muted">Total Gems</span>
                    <span className="text-gem font-semibold">{totalGems.toLocaleString()} 💎</span>
                </div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-text-muted">Total Spent</span>
                    <span className="text-text-primary font-semibold">{fmtLocal(totalSpent)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-gem/15">
                    <span className="text-text-muted">Avg. Price/Gem</span>
                    <span className="text-gem font-semibold">{fmtLocal(avgPricePerGem)}</span>
                </div>
            </div>

            {/* Payment Gateway Fee */}
            <div className="rounded-lg border border-border bg-white/[0.02] p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-orange-500/20 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-text-primary">Withdrawal Fee</span>
                        <span className="text-[10px] text-text-muted">(Payment Gateway)</span>
                    </div>
                    <div
                        onClick={() => onGatewayFeeChange('enabled', !gf.enabled)}
                        className={`relative w-9 h-[18px] rounded-full transition-colors duration-200 cursor-pointer ${gf.enabled ? 'bg-orange-500' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${gf.enabled ? 'translate-x-[18px]' : ''}`} />
                    </div>
                </div>

                {gf.enabled && (
                    <div className="space-y-2 mt-3 fade-in">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] text-text-muted mb-1">% Fee per Withdrawal</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={gf.percentFee ?? 2.9}
                                        onChange={(e) => onGatewayFeeChange('percentFee', parseFloat(e.target.value) || 0)}
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        className="!text-xs !py-1.5 !pr-6"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-muted pointer-events-none">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-text-muted mb-1">Fixed Fee ({dc.code})</label>
                                <input
                                    type="number"
                                    value={gf.fixedFee ?? 0.30}
                                    onChange={(e) => onGatewayFeeChange('fixedFee', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="any"
                                    className="!text-xs !py-1.5"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] text-text-muted mb-1">Min Fee ({dc.code})</label>
                                <input
                                    type="number"
                                    value={gf.minFee ?? 0}
                                    onChange={(e) => onGatewayFeeChange('minFee', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="any"
                                    className="!text-xs !py-1.5"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-text-muted mb-1"># Withdrawals</label>
                                <input
                                    type="number"
                                    value={gf.numWithdrawals ?? 1}
                                    onChange={(e) => onGatewayFeeChange('numWithdrawals', parseInt(e.target.value) || 1)}
                                    min="1"
                                    step="1"
                                    className="!text-xs !py-1.5"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-text-muted">
                            Fee is applied per withdrawal on gross gem revenue. Total spent = {gf.numWithdrawals ?? 1} × (revenue/{gf.numWithdrawals ?? 1} × {gf.percentFee ?? 2.9}% + {dc.symbol}{(gf.fixedFee ?? 0.30).toLocaleString()})
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GemsSystem;
