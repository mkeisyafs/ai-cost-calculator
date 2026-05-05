import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CURRENCIES, convertToDisplay } from '../currencies';

// Strip emojis — jsPDF default fonts can't render them
const stripEmoji = (str) => str.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[\u{1F1E0}-\u{1F1FF}]/gu, '').trim();

// Country code labels instead of emoji flags
const FLAG_LABELS = { USD: 'US', CNY: 'CN', JPY: 'JP', IDR: 'ID' };

export function exportToPdf({ perPkgResults, allResults, gemPackages, totalGems, totalSpent, selectedModels, manualPricing, manualGemConfig, useManualPricing, useGemSystem, displayCurrency, rates }) {
    const dc = CURRENCIES[displayCurrency];
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    const fmtLocal = (val, decimals = dc.decimals) => {
        if (decimals === 0) return `${dc.symbol}${Math.round(val).toLocaleString()}`;
        return `${dc.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    };
    const fmtUsd = (val) => `$${val.toFixed(6)}`;

    // ── Title ──
    doc.setFontSize(20);
    doc.setTextColor(100, 60, 220);
    doc.text('AI Cost Calculator Report', pageW / 2, y, { align: 'center' });
    y += 8;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Currency: ${FLAG_LABELS[dc.code] || dc.code} ${dc.code}`, pageW / 2, y, { align: 'center' });
    y += 10;

    // ── Configuration Summary ──
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Configuration', 14, y);
    y += 6;

    const configRows = [
        ['Pricing Mode', useManualPricing ? 'Manual' : 'OpenRouter API'],
        ['Gem System', useGemSystem ? 'Enabled' : 'Disabled'],
        ['Display Currency', `[${FLAG_LABELS[dc.code] || dc.code}] ${dc.code} (${dc.name})`],
    ];
    if (useManualPricing) {
        configRows.push(['Price / 1K Input', fmtLocal(manualPricing.pricePerKInput, 4)]);
        configRows.push(['Price / 1K Output', fmtLocal(manualPricing.pricePerKOutput, 4)]);
        if (useGemSystem && manualGemConfig) {
            configRows.push(['Gems / Request', String(manualGemConfig.gemsPerRequest)]);
            configRows.push(['Input Tokens / Request', manualGemConfig.inputTokens.toLocaleString()]);
            configRows.push(['Output Tokens / Request', manualGemConfig.outputTokens.toLocaleString()]);
        }
    }
    autoTable(doc, {
        startY: y,
        head: [['Setting', 'Value']],
        body: configRows,
        theme: 'striped',
        headStyles: { fillColor: [100, 60, 220], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    // ── Selected Models ──
    if (!useManualPricing && selectedModels.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('Selected Models', 14, y);
        y += 6;

        const modelRows = selectedModels.map(m => {
            const inPrice = parseFloat(m.pricing?.prompt || '0') * 1_000_000;
            const outPrice = parseFloat(m.pricing?.completion || '0') * 1_000_000;
            const inLocal = convertToDisplay(inPrice, displayCurrency, rates);
            const outLocal = convertToDisplay(outPrice, displayCurrency, rates);
            return [
                stripEmoji(m.name),
                `${dc.symbol}${inLocal >= 1 ? inLocal.toFixed(2) : inLocal.toFixed(4)}`,
                `${dc.symbol}${outLocal >= 1 ? outLocal.toFixed(2) : outLocal.toFixed(4)}`,
                String(m.gemConfig?.gemsPerRequest || '-'),
                (m.gemConfig?.inputTokens || 0).toLocaleString(),
                (m.gemConfig?.outputTokens || 0).toLocaleString(),
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Model', `In/M (${dc.code})`, `Out/M (${dc.code})`, 'Gems/Req', 'In Tok', 'Out Tok']],
            body: modelRows,
            theme: 'striped',
            headStyles: { fillColor: [140, 80, 220], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            columnStyles: { 0: { cellWidth: 55 } },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── Gem Top-Up Packages ──
    if (useGemSystem && gemPackages.length > 0) {
        if (y > 240) { doc.addPage(); y = 15; }
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('Gem Top-Up Packages', 14, y);
        y += 6;

        const pkgRows = gemPackages.map((pkg, i) => {
            const gems = (pkg.packsBought || 0) * (pkg.gemsSold || 0);
            const spent = (pkg.packsBought || 0) * (pkg.gemsPrice || 0);
            const perGem = pkg.gemsSold > 0 ? pkg.gemsPrice / pkg.gemsSold : 0;
            return [
                `Package ${i + 1}`,
                pkg.gemsSold.toLocaleString(),
                fmtLocal(pkg.gemsPrice),
                String(pkg.packsBought),
                gems.toLocaleString(),
                fmtLocal(spent),
                fmtLocal(perGem),
            ];
        });
        pkgRows.push([
            { content: 'Total', styles: { fontStyle: 'bold' } },
            '', '', '',
            { content: totalGems.toLocaleString(), styles: { fontStyle: 'bold' } },
            { content: fmtLocal(totalSpent), styles: { fontStyle: 'bold' } },
            { content: totalGems > 0 ? fmtLocal(totalSpent / totalGems) : '-', styles: { fontStyle: 'bold' } },
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Package', 'Gems', `Price (${dc.code})`, 'Qty', 'Total Gems', `Total (${dc.code})`, '/Gem']],
            body: pkgRows,
            theme: 'striped',
            headStyles: { fillColor: [180, 120, 50], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── Per-Package Results ──
    if (useGemSystem && perPkgResults && perPkgResults.length > 0) {
        perPkgResults.forEach((pkg, i) => {
            if (y > 230) { doc.addPage(); y = 15; }
            doc.setFontSize(11);
            doc.setTextColor(40, 40, 40);
            doc.text(`Results - Package ${i + 1} (${pkg.pkgGems.toLocaleString()} gems)`, 14, y);
            y += 5;

            const rows = pkg.modelCosts.map(mc => [
                stripEmoji(mc.name),
                (mc.numRequests || 0).toLocaleString(),
                (mc.gemsUsed || 0).toLocaleString(),
                `${mc.inputTokens.toLocaleString()} / ${mc.outputTokens.toLocaleString()}`,
                fmtUsd(mc.cost),
                useGemSystem ? fmtUsd(mc.revenueUsd || 0) : '-',
                useGemSystem ? fmtUsd(mc.profitUsd || 0) : '-',
            ]);

            autoTable(doc, {
                startY: y,
                head: [['Model', 'Requests', 'Gems', 'In / Out Tokens', 'Cost (USD)', 'Revenue (USD)', 'Profit (USD)']],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [60, 140, 200], textColor: 255, fontStyle: 'bold', fontSize: 7 },
                bodyStyles: { fontSize: 7 },
                margin: { left: 14, right: 14 },
            });
            y = doc.lastAutoTable.finalY + 3;

            // Summary
            const summaryRows = [
                ['Total Cost (USD)', fmtUsd(pkg.totalModelCost)],
                ['Gem Revenue (USD)', fmtUsd(pkg.gemRevenueUsd)],
                ['Profit/Loss (USD)', fmtUsd(pkg.profitUsd)],
                ['Margin', pkg.gemRevenueUsd > 0 ? `${((pkg.profitUsd / pkg.gemRevenueUsd) * 100).toFixed(1)}%` : 'N/A'],
            ];
            autoTable(doc, {
                startY: y,
                body: summaryRows,
                theme: 'plain',
                bodyStyles: { fontSize: 8 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
                margin: { left: 14, right: 80 },
            });
            y = doc.lastAutoTable.finalY + 8;
        });
    }

    // ── Combined "All" Results ──
    if (allResults) {
        if (y > 220) { doc.addPage(); y = 15; }
        doc.setFontSize(12);
        doc.setTextColor(100, 60, 220);
        doc.text('Combined Results - All Packages', 14, y);
        y += 6;

        const rows = allResults.modelCosts.map(mc => [
            stripEmoji(mc.name),
            (mc.numRequests || 0).toLocaleString(),
            (mc.gemsUsed || 0).toLocaleString(),
            `${mc.inputTokens.toLocaleString()} / ${mc.outputTokens.toLocaleString()}`,
            fmtUsd(mc.cost),
            useGemSystem ? fmtUsd(mc.revenueUsd || 0) : '-',
            useGemSystem ? fmtUsd(mc.profitUsd || 0) : '-',
        ]);

        autoTable(doc, {
            startY: y,
            head: [['Model', 'Requests', 'Gems', 'In / Out Tokens', 'Cost (USD)', 'Revenue (USD)', 'Profit (USD)']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [100, 60, 220], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            margin: { left: 14, right: 14 },
        });
        y = doc.lastAutoTable.finalY + 4;

        const summaryRows = [
            ['Total Tokens', `${allResults.totalInputTokens.toLocaleString()} in + ${allResults.totalOutputTokens.toLocaleString()} out = ${allResults.totalTokens.toLocaleString()}`],
            ['Total Cost (USD)', fmtUsd(allResults.totalModelCost)],
        ];
        if (useGemSystem) {
            summaryRows.push(['Gem Revenue (USD)', fmtUsd(allResults.gemRevenueUsd)]);
            summaryRows.push(['Profit/Loss (USD)', fmtUsd(allResults.profitUsd)]);
            summaryRows.push(['Margin', allResults.gemRevenueUsd > 0 ? `${((allResults.profitUsd / allResults.gemRevenueUsd) * 100).toFixed(1)}%` : 'N/A']);
        }

        autoTable(doc, {
            startY: y,
            body: summaryRows,
            theme: 'plain',
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
            margin: { left: 14, right: 60 },
        });
        y = doc.lastAutoTable.finalY + 5;
    }

    // ── Multi-Currency Table ──
    if (allResults) {
        if (y > 240) { doc.addPage(); y = 15; }
        doc.setFontSize(11);
        doc.setTextColor(40, 40, 40);
        doc.text('Multi-Currency Comparison', 14, y);
        y += 5;

        const currRows = Object.values(CURRENCIES).map(c => {
            const r = c.code === 'USD' ? 1 : (rates[c.code] || 1);
            const cost = allResults.totalModelCost * r;
            const rev = allResults.gemRevenueUsd * r;
            const prof = allResults.profitUsd * r;
            const fmt = (v) => {
                if (c.decimals === 0) return `${c.symbol}${Math.round(v).toLocaleString()}`;
                return `${c.symbol}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };
            return [
                `[${FLAG_LABELS[c.code] || c.code}] ${c.code}`,
                fmt(cost),
                useGemSystem ? fmt(rev) : '-',
                useGemSystem ? fmt(prof) : '-',
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Currency', 'Cost', 'Revenue', 'Profit']],
            body: currRows,
            theme: 'striped',
            headStyles: { fillColor: [80, 80, 120], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            margin: { left: 14, right: 14 },
        });
    }

    // Footer on every page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`AI Cost Calculator  |  Page ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    }

    doc.save(`ai-cost-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
