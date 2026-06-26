'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Plus, Edit3, Trash2, Search, Shield,
  Building2, Mail, Phone, MapPin, User2, X
} from 'lucide-react';
import Link from 'next/link';

interface Vendor {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
}

const API = 'http://localhost:5215/api/vendors';

export default function AdminVendorsPage() {
  const router = useRouter();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form fields
  const [fName, setFName] = useState('');
  const [fContact, setFContact] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fAddress, setFAddress] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const getToken = () => localStorage.getItem('token') ?? '';

  // Auth + initial fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin') { setError('Access restricted to Admins.'); setLoading(false); return; }
    } catch { router.push('/login'); return; }
    fetchVendors();
  }, [router]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch(API, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setVendors(await res.json());
      else setError('Failed to load vendors.');
    } catch { setError('Cannot reach backend server.'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setIsEditing(false); setEditingId(null);
    setFName(''); setFContact(''); setFEmail(''); setFPhone(''); setFAddress('');
    setModalError('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (v: Vendor) => {
    setIsEditing(true); setEditingId(v.id);
    setFName(v.name); setFContact(v.contactPerson ?? '');
    setFEmail(v.email ?? ''); setFPhone(v.phoneNumber ?? ''); setFAddress(v.address ?? '');
    setModalError(''); setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) { setModalError('Vendor name is required.'); return; }
    setModalError(''); setModalLoading(true);

    const body = JSON.stringify({ name: fName, contactPerson: fContact, email: fEmail, phoneNumber: fPhone, address: fAddress });
    const url = isEditing ? `${API}/${editingId}` : API;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body
      });
      if (res.ok) { setShowModal(false); resetForm(); await fetchVendors(); }
      else { const msg = await res.text(); setModalError(msg || 'Operation failed.'); }
    } catch { setModalError('Network error.'); }
    finally { setModalLoading(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete vendor "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) await fetchVendors();
      else { const msg = await res.text(); alert(msg || 'Failed to delete.'); }
    } catch { alert('Network error.'); }
  };

  // Reset page number on search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contactPerson ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedVendors = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="admin-page">
      {/* Header */}
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </Link>
            <h1 className="page-header-title">Vendor Relations</h1>
            <p className="page-header-text">Manage wholesale parts suppliers, directory contacts, and physical shop addresses.</p>
          </div>

          {/* Sub-nav */}
          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--borders)' }}>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
              Users
            </Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/parts" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
              Parts & Invoices
            </Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/vendors" style={{ color: 'var(--primary-accent)', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>
              Vendors
            </Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/reports" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
              Financial Reports
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--primary-accent)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Shield size={18} />
            <span>Admin Portal</span>
          </div>
        </div>
      </header>

      <main>
        {error ? (
          <div className="card empty-state" style={{ maxWidth: '480px', margin: '4rem auto' }}>
            <div className="empty-state-icon"><X size={40} style={{ color: 'var(--primary-accent)' }} /></div>
            <h2 className="empty-state-title">Access Restriction</h2>
            <p className="empty-state-text" style={{ marginBottom: '1.5rem' }}>{error}</p>
            <Link href="/login" className="btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}>Go to Login</Link>
          </div>
        ) : loading ? (
          <div className="card empty-state" style={{ minHeight: '300px' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
            <p className="card-eyebrow">Loading vendor directory...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid-stats" style={{ marginBottom: '2.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap" style={{ color: 'var(--primary-accent)', backgroundColor: 'rgba(214, 31, 44, 0.1)' }}><Building2 size={24} /></div>
                <div>
                  <span className="card-eyebrow">Registered Suppliers</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{vendors.length}</h3>
                </div>
              </div>
              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}><Mail size={24} /></div>
                <div>
                  <span className="card-eyebrow">Active Emails</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#22c55e' }}>{vendors.filter(v => v.email).length}</h3>
                </div>
              </div>
              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}><Phone size={24} /></div>
                <div>
                  <span className="card-eyebrow">Active Contacts</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#f59e0b' }}>{vendors.filter(v => v.phoneNumber).length}</h3>
                </div>
              </div>
            </div>

            {/* Controls Filter Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="admin-search" style={{ flex: 1, minWidth: '240px' }}>
                <Search size={18} className="admin-search-icon" />
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Search by vendor name, contact person or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="btn-primary" style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem' }} onClick={openCreate}>
                <Plus size={18} />
                <span>Add New Vendor</span>
              </button>
            </div>

            {/* Table Listing */}
            <div className="card p-7" style={{ overflowX: 'auto' }}>
              <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Vendor Directory ({filtered.length})</h2>
              
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Contact Person</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Business Address</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        {vendors.length === 0
                          ? 'No vendors registered yet. Add your first vendor supplier above.'
                          : 'No vendors match your search query.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedVendors.map(v => (
                      <tr key={v.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'rgba(214,31,44,0.1)', color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                              {v.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ID: #{v.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            <User2 size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>{v.contactPerson || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            <Mail size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>{v.email || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                            <Phone size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>{v.phoneNumber || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>—</span>}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {v.address || '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              className="admin-action-btn"
                              onClick={() => openEdit(v)}
                            >
                              <Edit3 size={14} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="admin-action-btn"
                              onClick={() => handleDelete(v.id, v.name)}
                              style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Elegant Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--borders)', paddingTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> – <strong>{Math.min(currentPage * itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> supplier vendors
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    >
                      First
                    </button>
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem' }}
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
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    >
                      Next
                    </button>
                    <button 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                      className="btn-secondary"
                      style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem' }}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card p-9" style={{ width: '100%', maxWidth: '34rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.5rem' }}>{isEditing ? 'Edit Vendor Details' : 'Add New Vendor'}</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => { setShowModal(false); resetForm(); }}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Vendor Name */}
              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Vendor / Company Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bosch Global Parts Ltd."
                  value={fName}
                  onChange={e => setFName(e.target.value)}
                  required
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Contact Person Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Smith"
                  value={fContact}
                  onChange={e => setFContact(e.target.value)}
                />
              </div>

              {/* Email + Phone — side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="vendor@example.com"
                    value={fEmail}
                    onChange={e => setFEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Enter 10-digit phone number"
                    pattern="^\d{10}$"
                    title="Phone number must be exactly 10 digits"
                    maxLength={10}
                    value={fPhone}
                    onChange={e => setFPhone(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Business Address</label>
                <textarea
                  className="form-input"
                  placeholder="Street, City, Country, ZIP"
                  value={fAddress}
                  onChange={e => setFAddress(e.target.value)}
                  style={{
                    minHeight: '80px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => { setShowModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : isEditing ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
