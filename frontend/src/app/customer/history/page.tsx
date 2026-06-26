'use client';
import React, { useState, useEffect } from 'react';
import { History, Receipt, Calendar, FileText, Car, Award, Loader2, Info, Search } from 'lucide-react';
import Link from 'next/link';

export default function ServiceHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await fetch('http://localhost:5215/api/customer-portal/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setHistory(await res.json());
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchHistory();
    }, []);

    // Reset page number on search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const filteredHistory = history.filter((inv: any) =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.vehicle && inv.vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const itemsPerPage = 6;
    const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
    const paginatedHistory = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const statusColor: any = { 'Paid': 'success', 'Pending': 'warning', 'Cancelled': 'danger' };

    return (
        <div className="space-y-8 animate-in">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 className="page-header-title">SERVICE HISTORY</h1>
                    <p className="page-header-text">A complete record of your vehicle's care and your investments.</p>
                </div>
                <div style={{ position: 'relative', minWidth: '280px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Search invoice or plate..."
                        style={{ paddingLeft: '2.75rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="card empty-state">
                    <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
                    <p className="card-eyebrow">Retrieving archives...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon"><History size={40} /></div>
                    <h2 className="empty-state-title">NO RECORDS FOUND</h2>
                    <p className="empty-state-text" style={{ maxWidth: '380px' }}>Your service and purchase history will appear here once you complete your first order.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {paginatedHistory.map((inv: any) => (
                        <div key={inv.id} className="card p-7">
                            {/* Main Row */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div className="stat-card-icon-wrap" style={{ width: '3.5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Receipt size={24} />
                                    </div>
                                    <div>
                                        <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Invoice Number</span>
                                        <h3 className="card-title" style={{ fontSize: '1.25rem' }}>{inv.invoiceNumber}</h3>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <div>
                                        <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Date</span>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                                            <Calendar size={14} style={{ color: 'var(--primary-accent)' }} />
                                            {new Date(inv.saleDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Vehicle</span>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>
                                            <Car size={14} style={{ color: 'var(--primary-accent)' }} />
                                            {inv.vehicle ? inv.vehicle.vehicleNumber : 'Over Counter'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Status</span>
                                        <span className={`appointment-status ${statusColor[inv.status] || ''}`}>{inv.status}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Total Amount</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {inv.loyaltyApplied && (
                                                <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    <Award size={10} /> Loyalty -10%
                                                </div>
                                            )}
                                            <h4 className="card-title" style={{ fontSize: '1.5rem', color: 'var(--primary-accent)' }}>${inv.totalAmount.toFixed(2)}</h4>
                                        </div>
                                    </div>
                                    <Link href={`/customer/reviews?invoiceId=${inv.id}`}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem', backgroundColor: 'var(--secondary-bg)', borderRadius: '1rem', color: 'var(--text-secondary)', border: '1px solid var(--borders)' }}>
                                        <FileText size={20} />
                                    </Link>
                                </div>
                            </div>

                            {/* Items breakdown */}
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--borders)', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {inv.items.map((item: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'var(--secondary-bg)', borderRadius: '0.75rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(214,31,44,0.1)', color: 'var(--primary-accent)', borderRadius: '0.5rem', fontWeight: 900, fontSize: '0.8rem' }}>
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item.partName}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${item.unitPrice.toFixed(2)} / unit</p>
                                                </div>
                                            </div>
                                            <p style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '0.875rem' }}>${item.lineTotal.toFixed(2)}</p>
                                        </div>
                                    ))}
                                    {inv.notes && (
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(214,31,44,0.05)', borderRadius: '0.75rem', marginTop: '0.5rem' }}>
                                            <Info size={16} style={{ color: 'var(--primary-accent)', flexShrink: 0, marginTop: '0.2rem' }} />
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Note: {inv.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>

                  {/* Elegant Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--borders)', paddingTop: '1.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> – <strong>{Math.min(currentPage * itemsPerPage, filteredHistory.length)}</strong> of <strong>{filteredHistory.length}</strong> purchase records
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', color: '#fff' }}
                        >
                          First
                        </button>
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', color: '#fff' }}
                        >
                          Previous
                        </button>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, padding: '0 0.75rem' }}>
                          Page {currentPage} of {totalPages}
                        </span>
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', color: '#fff' }}
                        >
                          Next
                        </button>
                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', color: '#fff' }}
                        >
                          Last
                        </button>
                      </div>
                    </div>
                  )}
                </div>
            )}
        </div>
    );
}
