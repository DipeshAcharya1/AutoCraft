'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { Star, MessageSquare, Send, Loader2, CheckCircle2, History, Award } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function ReviewsContent() {
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('invoiceId');

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ rating: 5, comment: '' });

    useEffect(() => { fetchReviews(); }, []);

    const fetchReviews = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5215/api/customer-portal/reviews', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            if (res.ok) setReviews(await res.json());
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('http://localhost:5215/api/customer-portal/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setSuccess(true);
                setFormData({ rating: 5, comment: '' });
                setTimeout(() => setSuccess(false), 3000);
                fetchReviews();
                let errText = await res.text();
                try {
                    const errJson = JSON.parse(errText);
                    if (errJson.errors) {
                        errText = Object.values(errJson.errors).flat().join(' ');
                    } else if (errJson.message) {
                        errText = errJson.message;
                    }
                } catch (e) {
                    // Not JSON, keep text
                }
                setError(errText || 'Failed to submit review. Please try again.');
            }
        } catch (err: any) { 
            console.error(err); 
            setError(err.message || 'Network error occurred.');
        } finally { setSubmitLoading(false); }
    };

    return (
        <div className="space-y-8 animate-in">
            <div className="page-header">
                <h1 className="page-header-title">SERVICE REVIEWS</h1>
                <p className="page-header-text">Your feedback drives our performance. Tell us how we did.</p>
            </div>

            <div className="grid-main">
                {/* Submit Review Form */}
                <div className="card p-7">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="stat-card-icon-wrap"><MessageSquare size={22} /></div>
                        <h2 className="card-title" style={{ fontSize: '1.5rem' }}>LEAVE A REVIEW</h2>
                    </div>

                    {success ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', textAlign: 'center', gap: '1rem' }}>
                            <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
                            </div>
                            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>REVIEW SUBMITTED</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Thank you for your valuable feedback!</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {error && (
                                <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                    {error}
                                </div>
                            )}
                            <div>
                                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.75rem' }}>Engine Performance Rating</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button key={s} type="button"
                                            onClick={() => setFormData({...formData, rating: s})}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: formData.rating >= s ? '#f59e0b' : 'var(--borders)', transition: 'color 0.2s', padding: '0.25rem' }}>
                                            <Star size={28} fill={formData.rating >= s ? 'currentColor' : 'none'} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="card-eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>Detailed Feedback</label>
                                <textarea required minLength={5} className="form-input" style={{ minHeight: '8rem', resize: 'none' }}
                                    placeholder="Tell us about the service quality, staff, or parts... (minimum 5 characters)"
                                    value={formData.comment}
                                    onChange={(e) => { setFormData({...formData, comment: e.target.value}); setError(''); }} />
                            </div>
                            <button type="submit" disabled={submitLoading} className="btn-primary"
                                style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                {submitLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={20} />}
                                PUBLISH REVIEW
                            </button>
                        </form>
                    )}
                </div>

                {/* Past Reviews */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <History size={20} style={{ color: 'var(--primary-accent)' }} />
                        <h2 className="card-title" style={{ fontSize: '1.25rem' }}>
                            YOUR REVIEWS <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>({reviews.length})</span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="card empty-state" style={{ minHeight: '200px' }}>
                            <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
                            <p className="card-eyebrow">Collecting your stories...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="card empty-state" style={{ minHeight: '200px' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>You haven't written any reviews yet. Be the first to share!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {reviews.map((rev: any) => (
                                <div key={rev.id} className="card p-7">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            {[...Array(rev.rating)].map((_, i) => <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />)}
                                            {[...Array(5 - rev.rating)].map((_, i) => <Star key={i} size={16} color="var(--borders)" />)}
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                            {new Date(rev.reviewedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '1rem' }}>
                                        "{rev.comment}"
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'rgba(214,31,44,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Award size={12} style={{ color: 'var(--primary-accent)' }} />
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Verified Client</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ServiceReviews() {
    return (
        <Suspense fallback={
            <div className="card empty-state" style={{ minHeight: '300px' }}>
                <Loader2 className="animate-spin" size={36} style={{ color: 'var(--primary-accent)', marginBottom: '1rem' }} />
                <p className="card-eyebrow">Initializing feedback channel...</p>
            </div>
        }>
            <ReviewsContent />
        </Suspense>
    );
}
