import { useState, useMemo } from 'react';
import { CURRENCIES, fmtDisplay } from './currencies';
import ModelSearch from './components/ModelSearch';
import TokenInput from './components/TokenInput';
import GemsSystem from './components/GemsSystem';
import SelectedModels from './components/SelectedModels';
import CurrencyRates from './components/CurrencyRates';
import ResultsDisplay from './components/ResultsDisplay';
import ProfitChart from './components/ProfitChart';
import AiChat from './components/AiChat';
import { exportToPdf } from './utils/exportPdf';

// Default gem config added to each model when selected
const DEFAULT_GEM_CONFIG = {
    gemsPerRequest: 5,
    inputTokens: 10000,
    outputTokens: 1000,
};

const DEFAULT_PACKAGE = { id: 1, gemsSold: 1000, gemsPrice: 50000, packsBought: 1 };

// Default payment gateway fee config
const DEFAULT_GATEWAY_FEE = {
    enabled: false,
    percentFee: 2.9,   // e.g. Stripe 2.9%
    fixedFee: 0.30,    // e.g. Stripe $0.30 per transaction
    minFee: 0,         // minimum fee in local currency
    numWithdrawals: 1, // how many withdrawals are planned
};

const defaultState = {
    inputTokens: 1000,
    outputTokens: 500,
    gemPackages: [{ ...DEFAULT_PACKAGE }],
    rates: { CNY: 7.2, JPY: 150, IDR: 16000 },
    manualPricing: { pricePerKInput: 0.03, pricePerKOutput: 0.06 },
    manualGemConfig: { ...DEFAULT_GEM_CONFIG },
    gatewayFee: { ...DEFAULT_GATEWAY_FEE },
};

