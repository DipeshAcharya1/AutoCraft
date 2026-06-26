'use client';
import React, { useState, useEffect } from 'react';
import { Car, Plus, Loader2, Edit2, Trash2, X, Save, AlertCircle } from 'lucide-react';

interface Vehicle {
  id: number;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  notes: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    notes: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5215/api/customer-portal/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setVehicles(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    const token = localStorage.getItem('token');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
      ? `http://localhost:5215/api/customer-portal/vehicles/${editingId}` 
      : 'http://localhost:5215/api/customer-portal/vehicles';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await fetchVehicles();
        setShowModal(false);
        setEditingId(null);
        setFormData({ vehicleNumber: '', make: '', model: '', year: new Date().getFullYear(), color: '', notes: '' });
      } else {
        setError('Error saving vehicle.');
      }
    } catch (err) {
      setError('Connection failure.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this vehicle?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5215/api/customer-portal/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setVehicles(prev => prev.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setFormData({
      vehicleNumber: v.vehicleNumber,
      make: v.make,
      model: v.model,
      year: v.year,
      color: v.color,
      notes: v.notes || ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
            <h1 className="page-header-title">MY GARAGE</h1>
            <p className="page-header-text">Manage your registered vehicles for quick servicing.</p>
        </div>
        <button className="btn-primary" 
          onClick={() => {
            setEditingId(null);
            setFormData({ vehicleNumber: '', make: '', model: '', year: new Date().getFullYear(), color: '', notes: '' });
            setShowModal(true);
          }}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={20} /> ADD VEHICLE
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(214,31,44,0.1)', color: 'var(--primary-accent)', padding: '1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="card empty-state">
          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
          <p className="card-eyebrow">Opening Garage Doors...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <Car size={40} />
          </div>
          <h2 className="empty-state-title">GARAGE IS EMPTY</h2>
          <p className="empty-state-text" style={{ maxWidth: '400px' }}>Register your vehicles to book services faster and track maintenance history.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {vehicles.map((v) => (
            <div key={v.id} className="card p-7" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-1rem', top: '-1rem', opacity: 0.05, transform: 'scale(1.5)' }}>
                    <Car size={100} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
                    <div className="stat-card-icon-wrap" style={{ width: '3.5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Car size={28} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-secondary" onClick={() => openEdit(v)} style={{ padding: '0.5rem' }}>
                            <Edit2 size={16} />
                        </button>
                        <button className="btn-outline" onClick={() => handleDelete(v.id)} style={{ padding: '0.5rem', color: 'var(--primary-accent)', borderColor: 'var(--primary-accent)' }}>
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Vehicle Number</span>
                        <h3 className="card-title" style={{ fontSize: '1.5rem' }}>{v.vehicleNumber}</h3>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: 'var(--secondary-bg)', padding: '1rem', borderRadius: '1rem' }}>
                        <div>
                            <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Make & Model</span>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.make} {v.model}</p>
                        </div>
                        <div>
                            <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Year & Color</span>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.year} • {v.color}</p>
                        </div>
                    </div>

                    {v.notes && (
                        <div>
                            <span className="card-eyebrow" style={{ display: 'block', marginBottom: '0.25rem' }}>Notes</span>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>"{v.notes}"</p>
                        </div>
                    )}
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(16px)' }} onClick={() => setShowModal(false)}></div>
          <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '30rem', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--borders)', paddingBottom: '1rem' }}>
              <h2 className="card-title">
                {editingId ? 'EDIT VEHICLE' : 'REGISTER VEHICLE'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Plate Number</label>
                  <input className="form-input" 
                    required
                    placeholder="e.g. ABC-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value})}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Make</label>
                      <input className="form-input" 
                        required
                        placeholder="e.g. Toyota"
                        value={formData.make}
                        onChange={(e) => setFormData({...formData, make: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Model</label>
                      <input className="form-input" 
                        required
                        placeholder="e.g. Camry"
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                      />
                    </div>
                </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div>
                      <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Year</label>
                      <input className="form-input" 
                        required type="month" min="1900-01" max="2100-12"
                        value={formData.year ? `${formData.year}-01` : ''}
                        onChange={(e) => setFormData({...formData, year: e.target.value ? parseInt(e.target.value.split('-')[0]) : new Date().getFullYear()})}
                      />
                    </div>
                    <div>
                      <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Color</label>
                      <input className="form-input" 
                        required
                        placeholder="e.g. Midnight Black"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                      />
                    </div>
                </div>
                <div>
                  <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Notes (Mechanical History, etc.)</label>
                  <textarea className="form-input" 
                    placeholder="Add details about your car..."
                    style={{ minHeight: '5rem', resize: 'none' }}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn-secondary" 
                  type="button" 
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  CANCEL
                </button>
                <button className="btn-primary" 
                  type="submit" 
                  disabled={modalLoading}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {modalLoading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {editingId ? 'UPDATE VEHICLE' : 'REGISTER VEHICLE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
