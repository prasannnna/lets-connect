import { Router } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, requireModerator } from '../auth.js';
import { updateReportSchema } from '../../shared/types.js';

export const moderationRouter = Router();

// Apply requireModerator to all routes in this router
moderationRouter.use(requireModerator);

// GET /api/moderation/reports
moderationRouter.get('/reports', async (req: AuthenticatedRequest, res) => {
  try {
    const status = req.query.status as string;
    let whereClause = '';
    const args: any[] = [];

    if (status && ['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      whereClause = 'WHERE r.status = ?';
      args.push(status);
    }

    const result = await db.execute({
      sql: `
        SELECT r.id, r.reporter_student_id, r.post_id, r.comment_id, r.reason, r.details,
               r.status, r.reviewed_by, r.reviewed_at, r.moderator_notes, r.created_at, r.updated_at,
               rep.pseudonym as reporter_pseudonym,
               rev.pseudonym as reviewer_pseudonym,
               p.title as post_title, p.body as post_body, p.deleted_at as post_deleted_at,
               c.body as comment_body, c.deleted_at as comment_deleted_at
        FROM reports r
        JOIN students rep ON r.reporter_student_id = rep.id
        LEFT JOIN students rev ON r.reviewed_by = rev.id
        LEFT JOIN posts p ON r.post_id = p.id
        LEFT JOIN comments c ON r.comment_id = c.id
        ${whereClause}
        ORDER BY 
          CASE r.status
            WHEN 'open' THEN 1
            WHEN 'reviewing' THEN 2
            WHEN 'resolved' THEN 3
            ELSE 4
          END ASC,
          r.created_at DESC
      `,
      args,
    });

    const reports = result.rows.map((row) => ({
      id: Number(row.id),
      reporter_student_id: Number(row.reporter_student_id),
      post_id: row.post_id !== null ? Number(row.post_id) : null,
      comment_id: row.comment_id !== null ? Number(row.comment_id) : null,
      reason: String(row.reason),
      details: row.details ? String(row.details) : null,
      status: String(row.status),
      reviewed_by: row.reviewed_by !== null ? Number(row.reviewed_by) : null,
      reviewed_at: row.reviewed_at ? String(row.reviewed_at) : null,
      moderator_notes: row.moderator_notes ? String(row.moderator_notes) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
      target_type: row.post_id ? 'post' : 'comment',
      reporter_pseudonym: String(row.reporter_pseudonym),
      reviewer_pseudonym: row.reviewer_pseudonym ? String(row.reviewer_pseudonym) : undefined,
      post: row.post_id ? {
        id: Number(row.post_id),
        title: String(row.post_title || ''),
        body: String(row.post_body || ''),
        is_deleted: row.post_deleted_at !== null,
      } : null,
      comment: row.comment_id ? {
        id: Number(row.comment_id),
        body: String(row.comment_body || ''),
        is_deleted: row.comment_deleted_at !== null,
      } : null,
    }));

    return res.json(reports);
  } catch (error) {
    console.error('Error loading reports:', error);
    return res.status(500).json({ error: 'Failed to fetch moderation reports' });
  }
});

// PATCH /api/moderation/reports/:id
moderationRouter.patch('/reports/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      return res.status(400).json({ error: 'Invalid report ID' });
    }

    const parseResult = updateReportSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid moderation report update',
      });
    }

    const { status, moderator_notes } = parseResult.data;
    const moderatorId = req.user!.id;

    await db.execute({
      sql: `
        UPDATE reports
        SET status = ?, moderator_notes = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      args: [status, moderator_notes || null, moderatorId, reportId],
    });

    return res.json({ success: true, message: 'Report status updated by moderator.' });
  } catch (error) {
    console.error('Error updating report:', error);
    return res.status(500).json({ error: 'Failed to update report.' });
  }
});

// DELETE /api/moderation/posts/:id (Moderator action)
moderationRouter.delete('/posts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    await db.execute({
      sql: 'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [postId],
    });

    // Auto-resolve associated reports
    await db.execute({
      sql: `
        UPDATE reports 
        SET status = 'resolved', moderator_notes = COALESCE(moderator_notes, 'Post removed by moderator for safety violation'),
            reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE post_id = ? AND status IN ('open', 'reviewing')
      `,
      args: [req.user!.id, postId],
    });

    return res.json({ success: true, message: 'Post removed by moderator.' });
  } catch (error) {
    console.error('Moderator post delete error:', error);
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// DELETE /api/moderation/comments/:id (Moderator action)
moderationRouter.delete('/comments/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);
    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    await db.execute({
      sql: 'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [commentId],
    });

    // Auto-resolve associated reports
    await db.execute({
      sql: `
        UPDATE reports 
        SET status = 'resolved', moderator_notes = COALESCE(moderator_notes, 'Comment removed by moderator'),
            reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE comment_id = ? AND status IN ('open', 'reviewing')
      `,
      args: [req.user!.id, commentId],
    });

    return res.json({ success: true, message: 'Reply removed by moderator.' });
  } catch (error) {
    console.error('Moderator comment delete error:', error);
    return res.status(500).json({ error: 'Failed to delete comment.' });
  }
});
