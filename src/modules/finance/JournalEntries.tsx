import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Plus, Trash2, Save, BookOpen, Calendar, FileText } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface JournalEntry {
    id: string;
    date: string;
    description: string;
    reference?: string;
    created_at?: string;
}

interface JournalEntryLine {
    id: string;
    journal_entry_id: string;
    account_id: string;
    account_code?: string;
    account_name?: string;
    debit: number;
    credit: number;
    description?: string;
}

interface Account {
    id: string;
    code: string;
    name: string;
    account_type: string;
    parent_account_id?: string;
    description?: string;
    created_at?: string;
}

const JournalEntries: React.FC = () => {
    const { addToast } = useToast();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [entryLines, setEntryLines] = useState<JournalEntryLine[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        lines: [] as Array<{
            account_id: string;
            debit: number;
            credit: number;
            description: string;
        }>
    });

    const loadEntries = async () => {
        setLoading(true);
        try {
            const data = await invoke<JournalEntry[]>('get_journal_entries');
            setEntries(data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load journal entries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const data = await invoke<Account[]>('get_accounts');
            setAccounts(data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load accounts', 'error');
        }
    };

    const loadEntryLines = async (entryId: string) => {
        try {
            const data = await invoke<JournalEntryLine[]>('get_journal_entry_lines', { journalEntryId: entryId });
            setEntryLines(data);
        } catch (err) {
            console.error(err);
            addToast('Failed to load entry lines', 'error');
        }
    };

    useEffect(() => {
        loadEntries();
        loadAccounts();
    }, []);

    const handleEntryClick = async (entry: JournalEntry) => {
        setSelectedEntry(entry);
        await loadEntryLines(entry.id);
        setShowForm(false);
    };

    const handleNewEntry = () => {
        setSelectedEntry(null);
        setEntryLines([]);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            reference: '',
            lines: [{ account_id: '', debit: 0, credit: 0, description: '' }]
        });
        setShowForm(true);
    };

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleLineChange = (index: number, field: string, value: string | number) => {
        const newLines = [...formData.lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setFormData(prev => ({ ...prev, lines: newLines }));
    };

    const addLine = () => {
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { account_id: '', debit: 0, credit: 0, description: '' }]
        }));
    };

    const removeLine = (index: number) => {
        if (formData.lines.length > 1) {
            setFormData(prev => ({
                ...prev,
                lines: prev.lines.filter((_, i) => i !== index)
            }));
        }
    };

    const calculateTotals = () => {
        const totalDebit = formData.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = formData.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        return { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
    };

    const handleSave = async () => {
        const { balanced } = calculateTotals();
        if (!balanced) {
            addToast('Debits must equal credits', 'error');
            return;
        }

        if (!formData.description.trim()) {
            addToast('Description is required', 'error');
            return;
        }

        if (formData.lines.some(line => !line.account_id)) {
            addToast('All lines must have an account selected', 'error');
            return;
        }

        setSaving(true);
        try {
            await invoke('add_journal_entry', {
                date: formData.date,
                description: formData.description,
                reference: formData.reference || null,
                lines: formData.lines.map(line => [
                    line.account_id,
                    line.debit || 0,
                    line.credit || 0,
                    line.description || null
                ])
            });
            addToast('Journal entry saved successfully', 'success');
            setShowForm(false);
            await loadEntries();
        } catch (err) {
            console.error(err);
            addToast('Failed to save journal entry', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (entryId: string) => {
        if (!confirm('Are you sure you want to delete this journal entry?')) return;

        try {
            await invoke('delete_journal_entry', { id: entryId });
            addToast('Journal entry deleted successfully', 'success');
            setSelectedEntry(null);
            setEntryLines([]);
            await loadEntries();
        } catch (err) {
            console.error(err);
            addToast('Failed to delete journal entry', 'error');
        }
    };

    const { totalDebit, totalCredit, balanced } = calculateTotals();

    return (
        <div className="journal-entries">
            <div className="section-header">
                <h2><BookOpen size={24} /> Journal Entries</h2>
                <button
                    className="btn-primary"
                    onClick={handleNewEntry}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={18} />
                    New Entry
                </button>
            </div>

            <div className="content-grid">
                {/* Entries List */}
                <div className="entries-list glass">
                    <h3>Journal Entries</h3>
                    {loading ? (
                        <div className="loading">Loading entries...</div>
                    ) : entries.length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={48} />
                            <p>No journal entries found</p>
                            <button className="btn-secondary" onClick={handleNewEntry}>
                                Create First Entry
                            </button>
                        </div>
                    ) : (
                        <div className="entries-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Reference</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entries.map(entry => (
                                        <tr
                                            key={entry.id}
                                            className={selectedEntry?.id === entry.id ? 'selected' : ''}
                                            onClick={() => handleEntryClick(entry)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                                            <td>{entry.description}</td>
                                            <td>{entry.reference || '-'}</td>
                                            <td>
                                                <button
                                                    className="btn-icon btn-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(entry.id);
                                                    }}
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Entry Details/Form */}
                <div className="entry-details glass">
                    {showForm ? (
                        <div className="entry-form">
                            <h3>New Journal Entry</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleFormChange('date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        placeholder="Entry description"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Reference</label>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => handleFormChange('reference', e.target.value)}
                                        placeholder="Reference number (optional)"
                                    />
                                </div>
                            </div>

                            <div className="entry-lines">
                                <h4>Entry Lines</h4>
                                <div className="lines-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Account</th>
                                                <th>Debit</th>
                                                <th>Credit</th>
                                                <th>Description</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.lines.map((line, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <select
                                                            value={line.account_id}
                                                            onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Select Account</option>
                                                            {accounts.map(account => (
                                                                <option key={account.id} value={account.id}>
                                                                    {account.code} - {account.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={line.debit || ''}
                                                            onChange={(e) => handleLineChange(index, 'debit', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={line.credit || ''}
                                                            onChange={(e) => handleLineChange(index, 'credit', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={line.description}
                                                            onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                                                            placeholder="Line description"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn-icon btn-danger"
                                                            onClick={() => removeLine(index)}
                                                            disabled={formData.lines.length === 1}
                                                            title="Remove Line"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={4}>
                                                    <button className="btn-secondary" onClick={addLine}>
                                                        <Plus size={16} /> Add Line
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr className="totals-row">
                                                <td><strong>Totals:</strong></td>
                                                <td className={balanced ? 'balanced' : 'unbalanced'}>
                                                    KES {totalDebit.toFixed(2)}
                                                </td>
                                                <td className={balanced ? 'balanced' : 'unbalanced'}>
                                                    KES {totalCredit.toFixed(2)}
                                                </td>
                                                <td colSpan={2}>
                                                    {!balanced && <span className="error">Debits must equal credits</span>}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleSave}
                                    disabled={saving || !balanced}
                                >
                                    <Save size={18} />
                                    {saving ? 'Saving...' : 'Save Entry'}
                                </button>
                            </div>
                        </div>
                    ) : selectedEntry ? (
                        <div className="entry-view">
                            <div className="entry-header">
                                <h3>{selectedEntry.description}</h3>
                                <div className="entry-meta">
                                    <span><Calendar size={16} /> {new Date(selectedEntry.date).toLocaleDateString()}</span>
                                    {selectedEntry.reference && (
                                        <span><FileText size={16} /> {selectedEntry.reference}</span>
                                    )}
                                </div>
                            </div>

                            <div className="entry-lines-view">
                                <h4>Entry Lines</h4>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Account</th>
                                            <th>Debit</th>
                                            <th>Credit</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entryLines.map(line => (
                                            <tr key={line.id}>
                                                <td>
                                                    {line.account_code} - {line.account_name}
                                                </td>
                                                <td>KES {line.debit.toFixed(2)}</td>
                                                <td>KES {line.credit.toFixed(2)}</td>
                                                <td>{line.description || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="totals-row">
                                            <td><strong>Totals:</strong></td>
                                            <td><strong>KES {entryLines.reduce((sum, line) => sum + line.debit, 0).toFixed(2)}</strong></td>
                                            <td><strong>KES {entryLines.reduce((sum, line) => sum + line.credit, 0).toFixed(2)}</strong></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <BookOpen size={48} />
                            <p>Select an entry to view details or create a new one</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JournalEntries;
