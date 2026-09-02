import { Router } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, toPublicStudent } from '../auth.js';

export const usersRouter = Router();

// GET /api/users/:id
usersRouter.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await db.execute({
      sql: `
        SELECT u.id, u.pseudonym, u.role, u.avatar_seed, u.created_at,
               (SELECT COUNT(*) FROM posts p WHERE p.student_id = u.id AND p.deleted_at IS NULL) as posts_count,
               (SELECT COUNT(*) FROM comments c WHERE c.student_id = u.id AND c.deleted_at IS NULL) as comments_count
        FROM students u
        WHERE u.id = ?
      `,
      args: [userId],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    return res.json(toPublicStudent(result.rows[0]));
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to load user profile' });
  }
});

// GET /api/users/:id/posts
usersRouter.get('/:id/posts', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const currentStudentId = req.user?.id || 0;

    const result = await db.execute({
      sql: `
        SELECT p.id, p.student_id, p.category_id, p.title, p.body, p.tags, p.is_pinned,
               p.created_at, p.updated_at, p.deleted_at,
               u.id as author_id, u.pseudonym as author_pseudonym, u.role as author_role, u.avatar_seed as author_avatar, u.created_at as author_created_at,
               c.id as cat_id, c.slug as cat_slug, c.name as cat_name, c.description as cat_desc, c.accent as cat_accent, c.created_at as cat_created_at,
               (SELECT COUNT(*) FROM post_votes pv WHERE pv.post_id = p.id) as vote_count,
               (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id AND cm.deleted_at IS NULL) as reply_count,
               (SELECT COUNT(*) FROM post_votes pv WHERE pv.post_id = p.id AND pv.student_id = ?) as user_voted
        FROM posts p
        JOIN students u ON p.student_id = u.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.student_id = ? AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
      `,
      args: [currentStudentId, userId],
    });

    const posts = result.rows.map((row) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(String(row.tags || '[]'));
      } catch {
        tags = [];
      }
      return {
        id: Number(row.id),
        student_id: Number(row.student_id),
        category_id: Number(row.category_id),
        title: String(row.title),
        body: String(row.body),
        tags,
        is_pinned: Boolean(row.is_pinned),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        deleted_at: row.deleted_at ? String(row.deleted_at) : null,
        vote_count: Number(row.vote_count || 0),
        reply_count: Number(row.reply_count || 0),
        has_voted: Number(row.user_voted || 0) > 0,
        author: {
          id: Number(row.author_id),
          pseudonym: String(row.author_pseudonym),
          role: String(row.author_role),
          avatar_seed: String(row.author_avatar),
          created_at: String(row.author_created_at),
        },
        category: {
          id: Number(row.cat_id),
          slug: String(row.cat_slug),
          name: String(row.cat_name),
          description: String(row.cat_desc),
          accent: String(row.cat_accent),
          created_at: String(row.cat_created_at),
        },
      };
    });

    return res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return res.status(500).json({ error: 'Failed to load user posts' });
  }
});

// GET /api/users/:id/comments
usersRouter.get('/:id/comments', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await db.execute({
      sql: `
        SELECT c.id, c.post_id, c.student_id, c.parent_id, c.body, c.created_at, c.updated_at, c.deleted_at,
               p.title as post_title,
               (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id) as vote_count
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        WHERE c.student_id = ? AND c.deleted_at IS NULL
        ORDER BY c.created_at DESC
      `,
      args: [userId],
    });

    const comments = result.rows.map((row) => ({
      id: Number(row.id),
      post_id: Number(row.post_id),
      post_title: String(row.post_title),
      student_id: Number(row.student_id),
      parent_id: row.parent_id !== null ? Number(row.parent_id) : null,
      body: String(row.body),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      vote_count: Number(row.vote_count || 0),
    }));

    return res.json(comments);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    return res.status(500).json({ error: 'Failed to load user replies' });
  }
});
