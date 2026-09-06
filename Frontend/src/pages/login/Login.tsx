import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/button/Button';
import Input from '../../components/common/input/Input';
import './Login.css';

export const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const next: Record<string, string> = {};

    if (!email.trim()) {
      next.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = 'Please enter a valid email address';
    }

    if (!password) {
      next.password = 'Password is required';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate() || isLoading) return;

    try {
      setIsLoading(true);

      await login(email.trim(), password);

      navigate('/dashboard', {
        replace: true,
      });
    } catch (err: any) {
      toast.error(
        err?.message ||
          'Authentication failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell">
        <aside className="login-visual">
          <div className="visual-shape visual-shape-one" />
          <div className="visual-shape visual-shape-two" />

          <div className="visual-content">
            <div className="visual-logo">
              <img
                src="/assets/giian-logo.png"
                alt="giian"
                className="visual-logo-image"
              />
            </div>

            <div className="visual-copy">
              <span className="visual-kicker">Business Management Suite</span>

              <h1 className="visual-title">
                Welcome back
              </h1>

              <p className="visual-description">
                Manage customers, products, quotations, invoices, receipts,
                purchases and reports from one secure workspace.
              </p>
            </div>

            <div className="visual-security">
              <ShieldCheck size={18} />

              <div>
                <strong>Secure access</strong>
                <span>Role-based business workspace</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-container">
            <div className="mobile-brand">
              <div className="mobile-brand-logo">
                <img
                  src="/assets/giian-logo.png"
                  alt="giian"
                  className="mobile-brand-image"
                />
              </div>

              <div>
                <span className="mobile-brand-name">giian</span>
                <span className="mobile-brand-caption">
                  Business Suite
                </span>
              </div>
            </div>

            <header className="login-form-header">
              <span className="login-eyebrow">
                Secure Sign In
              </span>

              <h2 className="login-title">
                Sign in to your account
              </h2>

              <p className="login-subtitle">
                Enter your registered email address and password to continue.
              </p>
            </header>

            <form
              onSubmit={handleSubmit}
              className="login-form"
              noValidate
            >
              <Input
                type="email"
                label="Email Address"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);

                  if (errors.email) {
                    setErrors((prev) => ({
                      ...prev,
                      email: '',
                    }));
                  }
                }}
                error={errors.email}
                icon={<Mail size={18} />}
                isRequired
                autoComplete="email"
              />

              <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);

                  if (errors.password) {
                    setErrors((prev) => ({
                      ...prev,
                      password: '',
                    }));
                  }
                }}
                error={errors.password}
                icon={<Lock size={18} />}
                isRequired
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                loadingText="Signing In..."
                className="login-submit-button"
                id="btn-login-submit"
              >
                Sign In
              </Button>
            </form>

            <div className="login-security-note">
              <ShieldCheck size={16} />

              <p>
                Staff accounts are securely created and managed by an
                administrator.
              </p>
            </div>

            <footer className="login-footer">
              © {new Date().getFullYear()} giian Business Suite
            </footer>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Login;