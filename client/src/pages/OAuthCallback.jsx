import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from '../context/useAuth';

export default function OAuthCallback() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const { completeOAuthLogin } = useAuth();

  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function finishLogin() {
      try {
        await completeOAuthLogin();

        if (!cancelled) {
          navigate("/dashboard", {
            replace: true,
          });
        }
      } catch (err) {
        if (cancelled) return;

        setError("Authentication could not be completed. Please try again.");

        setTimeout(() => {
          navigate("/login", {
            replace: true,
          });
        }, 1200);
      }
    }

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [completeOAuthLogin, navigate]);

  if (error) {
    return <div className="page-loading">{error}</div>;
  }

  return (
    <div className="page-loading">
      <span className="button-spinner" />
      <span>Completing sign in…</span>
    </div>
  );
}
