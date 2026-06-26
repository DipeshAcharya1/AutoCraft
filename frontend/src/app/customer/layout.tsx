'use client';
import './customer.css';
import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Car, Calendar, ClipboardList, User, 
  History, LogOut, Wrench, Menu, X, Star
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (role !== 'Customer') {
        router.push('/');
        return;
      }
      setUser({
        username: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || 'Customer',
        email: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || '',
        role: role
      });
    } catch (e) {
      localStorage.removeItem('token');
      router.push('/login');
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  const navItems = [
    { title: 'Dashboard', icon: <BarChart3 size={20} />, href: '/customer' },
    { title: 'My Vehicles', icon: <Car size={20} />, href: '/customer/vehicles' },
    { title: 'Appointments', icon: <Calendar size={20} />, href: '/customer/appointments' },
    { title: 'Part Requests', icon: <ClipboardList size={20} />, href: '/customer/requests' },
    { title: 'Service History', icon: <History size={20} />, href: '/customer/history' },
    { title: 'Reviews', icon: <Star size={20} />, href: '/customer/reviews' },
    { title: 'My Profile', icon: <User size={20} />, href: '/customer/profile' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="customer-layout-container">
      {/* Sidebar */}
      <aside className={`customer-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <Link href="/" className="brand-link">
              <div className="brand-icon-wrapper">
                <Wrench className="text-white" size={24} />
              </div>
              <span className="brand-text">
                AUTO<span className="brand-text-white">CRAFT</span>
              </span>
            </Link>
          </div>

          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.title}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-profile-card">
              <div className="user-profile-content">
                <div className="user-avatar">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="user-info">
                  <p className="user-name">{user?.username}</p>
                  <p className="user-email">{user?.email}</p>
                </div>
              </div>
            </div>
            
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={20} />
              <span className="nav-text">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="customer-main-wrapper">
        {/* Header */}
        <header className="customer-header">
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="mobile-menu-btn"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="header-right">
            <div className="header-badge-col">
              <span className="header-badge-title">Member Lounge</span>
              <span className="header-badge-subtitle">Customer Portal</span>
            </div>
            <div className="header-divider"></div>
            <Link href="/" className="header-home-link">
              Home Page
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="customer-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
