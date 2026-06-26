'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, TrendingUp, Users,
  AlertTriangle, Star, DollarSign, FileText, X
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 10;
const API = 'http://localhost:5215';

interface Regular { customerId: number; customerName: string; customerEmail: string; customerPhone: string; invoiceCount: number; totalSpent: number; }
interface Spender extends Regular { }
interface PendingCredit {
  id: number; invoiceNumber: string; saleDate: string; totalAmount: number; status: string;
  customer: { username: string; email: string; phoneNumber: string };
  vehicle?: { vehicleNumber: string; make: string; model: string };
}
interface Summary { totalRevenue: number; paidAmount: number; pendingAmount: number; invoiceCount: number; }

export default function StaffReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'summary' | 'regulars' | 'spenders' | 'pending'>('summary');

  const [summary, setSummary] = useState<Summary | null>(null);
  const [regulars, setRegulars] = useState<Regular[]>([]);
  const [spenders, setSpenders] = useState<Spender[]>([]);
  const [pending, setPending] = useState<PendingCredit[]>([]);

  const [regularPage, setRegularPage] = useState(1);
  const [spenderPage, setSpenderPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const p = JSON.parse(atob(token.split('.')[1]));
      const role = p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin' && role !== 'Staff') { setError('Staff/Admin only.'); setLoading(false); return; }
    } catch { router.push('/login'); return; }
    loadReports();
  }, [router]);

  const loadReports = async () => {
    setLoading(true);
    const h = { headers: { Authorization: `Bearer ${getToken()}` } };
    try {
      const [sumRes, regRes, spdRes, penRes] = await Promise.all([
        fetch(`${API}/api/sales/reports/summary`, h),
        fetch(`${API}/api/sales/reports/regulars`, h),
        fetch(`${API}/api/sales/reports/high-spenders`, h),
        fetch(`${API}/api/sales/reports/pending-credits`, h),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (regRes.ok) setRegulars(await regRes.json());
      if (spdRes.ok) setSpenders(await spdRes.json());
      if (penRes.ok) setPending(await penRes.json());
    } catch {
      setError('Cannot reach backend. Is the server online?');
    } finally {
      setLoading(false);
    }
  };

  const pagedRegulars = useMemo(() => regulars.slice((regularPage - 1) * PAGE_SIZE, regularPage * PAGE_SIZE), [regulars, regularPage]);
  const pagedSpenders = useMemo(() => spenders.slice((spenderPage - 1) * PAGE_SIZE, spenderPage * PAGE_SIZE), [spenders, spenderPage]);
  const pagedPending = useMemo(() => pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE), [pending, pendingPage]);

  const tabs = [
    { key: 'summary', label: 'Revenue Summary', icon: <TrendingUp size={16} /> },
    { key: 'regulars', label: `Regular Customers (${regulars.length})`, icon: <Star size={16} /> },
    { key: 'spenders', label: `Top Spenders (${spenders.length})`, icon: <DollarSign size={16} /> },
    { key: 'pending', label: `Pending Credits (${pending.length})`, icon: <AlertTriangle size={16} /> },
  ] as const;

  return (
    <div className="admin-page">
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </Link>
            <h1 className="page-header-title">Analytical Reports</h1>
            <p className="page-header-text">Monitor shop performance, track loyal drivers, and audit pending credit accounts.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--borders)' }}>
            <Link href="/staff/customers" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Customers</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/staff/sales" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Sales & Invoices</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/staff/reports" style={{ color: 'var(--primary-accent)', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>Reports</Link>
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
            <p className="card-eyebrow">Compiling shop analytics...</p>
          </div>
        ) : (
          <>
            {/* Tab selection bar */}
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {tabs.map(t => (
                <button 
                  key={t.key} 
                  onClick={() => setActiveTab(t.key)}
                  className={activeTab === t.key ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.85rem',
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* SUMMARY TAB */}
            {activeTab === 'summary' && summary && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap" style={{ color: 'var(--primary-accent)', backgroundColor: 'rgba(214, 31, 44, 0.1)' }}><DollarSign size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Total Revenue</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>${summary.totalRevenue.toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}><DollarSign size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Collected Revenue</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#22c55e' }}>${summary.paidAmount.toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}><AlertTriangle size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Pending Collection</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#ef4444' }}>${summary.pendingAmount.toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap"><FileText size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Invoices Count</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{summary.invoiceCount}</h3>
                    </div>
                  </div>
                </div>

                <div className="card p-7">
                  <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Core Metrics Breakdown</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                      { label: 'Revenue Collection Rate', value: summary.totalRevenue > 0 ? ((summary.paidAmount / summary.totalRevenue) * 100).toFixed(1) + '%' : '0%', color: '#22c55e' },
                      { label: 'Average Ticket Value', value: summary.invoiceCount > 0 ? '$' + (summary.totalRevenue / summary.invoiceCount).toFixed(2) : '$0', color: '#60a5fa' },
                      { label: 'Outstanding Receivables Ratio', value: summary.totalRevenue > 0 ? ((summary.pendingAmount / summary.totalRevenue) * 100).toFixed(1) + '%' : '0%', color: '#f59e0b' },
                    ].map(m => (
                      <div key={m.label} style={{ background: 'var(--secondary-bg)', border: '1px solid var(--borders)', borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '2.25rem', fontWeight: 900, color: m.color }}>{m.value}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* REGULARS TAB */}
            {activeTab === 'regulars' && (
              <div className="card p-7">
                <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                  Regular Drivers <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '0.85rem' }}>(3+ purchases logged)</span>
                </h2>
                
                {regulars.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No regular customers yet — requires 3+ sales invoices per customer.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Client Name</th>
                          <th>Email Address</th>
                          <th>Phone Number</th>
                          <th>Invoices Settled</th>
                          <th style={{ textAlign: 'right' }}>Total Investment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedRegulars.map(r => (
                          <tr key={r.customerId}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'rgba(214,31,44,0.1)', color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                                  {r.customerName.substring(0, 2).toUpperCase()}
                                </div>
                                <span style={{ fontWeight: 700 }}>{r.customerName}</span>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.customerEmail}</td>
                            <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.customerPhone}</td>
                            <td><span className="admin-badge admin-badge-active" style={{ fontSize: '0.75rem' }}>{r.invoiceCount} invoices</span></td>
                            <td style={{ textAlign: 'right' }}><strong style={{ color: '#22c55e' }}>${r.totalSpent.toFixed(2)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div style={{ marginTop: '1.5rem' }}>
                      <Pagination currentPage={regularPage} totalPages={Math.ceil(regulars.length / PAGE_SIZE)} onPageChange={setRegularPage} pageSize={PAGE_SIZE} totalItems={regulars.length} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* HIGH SPENDERS TAB */}
            {activeTab === 'spenders' && (
              <div className="card p-7">
                <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Top 20 High Spenders</h2>
                
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Global Rank</th>
                        <th>Client Name</th>
                        <th>Email Address</th>
                        <th>Total Orders</th>
                        <th style={{ textAlign: 'right' }}>Total Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedSpenders.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            No high spender accounts recorded yet.
                          </td>
                        </tr>
                      ) : pagedSpenders.map((s, i) => (
                        <tr key={s.customerId}>
                          <td>
                            <span style={{ 
                              fontWeight: 900, 
                              fontSize: '1.1rem', 
                              color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--text-secondary)' 
                            }}>
                              #{(spenderPage - 1) * PAGE_SIZE + i + 1}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                                {s.customerName.substring(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 700 }}>{s.customerName}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{s.customerEmail}</td>
                          <td><span className="admin-badge admin-badge-pending" style={{ fontSize: '0.75rem' }}>{s.invoiceCount} purchases</span></td>
                          <td style={{ textAlign: 'right' }}><strong style={{ color: '#22c55e', fontSize: '1rem' }}>${s.totalSpent.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div style={{ marginTop: '1.5rem' }}>
                    <Pagination currentPage={spenderPage} totalPages={Math.ceil(spenders.length / PAGE_SIZE)} onPageChange={setSpenderPage} pageSize={PAGE_SIZE} totalItems={spenders.length} />
                  </div>
                </div>
              </div>
            )}

            {/* PENDING CREDITS TAB */}
            {activeTab === 'pending' && (
              <div className="card p-7">
                <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Pending / Unpaid Credits</h2>
                
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Invoice Number</th>
                        <th>Client / Owner</th>
                        <th>Associated Vehicle</th>
                        <th>Sale Date</th>
                        <th>Receivables Status</th>
                        <th style={{ textAlign: 'right' }}>Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedPending.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#22c55e', fontWeight: 600 }}>
                            ✓ Perfect Shop Balance. All client invoices have been fully settled!
                          </td>
                        </tr>
                      ) : pagedPending.map(p => (
                        <tr key={p.id}>
                          <td><strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{p.invoiceNumber}</strong></td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700 }}>{p.customer.username}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.customer.phoneNumber}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {p.vehicle ? `${p.vehicle.vehicleNumber} – ${p.vehicle.make}` : '—'}
                          </td>
                          <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(p.saleDate).toLocaleDateString()}</td>
                          <td>
                            <span className={`admin-badge ${p.status === 'Pending' ? 'admin-badge-pending' : 'admin-badge-inactive'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}><strong style={{ color: '#ef4444' }}>${p.totalAmount.toFixed(2)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div style={{ marginTop: '1.5rem' }}>
                    <Pagination currentPage={pendingPage} totalPages={Math.ceil(pending.length / PAGE_SIZE)} onPageChange={setPendingPage} pageSize={PAGE_SIZE} totalItems={pending.length} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