function App() {
    const [inputTokens, setInputTokens] = useState(defaultState.inputTokens);
    const [outputTokens, setOutputTokens] = useState(defaultState.outputTokens);
    const [gemPackages, setGemPackages] = useState(defaultState.gemPackages);
    const [rates, setRates] = useState(defaultState.rates);
    const [selectedModels, setSelectedModels] = useState([]);
    const [manualPricing, setManualPricing] = useState(defaultState.manualPricing);
    const [manualGemConfig, setManualGemConfig] = useState(defaultState.manualGemConfig);
    const [gatewayFee, setGatewayFee] = useState(defaultState.gatewayFee);
    const [useManualPricing, setUseManualPricing] = useState(true);
    const [useGemSystem, setUseGemSystem] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState('IDR');
    const [nextPkgId, setNextPkgId] = useState(2);

    const handleGatewayFeeChange = (field, value) =>
        setGatewayFee(prev => ({ ...prev, [field]: value }));

    const handleTokenChange = (field, value) => {
        if (field === 'inputTokens') setInputTokens(value);
        else setOutputTokens(value);
    };
    const handleRateChange = (code, value) => setRates(prev => ({ ...prev, [code]: value }));

    // Gem package handlers
    const handlePkgChange = (pkgId, field, value) => {
        setGemPackages(prev => prev.map(p => p.id === pkgId ? { ...p, [field]: value } : p));
    };
    const handleAddPackage = () => {
        setGemPackages(prev => [...prev, { id: nextPkgId, gemsSold: 100, gemsPrice: 10000, packsBought: 1 }]);
        setNextPkgId(n => n + 1);
    };
    const handleRemovePackage = (pkgId) => {
        setGemPackages(prev => prev.length > 1 ? prev.filter(p => p.id !== pkgId) : prev);
    };

    // When a model is selected from OpenRouter, attach default gem config
    const handleModelSelected = (model) => {
        setSelectedModels(prev => {
            if (prev.some(m => m.id === model.id)) return prev;
            return [...prev, { ...model, gemConfig: { ...DEFAULT_GEM_CONFIG } }];
        });
    };

    const handleRemoveModel = (modelId) => setSelectedModels(prev => prev.filter(m => m.id !== modelId));

    // Update a specific field in a model's gem config
    const handleUpdateModelGem = (modelId, field, value) => {
        setSelectedModels(prev => prev.map(m =>
            m.id === modelId ? { ...m, gemConfig: { ...m.gemConfig, [field]: value } } : m
        ));
    };

    const handleManualPricingChange = (field, value) => setManualPricing(prev => ({ ...prev, [field]: value }));

    const handleReset = () => {
        setInputTokens(defaultState.inputTokens);
        setOutputTokens(defaultState.outputTokens);
        setGemPackages([{ ...DEFAULT_PACKAGE }]);
        setNextPkgId(2);
        setRates({ ...defaultState.rates });
        setSelectedModels([]);
        setManualPricing({ ...defaultState.manualPricing });
        setManualGemConfig({ ...DEFAULT_GEM_CONFIG });
        setGatewayFee({ ...DEFAULT_GATEWAY_FEE });
        setUseManualPricing(true);
        setUseGemSystem(true);
        setDisplayCurrency('IDR');
        setActiveTab('all');
    };

    const currencyCtx = { displayCurrency, rates };
    const dc = CURRENCIES[displayCurrency];
    const [activeTab, setActiveTab] = useState('all');

    // ─── Helper: calculate gateway fee in local currency ───
    const calcGatewayFee = (grossRevenueLocal) => {
        if (!gatewayFee.enabled || !useGemSystem) return { totalFeeLocal: 0, feePerWithdrawal: 0 };
        const n = Math.max(1, gatewayFee.numWithdrawals || 1);
        const perWithdrawalRevenue = grossRevenueLocal / n;
        const perWithdrawalFee = Math.max(
            gatewayFee.minFee || 0,
            (perWithdrawalRevenue * (gatewayFee.percentFee || 0)) / 100 + (gatewayFee.fixedFee || 0)
        );
        return { totalFeeLocal: perWithdrawalFee * n, feePerWithdrawal: perWithdrawalFee };
    };

    // ─── Helper: calculate results for a given gem count and pricePerGem ───
    const calcForGems = (availableGems, pricePerGem, rate) => {
        let modelCosts = [];
        let totalModelCost = 0;
        let totalGemRevenue = 0;
        let totalGemsConsumed = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        if (!useManualPricing && selectedModels.length > 0) {
            modelCosts = selectedModels.map(model => {
                const gc = model.gemConfig;
                const numRequests = gc.gemsPerRequest > 0 ? Math.floor(availableGems / gc.gemsPerRequest) : 0;
                const inTok = numRequests * gc.inputTokens;
                const outTok = numRequests * gc.outputTokens;
                const gemsUsed = numRequests * gc.gemsPerRequest;
                const promptPrice = parseFloat(model.pricing?.prompt || '0');
                const completionPrice = parseFloat(model.pricing?.completion || '0');
                const costUsd = (inTok * promptPrice) + (outTok * completionPrice);
                const revenue = useGemSystem ? gemsUsed * pricePerGem : 0;
                const revenueUsd = useGemSystem ? revenue / rate : 0;
                const profitUsd = revenueUsd - costUsd;
                totalInputTokens += inTok;
                totalOutputTokens += outTok;
                totalGemsConsumed += gemsUsed;
                return { id: model.id, name: model.name, cost: costUsd, revenue, revenueUsd, profitUsd, gemsUsed, numRequests, inputTokens: inTok, outputTokens: outTok };
            });
            totalModelCost = modelCosts.reduce((s, mc) => s + mc.cost, 0);
            totalGemRevenue = modelCosts.reduce((s, mc) => s + mc.revenue, 0);
        } else {
            const gc = manualGemConfig;
            let numRequests, inTok, outTok, gemsUsed;
            if (useGemSystem && gc.gemsPerRequest > 0) {
                numRequests = Math.floor(availableGems / gc.gemsPerRequest);
                inTok = numRequests * gc.inputTokens;
                outTok = numRequests * gc.outputTokens;
                gemsUsed = numRequests * gc.gemsPerRequest;
            } else {
                numRequests = 0; inTok = inputTokens; outTok = outputTokens; gemsUsed = 0;
            }
            totalInputTokens = inTok; totalOutputTokens = outTok; totalGemsConsumed = gemsUsed;
            const costUsd = (inTok / 1000 * manualPricing.pricePerKInput) + (outTok / 1000 * manualPricing.pricePerKOutput);
            const revenue = useGemSystem ? gemsUsed * pricePerGem : 0;
            const revenueUsd = useGemSystem ? revenue / rate : 0;
            const profitUsd = revenueUsd - costUsd;
            modelCosts = [{ id: 'manual', name: 'Manual Pricing', cost: costUsd, revenue, revenueUsd, profitUsd, gemsUsed, numRequests, inputTokens: inTok, outputTokens: outTok }];
            totalModelCost = costUsd; totalGemRevenue = revenue;
        }
        const totalTokens = totalInputTokens + totalOutputTokens;
        const totalGemRevenueUsd = totalGemRevenue / rate;
        // Gateway fee (calculated in local currency, then converted back to USD for profit)
        const { totalFeeLocal, feePerWithdrawal } = calcGatewayFee(totalGemRevenue);
        const gatewayFeeUsd = totalFeeLocal / rate;
        const netGemRevenueUsd = totalGemRevenueUsd - gatewayFeeUsd;
        const profitUsd = netGemRevenueUsd - totalModelCost;
        return {
            totalInputTokens, totalOutputTokens, totalTokens,
            modelCosts, totalModelCost,
            gemRevenue: totalGemRevenue, gemRevenueUsd: totalGemRevenueUsd,
            gatewayFeeLocal: totalFeeLocal, gatewayFeeUsd,
            feePerWithdrawal, numWithdrawals: gatewayFee.numWithdrawals || 1,
            netGemRevenueUsd,
            gemsConsumed: totalGemsConsumed, profitUsd, useGemSystem,
        };
    };

    // ─── Per-package results + combined "all" ───
    const { perPkgResults, allResults, totalGems, totalSpent } = useMemo(() => {
        const rate = displayCurrency === 'USD' ? 1 : (rates[displayCurrency] || 1);

        // Per-package
        const perPkg = gemPackages.map(pkg => {
            const pkgGems = (pkg.packsBought || 0) * (pkg.gemsSold || 0);
            const pkgSpent = (pkg.packsBought || 0) * (pkg.gemsPrice || 0);
            const pkgPricePerGem = pkgGems > 0 ? pkgSpent / pkgGems : 0;
            const result = calcForGems(pkgGems, pkgPricePerGem, rate);
            return { pkgId: pkg.id, pkgLabel: `${pkg.gemsSold.toLocaleString()} gems × ${pkg.packsBought}`, pkgGems, pkgSpent, pkgPricePerGem, ...result };
        });

        // Combined "all"
        const tGems = gemPackages.reduce((s, p) => s + (p.packsBought || 0) * (p.gemsSold || 0), 0);
        const tSpent = gemPackages.reduce((s, p) => s + (p.packsBought || 0) * (p.gemsPrice || 0), 0);
        const avgPricePerGem = tGems > 0 ? tSpent / tGems : 0;
        const allRes = calcForGems(tGems, avgPricePerGem, rate);

        return { perPkgResults: perPkg, allResults: allRes, totalGems: tGems, totalSpent: tSpent };
    }, [inputTokens, outputTokens, selectedModels, gemPackages, manualPricing, manualGemConfig, useManualPricing, useGemSystem, displayCurrency, rates, gatewayFee]);

    // Active result based on tab
    const activeResult = activeTab === 'all' ? allResults : (perPkgResults.find(p => p.pkgId === activeTab) || allResults);
    const activeLabel = activeTab === 'all' ? 'All Packages' : (perPkgResults.find(p => p.pkgId === activeTab)?.pkgLabel || 'All');

    return (
        <div className="min-h-screen py-4 px-3 sm:py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-5 sm:mb-8">
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold gradient-text">AI Cost Calculator</h1>
                        <p className="text-text-secondary text-xs sm:text-sm mt-1">
                            Estimate costs &amp; profit from AI model usage with gems and currency conversion
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center rounded-lg border border-border overflow-hidden bg-white/5">
                            {Object.values(CURRENCIES).map(c => (
                                <button
                                    key={c.code}
                                    onClick={() => setDisplayCurrency(c.code)}
                                    className={`px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-medium transition-all duration-200 cursor-pointer ${displayCurrency === c.code ? 'bg-accent text-white' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                                        }`}
                                    title={c.name}
                                >
                                    {c.flag} {c.code}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => exportToPdf({ perPkgResults, allResults, gemPackages, totalGems, totalSpent, selectedModels, manualPricing, manualGemConfig, useManualPricing, useGemSystem, displayCurrency, rates })}
                            className="px-3 sm:px-4 py-2 rounded-lg bg-accent/15 border border-accent/30 hover:bg-accent/25 text-accent-light hover:text-white text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer"
                            id="export-pdf-btn"
                        >
                            📄 PDF
                        </button>
                        <button onClick={handleReset} className="px-3 sm:px-4 py-2 rounded-lg bg-white/5 border border-border hover:bg-white/10 text-text-secondary hover:text-text-primary text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer" id="reset-btn">
                            ↺ Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                {/* Left Column */}
                <div className="lg:col-span-5 space-y-4 sm:space-y-5">
                    <ModelSearch
                        onModelsSelected={handleModelSelected}
                        selectedModels={selectedModels}
                        onRemoveModel={handleRemoveModel}
                        currencyCtx={currencyCtx}
                    />

                    {/* Selected Models with per-model gem config */}
                    <SelectedModels
                        models={selectedModels}
                        totalGems={totalGems}
                        onUpdateModel={handleUpdateModelGem}
                        onRemoveModel={handleRemoveModel}
                        currencyCtx={currencyCtx}
                    />

                    {/* Model Pricing Mode */}
                    <div className="glass-card fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-text-primary">Model Pricing</h2>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-text-muted">Manual</span>
                                <div onClick={() => setUseManualPricing(!useManualPricing)} className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${useManualPricing ? 'bg-accent' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${useManualPricing ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>
                        </div>
                        {useManualPricing && (
                            <div className="space-y-3 fade-in">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-text-secondary mb-1.5">Price / 1K Input ({dc.symbol})</label>
                                        <input type="number" value={manualPricing.pricePerKInput} onChange={(e) => handleManualPricingChange('pricePerKInput', parseFloat(e.target.value) || 0)} step="0.001" min="0" id="price-per-k-input" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-text-secondary mb-1.5">Price / 1K Output ({dc.symbol})</label>
                                        <input type="number" value={manualPricing.pricePerKOutput} onChange={(e) => handleManualPricingChange('pricePerKOutput', parseFloat(e.target.value) || 0)} step="0.001" min="0" id="price-per-k-output" />
                                    </div>
                                </div>
                                {/* Gem config for manual pricing */}
                                {useGemSystem && (
                                    <div className="pt-3 border-t border-border">
                                        <div className="text-xs text-text-muted uppercase tracking-wider font-medium mb-2">Gems per Request</div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-text-muted mb-1">💎 Gems/Req</label>
                                                <input type="number" value={manualGemConfig.gemsPerRequest} onChange={(e) => setManualGemConfig(prev => ({ ...prev, gemsPerRequest: parseFloat(e.target.value) || 0 }))} min="0" step="any" className="!text-xs !py-1.5" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-text-muted mb-1">Input Tok</label>
                                                <input type="number" value={manualGemConfig.inputTokens} onChange={(e) => setManualGemConfig(prev => ({ ...prev, inputTokens: parseFloat(e.target.value) || 0 }))} min="0" className="!text-xs !py-1.5" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-text-muted mb-1">Output Tok</label>
                                                <input type="number" value={manualGemConfig.outputTokens} onChange={(e) => setManualGemConfig(prev => ({ ...prev, outputTokens: parseFloat(e.target.value) || 0 }))} min="0" className="!text-xs !py-1.5" />
                                            </div>
                                        </div>
                                        {manualGemConfig.gemsPerRequest > 0 && (
                                            <div className="mt-2 py-1.5 px-2 rounded-md bg-accent/5 border border-accent/10">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-text-muted">Max requests from {totalGems.toLocaleString()} gems</span>
                                                    <span className="text-accent-light font-semibold">{Math.floor(totalGems / manualGemConfig.gemsPerRequest).toLocaleString()} requests</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        {!useManualPricing && selectedModels.length === 0 && (
                            <p className="text-xs text-text-muted">Search &amp; select models above to use OpenRouter pricing.</p>
                        )}
                        {!useManualPricing && selectedModels.length > 0 && (
                            <p className="text-xs text-text-muted">Using pricing from {selectedModels.length} selected model(s). Configure gems per request above.</p>
                        )}
                    </div>

                    {/* Gem System Toggle */}
                    <div className="glass-card fade-in">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gem/20 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-gem" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l2.5 4.5L20 9l-4 3.5L17 18l-5-3-5 3 1-5.5L4 9l5.5-1.5z" />
                                    </svg>
                                </div>
                                <h2 className="text-lg font-semibold text-text-primary">Gem Revenue</h2>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-xs text-text-muted">Enabled</span>
                                <div onClick={() => setUseGemSystem(!useGemSystem)} className={`relative w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${useGemSystem ? 'bg-gem' : 'bg-white/10'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${useGemSystem ? 'translate-x-5' : ''}`} />
                                </div>
                            </label>
                        </div>
                        <p className="text-xs text-text-muted">
                            {useGemSystem ? 'Gem revenue is calculated from each model\'s gem cost × top-up pricing.' : 'Gem system disabled. Only costs are calculated.'}
                        </p>
                    </div>

                    {/* Gem Top-Up Pricing (only shown when gem system enabled) */}
                    {useGemSystem && <GemsSystem packages={gemPackages} onPkgChange={handlePkgChange} onAddPackage={handleAddPackage} onRemovePackage={handleRemovePackage} totalGems={totalGems} totalSpent={totalSpent} currencyCtx={currencyCtx} gatewayFee={gatewayFee} onGatewayFeeChange={handleGatewayFeeChange} />}

                    {/* Manual Token Input (only when manual pricing and no gem system) */}
                    {useManualPricing && (
                        <TokenInput inputTokens={inputTokens} outputTokens={outputTokens} onChange={handleTokenChange} />
                    )}

                    <CurrencyRates rates={rates} onChange={handleRateChange} />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-5">
                    {/* Package tabs */}
                    {gemPackages.length > 1 && useGemSystem && (
                        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === 'all' ? 'bg-accent text-white' : 'bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10 border border-border'}`}
                            >
                                📊 All Packages
                            </button>
                            {gemPackages.map((pkg, idx) => (
                                <button
                                    key={pkg.id}
                                    onClick={() => setActiveTab(pkg.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${activeTab === pkg.id ? 'bg-gem text-white' : 'bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10 border border-border'}`}
                                >
                                    💎 Pkg {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <ResultsDisplay results={activeResult} rates={rates} currencyCtx={currencyCtx} label={activeLabel} gatewayFee={gatewayFee} />
                    <ProfitChart modelCosts={activeResult.modelCosts} gemRevenue={activeResult.netGemRevenueUsd ?? activeResult.gemRevenueUsd} currencyCtx={currencyCtx} />

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                        <div className="glass-card-compact text-center fade-in">
                            <div className="text-xs text-text-muted mb-1">Cost / 1K Tokens</div>
                            <div className="text-sm font-bold text-loss">
                                {activeResult.totalTokens > 0 ? fmtDisplay((activeResult.totalModelCost / activeResult.totalTokens) * 1000, displayCurrency, rates, 4) : `${dc.symbol}0`}
                            </div>
                        </div>
                        <div className="glass-card-compact text-center fade-in">
                            <div className="text-xs text-text-muted mb-1">Revenue / 1K Tokens</div>
                            <div className="text-sm font-bold text-gem">
                                {activeResult.totalTokens > 0 ? fmtDisplay((activeResult.gemRevenueUsd / activeResult.totalTokens) * 1000, displayCurrency, rates, 4) : `${dc.symbol}0`}
                            </div>
                        </div>
                        <div className="glass-card-compact text-center fade-in">
                            <div className="text-xs text-text-muted mb-1">Margin</div>
                            <div className={`text-sm font-bold ${activeResult.profitUsd >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {activeResult.gemRevenueUsd > 0 ? ((activeResult.profitUsd / activeResult.gemRevenueUsd) * 100).toFixed(1) : '0'}%
                            </div>
                        </div>
                        <div className="glass-card-compact text-center fade-in">
                            <div className="text-xs text-text-muted mb-1">Models</div>
                            <div className="text-sm font-bold text-accent-light">
                                {useManualPricing ? 'Manual' : selectedModels.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto mt-8 text-center">
                <p className="text-xs text-text-muted">
                    Prices via OpenRouter API • Exchange rates are manually configured • All calculations update in real-time
                </p>
            </div>

            <AiChat calcData={{ perPkgResults, allResults, gemPackages, totalGems, totalSpent, rates, displayCurrency, selectedModels, manualPricing, manualGemConfig, useManualPricing, useGemSystem, gatewayFee }} />
        </div>
    );
}

export default App;
