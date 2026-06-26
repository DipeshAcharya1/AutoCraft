'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, FileText, PlusCircle, X,
  Search, CheckCircle, Clock, XCircle, Mail, Send, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 8;
const API = 'http://localhost:5215';

interface Part { id: number; name: string; partNumber: string; price: number; stockQuantity: number; }
interface Customer { id: number; username: string; email: string; phoneNumber: string; vehicles: { id: number; vehicleNumber: string; make: string; model: string }[]; }
interface Invoice {
  id: number; invoiceNumber: string; saleDate: string; totalAmount: number;
  status: string; emailSent: boolean; notes?: string;
  customer: { id: number; username: string; email: string; phoneNumber: string };
  vehicle?: { id: number; vehicleNumber: string; make: string; model: string };
  items: { id: number; partId: number; partName: string; quantity: number; unitPrice: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  Paid: 'admin-badge-active',
  Unpaid: 'admin-badge-inactive',
  Pending: 'admin-badge-pending',
};

export default function StaffSalesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // New Invoice Modal
  const [showModal, setShowModal] = useState(false);
  const [iNumber, setINumber] = useState('');
  const [iCustomerId, setICustomerId] = useState(0);
  const [iVehicleId, setIVehicleId] = useState(0);
  const [iNotes, setINotes] = useState('');
  const [iItems, setIItems] = useState([{ partId: 0, quantity: 1, unitPrice: 0 }]);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const p = JSON.parse(atob(token.split('.')[1]));
      const role = p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'Staff') { setError('Staff/Admin only.'); setLoading(false); return; }
    } catch { router.push('/login'); return; }
    loadAll();
  }, [router]);

  const loadAll = async () => {
    setLoading(true);
    const h = { headers: { Authorization: `Bearer ${getToken()}` } };
    try {
      const [invRes, partsRes, custRes] = await Promise.all([
        fetch(`${API}/api/sales`, h),
        fetch(`${API}/api/parts`, h),
        fetch(`${API}/api/customers`, h),
      ]);
      if (invRes.ok) setInvoices(await invRes.json());
      if (partsRes.ok) setParts(await partsRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
    } catch {
      setError('Cannot reach backend. Is the server online?');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return invoices.filter(inv => {
      const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customer.username.toLowerCase().includes(q) ||
        inv.customer.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const selectedCustomer = customers.find(c => c.id === iCustomerId);
  const invoiceTotal = iItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const addItemRow = () => setIItems([...iItems, { partId: 0, quantity: 1, unitPrice: 0 }]);
  const removeItemRow = (i: number) => { if (iItems.length > 1) setIItems(iItems.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: string, val: number) => { const a = [...iItems]; (a[i] as any)[field] = val; setIItems(a); };

  const handlePartSelect = (i: number, partId: number) => {
    const p = parts.find(p => p.id === partId);
    const a = [...iItems];
    a[i] = { partId, quantity: 1, unitPrice: p?.price ?? 0 };
    setIItems(a);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iNumber.trim()) { setModalError('Invoice number is required.'); return; }
    if (!iCustomerId) { setModalError('Please select a customer.'); return; }
    if (iItems.some(i => !i.partId)) { setModalError('Select a part for every line.'); return; }
    if (iItems.some(i => i.quantity <= 0)) { setModalError('Quantity must be > 0.'); return; }
    setModalError(''); setModalLoading(true);
    try {
      // Client-side validation: ensure requested quantity does not exceed available stock
      for (const it of iItems) {
        const p = parts.find(pp => pp.id === it.partId);
        if (!p) { setModalError(`Part with ID ${it.partId} not found in catalog.`); setModalLoading(false); return; }
        if (it.quantity > p.stockQuantity) { setModalError(`Requested quantity for '${p.name}' exceeds available stock (${p.stockQuantity}).`); setModalLoading(false); return; }
      }

      // Build payload with server-authoritative unit prices (from admin-set part price)
      const itemsPayload = iItems.map(it => {
        const p = parts.find(pp => pp.id === it.partId)!;
        return { partId: it.partId, quantity: it.quantity, unitPrice: p.price };
      });

      const res = await fetch(`${API}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ invoiceNumber: iNumber, customerId: iCustomerId, vehicleId: iVehicleId || null, notes: iNotes, items: itemsPayload })
      });
      if (res.ok) {
        setShowModal(false); resetModal(); await loadAll();
      } else { const msg = await res.text(); setModalError(msg || 'Failed.'); }
    } catch { setModalError('Network error.'); }
    finally { setModalLoading(false); }
  };

  const resetModal = () => { setINumber(''); setICustomerId(0); setIVehicleId(0); setINotes(''); setIItems([{ partId: 0, quantity: 1, unitPrice: 0 }]); setModalError(''); };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`${API}/api/sales/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status })
    });
    await loadAll();
  };

  const handleSendEmail = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/sales/${id}/send-email`, {
        method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }
      });

      const contentType = res.headers.get('content-type') || '';
      let message = '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        message = data?.message || data?.Message || '';
      } else {
        message = await res.text();
      }

      if (!res.ok) {
        alert(message || 'Failed to send invoice email.');
        return;
      }

      alert(message || 'Email sent.');
      await loadAll();
    } catch {
      alert('Network error while sending email.');
    }
  };

  const StatusIcon = ({ s }: { s: string }) =>
    s === 'Paid' ? <CheckCircle size={14} /> : s === 'Pending' ? <Clock size={14} /> : <XCircle size={14} />;

  return (
    <div className="admin-page">
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </Link>
            <h1 className="page-header-title">Sales & Invoices</h1>
            <p className="page-header-text">Issue new sales records, track collected revenue, and dispatch client receipts.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--borders)' }}>
            <Link href="/staff/customers" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Customers</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/staff/sales" style={{ color: 'var(--primary-accent)', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>Sales & Invoices</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/staff/reports" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Reports</Link>
          </div>
        </div>
      </header>

      <main>
        {error ? (
          <div className="card empty-state" style={{ maxWidth: '480px', margin: '4rem auto' }}>
            <div className="empty-state-icon"><X size={40} style={{ color: 'var(--primary-accent)' }} /></div>
            <h2 className="empty-state-title">Access Denied</h2>
            <p className="empty-state-text" style={{ marginBottom: '1.5rem' }}>{error}</p>
          </div>
        ) : loading ? (
          <div className="card empty-state" style={{ minHeight: '300px' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
            <p className="card-eyebrow">Loading invoice database...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid-stats" style={{ marginBottom: '2.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap"><FileText size={24} /></div>
                <div>
                  <span className="card-eyebrow">Total Invoices</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{invoices.length}</h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}><CheckCircle size={24} /></div>
                <div>
                  <span className="card-eyebrow">Collected Revenue</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#22c55e' }}>
                    ${invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.totalAmount, 0).toFixed(0)}
                  </h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}><XCircle size={24} /></div>
                <div>
                  <span className="card-eyebrow">Outstanding Receivables</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#ef4444' }}>
                    ${invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.totalAmount, 0).toFixed(0)}
                  </h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}><Clock size={24} /></div>
                <div>
                  <span className="card-eyebrow">Pending Settlement</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#f59e0b' }}>
                    {invoices.filter(i => i.status === 'Pending').length}
                  </h3>
                </div>
              </div>
            </div>

            {/* Controls Filter Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <div className="admin-search" style={{ flex: 1, minWidth: '240px' }}>
                  <Search size={18} className="admin-search-icon" />
                  <input 
                    type="text" 
                    className="admin-search-input"
                    placeholder="Search by invoice #, customer..." 
                    value={searchQuery} 
                    onChange={e => { setSearchQuery(e.target.value); setPage(1); }} 
                  />
                </div>
                <select 
                  className="form-select" 
                  style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }} 
                  value={statusFilter} 
                  onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <button className="btn-primary" style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem' }} onClick={() => { resetModal(); setShowModal(true); }}>
                <PlusCircle size={18} />
                <span>New Sales Invoice</span>
              </button>
            </div>

            {/* Table Listing */}
            <div className="card p-7" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer Name</th>
                    <th>Associated Vehicle</th>
                    <th>Sale Date</th>
                    <th>Total Amount</th>
                    <th>Settlement Status</th>
                    <th>Invoice Dispatch</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No invoices found matching the filters.
                      </td>
                    </tr>
                  ) : paginated.map(inv => (
                    <React.Fragment key={inv.id}>
                      <tr>
                        <td><strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{inv.invoiceNumber}</strong></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{inv.customer.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{inv.customer.email}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {inv.vehicle ? `${inv.vehicle.vehicleNumber} – ${inv.vehicle.make} ${inv.vehicle.model}` : '—'}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(inv.saleDate).toLocaleDateString()}
                        </td>
                        <td><strong style={{ color: '#22c55e' }}>${inv.totalAmount.toFixed(2)}</strong></td>
                        <td>
                          <span className={`admin-badge ${STATUS_COLORS[inv.status] || 'admin-badge-pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <StatusIcon s={inv.status} />
                            {inv.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: inv.emailSent ? '#22c55e' : 'var(--text-secondary)', fontWeight: 600 }}>
                            {inv.emailSent ? '✓ Sent to Email' : 'Pending Send'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="admin-action-btn"
                              onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                            >
                              <ChevronDown size={13} />
                              <span>Items</span>
                            </button>
                            {inv.status !== 'Paid' && (
                              <button 
                                className="admin-action-btn"
                                onClick={() => handleStatusChange(inv.id, 'Paid')}
                                style={{ borderColor: '#22c55e', color: '#22c55e' }}
                              >
                                Mark Paid
                              </button>
                            )}
                            {!inv.emailSent && (
                              <button 
                                className="admin-action-btn"
                                onClick={() => handleSendEmail(inv.id)}
                              >
                                <Mail size={13} />
                                <span>Email</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedId === inv.id && (
                        <tr>
                          <td colSpan={8} style={{ background: 'rgba(255,255,255,0.01)', padding: 0 }}>
                            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--borders)', borderBottom: '1px solid var(--borders)' }}>
                              <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                                <thead>
                                  <tr>
                                    <th>Part Description</th>
                                    <th style={{ textAlign: 'center' }}>Quantity</th>
                                    <th style={{ textAlign: 'center' }}>Unit Price</th>
                                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inv.items.map(item => (
                                    <tr key={item.id}>
                                      <td>{item.partName}</td>
                                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity} units</td>
                                      <td style={{ textAlign: 'center' }}>${item.unitPrice.toFixed(2)}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {inv.notes && (
                                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Note: {inv.notes}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '1.5rem' }}>
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => { setPage(p); setExpandedId(null); }} pageSize={PAGE_SIZE} totalItems={filtered.length} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* New Invoice Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card p-9" style={{ width: '100%', maxWidth: '38rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Create Sales Invoice</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            {modalError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Invoice Number *</label>
                  <input type="text" className="form-input" placeholder="e.g. SI-2026-001" value={iNumber} onChange={e => setINumber(e.target.value)} required />
                </div>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Customer *</label>
                  <select 
                    className="form-select"
                    value={iCustomerId} 
                    onChange={e => { setICustomerId(parseInt(e.target.value)); setIVehicleId(0); }}
                  >
                    <option value={0}>Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.username} ({c.email})</option>)}
                  </select>
                </div>
              </div>

              {selectedCustomer && selectedCustomer.vehicles.length > 0 && (
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Associated Vehicle (Optional)</label>
                  <select 
                    className="form-select"
                    value={iVehicleId} 
                    onChange={e => setIVehicleId(parseInt(e.target.value))}
                  >
                    <option value={0}>No specific vehicle</option>
                    {selectedCustomer.vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber} – {v.make} {v.model}</option>)}
                  </select>
                </div>
              )}

              {/* Line Items */}
              <div style={{ borderTop: '1px solid var(--borders)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <label className="card-eyebrow" style={{ margin: 0 }}>Itemized Parts *</label>
                  <button type="button" onClick={addItemRow} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }} className="add-item-btn">
                    <PlusCircle size={14} /> Add Line Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {/* Grid Table Headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 0.8fr 1.2fr auto', gap: '0.5rem', paddingRight: '1rem', alignItems: 'center' }}>
                    <span className="card-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', letterSpacing: '0.15em', margin: 0 }}>Part Description</span>
                    <span className="card-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', letterSpacing: '0.15em', textAlign: 'center', margin: 0 }}>Qty</span>
                    <span className="card-eyebrow" style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', letterSpacing: '0.15em', textAlign: 'center', margin: 0 }}>Unit Price</span>
                    <span style={{ width: '16px' }}></span>
                  </div>
                  
                  {/* Grid Rows Container */}
                  <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '0.3rem' }}>
                    {iItems.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '3.5fr 0.8fr 1.2fr auto', gap: '0.5rem', alignItems: 'center' }}>
                        <select 
                          value={item.partId} 
                          onChange={e => handlePartSelect(i, parseInt(e.target.value))}
                          className="form-select-compact"
                        >
                          <option value={0}>Select part...</option>
                          {parts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>)}
                        </select>
                        
                        <input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                          className="form-input-compact"
                          style={{ textAlign: 'center' }}
                        />

                        <input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          value={item.unitPrice || ''} 
                          onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="form-input-compact"
                          style={{ textAlign: 'center' }}
                          placeholder="Price" 
                        />

                        <button 
                          type="button" 
                          onClick={() => removeItemRow(i)} 
                          disabled={iItems.length === 1}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#ef4444', 
                            cursor: 'pointer', 
                            opacity: iItems.length === 1 ? 0.3 : 1, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '0.25rem', 
                            transition: 'color 0.2s' 
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Invoice Notes</label>
                <textarea 
                  className="form-input"
                  value={iNotes} 
                  onChange={e => setINotes(e.target.value)} 
                  placeholder="Optional service notes or guidelines for this invoice..."
                  style={{ minHeight: '60px', fontFamily: 'inherit' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--borders)' }}>
                <span className="card-eyebrow" style={{ fontWeight: 700, margin: 0 }}>INVOICE TOTAL</span>
                <strong style={{ fontSize: '1.4rem', color: '#22c55e' }}>${invoiceTotal.toFixed(2)}</strong>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
