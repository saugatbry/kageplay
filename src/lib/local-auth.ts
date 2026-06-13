const USERS_KEY = "kageplay_users";

interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string;
  avatar: string;
  autoSkip: boolean;
}

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function signup(
  username: string, email: string, password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("kageplay_user_source", "supabase");
      return { success: true };
    }
    if (res.status === 409) {
      return { success: false, error: "Username already taken" };
    }
  } catch {}
  const users = getUsers();
  if (users.find((u) => u.username === username)) {
    return { success: false, error: "Username already taken" };
  }
  users.push({
    id: uid(),
    username,
    email,
    password: hash(password),
    avatar: "",
    autoSkip: false,
  });
  saveUsers(users);
  localStorage.setItem("kageplay_user_source", "local");
  return { success: true };
}

export async function login(
  username: string, password: string,
): Promise<{ success: boolean; error?: string; user?: { id: string; username: string; email: string; avatar: string } }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      localStorage.setItem("kageplay_user_source", "supabase");
      return {
        success: true,
        user: {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email || "",
          avatar: data.user.avatar || "",
        },
      };
    }
  } catch {}
  const users = getUsers();
  const found = users.find((u) => u.username === username && u.password === hash(password));
  if (!found) {
    return { success: false, error: "Invalid username or password" };
  }
  localStorage.setItem("kageplay_user_source", "local");
  return {
    success: true,
    user: { id: found.id, username: found.username, email: found.email, avatar: found.avatar },
  };
}

export function getUserById(id: string): StoredUser | undefined {
  return getUsers().find((u) => u.id === id);
}

export function updateUser(id: string, updates: Partial<StoredUser>) {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
  }
}
