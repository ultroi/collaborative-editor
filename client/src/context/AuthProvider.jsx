import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { getAccessToken } from "../services/api";
import * as authService from "../services/authService";

import { AuthContext } from "./authContext";

const USER_STORAGE_KEY = "codespace.user";

function readStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawUser = window.sessionStorage.getItem(USER_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (user) {
      window.sessionStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(user)
      );
    } else {
      window.sessionStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

export function AuthProvider({ children }) {
  const location = useLocation();

  const [user, setUser] = useState(() => readStoredUser());

  const [status, setStatus] = useState(() =>
    getAccessToken() ? "authenticated" : "loading"
  );

  // Restore an existing session when the app starts.
  useEffect(() => {
    // OAuth callback completes the session itself.
    if (location.pathname === "/auth/callback") {
      setStatus("guest");
      return;
    }

    // Access token is already available.
    if (getAccessToken()) {
      setStatus("authenticated");
      return;
    }

    let cancelled = false;

    const restore = async () => {
      try {
        // The backend refresh token is stored in an HTTP-only cookie.
        // This request restores the session and creates a new access token.
        const restoredUser = await authService.restoreSession();

        if (cancelled) {
          return;
        }

        setUser(restoredUser);
        writeStoredUser(restoredUser);
        setStatus("authenticated");
      } catch {
        if (cancelled) {
          return;
        }

        // No valid refresh session = user is logged out.
        setUser(null);
        writeStoredUser(null);
        setStatus("guest");
      }
    };

    restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authService.login(credentials);

    setUser(loggedInUser);
    writeStoredUser(loggedInUser);
    setStatus("authenticated");

    return loggedInUser;
  }, []);

  const registerAccount = useCallback(async (details) => {
    const newUser = await authService.register(details);

    setUser(newUser);
    writeStoredUser(newUser);
    setStatus("authenticated");

    return newUser;
  }, []);

  const completeOAuthLogin = useCallback(async () => {
    const restoredUser = await authService.restoreSession();

    setUser(restoredUser);
    writeStoredUser(restoredUser);
    setStatus("authenticated");

    return restoredUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      writeStoredUser(null);
      setStatus("guest");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        registerAccount,
        completeOAuthLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}