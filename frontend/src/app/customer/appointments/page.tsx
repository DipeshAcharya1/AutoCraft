'use client';
import React, { useState, useEffect } from 'react';
import { 
    Calendar, Clock, AlertCircle, CheckCircle2, 
    XCircle, History, Plus, Loader2, ChevronRight, 
    FileText, Car, Wrench
} from 'lucide-react';

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);

    const [formData, setFormData] = useState({
        serviceType: '',
        vehicleId: '',
        appointmentDate: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        try {
            const [apptRes, vehRes] = await Promise.all([
                fetch('http://localhost:5215/api/appointments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://localhost:5215/api/customer-portal/vehicles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            if (apptRes.ok) setAppointments(await apptRes.json());
            if (vehRes.ok) setVehicles(await vehRes.json());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookingLoading(true);
        const token = localStorage.getItem('token');

        try {
            const res = await fetch('http://localhost:5215/api/appointments', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    ...formData,
                    vehicleId: formData.vehicleId ? parseInt(formData.vehicleId) : null,
                    appointmentDate: new Date(formData.appointmentDate).toISOString()
                })
            });

            if (res.ok) {
                setShowBookModal(false);
                setFormData({ serviceType: '', vehicleId: '', appointmentDate: '', notes: '' });
                await fetchData();
            } else {
                const txt = await res.text();
                alert(txt || "Booking failed.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setBookingLoading(false);
        }
    };

    const statusColors: any = {
        'Pending': 'warning',
        'Confirmed': 'success',
        'Completed': 'info',
        'Cancelled': 'danger',
    };

    // Reset page number on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus]);

    const filteredAppts = filterStatus === 'All' 
        ? appointments 
        : appointments.filter((a: any) => a.status === filterStatus);

    const itemsPerPage = 8;
    const totalPages = Math.ceil(filteredAppts.length / itemsPerPage);
    const paginatedAppts = filteredAppts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-8 animate-in">
            {/* Header section */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-header-title">SERVICE BOOKINGS</h1>
                    <p className="page-header-text">Keep your beast in peak condition with regular professional care.</p>
                </div>
                <button 
                    onClick={() => setShowBookModal(true)}
                    className="btn-primary"
                    style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                >
                    <Plus size={24} style={{ marginRight: '0.5rem' }} /> BOOK NEW SERVICE
                </button>
            </div>

            {/* Content area */}
            <div className="grid-main">
                {/* Filters sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card p-7">
                        <h3 className="card-eyebrow" style={{ marginBottom: '1.5rem' }}>Filter by Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={filterStatus === status ? 'btn-primary' : 'btn-outline'}
                                    style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0.75rem 1rem' }}
                                >
                                    {status}
                                    {filterStatus !== status && <ChevronRight size={16} style={{ opacity: 0.5 }} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card p-7" style={{ backgroundColor: 'var(--secondary-bg)' }}>
                        <History style={{ color: 'var(--primary-accent)', marginBottom: '1.5rem' }} size={28} />
                        <h4 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Need a faster check?</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>Browse through your history to see common services performed on your vehicles.</p>
                        <button style={{ color: 'var(--primary-accent)', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}>Go to History &rarr;</button>
                    </div>
                </div>

                {/* List area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {loading ? (
                        <div className="card empty-state">
                          <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
                          <p className="card-eyebrow">Checking Schedule...</p>
                        </div>
                    ) : filteredAppts.length === 0 ? (
                        <div className="card empty-state">
                          <div className="empty-state-icon">
                            <Calendar size={48} />
                          </div>
                          <h3 className="empty-state-title">NO APPOINTMENTS FOUND</h3>
                          <p className="empty-state-text" style={{ maxWidth: '300px' }}>You don't have any {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} bookings scheduled at the moment.</p>
                          <button onClick={() => setShowBookModal(true)} style={{ color: 'var(--primary-accent)', marginTop: '1rem', fontWeight: 900, fontStyle: 'italic', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '8px' }}>Book your first service today</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {paginatedAppts.map((appt: any) => (
                              <div key={appt.id} className="card p-7" style={{ display: 'flex', gap: '2rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', gap: '2rem', flex: 1 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '6rem', width: '6rem', backgroundColor: '#000', borderRadius: '1.5rem', border: '1px solid var(--borders)' }}>
                                    <span style={{ color: 'var(--primary-accent)', fontSize: '1.875rem', fontWeight: 900, fontStyle: 'italic' }}>{new Date(appt.appointmentDate).getDate()}</span>
                                    <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>{new Date(appt.appointmentDate).toLocaleString('default', { month: 'short' })}</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <span className={`appointment-status ${statusColors[appt.status] || ''}`}>
                                        {appt.status}
                                      </span>
                                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', backgroundColor: 'var(--secondary-bg)', padding: '0.25rem 0.75rem', borderRadius: '0.5rem' }}>
                                        <Clock size={12} style={{ color: 'var(--primary-accent)' }} />
                                        {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <div>
                                      <h2 className="card-title" style={{ fontSize: '1.5rem' }}>{appt.serviceType}</h2>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                        <Car size={16} style={{ color: 'var(--primary-accent)' }} />
                                        {appt.vehicle
                                          ? [appt.vehicle.year, appt.vehicle.make, appt.vehicle.model].filter(Boolean).join(' ')
                                          : 'Not Specified'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--borders)', paddingLeft: '2rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                    <FileText size={18} style={{ color: 'var(--primary-accent)', flexShrink: 0, marginTop: '0.25rem' }} />
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                      {appt.notes || 'No specific notes provided for this service request.'}
                                    </p>
                                  </div>
                                  {appt.staffNotes && (
                                    <div style={{ backgroundColor: 'rgba(214,31,44,0.05)', border: '1px solid rgba(214,31,44,0.2)', borderRadius: '1rem', padding: '1rem' }}>
                                      <p className="card-eyebrow" style={{ color: 'var(--primary-accent)' }}>PRO ADVICE</p>
                                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{appt.staffNotes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Elegant Pagination Controls */}
                          {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', borderTop: '1px solid var(--borders)', paddingTop: '1.5rem' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> – <strong>{Math.min(currentPage * itemsPerPage, filteredAppts.length)}</strong> of <strong>{filteredAppts.length}</strong> bookings
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
            </div>

            {/* Booking Modal */}
            {showBookModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(16px)' }} onClick={() => setShowBookModal(false)}></div>
                    <div className="card" style={{ position: 'relative', width: '100%', maxWidth: '34rem', padding: '1.75rem', border: '1px solid var(--borders)', boxShadow: '0 0 100px rgba(214,31,44,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--borders)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 className="card-title" style={{ fontSize: '1.875rem' }}>READY FOR A TUNE-UP?</h2>
                                <p className="card-eyebrow" style={{ marginTop: '0.5rem' }}>Schedule your next pit stop.</p>
                            </div>
                            <button onClick={() => setShowBookModal(false)} style={{ padding: '0.75rem', backgroundColor: 'var(--secondary-bg)', borderRadius: '1rem', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="card-eyebrow" style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Wrench size={14} /> SERVICE TYPE
                                    </label>
                                    <select 
                                        required
                                        className="form-input"
                                        value={formData.serviceType}
                                        onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                                    >
                                        <option value="">Select Service</option>
                                        <option value="Full Maintenance">Full Maintenance</option>
                                        <option value="Engine Repair">Engine Repair</option>
                                        <option value="Brake Check">Brake Check</option>
                                        <option value="Oil Change">Oil Change</option>
                                        <option value="Tire Rotation">Tire Rotation</option>
                                        <option value="Diagnostic Test">Diagnostic Test</option>
                                        <option value="General Inquiry">General Inquiry</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="card-eyebrow" style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Car size={14} /> SELECT VEHICLE
                                    </label>
                                    <select 
                                        required
                                        className="form-input"
                                        value={formData.vehicleId}
                                        onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                                    >
                                        <option value="">Select Vehicle</option>
                                        {vehicles.map((v: any) => (
                                            <option key={v.id} value={v.id}>{v.make} {v.model} ({v.vehicleNumber})</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="card-eyebrow" style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} /> DATE & TIME
                                    </label>
                                    <input 
                                        required type="datetime-local"
                                        className="form-input"
                                        value={formData.appointmentDate}
                                        min={new Date().toISOString().slice(0, 16)}
                                        onChange={(e) => setFormData({...formData, appointmentDate: e.target.value})}
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <label className="card-eyebrow" style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FileText size={14} /> ADDITIONAL NOTES
                                    </label>
                                    <textarea 
                                        className="form-input"
                                        style={{ height: '5rem', resize: 'none' }}
                                        placeholder="Describe the issues or specific requirements..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={bookingLoading}
                                className="btn-primary"
                                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}
                            >
                                {bookingLoading ? <Loader2 className="animate-spin" size={22} /> : <CheckCircle2 size={22} />}
                                CONFIRM BOOKING
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
