'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, Plus, Loader2, Shield, Users,
  Car, ChevronDown, ChevronUp, Phone, Mail, Edit3,
  Trash2, PlusCircle, X, User2
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;
const API = 'http://localhost:5215';

interface Vehicle {
  id: number;
  vehicleNumber: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  notes?: string;
}

interface Customer {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  vehicles: Vehicle[];
}

export default function StaffCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);

  // Create Customer Modal
  const [showModal, setShowModal] = useState(false);
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [vehicles, setVehicles] = useState([{ vehicleNumber: '', make: '', model: '', year: '', color: '' }]);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'Staff') {
        setError('Access restricted to Staff and Admins.');
        setLoading(false);
        return;
      }
    } catch { router.push('/login'); return; }
    fetchCustomers();
  }, [router]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customers`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setCustomers(await res.json());
      else setError('Failed to load customers.');
    } catch { setError('Cannot reach backend.'); }
    finally { setLoading(false); }
  };

  // Search via API
  useEffect(() => {
    if (!searchQuery.trim()) { fetchCustomers(); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`${API}/api/customers/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (res.ok) setCustomers(await res.json());
      } finally { setIsSearching(false); setPage(1); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return customers.slice(start, start + PAGE_SIZE);
  }, [customers, page]);

  const totalPages = Math.ceil(customers.length / PAGE_SIZE);

  const resetModal = () => {
    setFName(''); setFEmail(''); setFPhone(''); setFPassword('');
    setVehicles([{ vehicleNumber: '', make: '', model: '', year: '', color: '' }]);
    setModalError('');
  };

  const addVehicleRow = () =>
    setVehicles([...vehicles, { vehicleNumber: '', make: '', model: '', year: '', color: '' }]);

  const removeVehicleRow = (i: number) =>
    setVehicles(vehicles.filter((_, idx) => idx !== i));

  const updateVehicle = (i: number, field: string, val: string) => {
    const v = [...vehicles];
    (v[i] as any)[field] = val;
    setVehicles(v);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!fName || !fEmail || !fPhone) { setModalError('Name, email, and phone are required.'); return; }
    if (!fPassword) { setModalError('Password is required.'); return; }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/;
    if (!passwordRegex.test(fPassword)) {
      setModalError('Password must be at least 6 characters, with uppercase, lowercase, digit, and special character.');
      return;
    }

    setModalLoading(true);
    try {
      const res = await fetch(`${API}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: fName, email: fEmail, phoneNumber: fPhone,
          password: fPassword || undefined,
          vehicles: vehicles.filter(v => v.vehicleNumber && v.make && v.model).map(v => ({
            vehicleNumber: v.vehicleNumber, make: v.make, model: v.model,
            year: v.year ? parseInt(v.year) : null, color: v.color || null
          }))
        })
      });
      if (res.ok) {
        setShowModal(false); resetModal(); await fetchCustomers();
      } else {
        const msg = await res.text(); setModalError(msg || 'Failed to create customer.');
      }
    } catch { setModalError('Network error.'); }
    finally { setModalLoading(false); }
  };

  const handleDeleteVehicle = async (customerId: number, vehicleId: number) => {
    if (!confirm('Remove this vehicle from the customer?')) return;
    await fetch(`${API}/api/customers/${customerId}/vehicles/${vehicleId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` }
    });
    await fetchCustomers();
  };

  return (
    <div className="admin-page">
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </Link>
            <h1 className="page-header-title">Customer Management</h1>
            <p className="page-header-text">Register customers, assign vehicles, and view client history records.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--borders)' }}>
            <Link href="/staff/customers" style={{ color: 'var(--primary-accent)', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>Customers</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/staff/sales" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Sales</Link>
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
            <p className="card-eyebrow">Loading Customers...</p>
          </div>
        ) : (
          <>
            {/* Stats Dashboard Grid */}
            <div className="grid-stats" style={{ marginBottom: '2.5rem' }}>
              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap"><Users size={24} /></div>
                <div>
                  <span className="card-eyebrow">Total Customers</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{customers.length}</h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap"><Car size={24} /></div>
                <div>
                  <span className="card-eyebrow">Total Vehicles</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
                    {customers.reduce((acc, c) => acc + c.vehicles.length, 0)}
                  </h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap"><Shield size={24} /></div>
                <div>
                  <span className="card-eyebrow">Active Clients</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>
                    {customers.filter(c => c.isActive).length}
                  </h3>
                </div>
              </div>
            </div>

            {/* Controls & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="admin-search" style={{ flex: 1, minWidth: '280px' }}>
                <Search size={18} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search by name, email, phone, vehicle plate..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {isSearching && <Loader2 size={16} className="animate-spin" style={{ position: 'absolute', right: '1rem', color: 'var(--text-secondary)' }} />}
              </div>
              
              <button className="btn-primary" style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem' }} onClick={() => { resetModal(); setShowModal(true); }}>
                <Plus size={18} />
                <span>New Customer</span>
              </button>
            </div>

            {/* Customers Listing Table */}
            <div className="card p-7" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Vehicles</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: 'right' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No customers found matching the search query.
                      </td>
                    </tr>
                  ) : paginated.map(c => (
                    <React.Fragment key={c.id}>
                      <tr>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid var(--borders)' }}>
                              {c.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.username}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{c.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>{c.email}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>{c.phoneNumber}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                            {c.vehicles.length} vehicle{c.vehicles.length !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge ${c.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="admin-action-btn"
                            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                            style={{ gap: '0.4rem' }}
                          >
                            {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            <span>{expanded === c.id ? 'Collapse' : 'View'}</span>
                          </button>
                        </td>
                      </tr>
                      {expanded === c.id && (
                        <tr>
                          <td colSpan={6} style={{ padding: '0', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--borders)', borderBottom: '1px solid var(--borders)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Registered Vehicles</strong>
                                <Link href={`/staff/customers/${c.id}`} style={{ fontSize: '0.8rem', color: 'var(--primary-accent)', fontWeight: 700, textDecoration: 'none' }}>
                                  Full History & Invoice Records →
                                </Link>
                              </div>
                              {c.vehicles.length === 0 ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>No vehicles registered.</p>
                              ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                  {c.vehicles.map(v => (
                                    <div key={v.id} style={{
                                      background: 'var(--secondary-bg)', border: '1px solid var(--borders)',
                                      borderRadius: '1rem', padding: '0.75rem 1.25rem',
                                      display: 'flex', alignItems: 'center', gap: '1rem'
                                    }}>
                                      <div className="stat-card-icon-wrap" style={{ padding: '0.5rem' }}><Car size={16} /></div>
                                      <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.vehicleNumber}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                          {v.make} {v.model} {v.year ? `(${v.year})` : ''} {v.color ? `• ${v.color}` : ''}
                                        </div>
                                      </div>
                                      <button onClick={() => handleDeleteVehicle(c.id, v.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '0.5rem', display: 'flex' }}>
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
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
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={p => { setPage(p); setExpanded(null); }} pageSize={PAGE_SIZE} totalItems={customers.length} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create Customer Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card p-9" style={{ width: '100%', maxWidth: '38rem', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Register New Customer</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            {modalError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
                  <input type="text" className="form-input" placeholder="John Doe" value={fName} onChange={e => setFName(e.target.value)} required />
                </div>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number *</label>
                  <input type="tel" className="form-input" placeholder="Enter 10-digit phone number" pattern="^\d{10}$" title="Phone number must be exactly 10 digits" maxLength={10} value={fPhone} onChange={e => setFPhone(e.target.value.replace(/\D/g, ''))} required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Email *</label>
                  <input type="email" className="form-input" placeholder="customer@email.com" value={fEmail} onChange={e => setFEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Password *</label>
                  <input type="password" className="form-input" placeholder="Min 6 chars, upper, lower, digit, symbol" value={fPassword} onChange={e => setFPassword(e.target.value)} required />
                </div>
              </div>

              {/* Vehicles section */}
              <div style={{ borderTop: '1px solid var(--borders)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="card-eyebrow" style={{ margin: 0 }}>Vehicle Details</label>
                  <button type="button" onClick={addVehicleRow} style={{ background: 'none', border: 'none', color: 'var(--primary-accent)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PlusCircle size={14} /> Add Vehicle
                  </button>
                </div>
                
                {vehicles.map((v, i) => (
                  <div key={i} style={{ backgroundColor: 'var(--secondary-bg)', border: '1px solid var(--borders)', borderRadius: '0.75rem', padding: '0.75rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Row 1: Plate / Make / Model */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                      <input type="text" placeholder="Plate No. *" value={v.vehicleNumber} onChange={e => updateVehicle(i, 'vehicleNumber', e.target.value)}
                        style={{ backgroundColor: 'var(--main-bg)', border: '1px solid var(--borders)', borderRadius: '0.5rem', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} />
                      <input type="text" placeholder="Make *" value={v.make} onChange={e => updateVehicle(i, 'make', e.target.value)}
                        style={{ backgroundColor: 'var(--main-bg)', border: '1px solid var(--borders)', borderRadius: '0.5rem', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} />
                      <input type="text" placeholder="Model *" value={v.model} onChange={e => updateVehicle(i, 'model', e.target.value)}
                        style={{ backgroundColor: 'var(--main-bg)', border: '1px solid var(--borders)', borderRadius: '0.5rem', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    {/* Row 2: Year / Color / Delete */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input type="month" min="1900-01" max="2100-12" placeholder="Year" value={v.year ? `${v.year}-01` : ''} onChange={e => updateVehicle(i, 'year', e.target.value ? e.target.value.split('-')[0] : '')}
                        style={{ backgroundColor: 'var(--main-bg)', border: '1px solid var(--borders)', borderRadius: '0.5rem', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} />
                      <input type="text" placeholder="Color" value={v.color} onChange={e => updateVehicle(i, 'color', e.target.value)}
                        style={{ backgroundColor: 'var(--main-bg)', border: '1px solid var(--borders)', borderRadius: '0.5rem', padding: '0.6rem', color: '#fff', fontSize: '0.8rem', width: '100%', boxSizing: 'border-box' }} />
                      <button type="button" onClick={() => removeVehicleRow(i)} disabled={vehicles.length === 1} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: vehicles.length === 1 ? 0.3 : 1, display: 'flex', alignItems: 'center' }}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Rows with empty plate/make/model will be skipped.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
