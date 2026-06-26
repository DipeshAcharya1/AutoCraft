'use client';
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '../../components/AuthLayout';

export default function Register() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (val: string) => {
    if (!val) return '';
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{6,}$/;
    return regex.test(val) ? '' : 'Must be 6+ chars with uppercase, lowercase, digit & special character.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const pwdErr = validatePassword(password);
    if (pwdErr) { setPasswordError(pwdErr); return; }
    if (password !== confirmPassword) { setConfirmPasswordError('Passwords do not match'); return; }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) { setError('Phone number must be exactly 10 digits.'); return; }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5215/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fullName, email, phoneNumber: phone, password })
      });e
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          setError('A server error occurred. Please try again.');
        } else {
          const errText = await response.text();
          setError(errText || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout isRegister={true}>
      <div className="auth-header">
        <h1>Create Account</h1>
        <p>Join us and get your car serviced</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-label">Full Name</label>
          <div className="auth-input-wrap">
            <User className="auth-input-icon" size={18} />
            <input type="text" placeholder="Enter your full name" className="auth-input"
              value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
        </div>
        <div className="auth-field">
          <label className="auth-label">Email Address</label>
          <div className="auth-input-wrap">
            <Mail className="auth-input-icon" size={18} />
            <input type="email" placeholder="Enter your email" className="auth-input"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Phone Number</label>
          <div className="auth-input-wrap">
            <Phone className="auth-input-icon" size={18} />
            <input type="tel" placeholder="Enter your 10-digit phone number" className="auth-input"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) setPhone(value);
              }}
              required pattern="\d{10}" title="Phone number must be exactly 10 digits" />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className={`auth-input${passwordError ? ' input-error' : ''}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(validatePassword(e.target.value)); }}
              required
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {passwordError && <p className="auth-field-error">{passwordError}</p>}
        </div>

        <div className="auth-field">
          <label className="auth-label">Confirm Password</label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" size={18} />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              className={`auth-input${confirmPasswordError ? ' input-error' : ''}`}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(e.target.value !== password ? 'Passwords do not match.' : ''); }}
              required
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPasswordError && <p className="auth-field-error">{confirmPasswordError}</p>}
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Creating Account...' : <><span>Create Account</span> <ArrowRight size={20} /></>}
        </button>

        <div className="auth-switch">
          Already have an account? <Link href="/login" className="auth-link">Log In</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
