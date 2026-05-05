// All supported currencies with display info
export const CURRENCIES = {
    USD: { code: 'USD', symbol: '$', flag: '🇺🇸', name: 'US Dollar', decimals: 2 },
    CNY: { code: 'CNY', symbol: '¥', flag: '🇨🇳', name: 'Chinese Yuan', decimals: 2 },
    JPY: { code: 'JPY', symbol: '¥', flag: '🇯🇵', name: 'Japanese Yen', decimals: 0 },
    IDR: { code: 'IDR', symbol: 'Rp', flag: '🇮🇩', name: 'Indonesian Rupiah', decimals: 0 },
};

// Convert a USD amount to the display currency
export function convertToDisplay(usdAmount, displayCurrency, rates) {
    if (displayCurrency === 'USD') return usdAmount;
    const rate = rates[displayCurrency] || 1;
    return usdAmount * rate;
}

// Format a number in the display currency
export function fmtDisplay(usdAmount, displayCurrency, rates, overrideDecimals) {
    const currency = CURRENCIES[displayCurrency] || CURRENCIES.USD;
    const converted = convertToDisplay(usdAmount, displayCurrency, rates);
    const decimals = overrideDecimals !== undefined ? overrideDecimals : currency.decimals;

    if (converted === 0) return `${currency.symbol}0`;

    const abs = Math.abs(converted);
    if (abs < 0.01 && decimals < 4) {
        // Very small numbers: use more decimals
        return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`;
    }

    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

// Format price per 1M tokens in display currency
export function fmtPricePerMillion(perTokenUsd, displayCurrency, rates) {
    const currency = CURRENCIES[displayCurrency] || CURRENCIES.USD;
    const perMillion = convertToDisplay(parseFloat(perTokenUsd) * 1_000_000, displayCurrency, rates);
    if (perMillion === 0) return 'Free';
    if (perMillion >= 1) {
        return `${currency.symbol}${perMillion % 1 === 0 ? perMillion.toFixed(0) : perMillion.toFixed(2)}`;
    }
    return `${currency.symbol}${perMillion.toFixed(4)}`;
}
