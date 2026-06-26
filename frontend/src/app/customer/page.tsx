'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Award,
  Calendar,
  Camera,
  Car,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  Plus,
  Save,
  Shield,
  Trash2,
  TrendingUp,
  User,
  Wrench,
  X,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5215/api';



const serviceOptions = [
  'Full System Check',
  'Engine Diagnostics',
  'Brake Service',
  'Oil & Fluid Change',
  'Tire & Wheel Service',
  'Performance Upgrade',
];

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function apiFetch(path: string, options: any = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function formatMoney(value = 0) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function cx(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

function PageHeader({ eyebrow, title, description, action }: any) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && (
          <p className="page-header-eyebrow">
            {eyebrow}
          </p>
        )}
        <h2 className="page-header-title">
          {title}
        </h2>
        {description && (
          <p className="page-header-desc">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function Button({ children, variant = "primary", className = "", ...props }: any) {
  const variantClass = `btn-${variant}`;

  return (
    <button
      className={`btn ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }: any) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, warning }: any) {
  return (
    <div className="card stat-card group">
      <Icon className="stat-card-bg-icon" />
      <div className="stat-card-content">
        <div>
          <p className="stat-card-label">
            {label}
          </p>
          <h3 className="stat-card-value">
            {value}
          </h3>
        </div>
        <div className={`stat-card-icon-wrap ${warning ? 'warning' : ''}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="form-field">
      <span className="form-label">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input(props: any) {
  return (
    <input
      className="form-input"
      {...props}
    />
  );
}

function Select(props: any) {
  return (
    <select
      className="form-select"
      {...props}
    />
  );
}

export default function CustomerPortal() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSpent: 0, invoiceCount: 0, loyaltySavings: 0, unpaidAmount: 0 });

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const statsData = await apiFetch('/customer-portal/stats');
        setStats(statsData);
      } catch (error) {
        console.error('Portal load error:', error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <Loader2 className="mb-5 h-14 w-14 animate-spin text-[#D61F2C]" />
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#A1A1AA]">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <DashboardView stats={stats} />
    </div>
  );
}

function DashboardView({ stats }: any) {
  const router = useRouter();
  const [recentAppts, setRecentAppts] = useState<any[]>([]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const appointments = await apiFetch('/appointments');
        setRecentAppts(Array.isArray(appointments) ? appointments.slice(0, 3) : []);
      } catch (error) {
        console.error('Appointment load error:', error);
      }
    };

    loadAppointments();
  }, []);

  return (
    <div className="space-y-8">
      <section className="dashboard-welcome">
        <div className="dashboard-welcome-glow" />
        <div className="dashboard-welcome-grid">
          <div>
            <div className="badge-pill">
              <Award size={14} /> Pro-tier benefits active
            </div>
            <h1 className="welcome-title">
              Welcome back,
              <span className="welcome-subtitle">Performance Driver</span>
            </h1>
            <p className="welcome-desc">
              Manage vehicles, bookings, rewards, invoices, and service history from one clean garage dashboard.
            </p>
            <div className="welcome-actions">
              <Button onClick={() => router.push('/customer/history')}>
                View Invoices <CreditCard size={16} />
              </Button>
              <Button variant="secondary" onClick={() => router.push('/customer/vehicles')}>
                My Garage <Car size={16} />
              </Button>
            </div>
          </div>

          <div className="card health-card">
            <div className="health-header">
              <div>
                <p className="health-eyebrow">Account Health</p>
                <h3 className="health-title">Live Status</h3>
              </div>
              <Activity className="text-primary" />
            </div>

            <ProgressRow label="Current Balance" value={formatMoney(stats.unpaidAmount)} percent={stats.unpaidAmount > 0 ? 60 : 0} amber />
            <ProgressRow label="Loyalty Rewards" value={formatMoney(stats.loyaltySavings)} percent={85} />
            <ProgressRow label="Service Activity" value={`${stats.invoiceCount || 0} visits`} percent={70} />
          </div>
        </div>
      </section>

      <div className="grid-stats">
        <StatCard icon={CreditCard} label="Total Spent" value={formatMoney(stats.totalSpent)} />
        <StatCard icon={Wrench} label="Services" value={stats.invoiceCount || 0} />
        <StatCard icon={TrendingUp} label="Savings" value={formatMoney(stats.loyaltySavings)} />
        <StatCard icon={AlertTriangle} label="Balance" value={formatMoney(stats.unpaidAmount)} warning />
      </div>

      <div className="grid-main">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-eyebrow">Schedule</p>
              <h3 className="card-title">Upcoming Pit Stops</h3>
            </div>
            <Calendar className="text-primary" />
          </div>

          {recentAppts.length === 0 ? (
            <EmptyState icon={Calendar} title="No Scheduled Maintenance" text="Book a new service visit to keep your vehicle running perfectly." />
          ) : (
            <div className="divide-y divide-[#2E2E2E]">
              {recentAppts.map((appointment: any) => (
                <AppointmentRow key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </div>


        <Card className="relative overflow-hidden bg-[linear-gradient(135deg,#D61F2C,#7F1119)] p-7">
          <Award className="absolute -right-8 -top-8 h-48 w-48 text-white opacity-10" />
          <div className="relative z-10">
            <p className="mb-4 text-[10px] font-black uppercase tracking-[0.28em] text-white/70">Rewards</p>
            <h3 className="font-['Oswald'] text-4xl font-bold uppercase leading-none">5% Savings Unlocked</h3>
            <p className="mt-5 text-sm leading-7 text-white/75">
              You are close to unlocking priority servicing and faster turnaround.
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur">
              <ProgressRow label="Next Tier" value="85%" percent={85} light />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, percent, amber = false, light = false }: any) {
  return (
    <div className="progress-row">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-value">{value}</span>
      </div>
      <div className="progress-bar-bg">
        <div
          className={`progress-bar-fill ${amber ? 'warning' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function AppointmentRow({ appointment }: any) {
  const date = appointment?.appointmentDate ? new Date(appointment.appointmentDate) : null;
  const day = date ? date.getDate() : '--';
  const month = date ? date.toLocaleString('default', { month: 'short' }) : 'TBD';
  const vehicleName = appointment?.vehicle
    ? `${appointment.vehicle.make} ${appointment.vehicle.model}`
    : 'General Service';
  const confirmed = appointment?.status === 'Confirmed';

  return (
    <div className="appointment-row">
      <div className="appointment-info">
        <div className="appointment-date-box">
          <p className="appointment-month">{month}</p>
          <p className="appointment-day">{day}</p>
        </div>
        <div className="appointment-details">
          <h4>
            {appointment?.serviceType || 'Service Visit'}
          </h4>
          <p>
            <Car size={14} className="inline mr-1" /> {vehicleName}
          </p>
        </div>
      </div>
      <span className={`appointment-status ${confirmed ? 'confirmed' : ''}`}>
        {appointment?.status || 'Pending'}
      </span>
    </div>
  );
}

function VehiclesView() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    notes: '',
  });

  const fetchVehicles = async () => {
    try {
      const data = await apiFetch('/customer-portal/vehicles');
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Vehicle load error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiFetch('/customer-portal/vehicles', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({ vehicleNumber: '', make: '', model: '', year: new Date().getFullYear(), color: '', notes: '' });
      fetchVehicles();
    } catch (error) {
      console.error('Vehicle save error:', error);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My Garage"
        title="Vehicle Management"
        description="Register and manage all customer vehicles in a clean, professional garage layout."
        action={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> Register Vehicle
          </Button>
        }
      />

      {loading ? (
        <div className="grid-stats">
          <p>Loading...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState icon={Car} title="No Vehicles Registered" text="Add your first vehicle to start booking garage services." />
      ) : (
        <div className="grid-stats">
          {vehicles.map((vehicle: any) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Register Vehicle" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Plate Number">
                  <Input required placeholder="e.g. BA 12 PA 7777" value={formData.vehicleNumber} onChange={(e: any) => setFormData({ ...formData, vehicleNumber: e.target.value })} />
                </Field>
              </div>
              <Field label="Make">
                <Input required placeholder="Toyota" value={formData.make} onChange={(e: any) => setFormData({ ...formData, make: e.target.value })} />
              </Field>
              <Field label="Model">
                <Input required placeholder="Supra" value={formData.model} onChange={(e: any) => setFormData({ ...formData, model: e.target.value })} />
              </Field>
              <Field label="Year">
                <Input required type="month" min="1900-01" max="2100-12" value={formData.year ? `${formData.year}-01` : ''} onChange={(e: any) => setFormData({ ...formData, year: e.target.value ? Number(e.target.value.split('-')[0]) : new Date().getFullYear() })} />
              </Field>
              <Field label="Color">
                <Input required placeholder="Midnight Black" value={formData.color} onChange={(e: any) => setFormData({ ...formData, color: e.target.value })} />
              </Field>
            </div>
            <Button type="submit" className="w-full py-4">
              Add To Garage
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function VehicleCard({ vehicle }: any) {
  return (
    <div className="card stat-card">
      <div className="stat-card-content" style={{ flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '1rem' }}>
          <div className="stat-card-icon-wrap">
            <Car size={34} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" style={{ padding: '0.5rem' }}>
              <Wrench size={16} />
            </Button>
            <Button variant="danger" style={{ padding: '0.5rem' }}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <p className="stat-card-label">Vehicle ID</p>
        <h3 className="stat-card-value">
          {vehicle.vehicleNumber}
        </h3>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--borders)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '100%' }}>
          <Info label="Make / Model" value={`${vehicle.make || 'Unknown'} ${vehicle.model || ''}`} />
          <Info label="Year / Color" value={`${vehicle.year || 'N/A'} • ${vehicle.color || 'N/A'}`} />
        </div>
      </div>
    </div>
  );
}

function AppointmentsView() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bookings"
        title="Pit Stop Scheduler"
        description="Allow customers to book high-performance maintenance, diagnostics, and repair appointments."
      />

      <div className="grid-main">
        <div className="card p-7">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card-icon-wrap">
              <Wrench size={24} />
            </div>
            <div>
              <p className="card-eyebrow">Schedule Visit</p>
              <h3 className="card-title">Book Service</h3>
            </div>
          </div>

          <div className="grid-stats">
            <Field label="Service Level">
              <Select defaultValue={serviceOptions[0]}>
                {serviceOptions.map((option: any) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </Field>
            <Field label="Pit Stop Date">
              <Input type="datetime-local" />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Notes">
                <textarea
                  rows={4}
                  placeholder="Describe the issue or service request..."
                  className="form-input"
                  style={{ resize: 'none' }}
                />
              </Field>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Button style={{ width: '100%', marginTop: '1rem' }}>
                Confirm Booking
              </Button>
            </div>
          </div>
        </div>

        <div className="card empty-state" style={{ minHeight: '420px', position: 'relative', overflow: 'hidden' }}>
          <Calendar style={{ position: 'absolute', right: '-3rem', top: '-3rem', width: '14rem', height: '14rem', color: '#fff', opacity: 0.03 }} />
          <div className="stat-card-icon-wrap" style={{ borderRadius: '2rem', padding: '1.5rem', marginBottom: '2rem' }}>
            <Clock size={46} />
          </div>
          <h3 className="card-title">No Active Bookings</h3>
          <p className="empty-state-text" style={{ marginTop: '1rem' }}>
            Your vehicle has no active appointment. Regular inspection keeps your ride safe and reliable.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ user }: any) {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Profile"
        title="Account Settings"
        description="Manage customer details, contact information, password, privacy, and service account preferences."
      />

      <div className="card profile-card">
        <Shield className="profile-shield-bg" />
        <div className="profile-content">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Profile" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <User size={64} />
                </div>
              )}
            </div>
            <button className="profile-camera-btn">
              <Camera size={22} />
            </button>
          </div>

          <div className="profile-info">
            <p className="profile-rank">
              Member Rank: Gold
            </p>
            <h2 className="profile-name">
              {user?.username || 'Customer'}
            </h2>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>{user?.email || 'No email available'}</p>
          </div>
        </div>
      </div>

      <div className="grid-main">
        <div className="card p-7">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <User className="text-primary" />
            <h3 className="card-title">Personal Details</h3>
          </div>

          <div className="grid-stats">
            <Field label="Username">
              <Input defaultValue={user?.username || ''} />
            </Field>
            <Field label="Mobile Contact">
              <Input defaultValue={user?.phoneNumber || ''} placeholder="Enter phone number" />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Email Address">
                <Input defaultValue={user?.email || ''} readOnly />
              </Field>
            </div>
          </div>

          <Button style={{ marginTop: '2rem', width: '100%' }}>
            <Save size={18} /> Save Changes
          </Button>
        </div>

        <div className="space-y-6">
          <SmallActionCard icon={Lock} title="Security" text="Change password and manage account protection settings." button="Change Password" />
          <SmallActionCard icon={Shield} title="Privacy" text="Control how your service and vehicle data is stored." button="Manage Privacy" />
        </div>
      </div>
    </div>
  );
}

function SmallActionCard({ icon: Icon, title, text, button }: any) {
  return (
    <div className="card p-7">
      <div className="stat-card-icon-wrap" style={{ width: '3.5rem', height: '3.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={26} />
      </div>
      <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>{title}</h3>
      <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: '1.75rem', color: 'var(--text-secondary)' }}>{text}</p>
      <Button variant="secondary" style={{ width: '100%' }}>
        {button}
      </Button>
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <button style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', border: 'none' }} onClick={onClose} aria-label="Close modal" />
      <div className="card" style={{ position: 'relative', maxHeight: '90vh', width: '100%', maxWidth: '42rem', overflowY: 'auto', padding: '1.75rem' }}>
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <h3 className="card-title">{title}</h3>
          <Button variant="secondary" onClick={onClose} style={{ height: '2.75rem', width: '2.75rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }: any) {
  return (
    <div>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>{label}</p>
      <p style={{ fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: any) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={30} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-text">{text}</p>
    </div>
  );
}
