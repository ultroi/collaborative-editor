import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../context/useAuth';
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/Auth.css";
export default function Register() {
  const { registerAccount } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await registerAccount(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Could not create account"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background-grid" />
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <Link to="/" className="auth-brand">
        <span className="brand-mark">{"</>"}</span>
        <span>CodeSpace</span>
      </Link>

      <main className="auth-layout register-layout">
        <section className="auth-showcase">
          <div className="showcase-label">
            <span className="live-dot" />
            Your workspace starts here
          </div>

          <h1>
            Create.
            <br />
            <span>Collaborate.</span>
          </h1>

          <p>
            Set up your development workspace and bring your projects, files and
            team together in one focused environment.
          </p>

          <div className="code-preview" aria-hidden="true">
            <div className="code-preview-bar">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>

              <span>workspace.js</span>

              <span className="preview-live">● READY</span>
            </div>

            <div className="code-lines">
              <span>
                <b>01</b>
                <em>const</em> developer = {"{"}
              </span>

              <span>
                <b>02</b>
                &nbsp;&nbsp;name: <mark>'you'</mark>,
              </span>

              <span>
                <b>03</b>
                &nbsp;&nbsp;workspace: <mark>'CodeSpace'</mark>,
              </span>

              <span>
                <b>04</b>
                &nbsp;&nbsp;build: <strong>true</strong>,
              </span>

              <span>
                <b>05</b>
                {"}"};
              </span>

              <span>
                <b>06</b>
                <em>export default</em> developer;
              </span>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-heading">
              <p className="eyebrow">GET STARTED</p>

              <h2>Create your workspace</h2>

              <p>Set up your account and start building.</p>
            </div>

            {error && (
              <div className="alert form-error">
                <span className="alert-icon">!</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="username">Username</label>

                <div className="input-wrap">
                  <span className="input-icon">@</span>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="yourname"
                    minLength={3}
                    maxLength={30}
                    required
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="email">Email address</label>

                <div className="input-wrap">
                  <span className="input-icon">@</span>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>

                <div className="input-wrap">
                  <span className="input-icon">•</span>

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a secure password"
                    minLength={8}
                    required
                    value={form.password}
                    onChange={handleChange}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="password-hint">Minimum 8 characters</div>
              </div>

              <button
                type="submit"
                className="primary-button auth-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="button-spinner" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account <span>→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span />
              <small>SECURE WORKSPACE</small>
              <span />
            </div>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>

          <p className="auth-legal">
            By creating an account, you agree to the workspace terms and privacy
            policy.
          </p>
        </section>
      </main>
    </div>
  );
}
