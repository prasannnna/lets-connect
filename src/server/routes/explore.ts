import { Router } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../auth.js';

export const exploreRouter = Router();

// GET /api/explore
exploreRouter.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const q = ((req.query.q as string) || '').trim();
    const categorySlug = (req.query.category as string) || '';
    const tag = ((req.query.tag as string) || '').trim();
    const sort = (req.query.sort as string) || 'trending';
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '20', 10)));
    const offset = (page - 1) * limit;
    const currentStudentId = req.user?.id || 0;

    let whereConditions = ['p.deleted_at IS NULL'];
    const args: any[] = [];

    if (q) {
      whereConditions.push('(p.title LIKE ? OR p.body LIKE ? OR p.tags LIKE ?)');
      const searchPattern = `%${q}%`;
      args.push(searchPattern, searchPattern, searchPattern);
    }

    if (categorySlug) {
      whereConditions.push('c.slug = ?');
      args.push(categorySlug);
    }

    if (tag) {
      whereConditions.push('p.tags LIKE ?');
      args.push(`%"${tag}"%`);
    }

    let orderBy = '';
    if (sort === 'latest') {
      orderBy = 'ORDER BY p.created_at DESC';
    } else if (sort === 'top') {
      orderBy = 'ORDER BY vote_count DESC, p.created_at DESC';
    } else if (sort === 'replies') {
      orderBy = 'ORDER BY reply_count DESC, p.created_at DESC';
    } else {
      // Trending sort
      orderBy = `
        ORDER BY
        ((CAST(vote_count AS REAL) * 3.0 + CAST(reply_count AS REAL) * 2.0 + 1.0) / 
         (POWER(((strftime('%s', 'now') - strftime('%s', p.created_at)) / 3600.0) + 2.0, 1.25))) DESC
      `;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

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
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM posts p
      JOIN categories c ON p.category_id = c.id
      ${whereClause}
    `;

    const countResult = await db.execute({ sql: countQuery, args });
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
  } catch (error) {
    console.error('Explore search error:', error);
    return res.status(500).json({ error: 'Failed to search explore posts' });
  }
});
