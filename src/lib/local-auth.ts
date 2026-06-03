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

export function signup(username: string, email: string, password: string): { success: boolean; error?: string } {
  const users = getUsers();
  if (users.find((u) => u.username === username)) {
    return { success: false, error: "Username already taken" };
  }
  if (users.find((u) => u.email === email)) {
    return { success: false, error: "Email already registered" };
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
  return { success: true };
}

export function login(username: string, password: string): { success: boolean; error?: string; user?: { id: string; username: string; email: string; avatar: string } } {
  const users = getUsers();
  const found = users.find((u) => u.username === username && u.password === hash(password));
  if (!found) {
    return { success: false, error: "Invalid username or password" };
  }
  return {
    success: true,
    user: {
      id: found.id,
      username: found.username,
      email: found.email,
      avatar: found.avatar,
    },
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
