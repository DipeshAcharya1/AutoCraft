'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Wrench, Phone, Mail, Clock, MapPin, Award, User, Shield, ChevronRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        if (role === 'Admin') setIsAdmin(true);
        if (role === 'Staff') setIsStaff(true);
        if (role === 'Customer') setIsCustomer(true);
        setUsername(payload.email ? payload.email.split('@')[0] : role);
      } catch (e) {
        setIsLoggedIn(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setIsStaff(false);
    setIsCustomer(false);
    router.push('/');
  };

  const handleBookClick = () => {
    if (isLoggedIn) {
      if (isAdmin) {
        router.push('/admin/parts');
      } else if (isStaff) {
        router.push('/staff/sales');
      } else if (isCustomer) {
        router.push('/customer/appointments');
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => router.push('/')}>
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="38" height="38" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"></path>
            <circle cx="12" cy="12" r="4" fill="var(--primary-accent)"></circle>
          </svg>
          <div className="logo-text-wrapper">
            <span className="logo-main">RED<span className="white-text">LINE</span></span>
            <span className="logo-sub">AUTO GARAGE</span>
          </div>
        </div>
        
        <div className="navbar-links">
          <Link href="/" className="active">Home</Link>
          <Link href="#services">Services</Link>
          <Link href="#about">About Us</Link>
          {isAdmin && (
            <>
              <Link href="/admin/users" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Users</Link>
              <Link href="/admin/parts" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Parts</Link>
              <Link href="/admin/vendors" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Vendors</Link>
              <Link href="/admin/reports" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Financials</Link>
              <Link href="/staff/customers" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Customers</Link>
              <Link href="/staff/sales" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Sales</Link>
            </>
          )}
          {isStaff && (
            <>
              <Link href="/staff/customers" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Customers</Link>
              <Link href="/staff/sales" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Sales</Link>
              <Link href="/staff/reports" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Reports</Link>
            </>
          )}
          {isCustomer && (
            <Link href="/customer" style={{ color: 'var(--primary-accent)', fontWeight: 800 }}>Customer Portal</Link>
          )}
        </div>

        <div className="navbar-cta-group">
          {isLoggedIn ? (
            <>
              <span className="nav-welcome" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Welcome, <strong style={{ color: '#fff' }}>{username}</strong>
              </span>
              <button className="navbar-cta-btn" onClick={handleLogout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-login-link">
                Log In
              </Link>
              <Link href="/register" className="navbar-cta-btn">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-tagline">PERFORMANCE. PRECISION. PASSION.</span>
            <h1>DRIVEN BY PASSION <br /><span className="red-text">BUILT TO PERFORM</span></h1>
            <p>Expert care for your car. Unmatched performance for your journey.</p>
            <div className="hero-btn-group">
              <button className="hero-cta-btn" onClick={handleBookClick}>
                BOOK APPOINTMENT <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <div className="hero-bg-glow"></div>
            <img 
              src="/hero-car.png" 
              alt="Sleek black sports car with red stripes" 
              className="hero-car-img" 
              onError={(e) => {
                // fallback if local server does not serve image
                e.currentTarget.src = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800";
              }}
            />
          </div>
        </div>
      </header>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="section-header">
          <span className="section-subtitle">OUR SERVICES</span>
          <h2>WHAT WE DO BEST</h2>
          <div className="section-underline"></div>
        </div>

        <div className="services-grid">
          {/* Card 1: Engine Diagnostics */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2v4h6M3 10h4l3 9 4-15 3 9h4" />
                <rect x="2" y="6" width="20" height="14" rx="2" />
              </svg>
            </div>
            <h3>ENGINE DIAGNOSTICS</h3>
            <p>Advanced diagnostics to identify and fix issues quickly and accurately.</p>
            <Link href="#services" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 2: Repairs & Maintenance */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                <path d="M8 16l-4-4M16 8l4 4" />
              </svg>
            </div>
            <h3>REPAIRS & MAINTENANCE</h3>
            <p>Expert repairs and routine maintenance for all vehicle types.</p>
            <Link href="#services" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 3: Brake Service */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </div>
            <h3>BRAKE SERVICE</h3>
            <p>Ensure your safety with our professional brake inspection and repair.</p>
            <Link href="#services" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 4: Tires & Wheel Service */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6" />
              </svg>
            </div>
            <h3>TIRES & WHEEL SERVICE</h3>
            <p>High-quality tires and precision wheel services for optimal performance.</p>
            <Link href="#services" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>

          {/* Card 5: Performance Upgrades */}
          <div className="service-card">
            <div className="service-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12a9 9 0 0 1 15-6.7L12 12" />
                <circle cx="12" cy="12" r="2" />
                <path d="M12 2v2M2 12h2M12 20v2M20 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
              </svg>
            </div>
            <h3>PERFORMANCE UPGRADES</h3>
            <p>Upgrade your ride with performance parts and tuning solutions.</p>
            <Link href="#services" className="service-link">
              LEARN MORE <span className="link-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Row Banner */}
      <section className="stats-banner">
        <div className="stats-container">
          {/* Stat 1 */}
          <div className="stat-item">
            <div className="home-stat-icon-box">
              <Wrench size={32} />
            </div>
            <div className="stat-details">
              <h4>15k+</h4>
              <p>Cars Repaired</p>
            </div>
          </div>
          {/* Stat 2 */}
          <div className="stat-item">
            <div className="home-stat-icon-box">
              <User size={32} />
            </div>
            <div className="stat-details">
              <h4>100%</h4>
              <p>Happy Clients</p>
            </div>
          </div>
          {/* Stat 3 */}
          <div className="stat-item">
            <div className="home-stat-icon-box">
              <Award size={32} />
            </div>
            <div className="stat-details">
              <h4>12+</h4>
              <p>Years Experience</p>
            </div>
          </div>
          {/* Stat 4 */}
          <div className="stat-item">
            <div className="home-stat-icon-box">
              <Shield size={32} />
            </div>
            <div className="stat-details">
              <h4>100%</h4>
              <p>Quality Guaranteed</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="about-container">
          {/* Col 1: Image wrap */}
          <div className="about-image-column">
            <div className="about-image-card">
              <img 
                src="/about-car.png" 
                alt="Sports car rear styling inside a garage" 
                className="about-car-img"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800";
                }}
              />
              <div className="about-neon-border"></div>
            </div>
          </div>

          {/* Col 2: About Text Column */}
          <div className="about-content-column">
            <span className="about-subtitle">ABOUT US</span>
            <h2>MORE THAN A GARAGE.<br /><span className="red-text">WE'RE CAR PEOPLE.</span></h2>
            <div className="about-underline"></div>
            <p>
              At Redline Auto Garage, we're more than just a repair shop. We're car enthusiasts dedicated to delivering top-notch service, honest advice, and unbeatable results.
            </p>
            <button className="about-cta-btn" onClick={handleBookClick}>
              LEARN MORE ABOUT US <span className="arrow-right-inline">→</span>
            </button>
          </div>

          {/* Col 3: Features List Column */}
          <div className="about-features-column">
            <div className="about-feature-item">
              <div className="feature-icon-badge">
                <Wrench size={22} />
              </div>
              <div className="feature-info">
                <h3>EXPERT TEAM</h3>
                <p>Certified mechanics with years of hands-on experience.</p>
              </div>
            </div>

            <div className="about-feature-item">
              <div className="feature-icon-badge">
                <Award size={22} />
              </div>
              <div className="feature-info">
                <h3>PREMIUM EQUIPMENT</h3>
                <p>We use the latest tools and technology for the best results.</p>
              </div>
            </div>

            <div className="about-feature-item">
              <div className="feature-icon-badge">
                <Shield size={22} />
              </div>
              <div className="feature-info">
                <h3>CUSTOMER FIRST</h3>
                <p>Your satisfaction is our priority. Always.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Stripe Section */}
      <section className="cta-stripe">
        <div className="cta-stripe-container">
          <div className="cta-stripe-left">
            <div className="cta-circle-badge">
              <Clock size={26} />
            </div>
            <div className="cta-stripe-text">
              <span className="cta-stripe-tagline">KEEP YOUR CAR</span>
              <h2>PERFORMING AT ITS BEST</h2>
              <p>Schedule your service today and experience the Redline difference.</p>
            </div>
          </div>
          <div>
            <button className="cta-stripe-btn" onClick={handleBookClick}>
              BOOK APPOINTMENT NOW <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section">
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '3rem', maxWidth: '1320px', margin: '0 auto', padding: '5rem 6% 3rem 6%' }}>
          {/* Col 1: About */}
          <div className="footer-about">
            <div className="navbar-brand" style={{ marginBottom: '1.5rem' }}>
              <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="var(--primary-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                <circle cx="12" cy="12" r="4" fill="var(--primary-accent)"></circle>
              </svg>
              <div className="logo-text-wrapper">
                <span className="logo-main" style={{ fontSize: '1.3rem' }}>RED<span className="white-text">LINE</span></span>
                <span className="logo-sub" style={{ fontSize: '0.45rem', letterSpacing: '3px' }}>AUTO GARAGE</span>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              We provide professional car repair and maintenance services with honesty, quality, and precision.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-links">
            <h3 style={{ fontFamily: 'var(--font-oswald, sans-serif)', fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#fff' }}>QUICK LINKS</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChevronRight size={12} color="var(--primary-accent)" /> Home</Link></li>
              <li><Link href="#services" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChevronRight size={12} color="var(--primary-accent)" /> Services</Link></li>
              <li><Link href="#about" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChevronRight size={12} color="var(--primary-accent)" /> About Us</Link></li>
            </ul>
          </div>

          {/* Col 3: Our Services */}
          <div className="footer-links">
            <h3 style={{ fontFamily: 'var(--font-oswald, sans-serif)', fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#fff' }}>OUR SERVICES</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link href="#services" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChevronRight size={12} color="var(--primary-accent)" /> Diagnostics</Link></li>
              <li><Link href="#services" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChevronRight size={12} color="var(--primary-accent)" /> Maintenance</Link></li>
              <li><Link href="#services" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ChevronRight size={12} color="var(--primary-accent)" /> Brakes</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact Us */}
          <div className="footer-contact">
            <h3 style={{ fontFamily: 'var(--font-oswald, sans-serif)', fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem', color: '#fff' }}>CONTACT US</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <MapPin size={16} color="var(--primary-accent)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>123 Garage Street, Auto City, AC 12345</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Phone size={16} color="var(--primary-accent)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>(123) 456-7890</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Mail size={16} color="var(--primary-accent)" style={{ flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>info@redlinegarage.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom" style={{ borderTop: '1px solid var(--borders)', padding: '2rem 6%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', maxWidth: '1320px', margin: '0 auto' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>&copy; {new Date().getFullYear()} Redline Auto Garage. All Rights Reserved.</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Privacy Policy</Link>
            <span style={{ color: 'var(--borders)', fontSize: '0.75rem' }}>|</span>
            <Link href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
