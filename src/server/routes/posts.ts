import { Router } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, requireAuth, toPublicStudent } from '../auth.js';
import { checkContentSafety } from '../moderation.js';
import { createPostSchema, editPostSchema, createReportSchema } from '../../shared/types.js';

export const postsRouter = Router();

// GET /api/feed & GET /api/posts
postsRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const tab = (req.query.tab as string) || 'trending';
    const categorySlug = req.query.category as string;
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '15', 10)));
    const offset = (page - 1) * limit;
    const currentStudentId = req.user?.id || 0;

    let whereClause = 'WHERE p.deleted_at IS NULL';
    const args: any[] = [];

    if (categorySlug) {
      whereClause += ' AND c.slug = ?';
      args.push(categorySlug);
    }

    let orderByClause = '';
    if (tab === 'latest') {
      orderByClause = 'ORDER BY p.is_pinned DESC, p.created_at DESC';
    } else if (tab === 'top') {
      orderByClause = 'ORDER BY p.is_pinned DESC, vote_count DESC, p.created_at DESC';
    } else {
      // Trending: ranking based on engagement & recency
      orderByClause = `
        ORDER BY p.is_pinned DESC,
        ((CAST(vote_count AS REAL) * 3.0 + CAST(reply_count AS REAL) * 2.0 + 1.0) / 
         (POWER(((strftime('%s', 'now') - strftime('%s', p.created_at)) / 3600.0) + 2.0, 1.25))) DESC
      `;
    }

    const query = `
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
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const totalCountQuery = `
      SELECT COUNT(*) as total
      FROM posts p
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const countArgs = categorySlug ? [categorySlug] : [];
    const countResult = await db.execute({ sql: totalCountQuery, args: countArgs });
    const total = Number(countResult.rows[0]?.total || 0);

    const fullArgs = [currentStudentId, ...args, limit, offset];
    const result = await db.execute({ sql: query, args: fullArgs });

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

    return res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Feed fetch error:', error);
    return res.status(500).json({ error: 'Failed to load posts feed' });
  }
});

// GET /api/posts/:id
postsRouter.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
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
        WHERE p.id = ? AND p.deleted_at IS NULL
      `,
      args: [currentStudentId, postId],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or has been removed.' });
    }

    const row = result.rows[0];
    let tags: string[] = [];
    try {
      tags = JSON.parse(String(row.tags || '[]'));
    } catch {
      tags = [];
    }

    const post = {
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

    return res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ error: 'Failed to fetch post details' });
  }
});

// POST /api/posts
postsRouter.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid post input',
      });
    }

    const { title, body, category_id, tags } = parseResult.data;
    const studentId = req.user!.id;

    // Check Content Safety
    const safetyCheck = await checkContentSafety(title, body);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        error: safetyCheck.reason || 'This content cannot be posted because it may violate the community guidelines.',
      });
    }

    // Verify category exists
    const categoryCheck = await db.execute({
      sql: 'SELECT id FROM categories WHERE id = ?',
      args: [category_id],
    });
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Selected category does not exist.' });
    }

    const insertResult = await db.execute({
      sql: `
        INSERT INTO posts (student_id, category_id, title, body, tags)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
      `,
      args: [studentId, category_id, title, body, JSON.stringify(tags || [])],
    });

    const newPostId = Number(insertResult.rows[0].id);

    return res.status(201).json({ id: newPostId, message: 'Post created successfully.' });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Failed to create post.' });
  }
});

// PUT /api/posts/:id
postsRouter.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const parseResult = editPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid post update',
      });
    }

    const { title, body, category_id, tags } = parseResult.data;
    const studentId = req.user!.id;
    const isModerator = req.user!.role === 'Moderator';

    // Verify post exists and user is author or moderator
    const existing = await db.execute({
      sql: 'SELECT student_id, deleted_at FROM posts WHERE id = ?',
      args: [postId],
    });

    if (existing.rows.length === 0 || existing.rows[0].deleted_at !== null) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const authorId = Number(existing.rows[0].student_id);
    if (authorId !== studentId && !isModerator) {
      return res.status(403).json({ error: 'You are not authorized to edit this post.' });
    }

    // Content safety
    const safetyCheck = await checkContentSafety(title, body);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        error: safetyCheck.reason || 'This content cannot be posted because it may violate the community guidelines.',
      });
    }

    await db.execute({
      sql: `
        UPDATE posts
        SET title = ?, body = ?, category_id = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [title, body, category_id, JSON.stringify(tags || []), postId],
    });

    return res.json({ success: true, message: 'Post updated successfully.' });
  } catch (error) {
    console.error('Error updating post:', error);
    return res.status(500).json({ error: 'Failed to update post.' });
  }
});

// DELETE /api/posts/:id (Soft deletion)
postsRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const studentId = req.user!.id;
    const isModerator = req.user!.role === 'Moderator';

    const existing = await db.execute({
      sql: 'SELECT student_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      args: [postId],
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or already deleted.' });
    }

    const authorId = Number(existing.rows[0].student_id);
    if (authorId !== studentId && !isModerator) {
      return res.status(403).json({ error: 'You are not authorized to delete this post.' });
    }

    await db.execute({
      sql: 'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [postId],
    });

    return res.json({ success: true, message: 'Post removed successfully.' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// POST /api/posts/:id/vote
postsRouter.post('/:id/vote', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const studentId = req.user!.id;

    // Check post exists
    const postCheck = await db.execute({
      sql: 'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL',
      args: [postId],
    });
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check existing vote
    const existingVote = await db.execute({
      sql: 'SELECT id FROM post_votes WHERE student_id = ? AND post_id = ?',
      args: [studentId, postId],
    });

    let voted = false;
    if (existingVote.rows.length > 0) {
      // Remove vote (toggle off)
      await db.execute({
        sql: 'DELETE FROM post_votes WHERE student_id = ? AND post_id = ?',
        args: [studentId, postId],
      });
      voted = false;
    } else {
      // Add vote (toggle on)
      await db.execute({
        sql: 'INSERT INTO post_votes (student_id, post_id) VALUES (?, ?)',
        args: [studentId, postId],
      });
      voted = true;
    }

    // Get updated total vote count
    const voteCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM post_votes WHERE post_id = ?',
      args: [postId],
    });

    const voteCount = Number(voteCountResult.rows[0].count);

    return res.json({ voted, vote_count: voteCount });
  } catch (error) {
    console.error('Vote error:', error);
    return res.status(500).json({ error: 'Failed to toggle vote on post.' });
  }
});

// POST /api/posts/:id/report
postsRouter.post('/:id/report', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const parseResult = createReportSchema.safeParse({
      ...req.body,
      post_id: postId,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid report submission',
      });
    }

    const { reason, details } = parseResult.data;
    const studentId = req.user!.id;

    // Check post exists
    const postCheck = await db.execute({
      sql: 'SELECT id FROM posts WHERE id = ?',
      args: [postId],
    });
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reported post does not exist.' });
    }

    await db.execute({
      sql: `
        INSERT INTO reports (reporter_student_id, post_id, reason, details, status)
        VALUES (?, ?, ?, ?, 'open')
      `,
      args: [studentId, postId, reason, details || null],
    });

    return res.status(201).json({ success: true, message: 'Report submitted for moderation review.' });
  } catch (error) {
    console.error('Post report error:', error);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
});
