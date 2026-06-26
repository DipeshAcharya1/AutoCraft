'use client';
import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Plus, X, CheckCircle, Loader2, Trash2, Tag, FileText } from 'lucide-react';

export default function PartRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ partName: '', partNumber: '', description: '' });
    const [customPartName, setCustomPartName] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const partNameOptions = [
        'Engine Oil Filter',
        'Brake Pads',
        'Air Filter',
        'Spark Plug',
        'Battery',
        'Clutch Plate',
        'Headlight',
        'Other'
    ];

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5215/api/partrequests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        const token = localStorage.getItem('token');
        const resolvedPartName = formData.partName === 'Other' ? customPartName.trim() : formData.partName;
        try {
            const res = await fetch('http://localhost:5215/api/partrequests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...formData, partName: resolvedPartName })
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ partName: '', partNumber: '', description: '' });
                setCustomPartName('');
                fetchRequests();
            }
        } catch (err) { console.error(err); } finally { setModalLoading(false); }
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:5215/api/partrequests/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setRequests((prev: any) => prev.filter((r: any) => r.id !== id));
            else alert((await res.text()) || 'Could not cancel.');
        } catch (err) { console.error(err); }
    };

    const statusColor: any = { 'Pending': 'warning', 'Approved': 'success', 'Rejected': 'danger' };

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-header-title">PART REQUESTS</h1>
                    <p className="page-header-text">Can't find what you need? Request specialized parts and we'll source them for you.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={24} /> NEW PART REQUEST
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="card empty-state">
                    <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
                    <p className="card-eyebrow">Scanning inventory...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon"><Search size={40} /></div>
                    <h2 className="empty-state-title">NO ACTIVE REQUESTS</h2>
                    <p className="empty-state-text" style={{ maxWidth: '380px' }}>If you need a part that isn't in our standard inventory, let us know and we'll get it for you.</p>
                    <button className="btn-primary" onClick={() => setShowModal(true)} style={{ marginTop: '1.5rem', padding: '0.75rem 2rem' }}>Submit your first request</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {requests.map((req: any) => (
                        <div key={req.id} className="card p-7">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <span className={`appointment-status ${statusColor[req.status] || ''}`}>{req.status}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            Requested on {new Date(req.requestedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="card-title" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{req.partName}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: 700 }}>#{req.partNumber || 'VENDOR-CODE-PENDING'}</p>
                                </div>
                                {req.status === 'Pending' && (
                                    <button onClick={() => handleCancel(req.id)} title="Cancel Request"
                                        style={{ padding: '0.5rem', backgroundColor: 'rgba(214,31,44,0.1)', border: '1px solid rgba(214,31,44,0.3)', borderRadius: '0.75rem', color: 'var(--primary-accent)', cursor: 'pointer' }}>
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>

                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--borders)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <FileText size={18} style={{ color: 'var(--primary-accent)', flexShrink: 0, marginTop: '0.2rem' }} />
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    "{req.description || 'No description provided.'}"
                                </p>
                            </div>

                            {req.adminNote && (
                                <div style={{ marginTop: '1rem', backgroundColor: 'rgba(214,31,44,0.05)', border: '1px solid rgba(214,31,44,0.2)', borderRadius: '1rem', padding: '1rem' }}>
                                    <h4 className="card-eyebrow" style={{ color: 'var(--primary-accent)', marginBottom: '0.5rem' }}>Response from Staff</h4>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{req.adminNote}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)' }} onClick={() => setShowModal(false)}></div>
                    <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '30rem', padding: '1.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--borders)', paddingBottom: '1rem' }}>
                            <h2 className="card-title">SOURCING REQUEST</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label className="card-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Tag size={14} /> Part Name
                                </label>
                                <select
                                    className="form-input"
                                    required
                                    value={formData.partName}
                                    onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                                >
                                    <option value="" disabled>Select part name</option>
                                    {partNameOptions.map((part) => (
                                        <option key={part} value={part}>{part}</option>
                                    ))}
                                </select>
                                {formData.partName === 'Other' && (
                                    <input
                                        className="form-input"
                                        required
                                        placeholder="Enter custom part name"
                                        style={{ marginTop: '0.6rem' }}
                                        value={customPartName}
                                        onChange={(e) => setCustomPartName(e.target.value)}
                                    />
                                )}
                            </div>
                            <div>
                                <label className="card-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Plus size={14} /> Part Number (If known)
                                </label>
                                <input className="form-input" placeholder="e.g. OEM-99812"
                                    value={formData.partNumber} onChange={(e) => setFormData({...formData, partNumber: e.target.value})} />
                            </div>
                            <div>
                                <label className="card-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <FileText size={14} /> Additional Details
                                </label>
                                <textarea className="form-input" required style={{ minHeight: '5rem', resize: 'none' }}
                                    placeholder="Describe the part or why you need it..."
                                    value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <button type="submit" disabled={modalLoading} className="btn-primary"
                                style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                {modalLoading ? <Loader2 className="animate-spin" size={24} /> : <ClipboardList size={20} />}
                                SUBMIT SOURCING REQUEST
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
