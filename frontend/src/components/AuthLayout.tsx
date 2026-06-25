import React from 'react';
import { ShieldCheck, Wrench, Clock } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  isRegister?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, isRegister }) => {
  return (
    <div className="auth-container">
      <div className={`auth-card ${isRegister ? 'register-card' : ''}`}>
        <div className="auth-logo">
          <h2 style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Wrench color="var(--primary-accent)" size={32} />
            AUTO<span>CRAFT</span>
          </h2>
          <p>
            - GARAGE -
          </p>
        </div>

        {children}


      </div>
    </div>
  );
};

export default AuthLayout;
