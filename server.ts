import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './src/server/db.js';
import { seedDatabase } from './src/server/seed.js';
import { authMiddleware } from './src/server/auth.js';
import { authRouter } from './src/server/routes/auth.js';
import { categoriesRouter } from './src/server/routes/categories.js';
import { postsRouter } from './src/server/routes/posts.js';
import { commentsRouter } from './src/server/routes/comments.js';
import { usersRouter } from './src/server/routes/users.js';
import { exploreRouter } from './src/server/routes/explore.js';
import { moderationRouter } from './src/server/routes/moderation.js';
import { contactRouter } from './src/server/routes/contact.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB and Seed Data
  await initDatabase();
  await seedDatabase();

  // Middleware
  app.use(express.json());
  app.use(cookieParser());
  app.use(authMiddleware as express.RequestHandler);

  // Health check
  app.get('/api/healthz', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/session', (req: any, res) => {
    res.json({ user: req.user || null });
  });
  app.use('/api/categories', categoriesRouter);
  app.use('/api/feed', postsRouter); // Feed endpoint
  app.use('/api/posts', postsRouter);
  app.use('/api', commentsRouter); // Comments endpoints (/api/posts/:id/comments, /api/comments/:id)
  app.use('/api/users', usersRouter);
  app.use('/api/explore', exploreRouter);
  app.use('/api/moderation', moderationRouter);
  app.use('/api/contact', contactRouter);

  // Vite middleware for development vs production static serve
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LET'S CONNECT Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
