import { Router } from 'express';
import { db } from '../db.js';
import {
  generateUniquePseudonym,
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
  AuthenticatedRequest,
} from '../auth.js';
import { registerSchema, loginSchema } from '../../shared/types.js';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid registration details',
      });
    }

    const { email, password, role } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existing = await db.execute({
      sql: 'SELECT id FROM students WHERE email = ?',
      args: [normalizedEmail],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This university email is already registered.' });
    }

    const passwordHash = await hashPassword(password);
    const pseudonym = await generateUniquePseudonym();
    const avatarSeed = `${pseudonym.replace('#', '_')}_${Date.now()}`;

    const insertResult = await db.execute({
      sql: `
        INSERT INTO students (email, password_hash, pseudonym, role, avatar_seed)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id, email, pseudonym, role, avatar_seed, created_at
      `,
      args: [normalizedEmail, passwordHash, pseudonym, role, avatarSeed],
    });

    const userRow = insertResult.rows[0];
    const studentId = Number(userRow.id);

    // Create session
    const token = await createSession(studentId);

    // Set HTTP-only cookie
    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return res.status(201).json({
      token,
      user: {
        id: studentId,
        email: String(userRow.email),
        pseudonym: String(userRow.pseudonym),
        role: String(userRow.role),
        avatar_seed: String(userRow.avatar_seed),
        created_at: String(userRow.created_at),
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Failed to create student account.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid login details',
      });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const userResult = await db.execute({
      sql: 'SELECT * FROM students WHERE email = ?',
      args: [normalizedEmail],
    });

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid university email or password.' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await verifyPassword(password, String(user.password_hash));

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid university email or password.' });
    }

    const token = await createSession(Number(user.id));

    res.cookie('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      token,
      user: {
        id: Number(user.id),
        email: String(user.email),
        pseudonym: String(user.pseudonym),
        role: String(user.role),
        avatar_seed: String(user.avatar_seed),
        created_at: String(user.created_at),
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Authentication failed.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', async (req: AuthenticatedRequest, res) => {
  try {
    const token = req.cookies?.session_token || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await deleteSession(token);
    }
    res.clearCookie('session_token', { path: '/' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Logout failed.' });
  }
});

// GET /api/session
authRouter.get('/session', async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  return res.json({ user: req.user });
});
