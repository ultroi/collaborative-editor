import { useState } from "react";
import "../styles/auth.css";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getErrorMessage } from "../utils/getErrorMessage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(() => {
    const oauthError = searchParams.get("oauthError");

    if (oauthError === "google") {
      return "Google sign in was not completed. Please try again.";
    }

    if (oauthError === "github") {
      return "GitHub sign in was not completed. Please try again.";
    }

    return null;
  });

  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

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
      await login(form);

      navigate(redirectTo, {
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.assign(`${API_URL}/auth/google`);
  };

  const handleGithubLogin = () => {
    window.location.assign(`${API_URL}/auth/github`);
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

      <main className="auth-layout">
        <section className="auth-showcase">
          <h1>
            Build together.
            <br />
            <span>Ship faster.</span>
          </h1>

          <p>
            A focused workspace for teams who want to write, review and ship
            code without getting in each other’s way.
          </p>

          <div className="code-preview" aria-hidden="true">
            <div className="code-preview-bar">
              <span className="window-dots">
                <i />
                <i />
                <i />
              </span>

              <span>app.jsx</span>

              <span className="preview-live">● LIVE</span>
            </div>

            <div className="code-lines">
              <span>
                <b>01</b>
                <em>const</em> workspace = <strong>createProject</strong>({"{"}
              </span>

              <span>
                <b>02</b>
                &nbsp;&nbsp;name: <mark>'your-next-idea'</mark>,
              </span>

              <span>
                <b>03</b>
                &nbsp;&nbsp;team: <mark>'together'</mark>,
              </span>

              <span>
                <b>04</b>
                {"}"});
              </span>

              <span>
                <b>05</b>
              </span>

              <span>
                <b>06</b>
                <em>export default</em> workspace;
              </span>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <div className="auth-card-heading">
              <p className="eyebrow">WELCOME BACK</p>

              <h2>Sign in to your workspace</h2>

              <p>Continue where you left off.</p>
            </div>

            {error && (
              <div className="alert form-error">
                <span className="alert-icon">!</span>

                <span>{error}</span>

                <button type="button" onClick={() => setError(null)}>
                  ×
                </button>
              </div>
            )}

            {/* Social login */}

            <div className="social-login">
              <button
                type="button"
                className="social-button"
                onClick={handleGoogleLogin}
              >
                <span className="social-icon google-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path fill="#4285F4" d="M21.805 12.227c0-.709-.064-1.392-.183-2.045H12v3.874h5.493a4.69 4.69 0 0 1-2.037 3.078v2.558h3.29c1.925-1.773 3.059-4.386 3.059-7.465Z"/>
                    <path fill="#34A853" d="M12 22c2.754 0 5.063-.912 6.75-2.308l-3.29-2.558c-.912.61-2.075.966-3.46.966-2.662 0-4.918-1.798-5.726-4.213H2.873v2.64A10.195 10.195 0 0 0 12 22Z"/>
                    <path fill="#FBBC05" d="M6.274 13.887A6.13 6.13 0 0 1 5.955 12c0-.655.113-1.292.319-1.887v-2.64H2.873A10.008 10.008 0 0 0 1.805 12c0 1.615.387 3.144 1.068 4.527l3.401-2.64Z"/>
                    <path fill="#EA4335" d="M12 5.9c1.497 0 2.84.515 3.896 1.527l2.922-2.922C17.059 2.84 14.75 2 12 2a10.195 10.195 0 0 0-9.127 5.473l3.401 2.64C7.082 7.698 9.338 5.9 12 5.9Z"/>
                  </svg>
                </span>

                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="social-button"
                onClick={handleGithubLogin}
              >
                <span className="social-icon github-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path fill="currentColor" d="M12 .67A11.34 11.34 0 0 0 8.41 22.73c.57.1.78-.25.78-.55v-2.1c-3.18.69-3.85-1.34-3.85-1.34-.52-1.32-1.27-1.68-1.27-1.68-1.04-.71.08-.69.08-.69 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.25 3.32.95.1-.74.4-1.25.73-1.54-2.54-.29-5.21-1.27-5.21-5.67 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.45.11-3.02 0 0 .96-.31 3.14 1.17a10.9 10.9 0 0 1 5.72 0c2.18-1.48 3.13-1.17 3.13-1.17.62 1.57.23 2.73.11 3.02.73.8 1.18 1.82 1.18 3.07 0 4.41-2.68 5.37-5.23 5.66.41.35.78 1.05.78 2.12v3.14c0 .3.21.65.79.54A11.34 11.34 0 0 0 12 .67Z"/>
                  </svg>
                </span>

                <span>Continue with GitHub</span>
              </button>
            </div>

            <div className="auth-divider">
              <span />

              <small>OR CONTINUE WITH EMAIL</small>

              <span />
            </div>

            {/* Manual JWT login */}

            <form onSubmit={handleSubmit}>
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
                    autoComplete="current-password"
                    placeholder="Enter your password"
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
              </div>

              <button
                type="submit"
                className="primary-button auth-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="button-spinner" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in <span>→</span>
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
              New to CodeSpace? <Link to="/register">Create an account</Link>
            </p>
          </div>

          <p className="auth-legal">
            By continuing, you agree to the workspace terms and privacy policy.
          </p>
        </section>
      </main>
    </div>
  );
}
