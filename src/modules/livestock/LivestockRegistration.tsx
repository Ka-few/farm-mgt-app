import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Edit2, Trash2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface Animal {
    id: string;
    tag: string;
    name: string;
    species: string;
    breed: string;
    dob: string;
    status: string;
}

const LivestockRegistration: React.FC = () => {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({
        tag: '',
        name: '',
        species: 'dairy',
        breed: '',
        dob: ''
    });
    const [searchTerm, setSearchTerm] = useState('');

    const loadAnimals = async () => {
        try {
            const result = await invoke<Animal[]>('get_livestock');
            setAnimals(result);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadAnimals();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await invoke('add_livestock', formData);
            setShowAdd(false);
            setFormData({ tag: '', name: '', species: 'dairy', breed: '', dob: '' });
            loadAnimals();
            alert('Animal registered successfully!');
        } catch (err) {
            console.error(err);
            alert('Error registering animal');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await invoke('delete_livestock', { id });
            loadAnimals();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredAnimals = animals.filter(a =>
        a.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="livestock-registration">
            <div className="section-actions" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
                <div className="search-box glass" style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', flex: 1, borderRadius: 'var(--radius-sm)' }}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by Tag or Name"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'none', border: 'none', color: 'white', padding: '0.75rem', width: '100%', outline: 'none' }}
                    />
                </div>
                <button className="button-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={18} /> Add Animal
                </button>
            </div>

            {showAdd && (
                <div className="modal-overlay">
                    <div className="form-container glass" style={{ maxWidth: '500px' }}>
                        <h3>Register New Animal</h3>
                        <form onSubmit={handleSubmit} className="entry-form">
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Tag ID</label>
                                    <input value={formData.tag} onChange={(e) => setFormData({ ...formData, tag: e.target.value })} required placeholder="e.g. COW-001" />
                                </div>
                                <div className="input-group">
                                    <label>Name (Optional)</label>
                                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Bessie" />
                                </div>
                            </div>
                            <div className="input-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="input-group">
                                    <label>Species</label>
                                    <select value={formData.species} onChange={(e) => setFormData({ ...formData, species: e.target.value })}>
                                        <option value="dairy">Dairy Cow</option>
                                        <option value="beef">Beef Cattle</option>
                                        <option value="poultry">Poultry</option>
                                        <option value="pigs">Pig</option>
                                        <option value="goats">Goat</option>
                                        <option value="sheep">Sheep</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Breed</label>
                                    <input value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} placeholder="e.g. Holstein" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="button-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="button-primary">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tag</th>
                            <th>Name</th>
                            <th>Species</th>
                            <th>Breed</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAnimals.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No animals found</td></tr>
                        ) : (
                            filteredAnimals.map(animal => (
                                <tr key={animal.id}>
                                    <td><Tag size={14} style={{ marginRight: '0.5rem' }} /> {animal.tag}</td>
                                    <td>{animal.name || '-'}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{animal.species}</td>
                                    <td>{animal.breed || '-'}</td>
                                    <td>
                                        <span className={`badge ${animal.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                            {animal.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-icon"><Edit2 size={14} /></button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(animal.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LivestockRegistration;
