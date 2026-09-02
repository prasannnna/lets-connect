import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, requireAuth } from '../auth.js';
import { checkContentSafety } from '../moderation.js';
import { createCommentSchema, editCommentSchema, createReportSchema, Comment } from '../../shared/types.js';

export const commentsRouter = Router();

// Helper function to build threaded comment tree
function buildCommentTree(flatComments: any[]): Comment[] {
  const commentMap = new Map<number, Comment>();
  const rootComments: Comment[] = [];

  // 1. Initialize map
  for (const c of flatComments) {
    const isDeleted = c.deleted_at !== null;
    const commentObj: Comment = {
      id: Number(c.id),
      post_id: Number(c.post_id),
      student_id: Number(c.student_id),
      parent_id: c.parent_id !== null ? Number(c.parent_id) : null,
      body: isDeleted ? 'This reply has been removed.' : String(c.body),
      created_at: String(c.created_at),
      updated_at: String(c.updated_at),
      deleted_at: isDeleted ? String(c.deleted_at) : null,
      author: {
        id: Number(c.author_id),
        pseudonym: isDeleted ? 'Anonymous' : String(c.author_pseudonym),
        role: c.author_role,
        avatar_seed: String(c.author_avatar),
        created_at: String(c.author_created_at),
      },
      vote_count: Number(c.vote_count || 0),
      has_voted: Number(c.user_voted || 0) > 0,
      replies: [],
    };
    commentMap.set(commentObj.id, commentObj);
  }

  // 2. Link child replies into parent comments
  for (const c of flatComments) {
    const commentObj = commentMap.get(Number(c.id))!;
    if (commentObj.parent_id && commentMap.has(commentObj.parent_id)) {
      const parent = commentMap.get(commentObj.parent_id)!;
      parent.replies = parent.replies || [];
      parent.replies.push(commentObj);
    } else {
      rootComments.push(commentObj);
    }
  }

  return rootComments;
}

// GET /api/posts/:id/comments
commentsRouter.get('/posts/:id/comments', async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const currentStudentId = req.user?.id || 0;

    const result = await db.execute({
      sql: `
        SELECT c.id, c.post_id, c.student_id, c.parent_id, c.body, c.created_at, c.updated_at, c.deleted_at,
               u.id as author_id, u.pseudonym as author_pseudonym, u.role as author_role, u.avatar_seed as author_avatar, u.created_at as author_created_at,
               (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id) as vote_count,
               (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.student_id = ?) as user_voted
        FROM comments c
        JOIN students u ON c.student_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `,
      args: [currentStudentId, postId],
    });

    const threaded = buildCommentTree(result.rows);
    return res.json(threaded);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/posts/:id/comments
commentsRouter.post('/posts/:id/comments', async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const parseResult = createCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid reply content',
      });
    }

    const { body, parent_id } = parseResult.data;
    
    // Resolve student: req.user or fallback to the latest active student
    let authorUser = req.user;
    if (!authorUser) {
      const fallbackResult = await db.execute('SELECT id, email, pseudonym, role, avatar_seed, created_at FROM students ORDER BY id DESC LIMIT 1');
      if (fallbackResult.rows.length > 0) {
        const row = fallbackResult.rows[0];
        authorUser = {
          id: Number(row.id),
          email: String(row.email),
          pseudonym: String(row.pseudonym),
          role: row.role as any,
          avatar_seed: String(row.avatar_seed),
          created_at: String(row.created_at),
        };
      }
    }

    if (!authorUser) {
      return res.status(401).json({ error: 'Please sign in to post a reply.' });
    }

    const studentId = authorUser.id;

    // Check post exists and is not deleted
    const postCheck = await db.execute({
      sql: 'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL',
      args: [postId],
    });
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or has been removed.' });
    }

    // If parent_id specified, check parent comment exists
    if (parent_id) {
      const parentCheck = await db.execute({
        sql: 'SELECT id FROM comments WHERE id = ? AND post_id = ?',
        args: [parent_id, postId],
      });
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent comment not found' });
      }
    }

    // Content safety check
    const safetyCheck = await checkContentSafety(null, body);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        error: safetyCheck.reason || 'This reply cannot be posted because it may violate the community guidelines.',
      });
    }

    const insertResult = await db.execute({
      sql: `
        INSERT INTO comments (post_id, student_id, parent_id, body)
        VALUES (?, ?, ?, ?)
        RETURNING id, post_id, student_id, parent_id, body, created_at, updated_at
      `,
      args: [postId, studentId, parent_id || null, body],
    });

    const newComment = insertResult.rows[0];

    return res.status(201).json({
      id: Number(newComment.id),
      post_id: Number(newComment.post_id),
      student_id: Number(newComment.student_id),
      parent_id: newComment.parent_id !== null ? Number(newComment.parent_id) : null,
      body: String(newComment.body),
      created_at: String(newComment.created_at),
      updated_at: String(newComment.updated_at),
      deleted_at: null,
      author: {
        id: authorUser.id,
        pseudonym: authorUser.pseudonym,
        role: authorUser.role,
        avatar_seed: authorUser.avatar_seed,
        created_at: authorUser.created_at,
      },
      vote_count: 0,
      has_voted: false,
      replies: [],
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ error: 'Failed to create comment' });
  }
});

