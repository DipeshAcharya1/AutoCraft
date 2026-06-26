'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Shield, TrendingUp,
  AlertTriangle, DollarSign, FileText, Calendar, X
} from 'lucide-react';
import Link from 'next/link';

const API = 'http://localhost:5215';

interface ReportItem {
  date?: string;
  month?: number;
  monthName?: string;
  year?: number;
  revenue: number;
  discount: number;
  count: number;
}

export default function AdminFinancialReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportData, setReportData] = useState<ReportItem[]>([]);

  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (role !== 'Admin') {
        setError('Administrator access only.');
        setLoading(false);
        return;
      }
    } catch {
      router.push('/login');
      return;
    }
    loadFinancialReport();
  }, [router, period, selectedYear, selectedMonth]);

  const loadFinancialReport = async () => {
    setLoading(true);
    try {
      const h = { headers: { Authorization: `Bearer ${getToken()}` } };
      let url = `${API}/api/sales/reports/financial?period=${period}`;
      if (period === 'daily') {
        url += `&year=${selectedYear}&month=${selectedMonth}`;
      } else if (period === 'monthly') {
        url += `&year=${selectedYear}`;
      }
      
      const res = await fetch(url, h);
      if (res.ok) {
        const json = await res.json();
        setReportData(json.data || []);
      } else {
        const txt = await res.text();
        setError(txt || 'Failed to fetch financial reports.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading reports.');
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const totalGrossRevenue = reportData.reduce((sum, item) => sum + item.revenue + item.discount, 0);
  const totalDiscounts = reportData.reduce((sum, item) => sum + item.discount, 0);
  const totalNetRevenue = reportData.reduce((sum, item) => sum + item.revenue, 0);
  const totalSalesCount = reportData.reduce((sum, item) => sum + item.count, 0);

  const monthsList = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const yearsList = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const downloadPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;
    
    const doc = new jsPDF();
    doc.text(`Financial Report (${period})`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    doc.text(`Gross Turnover: $${totalGrossRevenue.toFixed(2)}`, 14, 38);
    doc.text(`Loyalty Deducted: $${totalDiscounts.toFixed(2)}`, 14, 44);
    doc.text(`Net Revenue: $${totalNetRevenue.toFixed(2)}`, 14, 50);
    doc.text(`Total Slips: ${totalSalesCount}`, 14, 56);

    const tableColumn = ["Period", "Invoices Settled", "Gross Revenue", "Loyalty Discount", "Net Revenue"];
    const tableRows: any[] = [];

    reportData.forEach(item => {
      let label = '';
      if (period === 'daily') label = item.date || '';
      else if (period === 'monthly') label = item.monthName || `Month ${item.month}`;
      else if (period === 'yearly') label = item.year?.toString() || '';

      tableRows.push([
        label, 
        `${item.count} tickets`, 
        `$${(item.revenue + item.discount).toFixed(2)}`, 
        `-$${item.discount.toFixed(2)}`, 
        `$${item.revenue.toFixed(2)}`
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
    });

    doc.save(`financial-report-${period}-${Date.now()}.pdf`);
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
            <h1 className="page-header-title">Financial Intelligence</h1>
            <p className="page-header-text">Analyze gross turnover, deduct client loyalty perks, and download net income sheets.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--borders)' }}>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
              Users
            </Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/parts" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
              Parts & Invoices
            </Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/vendors" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
              Vendors
            </Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/reports" style={{ color: 'var(--primary-accent)', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>
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
            <h2 className="empty-state-title">Access Denied</h2>
            <p className="empty-state-text" style={{ marginBottom: '1.5rem' }}>{error}</p>
            <Link href="/login" className="btn-primary" style={{ padding: '0.75rem 1.5rem', textDecoration: 'none' }}>Go to Login</Link>
          </div>
        ) : (
          <>
            {/* Header / Report Filter controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['daily', 'monthly', 'yearly'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={period === p ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '0.75rem',
                      fontSize: '0.85rem',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p} Report
                  </button>
                ))}
                
                <button
                  onClick={downloadPDF}
                  className="btn-secondary"
                  style={{
                    padding: '0.6rem 1.2rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    color: '#22c55e',
                    border: '1px solid rgba(34,197,94,0.3)',
                    fontWeight: 700
                  }}
                >
                  <FileText size={16} /> Download PDF
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                {period !== 'yearly' && (
                  <select
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: 600
                    }}
                  >
                    {yearsList.map(y => (
                      <option key={y} value={y}>{y} Year</option>
                    ))}
                  </select>
                )}

                {period === 'daily' && (
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      fontWeight: 600
                    }}
                  >
                    {monthsList.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {loading ? (
              <div className="card empty-state" style={{ minHeight: '300px' }}>
                <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
                <p className="card-eyebrow">Generating financial statements...</p>
              </div>
            ) : (
              <>
                {/* Stats Dashboard Grid */}
                <div className="grid-stats" style={{ marginBottom: '2.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap" style={{ color: 'var(--text-primary)', backgroundColor: 'rgba(255,255,255,0.05)' }}><DollarSign size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Gross Turn-Over</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>${totalGrossRevenue.toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}><Calendar size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Loyalty Deducted</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#ef4444' }}>${totalDiscounts.toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap" style={{ color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}><DollarSign size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Net Revenue</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem', color: '#22c55e' }}>${totalNetRevenue.toFixed(2)}</h3>
                    </div>
                  </div>

                  <div className="card p-7" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div className="stat-card-icon-wrap"><FileText size={24} /></div>
                    <div>
                      <span className="card-eyebrow">Total Slips</span>
                      <h3 className="card-title" style={{ fontSize: '1.75rem', marginTop: '0.25rem' }}>{totalSalesCount}</h3>
                    </div>
                  </div>
                </div>

                {/* Financial Table card */}
                <div className="card p-7">
                  <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Financial Summary Details</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Period / Timeframe</th>
                          <th style={{ textAlign: 'right' }}>Invoices Settled</th>
                          <th style={{ textAlign: 'right' }}>Gross Revenue</th>
                          <th style={{ textAlign: 'right' }}>Loyalty Discount</th>
                          <th style={{ textAlign: 'right' }}>Net Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                              No financial records found for the selected parameters.
                            </td>
                          </tr>
                        ) : (
                          reportData.map((item, idx) => {
                            let label = '';
                            if (period === 'daily') {
                              label = item.date || '';
                            } else if (period === 'monthly') {
                              label = item.monthName || `Month ${item.month}`;
                            } else if (period === 'yearly') {
                              label = item.year?.toString() || '';
                            }

                            return (
                              <tr key={idx}>
                                <td>
                                  <strong style={{ fontSize: '0.9rem', color: 'var(--primary-accent)' }}>{label}</strong>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.count} tickets</td>
                                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                                  ${(item.revenue + item.discount).toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                                  -${item.discount.toFixed(2)}
                                </td>
                                <td style={{ textAlign: 'right', color: '#22c55e', fontWeight: 900, fontSize: '0.95rem' }}>
                                  ${item.revenue.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
