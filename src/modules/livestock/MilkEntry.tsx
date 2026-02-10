import React, { useState, useRef, useEffect } from 'react';
import { Save } from 'lucide-react';
import { getDb, generateId } from '../../core/db';
import '../../styles/Forms.css';

const MilkEntry: React.FC = () => {
    const [tag, setTag] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);
    const tagRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        tagRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tag || !quantity) return;

        setLoading(true);
        try {
            const db = await getDb();
            const livestockId = tag; // Simplification: tagging by ID or lookup

            await db.execute(
                'INSERT INTO production_logs (id, livestock_id, type, quantity, recorded_at) VALUES ($1, $2, $3, $4, $5)',
                [generateId(), livestockId, 'milk', parseFloat(quantity), new Date().toISOString()]
            );

            // Audit trail
            await db.execute(
                'INSERT INTO audit_events (id, entity_type, entity_id, action, payload) VALUES ($1, $2, $3, $4, $5)',
                [generateId(), 'production_logs', livestockId, 'create', JSON.stringify({ quantity })]
            );

            setTag('');
            setQuantity('');
            tagRef.current?.focus();
            alert('Record saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Error saving record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container glass">
            <h3>Quick Milk Entry</h3>
            <p className="form-help">Enter the cow tag and quantity. Press Enter to save.</p>

            <form onSubmit={handleSubmit} className="entry-form">
                <div className="input-group">
                    <label htmlFor="tag">Cow Tag / ID</label>
                    <input
                        ref={tagRef}
                        id="tag"
                        type="text"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        placeholder="e.g. COW-001"
                        required
                        autoComplete="off"
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="quantity">Quantity (Litres)</label>
                    <input
                        id="quantity"
                        type="number"
                        step="0.1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.0"
                        required
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="button-primary" disabled={loading}>
                        <Save size={18} />
                        <span>{loading ? 'Saving...' : 'Save Record'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MilkEntry;
