import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.js';

// Load environmental configuration
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(express.json());
app.use(cookieParser());

// Serve frontend static assets from public/ folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount authentication router
app.use('/api/auth', authRouter);

// Fallback to route requests back to the frontend dashboard or login screen
app.get('*', (req, res, next) => {
  // API routes should not fallback to static HTML, pass to error handler or 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected internal error occurred.' });
});

// Start Express server
app.listen(PORT, () => {
  console.log('===================================================');
  console.log(`  Secure Authentication Server is running!`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log('===================================================');
});
