import { api, setAccessToken } from "./api";

function normalizeUser(user = {}) {
  const googleProfile = user.googleProfile || user.google || user.profile || {};

  const derivedName =
    user.name ||
    user.fullName ||
    user.displayName ||
    user.givenName ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    googleProfile.name ||
    [googleProfile.given_name, googleProfile.family_name]
      .filter(Boolean)
      .join(" ") ||
    user.username ||
    "Developer";

  const derivedAvatar =
    user.avatar ||
    user.avatarUrl ||
    user.profilePicture ||
    user.profileImage ||
    user.picture ||
    user.photoURL ||
    googleProfile.picture ||
    googleProfile.avatar ||
    null;

  return {
    ...user,

    // Display name
    name: derivedName,

    // Profile photo
    avatar: derivedAvatar,

    // Basic account information
    email: user.email || googleProfile.email || "",

    username: user.username || user.userName || "",

    role: user.role || user.accountType || "user",
  };
}

export async function register({ username, email, password }) {
  const { data } = await api.post("/auth/register", {
    username,
    email,
    password,
  });

  setAccessToken(data.data.accessToken);

  return normalizeUser(data.data.user);
}

export async function login({ email, password }) {
  const { data } = await api.post("/auth/login", {
    email,
    password,
  });

  setAccessToken(data.data.accessToken);

  return normalizeUser(data.data.user);
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export async function restoreSession() {
  const { data } = await api.post("/auth/refresh");

  setAccessToken(data.data.accessToken);

  const me = await api.get("/auth/me");

  return normalizeUser(me.data.data.user);
}
