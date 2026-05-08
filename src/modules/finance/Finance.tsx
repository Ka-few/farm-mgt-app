import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Target, Landmark, TrendingUp, Archive, BookOpen, FileText, BarChart } from 'lucide-react';
import './Finance.css';

const FinanceOverview = lazy(() => import('./FinanceOverview'));
const ProductionStatement = lazy(() => import('./ProductionStatement'));
const FinanceIncome = lazy(() => import('./FinanceIncome'));
const FinanceExpenses = lazy(() => import('./FinanceExpenses'));
const Budgets = lazy(() => import('./Budgets'));
const BalanceSheet = lazy(() => import('./BalanceSheet'));
const COA = lazy(() => import('./COA'));
const JournalEntries = lazy(() => import('./JournalEntries'));
const GeneralLedger = lazy(() => import('./GeneralLedger'));
const ProfitLoss = lazy(() => import('./ProfitLoss'));

type SectionId =
    | 'overview'
    | 'production'
    | 'income'
    | 'expenses'
    | 'budgets'
    | 'coa'
    | 'journal_entries'
    | 'general_ledger'
    | 'profit_loss'
    | 'balance_sheet';

type SectionConfig = {
    id: SectionId;
    label: string;
    icon: React.ReactNode;
    content: React.ReactNode;
    preload: boolean;
};

const Finance: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SectionId>('overview');
    const [loadedSections, setLoadedSections] = useState<Record<SectionId, boolean>>({
        overview: true,
        production: true,
        income: true,
        expenses: true,
        budgets: true,
        coa: false,
        journal_entries: false,
        general_ledger: false,
        profit_loss: false,
        balance_sheet: false,
    });
    const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
        overview: null,
        production: null,
        income: null,
        expenses: null,
        budgets: null,
        coa: null,
        journal_entries: null,
        general_ledger: null,
        profit_loss: null,
        balance_sheet: null,
    });

    const sections = useMemo<SectionConfig[]>(() => [
        { id: 'overview', label: 'Dashboard', icon: <DollarSign size={18} />, content: <FinanceOverview />, preload: true },
        { id: 'production', label: 'Production & Income', icon: <TrendingUp size={18} />, content: <ProductionStatement />, preload: true },
        { id: 'income', label: 'Income Records', icon: <ArrowUpRight size={18} />, content: <FinanceIncome />, preload: true },
        { id: 'expenses', label: 'Expense Records', icon: <ArrowDownRight size={18} />, content: <FinanceExpenses />, preload: true },
        { id: 'budgets', label: 'Budgeting', icon: <Target size={18} />, content: <Budgets />, preload: true },
        { id: 'coa', label: 'Chart Of Accounts', icon: <Archive size={18} />, content: <COA />, preload: false },
        { id: 'journal_entries', label: 'Journal Entries', icon: <BookOpen size={18} />, content: <JournalEntries />, preload: false },
        { id: 'general_ledger', label: 'General Ledger', icon: <FileText size={18} />, content: <GeneralLedger />, preload: false },
        { id: 'profit_loss', label: 'P&L Statement', icon: <BarChart size={18} />, content: <ProfitLoss />, preload: false },
        { id: 'balance_sheet', label: 'Balance Sheet', icon: <Landmark size={18} />, content: <BalanceSheet />, preload: false },
    ], []);
    const tabs = sections.map(({ id, label, icon }) => ({ id, label, icon }));

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (visible?.target instanceof HTMLElement) {
                    const sectionId = visible.target.dataset.sectionId as SectionId | undefined;
                    if (sectionId) {
                        setActiveTab(sectionId);
                    }
                }

                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const sectionId = (entry.target as HTMLElement).dataset.sectionId as SectionId | undefined;
                    if (sectionId) {
                        setLoadedSections((prev) => (prev[sectionId] ? prev : { ...prev, [sectionId]: true }));
                    }
                });
            },
            {
                root: null,
                threshold: [0.1, 0.25, 0.5],
                rootMargin: '20% 0px 35% 0px',
            }
        );

        Object.values(sectionRefs.current).forEach((el) => {
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sections]);

    const scrollToSection = (id: SectionId) => {
        const element = sectionRefs.current[id];
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveTab(id);
        setLoadedSections((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
    };

    return (
        <div className="finance-module layered-finance">
            <div className="tabs-container glass finance-tabs-rail">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => scrollToSection(tab.id)}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="finance-sections">
                {sections.map((section) => (
                    <section
                        key={section.id}
                        ref={(el) => {
                            sectionRefs.current[section.id] = el;
                        }}
                        data-section-id={section.id}
                        className={`finance-section glass ${activeTab === section.id ? 'is-active' : ''}`}
                    >
                        <div className="finance-section-header">
                            <div>
                                <h2>{section.label}</h2>
                            </div>
                            <button type="button" className="section-jump" onClick={() => scrollToSection(section.id)}>
                                Focus
                            </button>
                        </div>
                        <div className="finance-section-body">
                            {loadedSections[section.id] ? (
                                <Suspense fallback={<SectionFallback />}>
                                    {section.content}
                                </Suspense>
                            ) : (
                                <SectionPlaceholder />
                            )}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default Finance;

const SectionPlaceholder: React.FC = () => (
    <div className="section-placeholder">
        <div className="placeholder-line placeholder-title" />
        <div className="placeholder-line" />
        <div className="placeholder-line short" />
    </div>
);

const SectionFallback: React.FC = () => (
    <div className="section-placeholder">
        <div className="placeholder-line placeholder-title" />
        <div className="placeholder-line" />
        <div className="placeholder-line short" />
    </div>
);
