import 'dotenv/config'; // must be first so env vars are loaded before db.js runs
import express from 'express';
import cors from 'cors';
import { router as authRouter } from './routes/routes.auth.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check (Render uses this to confirm the app is alive)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running perfectly' });
});

// Routes: register, login, sync-bulk and sync-single all live in this one router
app.use('/api/auth', authRouter);

// Render sets PORT automatically; locally it falls back to 5000
const PORT = process.env.PORT || 5000;

// 0.0.0.0 works both locally and on Render
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});