import { Router } from 'express';
import { db } from '../db.js';

export const categoriesRouter = Router();

// GET /api/categories
categoriesRouter.get('/', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.deleted_at IS NULL) as posts_count
      FROM categories c
      ORDER BY c.id ASC
    `);

    const categories = result.rows.map((row) => ({
      id: Number(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description),
      accent: String(row.accent),
      created_at: String(row.created_at),
      posts_count: Number(row.posts_count || 0),
    }));

    return res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});
