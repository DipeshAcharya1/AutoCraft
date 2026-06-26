'use client';
import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '../../components/AuthLayout';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5215/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          setError('A server error occurred. Please check credentials or try again.');
        } else {
          const errText = await response.text();
          setError(errText || 'Invalid credentials');
        }
      }
    } catch (err) {
      setError('Failed to connect to the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-header">
        <h1>Welcome Back</h1>
        <p>Login to your account</p>
      </div>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field">
          <label className="auth-label">Email Address</label>
          <div className="auth-input-wrap">
            <Mail className="auth-input-icon" size={18} />
            <input
              type="email"
              placeholder="Enter your email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-label">Password</label>
          <div className="auth-input-wrap">
            <Lock className="auth-input-icon" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="auth-forgot">
          <Link href="#" className="auth-link">Forgot Password?</Link>
        </div>

        <button type="submit" className="auth-submit-btn" disabled={loading}>
          {loading ? 'Logging in...' : <><span>Log In</span> <ArrowRight size={20} /></>}
        </button>

        <div className="auth-switch">
          Don't have an account? <Link href="/register" className="auth-link">Sign Up</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
