import { createClient, Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'lets_connect.db');
export const db: Client = createClient({
  url: `file:${dbPath}`,
});

export async function initDatabase() {
  // Foreign keys support
  await db.execute('PRAGMA foreign_keys = ON;');

  // STUDENTS TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      pseudonym TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('Junior', 'Senior', 'Alumni', 'Moderator')),
      avatar_seed TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // SESSIONS TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // CATEGORIES TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      accent TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // POSTS TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      is_pinned INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL
    );
  `);

  // POST_VOTES TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS post_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, post_id)
    );
  `);

  // COMMENTS TABLE (Threaded)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      parent_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL
    );
  `);

  // COMMENT_VOTES TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS comment_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, comment_id)
    );
  `);

  // REPORTS TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      post_id INTEGER DEFAULT NULL REFERENCES posts(id) ON DELETE CASCADE,
      comment_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'reviewing', 'resolved', 'dismissed')),
      reviewed_by INTEGER DEFAULT NULL REFERENCES students(id) ON DELETE SET NULL,
      reviewed_at DATETIME DEFAULT NULL,
      moderator_notes TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // CONTACT_MESSAGES TABLE
  await db.execute(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // INDEXES FOR QUERY OPTIMIZATION
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_student ON posts(student_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);`);

  console.log('Database initialized successfully with full relational schema & indexes.');
}
