import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from './db.js';
import { StudentPrivate, StudentPublic, StudentRole } from '../shared/types.js';

const PREFIXES = [
  'Tech', 'Code', 'DSA', 'Project', 'Byte', 'Logic', 'Cyber', 'Algo', 'Cloud',
  'Neural', 'Turbo', 'Matrix', 'Binary', 'Apex', 'Dev', 'Quantum', 'Python',
  'Java', 'Hack', 'Syntax', 'Pixel', 'Stack', 'Git', 'Kernel', 'Vector'
];

const NOUNS = [
  'Tiger', 'Falcon', 'Wolf', 'Panda', 'Eagle', 'Cheetah', 'Panther', 'Hawk',
  'Fox', 'Viper', 'Lion', 'Dragon', 'Badger', 'Lynx', 'Owl', 'Cobra',
  'Raven', 'Bear', 'Shark', 'Phoenix', 'Otter', 'Jaguar', 'Titan', 'Sage'
];

export async function generateUniquePseudonym(): Promise<string> {
  let attempts = 0;
  while (attempts < 50) {
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const number = Math.floor(100 + Math.random() * 900); // 100-999
    const pseudonym = `${prefix}${noun}#${number}`;

    const existing = await db.execute({
      sql: 'SELECT id FROM students WHERE pseudonym = ?',
      args: [pseudonym],
    });

    if (existing.rows.length === 0) {
      return pseudonym;
    }
    attempts++;
  }
  return `AdityaStudent#${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(studentId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await db.execute({
    sql: 'INSERT INTO sessions (student_id, token, expires_at) VALUES (?, ?, ?)',
    args: [studentId, token, expiresAt],
  });

  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await db.execute({
    sql: 'DELETE FROM sessions WHERE token = ?',
    args: [token],
  });
}

export function toPublicStudent(student: any): StudentPublic {
  return {
    id: Number(student.id),
    pseudonym: String(student.pseudonym),
    role: student.role as StudentRole,
    avatar_seed: String(student.avatar_seed),
    created_at: String(student.created_at),
    posts_count: student.posts_count !== undefined ? Number(student.posts_count) : undefined,
    comments_count: student.comments_count !== undefined ? Number(student.comments_count) : undefined,
  };
}

export interface AuthenticatedRequest extends Request {
  user?: StudentPrivate;
  sessionToken?: string;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token =
    req.cookies?.session_token ||
    (authHeader && typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : undefined);

  if (!token) {
    return next();
  }

  try {
    const sessionResult = await db.execute({
      sql: `
        SELECT s.student_id, s.token, s.expires_at,
               u.id, u.email, u.pseudonym, u.role, u.avatar_seed, u.created_at
        FROM sessions s
        JOIN students u ON s.student_id = u.id
        WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
      `,
      args: [token],
    });

    if (sessionResult.rows.length > 0) {
      const row = sessionResult.rows[0];
      req.user = {
        id: Number(row.id),
        email: String(row.email),
        pseudonym: String(row.pseudonym),
        role: row.role as StudentRole,
        avatar_seed: String(row.avatar_seed),
        created_at: String(row.created_at),
      };
      req.sessionToken = token;
    }
  } catch (error) {
    console.error('Session lookup error:', error);
  }

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireModerator(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'Moderator') {
    return res.status(403).json({ error: 'Forbidden. Moderator privileges required.' });
  }
  next();
}
