import { Router } from 'express';
import { db } from '../db.js';
import { contactSchema } from '../../shared/types.js';

export const contactRouter = Router();

// POST /api/contact
contactRouter.post('/', async (req, res) => {
  try {
    const parseResult = contactSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.issues[0]?.message || 'Invalid contact form input',
      });
    }

    const { name, email, subject, message } = parseResult.data;

    await db.execute({
      sql: `
        INSERT INTO contact_messages (name, email, subject, message)
        VALUES (?, ?, ?, ?)
      `,
      args: [name.trim(), email.trim().toLowerCase(), subject.trim(), message.trim()],
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received by the Let’s Connect moderation and mentorship team.',
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    return res.status(500).json({ error: 'Failed to submit contact message.' });
  }
});
