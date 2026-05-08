import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RefreshCw, Download, DollarSign, Package, Zap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface FinanceRecord {
    id: string;
    record_type: string;
    category: string;
    amount: number;
    date: string;
    description: string;
}

interface BalanceEntry {
    account_name: string;
    amount: number;
}

const ProductionStatement: React.FC = () => {
    const { addToast } = useToast();
    const [records, setRecords] = useState<FinanceRecord[]>([]);
    const [balanceEntries, setBalanceEntries] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [txs, balances] = await Promise.all([
                invoke<FinanceRecord[]>('get_finance_records'),
                invoke<BalanceEntry[]>('get_balance_sheet')
            ]);
            setRecords(txs);

            const bMap: Record<string, number> = {};
            balances.forEach(b => bMap[b.account_name] = b.amount);
            setBalanceEntries(bMap);
        } catch (err) {
            console.error(err);
            addToast('Failed to load statement data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getVal = (key: string) => balanceEntries[key] || 0;
    const filterSum = (type: string, category?: string) => {
        return records
            .filter(r => r.record_type === type && (!category || r.category === category))
            .reduce((sum, r) => sum + r.amount, 0);
    };

    // --- Production Section (Adapted from Manufacturing) ---
    // Using farm terms: Inputs instead of Raw Materials
    const openingStockInputs = getVal('Inventory - Livestock Feed') + getVal('Inventory - Crops'); // Using inventory as stock
    const purchasesInputs = filterSum('expense', 'Feeds') + filterSum('expense', 'Supplies') + filterSum('expense', 'Crop Inputs');
    // Note: Return outwards and Carriage inwards could be added if categories exist, but using simplified for now.

    const costOfInputsAvailable = openingStockInputs + purchasesInputs;
    const closingStockInputs = getVal('Inventory - Livestock Feed') + getVal('Inventory - Crops'); // Usually manual or end-of-period
    const costOfInputsUsed = costOfInputsAvailable - closingStockInputs;

    const directLabor = filterSum('expense', 'Labor');
    const directExpenses = filterSum('expense', 'Veterinary/Medicine') + filterSum('expense', 'Maintenance');

    const primeCosts = costOfInputsUsed + directLabor + directExpenses;

    const indirectExpenses = filterSum('expense', 'Utilities') + filterSum('expense', 'Insurance/Taxes');
    const adminExpenses = filterSum('expense', 'Rent/Lease') + filterSum('expense', 'Other Expense');

    // Total Production Cost
    const totalProductionCost = primeCosts + indirectExpenses + adminExpenses;

    // --- Trading / Income Section ---
    const sales = filterSum('income');
    const openingStockProduce = getVal('Produced Goods Stock') || 0;
    const transferFromProduction = totalProductionCost;
    const addProducePurchases = 0; // Farms rarely purchase finished produce to resell in this context

    const produceAvailableForSale = openingStockProduce + transferFromProduction + addProducePurchases;
    const closingStockProduce = getVal('Produced Goods Stock') || 0; // Manual entry

    const costOfSales = produceAvailableForSale - closingStockProduce;
    const grossProfit = sales - costOfSales;

    // --- Detailed Expenses (from DARAJA 36) ---
    const expensesList = [
        { label: 'Salaries & Wages', value: filterSum('expense', 'Labor') },
        { label: 'Utilities (Electricity/Water)', value: filterSum('expense', 'Utilities') },
        { label: 'Rent/Lease', value: filterSum('expense', 'Rent/Lease') },
        { label: 'Marketing', value: filterSum('expense', 'Marketing') },
        { label: 'Maintenance', value: filterSum('expense', 'Maintenance') },
        { label: 'Other Expenses', value: filterSum('expense', 'Other Expense') },
    ];
    const totalOperatingExpenses = expensesList.reduce((s, e) => s + e.value, 0);
    const netProfit = grossProfit - totalOperatingExpenses;

    const renderRow = (label: string, value: number, isSubtotal = false, isFinal = false) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.4rem 0',
            borderBottom: isSubtotal ? '1px solid var(--glass-border)' : 'none',
            fontWeight: (isSubtotal || isFinal) ? 700 : 400,
            color: isFinal ? 'var(--accent-primary)' : 'var(--text-primary)',
            fontSize: isFinal ? '1.1rem' : '0.95rem',
            marginTop: isSubtotal ? '0.5rem' : '0'
        }}>
            <span style={{ paddingLeft: isSubtotal ? '0' : '1rem' }}>{label}</span>
            <span>KES {value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
    );

    return (
        <div className="production-statement">
            <div className="welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3>Farm Production and Income Statement</h3>
                    <p className="subtitle">Performance report for the current period (Farm Adapted).</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="button-secondary" onClick={loadData} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button className="button-primary">
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            <div className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>SHAMBASMART</h2>
                    <h4 style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Production and Income Statement</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>For the Period Ended {new Date().toLocaleDateString('en-KE')}</p>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h5 style={{ borderBottom: '2px solid var(--accent-primary)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={18} /> PRODUCTION SECTION
                    </h5>
                    {renderRow('Opening stock of Farm Inputs', openingStockInputs)}
                    {renderRow('Add Purchases of Inputs', purchasesInputs)}
                    {renderRow('Cost of inputs available for production', costOfInputsAvailable, true)}
                    {renderRow('Less closing stock (Inputs)', closingStockInputs)}
                    {renderRow('Cost of inputs used', costOfInputsUsed, true)}
                    {renderRow('Add Direct Labor', directLabor)}
                    {renderRow('Direct Expenses (Vet/Maint)', directExpenses)}
                    {renderRow('PRIME COSTS', primeCosts, true)}
                    {renderRow('Indirect Expenses (Utilities/Ins)', indirectExpenses)}
                    {renderRow('Administrative Expenses', adminExpenses)}
                    {renderRow('TOTAL PRODUCTION COST', totalProductionCost, true, true)}
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h5 style={{ borderBottom: '2px solid var(--accent-success)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={18} /> TRADING SECTION
                    </h5>
                    {renderRow('Sales Revenue', sales)}
                    {renderRow('Less cost of sales:', 0)}
                    <div style={{ paddingLeft: '1rem' }}>
                        {renderRow('Opening stock of Produce', openingStockProduce)}
                        {renderRow('Transfer from Production', transferFromProduction)}
                        {renderRow('Goods available for sale', produceAvailableForSale, true)}
                        {renderRow('Less closing stock', closingStockProduce)}
                    </div>
                    {renderRow('COST OF SALES', costOfSales, true)}
                    {renderRow('GROSS PROFIT', grossProfit, true, true)}
                </div>

                <div>
                    <h5 style={{ borderBottom: '2px solid var(--accent-secondary)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={18} /> OPERATING EXPENSES & NET PROFIT
                    </h5>
                    {expensesList.map(exp => renderRow(exp.label, exp.value))}
                    {renderRow('TOTAL OPERATING EXPENSES', totalOperatingExpenses, true)}
                    <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '8px' }}>
                        {renderRow('NET PROFIT / (LOSS)', netProfit, false, true)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductionStatement;
