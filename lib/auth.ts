import { User } from './types';

const USERS_KEY = 'zarathrift_users';
const CURRENT_USER_KEY = 'zarathrift_current_user';

// LocalStorage helpers (demo mode)
function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(USERS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(CURRENT_USER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// Register new user
export async function register(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
}): Promise<{ user?: User; error?: string }> {
  // Basic validation
  if (!data.firstName || !data.lastName || !data.phone || !data.password) {
    return { error: 'First name, last name, phone, and password are required.' };
  }

  if (data.password !== data.confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  if (data.password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  // Simple Nigerian phone validation (starts with 0 or +234, 10-13 digits)
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
    return { error: 'Please enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678).' };
  }

  const users = getUsers();
  const normalizedPhone = normalizePhone(data.phone);

  // Check if phone already exists
  const phoneExists = users.some(u => u.phone === normalizedPhone);
  if (phoneExists) {
    return { error: 'A user with this phone number already exists.' };
  }

  // Check email if provided
  if (data.email) {
    const emailExists = users.some(u => u.email && u.email.toLowerCase() === data.email!.toLowerCase());
    if (emailExists) {
      return { error: 'A user with this email already exists.' };
    }
  }

  const newUser: User = {
    id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: normalizedPhone,
    email: data.email ? data.email.trim().toLowerCase() : undefined,
    password: data.password, // DEMO ONLY - plain text. In production use Supabase Auth or bcrypt.
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Auto-login after registration
  setCurrentUser(newUser);

  // Also register in admin CRM so they can be messaged for marketing (new products/sales)
  try {
    // Dynamic import to avoid circular deps
    import('./data').then(({ saveCustomerNote }) => {
      saveCustomerNote(normalizedPhone, `${data.firstName} ${data.lastName}`.trim(), '', 0);
    });
  } catch {}

  return { user: newUser };
}

// Login with phone or email
export async function login(identifier: string, password: string): Promise<{ user?: User; error?: string }> {
  if (!identifier || !password) {
    return { error: 'Phone/Email and password are required.' };
  }

  const users = getUsers();
  const cleanId = identifier.trim().toLowerCase();
  const normalizedPhone = normalizePhone(identifier);

  // Find by phone or email
  const user = users.find(u => 
    u.phone === normalizedPhone || 
    (u.email && u.email.toLowerCase() === cleanId)
  );

  if (!user) {
    return { error: 'No account found with that phone number or email.' };
  }

  if (user.password !== password) {
    return { error: 'Incorrect password.' };
  }

  setCurrentUser(user);
  return { user };
}

export function logout() {
  setCurrentUser(null);
}

// Helper to check if logged in
export function isLoggedIn(): boolean {
  return !!getCurrentUser();
}

// For future Supabase migration (stub)
export async function migrateToSupabase() {
  // TODO: When Supabase is fully connected, sync users here
  console.log('Supabase user sync not implemented yet. Using localStorage for now.');
}

// Normalize Nigerian phone number for consistency (store as 08012345678)
export function normalizePhone(phone: string): string {
  let p = phone.replace(/[\s\-\(\)]/g, '').trim();
  if (p.startsWith('+234')) {
    p = '0' + p.slice(4);
  } else if (p.startsWith('234')) {
    p = '0' + p.slice(3);
  }
  if (!p.startsWith('0')) {
    p = '0' + p;
  }
  return p;
}

// Simple password strength checker
export function getPasswordStrength(password: string): { score: number; label: string; color: string; feedback: string } {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 6) score++;
  else feedback.push('at least 6 characters');

  if (password.length >= 8) score++;
  if (/[0-9]/.test(password)) score++;
  else feedback.push('a number');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('an uppercase letter');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push('a special character');

  let label = 'Weak';
  let color = 'text-red-500';
  if (score >= 4) {
    label = 'Strong';
    color = 'text-green-500';
  } else if (score >= 3) {
    label = 'Medium';
    color = 'text-yellow-500';
  }

  return {
    score,
    label,
    color,
    feedback: feedback.length > 0 ? `Add ${feedback.join(', ')}` : 'Good password!'
  };
}

// Forgot password (demo) - find user and allow reset
export async function requestPasswordReset(identifier: string): Promise<{ user?: User; error?: string }> {
  const users = getUsers();
  const cleanId = identifier.trim().toLowerCase();
  const normalizedPhone = normalizePhone(identifier);

  const user = users.find(u =>
    u.phone === normalizedPhone ||
    (u.email && u.email.toLowerCase() === cleanId)
  );

  if (!user) {
    return { error: 'No account found with that phone or email.' };
  }

  return { user };
}

export async function resetPassword(userId: string, newPassword: string, confirmPassword: string): Promise<{ success?: boolean; error?: string }> {
  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }
  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { error: 'User not found.' };
  }

  users[userIndex].password = newPassword;
  saveUsers(users);

  // If this was the current user, update session too
  const current = getCurrentUser();
  if (current && current.id === userId) {
    setCurrentUser(users[userIndex]);
  }

  return { success: true };
}
