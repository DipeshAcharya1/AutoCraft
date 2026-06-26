'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, User2, Mail, Phone, Car,
  FileText, CheckCircle, Clock, XCircle, Plus, Send, X, Trash2
} from 'lucide-react';
import Link from 'next/link';

const API = 'http://localhost:5215';

interface Part { id: number; name: string; price: number; }
interface InvoiceItem { id: number; partId: number; part: Part; quantity: number; unitPrice: number; }
interface Vehicle { id: number; vehicleNumber: string; make: string; model: string; year?: number; color?: string; notes?: string; }
interface Invoice {
  id: number; invoiceNumber: string; saleDate: string; totalAmount: number;
  status: string; emailSent: boolean; notes?: string;
  vehicle?: Vehicle; items: InvoiceItem[];
}
interface Customer {
  id: number; username: string; email: string; phoneNumber: string; isActive: boolean;
  vehicles: Vehicle[]; invoices: Invoice[];
}

const STATUS_COLORS: Record<string, string> = {
  Paid: 'admin-badge-active',
  Unpaid: 'admin-badge-inactive',
  Pending: 'admin-badge-pending',
};

export default function CustomerDetailPage({ params }: { params: any }) {
  const router = useRouter();
  const unwrappedParams = React.use(params) as any;
  const customerId = unwrappedParams.id;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<number | null>(null);

  // New Vehicle form state
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vNumber, setVNumber] = useState('');
  const [vMake, setVMake] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState('');
  const [vColor, setVColor] = useState('');
  const [vNotes, setVNotes] = useState('');
  const [vehicleError, setVehicleError] = useState('');
  const [vehicleLoading, setVehicleLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const p = JSON.parse(atob(token.split('.')[1]));
      const role = p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'Staff') { setError('Access restricted to Staff/Admins.'); setLoading(false); return; }
    } catch { router.push('/login'); return; }
    loadCustomerData();
  }, [customerId, router]);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setCustomer(await res.json());
      } else {
        setError('Customer account not found.');
      }
    } catch {
      setError('Cannot reach backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vNumber.trim() || !vMake.trim() || !vModel.trim()) {
      setVehicleError('Plate number, make, and model are required.');
      return;
    }
    setVehicleError('');
    setVehicleLoading(true);

    try {
      const res = await fetch(`${API}/api/customers/${customerId}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          vehicleNumber: vNumber,
          make: vMake,
          model: vModel,
          year: vYear ? parseInt(vYear) : null,
          color: vColor || null,
          notes: vNotes || null
        })
      });
      if (res.ok) {
        setShowVehicleModal(false);
        resetVehicleForm();
        await loadCustomerData();
      } else {
        const msg = await res.text();
        setVehicleError(msg || 'Failed to add vehicle.');
      }
    } catch {
      setVehicleError('Network error.');
    } finally {
      setVehicleLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!confirm('Remove this vehicle from the customer?')) return;
    try {
      const res = await fetch(`${API}/api/customers/${customerId}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        await loadCustomerData();
      } else {
        alert('Failed to remove vehicle.');
      }
    } catch {
      alert('Network error.');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await fetch(`${API}/api/sales/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status })
    });
    await loadCustomerData();
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

      alert(message || 'Invoice email dispatched.');
      await loadCustomerData();
    } catch {
      alert('Network error while sending email.');
    }
  };

  const resetVehicleForm = () => {
    setVNumber(''); setVMake(''); setVModel(''); setVYear(''); setVColor(''); setVNotes('');
    setVehicleError('');
  };

  const StatusIcon = ({ s }: { s: string }) =>
    s === 'Paid' ? <CheckCircle size={14} /> : s === 'Pending' ? <Clock size={14} /> : <XCircle size={14} />;

  if (loading) {
    return (
      <div className="admin-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card empty-state" style={{ minHeight: '300px' }}>
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
          <p className="card-eyebrow">Fetching client directory records...</p>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="admin-page" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card empty-state" style={{ maxWidth: '480px' }}>
          <div className="empty-state-icon"><X size={40} style={{ color: 'var(--primary-accent)' }} /></div>
          <h2 className="empty-state-title">Profile Error</h2>
          <p className="empty-state-text" style={{ marginBottom: '1.5rem' }}>{error || 'No customer data loaded.'}</p>
          <Link href="/staff/customers" className="btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}>Back to Directory</Link>
        </div>
      </div>
    );
  }

  const paidInvoices = customer.invoices.filter(i => i.status === 'Paid');
  const totalSpent = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/staff/customers" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Back to Directory</span>
            </Link>
            <h1 className="page-header-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {customer.username}
              <span className={`admin-badge ${customer.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                {customer.isActive ? 'Active Client' : 'Inactive'}
              </span>
            </h1>
            <p className="page-header-text">ID: #{customer.id} • Registered vehicles and client transaction history.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--primary-accent)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Shield size={18} />
            <span>Staff Portal</span>
          </div>
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Contact Information Card */}
        <div className="card p-7" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: 'rgba(214, 31, 44, 0.1)', color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              <User2 size={20} />
            </div>
            <div>
              <span className="card-eyebrow">Client Username</span>
              <h4 style={{ margin: '0.1rem 0 0', fontSize: '1.1rem', fontWeight: 700 }}>{customer.username}</h4>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              <Mail size={20} />
            </div>
            <div>
              <span className="card-eyebrow">Email Address</span>
              <h4 style={{ margin: '0.1rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{customer.email}</h4>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              <Phone size={20} />
            </div>
            <div>
              <span className="card-eyebrow">Phone Connection</span>
              <h4 style={{ margin: '0.1rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{customer.phoneNumber}</h4>
            </div>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="stat-card-icon-wrap" style={{ color: 'var(--primary-accent)', backgroundColor: 'rgba(214, 31, 44, 0.1)' }}><FileText size={24} /></div>
            <div>
              <span className="card-eyebrow">Sales Slips</span>
              <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{customer.invoices.length}</h3>
            </div>
          </div>

          <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="stat-card-icon-wrap" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}><CheckCircle size={24} /></div>
            <div>
              <span className="card-eyebrow">Total Revenue Settled</span>
              <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#22c55e' }}>${totalSpent.toFixed(2)}</h3>
            </div>
          </div>

          <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="stat-card-icon-wrap" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}><Clock size={24} /></div>
            <div>
              <span className="card-eyebrow">Outstanding Invoices</span>
              <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#ef4444' }}>
                {customer.invoices.filter(i => i.status !== 'Paid').length}
              </h3>
            </div>
          </div>

          <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div className="stat-card-icon-wrap" style={{ color: '#60a5fa', backgroundColor: 'rgba(96, 165, 250, 0.1)' }}><Car size={24} /></div>
            <div>
              <span className="card-eyebrow">Associated Garage Cars</span>
              <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#60a5fa' }}>{customer.vehicles.length}</h3>
            </div>
          </div>
        </div>

        {/* Garage Vehicles Section */}
        <div className="card p-7">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Garage Vehicles</h2>
            <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontSize: '0.85rem' }} onClick={() => setShowVehicleModal(true)}>
              <Plus size={16} />
              <span>Register New Vehicle</span>
            </button>
          </div>

          {customer.vehicles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No vehicles are registered for this customer account.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {customer.vehicles.map(v => (
                <div key={v.id} style={{
                  background: 'var(--secondary-bg)',
                  border: '1px solid var(--borders)',
                  borderRadius: '1rem',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--borders)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                      <Car size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>{v.vehicleNumber}</h4>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {v.make} {v.model} {v.year ? `(${v.year})` : ''} {v.color ? `• ${v.color}` : ''}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteVehicle(v.id)} 
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice & Sales Records Table */}
        <div className="card p-7">
          <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Full Sales & Invoice Slips</h2>

          {customer.invoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No transactions or invoices have been compiled for this client.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Car Target</th>
                    <th>Billing Date</th>
                    <th>Slip Total</th>
                    <th>Status</th>
                    <th>Dispatched</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.invoices.map(inv => (
                    <React.Fragment key={inv.id}>
                      <tr>
                        <td><strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{inv.invoiceNumber}</strong></td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {inv.vehicle ? `${inv.vehicle.vehicleNumber} – ${inv.vehicle.make}` : '—'}
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
                            {inv.emailSent ? '✓ Emailed' : 'Unsent'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="admin-action-btn"
                              onClick={() => setExpandedInvoiceId(expandedInvoiceId === inv.id ? null : inv.id)}
                            >
                              <span>Parts</span>
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
                                <Send size={12} />
                                <span>Email</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedInvoiceId === inv.id && (
                        <tr>
                          <td colSpan={7} style={{ background: 'rgba(255,255,255,0.01)', padding: 0 }}>
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
                                      <td>{item.part?.name || 'Unknown Part'}</td>
                                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.quantity} units</td>
                                      <td style={{ textAlign: 'center' }}>${item.unitPrice.toFixed(2)}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {inv.notes && (
                                <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                  Technician Notes: {inv.notes}
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
            </div>
          )}
        </div>
      </main>

      {/* New Vehicle Modal */}
      {showVehicleModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card p-9" style={{ width: '100%', maxWidth: '30rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Register New Vehicle</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => { setShowVehicleModal(false); resetVehicleForm(); }}>&times;</button>
            </div>

            {vehicleError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {vehicleError}
              </div>
            )}

            <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Plate Number *</label>
                <input type="text" className="form-input" placeholder="e.g. BA-123-CD" value={vNumber} onChange={e => setVNumber(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Vehicle Make *</label>
                  <input type="text" className="form-input" placeholder="e.g. Toyota" value={vMake} onChange={e => setVMake(e.target.value)} required />
                </div>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Model *</label>
                  <input type="text" className="form-input" placeholder="e.g. Camry" value={vModel} onChange={e => setVModel(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Year</label>
                  <input type="month" min="1900-01" max="2100-12" className="form-input" placeholder="e.g. 2020" value={vYear ? `${vYear}-01` : ''} onChange={e => setVYear(e.target.value ? e.target.value.split('-')[0] : '')} />
                </div>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Color</label>
                  <input type="text" className="form-input" placeholder="e.g. Metallic Black" value={vColor} onChange={e => setVColor(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Garage Notes</label>
                <textarea className="form-input" placeholder="Optional engine notes or transmission details..." value={vNotes} onChange={e => setVNotes(e.target.value)} style={{ minHeight: '60px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => { setShowVehicleModal(false); resetVehicleForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} disabled={vehicleLoading}>
                  {vehicleLoading ? 'Adding...' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
