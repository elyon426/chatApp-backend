
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {router} from './routes/routes.auth.js'; // Adjust this path to match where your router file lives

// Load environment variables from a .env file
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Allows the server to accept JSON data in the request body

// Health check route (Render looks for this to ensure your app hasn't crashed)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running perfectly' });
});

// Routes
app.use('/api/auth', router);

// Render sets the PORT environment variable automatically. Locally, it defaults to 5000.
const PORT = process.env.PORT || 5000;

// Host must be 0.0.0.0 for Render to bind to the network externally, defaults to localhost for local testing
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`Server is actively running on http://${HOST}:${PORT}`);
});
