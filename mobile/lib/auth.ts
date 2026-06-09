import { User } from './types';
import { getUsers, saveUsers, saveCurrentUser, normalizePhone as normalize } from './data';

export { normalizePhone } from './data';

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
  let color = '#ef4444';
  if (score >= 4) {
    label = 'Strong';
    color = '#22c55e';
  } else if (score >= 3) {
    label = 'Medium';
    color = '#eab308';
  }

  return {
    score,
    label,
    color,
    feedback: feedback.length > 0 ? `Add ${feedback.join(', ')}` : 'Good password!'
  };
}

export async function register(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
}): Promise<{ user?: User; error?: string }> {
  if (!data.firstName || !data.lastName || !data.phone || !data.password) {
    return { error: 'First name, last name, phone, and password are required.' };
  }
  if (data.password !== data.confirmPassword) {
    return { error: 'Passwords do not match.' };
  }
  if (data.password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  const normalizedPhone = normalize(data.phone);
  if (!phoneRegex.test(normalizedPhone)) {
    return { error: 'Please enter a valid Nigerian phone number.' };
  }

  const users = await getUsers();

  const phoneExists = users.some(u => u.phone === normalizedPhone);
  if (phoneExists) {
    return { error: 'A user with this phone number already exists.' };
  }

  if (data.email) {
    const emailExists = users.some(u => u.email && u.email.toLowerCase() === data.email!.toLowerCase());
    if (emailExists) {
      return { error: 'A user with this email already exists.' };
    }
  }

  const newUser: User = {
    id: 'user_' + Date.now().toString(36),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phone: normalizedPhone,
    email: data.email ? data.email.trim().toLowerCase() : undefined,
    password: data.password,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);
  await saveCurrentUser(newUser);

  return { user: newUser };
}

export async function login(identifier: string, password: string): Promise<{ user?: User; error?: string }> {
  if (!identifier || !password) {
    return { error: 'Phone/Email and password are required.' };
  }

  const users = await getUsers();
  const cleanId = identifier.trim().toLowerCase();
  const normalizedPhone = normalize(identifier);

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

  await saveCurrentUser(user);
  return { user };
}

export async function logout() {
  await saveCurrentUser(null);
}
