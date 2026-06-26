'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, UserPlus, Power, Shield, Mail, Phone, Lock, 
  User, Search, Plus, CheckCircle, XCircle, Loader2, ArrowLeft, KeyRound
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

interface UserItem {
  id: number;
  username: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

export default function AdminUsersDashboard() {
  const router = useRouter();
  
  // State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Create Staff Modal State
  const [showModal, setShowModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');

  // Authentication check & Fetch Users
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Simple JWT parse
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (role !== 'Admin') {
          setError('Unauthorized. Only Admins can access this panel.');
          setLoading(false);
          return;
        }
      } catch (e) {
        router.push('/login');
        return;
      }

      await fetchUsers(token);
    };

    checkAuthAndFetch();
  }, [router]);

  const fetchUsers = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5215/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Failed to retrieve users. Please re-login.');
      }
    } catch (err) {
      setError('Connection to backend failed. Please ensure the server is active.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle User Active Status
  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(userId);
    try {
      const response = await fetch(`http://localhost:5215/api/admin/users/${userId}/toggle-active`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      alert('Error updating user status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Create Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    setModalLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setModalError('Session expired. Please log in.');
      setModalLoading(false);
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/;
    if (!passwordRegex.test(staffPassword)) {
      setModalError('Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.');
      setModalLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5215/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          phoneNumber: staffPhone,
          password: staffPassword
        })
      });

      if (response.ok) {
        setModalSuccess('Staff member created successfully!');
        setStaffName('');
        setStaffEmail('');
        setStaffPhone('');
        setStaffPassword('');
        
        await fetchUsers(token);
        
        setTimeout(() => {
          setShowModal(false);
          setModalSuccess('');
        }, 1500);
      } else {
        const errText = await response.text();
        setModalError(errText || 'Failed to create staff member.');
      }
    } catch (err) {
      setModalError('Network error. Failed to create staff member.');
    } finally {
      setModalLoading(false);
    }
  };

  // Stats Counters
  const totalCustomers = users.filter(u => u.role === 'Customer').length;
  const totalStaff = users.filter(u => u.role === 'Staff').length;
  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phoneNumber.includes(searchQuery);
    const matchesRole = roleFilter === 'All' ? true : user.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'All' ? true : 
      statusFilter === 'Active' ? user.isActive : !user.isActive;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);

  return (
    <div className="admin-page">
      {/* Top Banner Navigation */}
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </Link>
            <h1 className="page-header-title">User Directory</h1>
            <p className="page-header-text">Manage employee access privileges and customer portal accounts.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--borders)' }}>
            <Link href="/admin/users" style={{ color: 'var(--primary-accent)', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>Users</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/parts" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Parts</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/vendors" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Vendors</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/reports" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Financials</Link>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--primary-accent)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <Shield size={18} />
            <span>Admin Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main>
        {error ? (
          <div className="card empty-state" style={{ maxWidth: '480px', margin: '4rem auto' }}>
            <div className="empty-state-icon"><XCircle size={40} /></div>
            <h2 className="empty-state-title">Access Restriction</h2>
            <p className="empty-state-text" style={{ marginBottom: '1.5rem' }}>{error}</p>
            <Link href="/login" className="btn-primary">Go to Login</Link>
          </div>
        ) : loading ? (
          <div className="card empty-state" style={{ minHeight: '300px' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
            <p className="card-eyebrow">Loading User Directory...</p>
          </div>
        ) : (
          <>
            {/* Stats Dashboard Grid */}
            <div className="grid-stats" style={{ marginBottom: '2.5rem' }}>
              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap"><Users size={24} /></div>
                <div>
                  <span className="card-eyebrow">Customers</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{totalCustomers}</h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap"><Shield size={24} /></div>
                <div>
                  <span className="card-eyebrow">Staff Members</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{totalStaff}</h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap"><CheckCircle size={24} /></div>
                <div>
                  <span className="card-eyebrow">Active Accounts</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{activeCount}</h3>
                </div>
              </div>

              <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="stat-card-icon-wrap" style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><XCircle size={24} /></div>
                <div>
                  <span className="card-eyebrow">Inactive Accounts</span>
                  <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{inactiveCount}</h3>
                </div>
              </div>
            </div>

            {/* User Control & Search Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1, minWidth: '280px' }}>
                <div className="admin-search" style={{ flex: 1, minWidth: '240px' }}>
                  <Search size={18} className="admin-search-icon" />
                  <input 
                    type="text" 
                    className="admin-search-input"
                    placeholder="Search by name, email, or phone..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select className="form-select" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                    <option value="All">All Roles</option>
                    <option value="Customer">Customers</option>
                    <option value="Staff">Staff</option>
                  </select>

                  <select className="form-select" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <button className="btn-primary" style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem' }} onClick={() => setShowModal(true)}>
                <UserPlus size={18} />
                <span>Create Staff Account</span>
              </button>
            </div>

            {/* Users Listing Table */}
            <div className="card p-7" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Info</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>System Role</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No registered users found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid var(--borders)' }}>
                              {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.username}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: #{user.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={14} style={{ color: 'var(--primary-accent)' }} />
                            <span>{user.phoneNumber || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-badge admin-badge-${user.role.toLowerCase()}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`admin-badge ${user.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="admin-action-btn"
                            onClick={() => handleToggleActive(user.id, user.isActive)}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <>
                                <Power size={14} />
                                <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              <div style={{ marginTop: '1.5rem' }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={p => setPage(p)}
                  pageSize={PAGE_SIZE}
                  totalItems={filteredUsers.length}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create Staff Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card p-9" style={{ width: '100%', maxWidth: '28rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Create Staff</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowModal(false)}>&times;</button>
            </div>
            
            {modalError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div style={{ color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(34,197,94,0.2)' }}>
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleCreateStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Staff Full Name</label>
                <input 
                  className="form-input"
                  type="text" 
                  placeholder="Enter full name" 
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                <input 
                  className="form-input"
                  type="email" 
                  placeholder="Enter email address" 
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  required 
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
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value.replace(/\D/g, ''))}
                  required 
                />
              </div>

              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Secure Password</label>
                <input 
                  className="form-input"
                  type="password" 
                  placeholder="Create secure password" 
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} disabled={modalLoading}>
                  {modalLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
