import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { CURRENCIES, convertToDisplay } from '../currencies';

const ProfitChart = ({ modelCosts, gemRevenue, currencyCtx }) => {
    const { displayCurrency, rates } = currencyCtx;
    const dc = CURRENCIES[displayCurrency];

    if (modelCosts.length === 0) {
        return (
            <div className="glass-card fade-in">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">Profit Chart</h2>
                </div>
                <div className="text-text-muted text-sm text-center py-8">
                    Select models and set token usage to see the chart.
                </div>
            </div>
        );
    }

    const convert = (usd) => convertToDisplay(usd, displayCurrency, rates);

    const data = modelCosts.map(mc => ({
        name: mc.name.length > 18 ? mc.name.substring(0, 18) + '…' : mc.name,
        cost: convert(mc.cost),
        revenue: convert(gemRevenue / modelCosts.length),
        profit: convert((gemRevenue / modelCosts.length) - mc.cost),
    }));

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload) return null;
        return (
            <div className="glass-card-compact text-xs" style={{ background: 'rgba(17,17,39,0.95)' }}>
                <p className="font-medium text-text-primary mb-1">{label}</p>
                {payload.map((entry, idx) => (
                    <p key={idx} style={{ color: entry.color }}>
                        {entry.name}: {dc.symbol}{parseFloat(entry.value).toLocaleString(undefined, { maximumFractionDigits: dc.decimals < 2 ? 0 : 4 })}
                    </p>
                ))}
            </div>
        );
    };

    return (
        <div className="glass-card fade-in">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h2 className="text-lg font-semibold text-text-primary">Profit Chart</h2>
                <span className="ml-auto text-xs text-text-muted">{dc.flag} {dc.code}</span>
            </div>

            <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                            tickLine={false}
                            tickFormatter={(v) => `${dc.symbol}${v.toLocaleString()}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar dataKey="cost" name="Cost" fill="#f87171" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="revenue" name="Revenue" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="Profit" radius={[4, 4, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#34d399' : '#f87171'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProfitChart;
