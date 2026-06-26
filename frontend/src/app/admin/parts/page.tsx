'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Trash2, Edit3, AlertTriangle, History, FileText, CheckCircle2, 
  DollarSign, Package, Layers, Search, ArrowLeft, Loader2, X, PlusCircle, Shield
} from 'lucide-react';
import Link from 'next/link';

interface Part {
  id: number;
  name: string;
  partNumber: string;
  description: string;
  category: string;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
}

interface InvoiceItem {
  id: number;
  partId: number;
  part?: Part;
  quantity: number;
  unitPrice: number;
}

interface PurchaseInvoice {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  items: InvoiceItem[];
}

interface Vendor {
  id: number;
  name: string;
}

export default function AdminPartsDashboard() {
  const router = useRouter();

  // Parts list state
  const [parts, setParts] = useState<Part[]>([]);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'parts' | 'invoices'>('parts');

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State for Parts (Add/Edit)
  const [showPartModal, setShowPartModal] = useState(false);
  const [isEditingPart, setIsEditingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  
  // Part Form State
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partDesc, setPartDesc] = useState('');
  const [partCategory, setPartCategory] = useState('Engine');
  const [partPrice, setPartPrice] = useState('');
  const [partStock, setPartStock] = useState('0');
  const [partMinStock, setPartMinStock] = useState('5');
  const [partModalError, setPartModalError] = useState('');
  const [partModalLoading, setPartModalLoading] = useState(false);

  // Modal State for Purchase Invoice (Stock Update)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceNumStr, setInvoiceNumStr] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{ partId: number; quantity: number; unitPrice: number }[]>([
    { partId: 0, quantity: 1, unitPrice: 0 }
  ]);
  const [invoiceModalError, setInvoiceModalError] = useState('');
  const [invoiceModalLoading, setInvoiceModalLoading] = useState(false);

  // Verify Admin Authentication
  useEffect(() => {
    const verifyAndFetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (role !== 'Admin') {
          setError('Access restricted. Admins only.');
          setLoading(false);
          return;
        }
      } catch (e) {
        router.push('/login');
        return;
      }

      await fetchAllData(token);
    };

    verifyAndFetch();
  }, [router]);

  const fetchAllData = async (token: string) => {
    try {
      setLoading(true);
      // Fetch parts
      const partsRes = await fetch('http://localhost:5215/api/parts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let partsData: Part[] = [];
      if (partsRes.ok) {
        partsData = await partsRes.json();
        setParts(partsData);
      }

      // Fetch purchase invoices
      const invoicesRes = await fetch('http://localhost:5215/api/parts/purchase-invoices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }

      // Fetch vendors
      const vendorsRes = await fetch('http://localhost:5215/api/vendors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        setVendors(vendorsData);
      }
    } catch (err) {
      setError('Connection to backend API failed.');
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Part
  const handlePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartModalError('');
    setPartModalLoading(true);

    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      name: partName,
      partNumber: partNumber,
      description: partDesc,
      category: partCategory,
      price: parseFloat(partPrice) || 0,
      stockQuantity: parseInt(partStock) || 0,
      minStockLevel: parseInt(partMinStock) || 5
    };

    try {
      const url = isEditingPart 
        ? `http://localhost:5215/api/parts/${editingPartId}`
        : 'http://localhost:5215/api/parts';
      
      const method = isEditingPart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowPartModal(false);
        resetPartForm();
        await fetchAllData(token);
      } else {
        const errMsg = await response.text();
        setPartModalError(errMsg || 'An error occurred during submission.');
      }
    } catch (err) {
      setPartModalError('Failed to connect to the server.');
    } finally {
      setPartModalLoading(false);
    }
  };

  // Open Edit Part Modal
  const openEditModal = (part: Part) => {
    setIsEditingPart(true);
    setEditingPartId(part.id);
    setPartName(part.name);
    setPartNumber(part.partNumber);
    setPartDesc(part.description || '');
    setPartCategory(part.category);
    setPartPrice(part.price.toString());
    setPartStock(part.stockQuantity.toString());
    setPartMinStock(part.minStockLevel.toString());
    setShowPartModal(true);
  };

  const resetPartForm = () => {
    setIsEditingPart(false);
    setEditingPartId(null);
    setPartName('');
    setPartNumber('');
    setPartDesc('');
    setPartCategory('Engine');
    setPartPrice('');
    setPartStock('0');
    setPartMinStock('5');
    setPartModalError('');
  };

  // Delete Part
  const handleDeletePart = async (partId: number) => {
    if (!confirm('Are you sure you want to delete this part? This cannot be undone.')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:5215/api/parts/${partId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchAllData(token);
      } else {
        const errMsg = await response.text();
        alert(errMsg || 'Failed to delete the part.');
      }
    } catch (err) {
      alert('Error connecting to backend.');
    }
  };

  // Add Item Line inside Invoice Creator
  const addInvoiceItemLine = () => {
    setInvoiceItems([...invoiceItems, { partId: 0, quantity: 1, unitPrice: 0 }]);
  };

  // Remove Item Line inside Invoice Creator
  const removeInvoiceItemLine = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  // Update Invoice Item Values dynamically
  const updateInvoiceItem = (index: number, field: 'partId' | 'quantity' | 'unitPrice', value: number) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;
    setInvoiceItems(updated);
  };

  // Calculate Invoice total dynamically
  const calculateInvoiceTotal = () => {
    return invoiceItems.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
  };

  // Submit Purchase Invoice
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceModalError('');

    // Validations
    if (!invoiceNumStr.trim()) {
      setInvoiceModalError('Invoice number is required.');
      return;
    }
    if (!supplierName.trim()) {
      setInvoiceModalError('Supplier name is required.');
      return;
    }
    if (invoiceItems.some(i => i.partId === 0)) {
      setInvoiceModalError('Please select a valid vehicle part for all item lines.');
      return;
    }
    if (invoiceItems.some(i => i.quantity <= 0 || i.unitPrice <= 0)) {
      setInvoiceModalError('Quantity and Unit Price must be greater than zero.');
      return;
    }

    setInvoiceModalLoading(true);
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      invoiceNumber: invoiceNumStr,
      supplierName,
      purchaseDate: new Date().toISOString(),
      items: invoiceItems.map(i => ({
        partId: i.partId,
        quantity: i.quantity,
        unitPrice: i.unitPrice
      }))
    };

    try {
      const response = await fetch('http://localhost:5215/api/parts/purchase-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setShowInvoiceModal(false);
        resetInvoiceForm();
        await fetchAllData(token);
      } else {
        const errMsg = await response.text();
        setInvoiceModalError(errMsg || 'Failed to submit purchase invoice.');
      }
    } catch (err) {
      setInvoiceModalError('Network error connecting to backend.');
    } finally {
      setInvoiceModalLoading(false);
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceNumStr('');
    setSupplierName('');
    setInvoiceItems([{ partId: 0, quantity: 1, unitPrice: 0 }]);
    setInvoiceModalError('');
  };

  // Category list
  const categories = ['Engine', 'Brakes', 'Suspension', 'Electrical', 'Transmission', 'Body & Trim', 'Accessories'];

  // Reset page number on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter]);

  // Filtering Parts
  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'All' ? true : part.category === categoryFilter;
    
    const matchesStock = 
      stockFilter === 'All' ? true :
      stockFilter === 'Out' ? part.stockQuantity === 0 :
      stockFilter === 'Low' ? part.stockQuantity > 0 && part.stockQuantity <= part.minStockLevel :
      part.stockQuantity > part.minStockLevel;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Pagination parameters for parts catalog
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);
  const paginatedParts = filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="admin-page">
      {/* Top Banner */}
      <header className="page-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem', textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </Link>
            <h1 className="page-header-title">Inventory Control</h1>
            <p className="page-header-text">Manage catalog details, track stock alerts, and record replenishment orders.</p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', backgroundColor: 'var(--secondary-bg)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--borders)' }}>
            <Link href="/admin/users" style={{ color: 'var(--text-secondary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>Users</Link>
            <span style={{ color: 'var(--borders)' }}>|</span>
            <Link href="/admin/parts" style={{ color: 'var(--primary-accent)', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem' }}>Parts</Link>
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

      {/* Main Container */}
      <main>
        {error ? (
          <div className="card empty-state" style={{ maxWidth: '480px', margin: '4rem auto' }}>
            <div className="empty-state-icon"><X size={40} style={{ color: 'var(--primary-accent)' }} /></div>
            <h2 className="empty-state-title">Access Restriction</h2>
            <p className="empty-state-text" style={{ marginBottom: '1.5rem' }}>{error}</p>
            <Link href="/login" className="btn-primary">Go to Login</Link>
          </div>
        ) : loading ? (
          <div className="card empty-state" style={{ minHeight: '300px' }}>
            <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
            <p className="card-eyebrow">Retrieving Parts Catalog and Invoices...</p>
          </div>
        ) : (
          <>
            {/* Quick Action Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button 
                onClick={() => setActiveTab('parts')}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: '1px solid var(--borders)',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'parts' ? 'var(--primary-accent)' : 'var(--secondary-bg)',
                  color: '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Package size={18} />
                  <span>Parts Catalog ({parts.length})</span>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('invoices')}
                style={{
                  padding: '0.8rem 2rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  border: '1px solid var(--borders)',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'invoices' ? 'var(--primary-accent)' : 'var(--secondary-bg)',
                  color: '#fff',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <History size={18} />
                  <span>Purchase Invoices ({invoices.length})</span>
                </div>
              </button>
            </div>

            {activeTab === 'parts' ? (
              <>
                {/* Control Panel */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', flex: 1, minWidth: '280px' }}>
                    <div className="admin-search" style={{ flex: 1, minWidth: '240px' }}>
                      <Search size={18} className="admin-search-icon" />
                      <input 
                        type="text" 
                        className="admin-search-input"
                        placeholder="Search by part name or part number..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select className="form-select" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>

                      <select className="form-select" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem' }} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                        <option value="All">All Stock Levels</option>
                        <option value="In">In Stock</option>
                        <option value="Low">Low Stock Warning</option>
                        <option value="Out">Out of Stock</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem', backgroundColor: '#22c55e' }}
                      onClick={() => { resetInvoiceForm(); setShowInvoiceModal(true); }}
                    >
                      <PlusCircle size={18} />
                      <span>Purchase Stock</span>
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '0.85rem 1.5rem', borderRadius: '0.75rem' }}
                      onClick={() => { resetPartForm(); setShowPartModal(true); }}
                    >
                      <Plus size={18} />
                      <span>New Part Definition</span>
                    </button>
                  </div>
                </div>

                {/* Catalog Listing */}
                <div className="card p-7" style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Part Information</th>
                        <th>Part Number</th>
                        <th>Category</th>
                        <th>Unit Retail Price</th>
                        <th>Stock Level</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParts.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            No vehicle parts registered matching your current selection.
                          </td>
                        </tr>
                      ) : (
                        paginatedParts.map(part => {
                          const isOutOfStock = part.stockQuantity === 0;
                          const isLowStock = part.stockQuantity > 0 && part.stockQuantity <= part.minStockLevel;

                          return (
                            <tr key={part.id}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--secondary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid var(--borders)' }}>
                                    {part.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{part.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{part.description || 'No description added.'}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                  {part.partNumber}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{part.category}</span>
                              </td>
                              <td>
                                <strong style={{ color: '#22c55e', fontSize: '0.95rem' }}>
                                  ${part.price.toFixed(2)}
                                </strong>
                              </td>
                              <td>
                                {isOutOfStock ? (
                                  <span className="admin-badge admin-badge-inactive">Out of Stock</span>
                                ) : isLowStock ? (
                                  <span className="admin-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                                    Low Stock ({part.stockQuantity})
                                  </span>
                                ) : (
                                  <span className="admin-badge admin-badge-active">In Stock ({part.stockQuantity})</span>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                  <button 
                                    className="admin-action-btn"
                                    onClick={() => openEditModal(part)}
                                  >
                                    <Edit3 size={14} />
                                    <span>Edit</span>
                                  </button>
                                  <button 
                                    className="admin-action-btn"
                                    onClick={() => handleDeletePart(part.id)}
                                    style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Elegant Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--borders)', paddingTop: '1.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> – <strong>{Math.min(currentPage * itemsPerPage, filteredParts.length)}</strong> of <strong>{filteredParts.length}</strong> catalog items
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
            ) : (
              /* Invoices Tab View */
              <div>
                <h2 style={{ fontFamily: 'var(--font-oswald, sans-serif)', fontSize: '1.25rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Purchase Invoice Replenishment History</h2>
                {invoices.length === 0 ? (
                  <div className="card empty-state" style={{ padding: '4rem 1rem' }}>
                    <p className="empty-state-text">No purchase invoices registered yet. Update your parts stock level by recording a purchase.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {invoices.map(invoice => (
                      <div 
                        key={invoice.id} 
                        className="card p-7"
                        style={{ border: '1px solid var(--borders)' }}
                      >
                        {/* Invoice Header details */}
                        <div 
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--borders)',
                            paddingBottom: '1rem',
                            marginBottom: '1rem',
                            flexWrap: 'wrap',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <FileText size={18} style={{ color: 'var(--primary-accent)' }} />
                              <strong style={{ fontSize: '1.1rem', color: '#fff' }}>
                                Invoice #{invoice.invoiceNumber}
                              </strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                              Supplier: <span style={{ color: '#fff', fontWeight: 600 }}>{invoice.supplierName}</span> | Date: {new Date(invoice.purchaseDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TOTAL REPLENISHMENT AMOUNT</div>
                            <strong style={{ fontSize: '1.3rem', color: '#22c55e' }}>
                              ${invoice.totalAmount.toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* Invoice Line items */}
                        <div style={{ overflowX: 'auto' }}>
                          <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th>Part Name</th>
                                <th>Part Number</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items.map(item => (
                                <tr key={item.id}>
                                  <td>{item.part?.name || 'Unknown Part'}</td>
                                  <td style={{ fontFamily: 'monospace' }}>{item.part?.partNumber || 'N/A'}</td>
                                  <td style={{ fontWeight: 'bold' }}>{item.quantity} units</td>
                                  <td style={{ color: '#22c55e' }}>${item.unitPrice.toFixed(2)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                    ${(item.quantity * item.unitPrice).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Part Definition Add/Edit Modal */}
      {showPartModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card p-9" style={{ width: '100%', maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.25rem' }}>{isEditingPart ? 'Edit Part Definition' : 'Define New Part'}</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowPartModal(false)}>&times;</button>
            </div>
            
            {partModalError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {partModalError}
              </div>
            )}

            <form onSubmit={handlePartSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Part Display Name</label>
                <input 
                  className="form-input"
                  type="text" 
                  placeholder="e.g. Performance Carbon Ceramic Brake Pads" 
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Unique Part Number (SKU)</label>
                <input 
                  className="form-input"
                  type="text" 
                  placeholder="e.g. BRK-CER-0092" 
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  required 
                />
              </div>

              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Inventory Category</label>
                <select 
                  className="form-select"
                  value={partCategory} 
                  onChange={(e) => setPartCategory(e.target.value)}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                <textarea 
                  className="form-input"
                  placeholder="Enter compatible models or specs..." 
                  value={partDesc}
                  onChange={(e) => setPartDesc(e.target.value)}
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Retail Price ($)</label>
                  <input 
                    className="form-input"
                    type="number" 
                    step="0.01"
                    placeholder="99.99" 
                    value={partPrice}
                    onChange={(e) => setPartPrice(e.target.value)}
                    required 
                  />
                </div>

                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Min Stock Limit</label>
                  <input 
                    className="form-input"
                    type="number" 
                    placeholder="5" 
                    value={partMinStock}
                    onChange={(e) => setPartMinStock(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {!isEditingPart && (
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Initial Stock Quantity</label>
                  <input 
                    className="form-input"
                    type="number" 
                    placeholder="0" 
                    value={partStock}
                    onChange={(e) => setPartStock(e.target.value)}
                    required 
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setShowPartModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem' }} disabled={partModalLoading}>
                  {partModalLoading ? 'Saving...' : isEditingPart ? 'Update Definition' : 'Define Part'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Purchase Invoice Modal */}
      {showInvoiceModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="card p-9" style={{ width: '100%', maxWidth: '38rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Record Purchase Invoice</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => setShowInvoiceModal(false)}>&times;</button>
            </div>
            
            {invoiceModalError && (
              <div style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                {invoiceModalError}
              </div>
            )}

            <form onSubmit={handleInvoiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Invoice Number</label>
                  <input 
                    className="form-input"
                    type="text" 
                    placeholder="e.g. INV-9908" 
                    value={invoiceNumStr}
                    onChange={(e) => setInvoiceNumStr(e.target.value)}
                    required 
                  />
                </div>

                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Supplier / Vendor Name</label>
                  <select 
                    className="form-select"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    required 
                  >
                    <option value="" disabled>Select a Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Purchase items list */}
              <div style={{ borderTop: '1px solid var(--borders)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label className="card-eyebrow" style={{ margin: 0 }}>Replenishment Lines</label>
                  <button 
                    type="button" 
                    onClick={addInvoiceItemLine}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-accent)',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer'
                    }}
                  >
                    <PlusCircle size={14} /> Add Line Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '0.3rem' }}>
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr auto', gap: '0.6rem', alignItems: 'center', width: '100%' }}>
                      <select
                        value={item.partId}
                        onChange={(e) => updateInvoiceItem(idx, 'partId', parseInt(e.target.value))}
                        style={{
                          backgroundColor: 'var(--main-bg)',
                          border: '1px solid var(--borders)',
                          borderRadius: '0.5rem',
                          padding: '0.6rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          width: '100%',
                          maxWidth: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value={0}>Select Part...</option>
                        {parts.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.partNumber})</option>
                        ))}
                      </select>

                      <input 
                        type="number" 
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        style={{
                          backgroundColor: 'var(--main-bg)',
                          border: '1px solid var(--borders)',
                          borderRadius: '0.5rem',
                          padding: '0.6rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          width: '100%',
                          maxWidth: '100%',
                          boxSizing: 'border-box'
                        }}
                        required
                      />

                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="Cost $"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateInvoiceItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        style={{
                          backgroundColor: 'var(--main-bg)',
                          border: '1px solid var(--borders)',
                          borderRadius: '0.5rem',
                          padding: '0.6rem',
                          color: '#fff',
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          width: '100%',
                          maxWidth: '100%',
                          boxSizing: 'border-box'
                        }}
                        required
                      />

                      <button 
                        type="button" 
                        onClick={() => removeInvoiceItemLine(idx)}
                        disabled={invoiceItems.length === 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          opacity: invoiceItems.length === 1 ? 0.3 : 1
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total calculations */}
              <div 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--borders)',
                  marginTop: '0.5rem'
                }}
              >
                <span className="card-eyebrow" style={{ fontWeight: 'bold' }}>
                  TOTAL PURCHASE AMOUNT
                </span>
                <strong style={{ fontSize: '1.4rem', color: '#22c55e' }}>
                  ${calculateInvoiceTotal().toFixed(2)}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1, padding: '0.85rem' }} onClick={() => setShowInvoiceModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.85rem', backgroundColor: '#22c55e' }} disabled={invoiceModalLoading}>
                  {invoiceModalLoading ? 'Processing...' : 'Complete Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