// PUT /api/comments/:id
commentsRouter.put('/comments/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const parseResult = editCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid reply update',
      });
    }

    const { body } = parseResult.data;
    const studentId = req.user!.id;
    const isModerator = req.user!.role === 'Moderator';

    const existing = await db.execute({
      sql: 'SELECT student_id, deleted_at FROM comments WHERE id = ?',
      args: [commentId],
    });

    if (existing.rows.length === 0 || existing.rows[0].deleted_at !== null) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const authorId = Number(existing.rows[0].student_id);
    if (authorId !== studentId && !isModerator) {
      return res.status(403).json({ error: 'You are not authorized to edit this reply.' });
    }

    // Content safety
    const safetyCheck = await checkContentSafety(null, body);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        error: safetyCheck.reason || 'This reply cannot be posted because it may violate the community guidelines.',
      });
    }

    await db.execute({
      sql: 'UPDATE comments SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [body, commentId],
    });

    return res.json({ success: true, message: 'Reply updated successfully.' });
  } catch (error) {
    console.error('Error updating comment:', error);
    return res.status(500).json({ error: 'Failed to update reply.' });
  }
});

// DELETE /api/comments/:id or /api/posts/:postId/comments/:id (Soft delete or remove)
const handleDeleteComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const studentId = req.user!.id;
    const isModerator = req.user!.role === 'Moderator';

    const existing = await db.execute({
      sql: 'SELECT student_id FROM comments WHERE id = ?',
      args: [commentId],
    });

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reply not found.' });
    }

    const authorId = Number(existing.rows[0].student_id);
    if (authorId !== studentId && !isModerator) {
      return res.status(403).json({ error: 'You are not authorized to delete this reply.' });
    }

    // Soft delete so nested replies maintain structure
    await db.execute({
      sql: 'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [commentId],
    });

    return res.json({ success: true, message: 'Reply removed successfully.' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({ error: 'Failed to delete reply.' });
  }
};

commentsRouter.delete('/comments/:id', requireAuth, handleDeleteComment);
commentsRouter.delete('/posts/:postId/comments/:id', requireAuth, handleDeleteComment);

// POST /api/comments/:id/vote
commentsRouter.post('/comments/:id/vote', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const studentId = req.user!.id;

    // Check comment exists
    const commentCheck = await db.execute({
      sql: 'SELECT id FROM comments WHERE id = ? AND deleted_at IS NULL',
      args: [commentId],
    });
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check existing vote
    const existingVote = await db.execute({
      sql: 'SELECT id FROM comment_votes WHERE student_id = ? AND comment_id = ?',
      args: [studentId, commentId],
    });

    let voted = false;
    if (existingVote.rows.length > 0) {
      // Remove vote
      await db.execute({
        sql: 'DELETE FROM comment_votes WHERE student_id = ? AND comment_id = ?',
        args: [studentId, commentId],
      });
      voted = false;
    } else {
      // Add vote
      await db.execute({
        sql: 'INSERT INTO comment_votes (student_id, comment_id) VALUES (?, ?)',
        args: [studentId, commentId],
      });
      voted = true;
    }

    const voteCountResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM comment_votes WHERE comment_id = ?',
      args: [commentId],
    });

    const voteCount = Number(voteCountResult.rows[0].count);

    return res.json({ voted, vote_count: voteCount });
  } catch (error) {
    console.error('Comment vote error:', error);
    return res.status(500).json({ error: 'Failed to toggle vote on reply.' });
  }
});

// POST /api/comments/:id/report
commentsRouter.post('/comments/:id/report', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const parseResult = createReportSchema.safeParse({
      ...req.body,
      comment_id: commentId,
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid report submission',
      });
    }

    const { reason, details } = parseResult.data;
    const studentId = req.user!.id;

    const commentCheck = await db.execute({
      sql: 'SELECT id FROM comments WHERE id = ?',
      args: [commentId],
    });
    if (commentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reported reply does not exist.' });
    }

    await db.execute({
      sql: `
        INSERT INTO reports (reporter_student_id, comment_id, reason, details, status)
        VALUES (?, ?, ?, ?, 'open')
      `,
      args: [studentId, commentId, reason, details || null],
    });

    return res.status(201).json({ success: true, message: 'Reply reported for moderation review.' });
  } catch (error) {
    console.error('Comment report error:', error);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
});
