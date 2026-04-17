import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import connectDB from './config/db';
import router from './routes';
import { initializeSocket } from './config/socket';

const allowedOrigins = ['https://app-quan-ly-thi-dua.vercel.app', 'http://localhost:5173'];

dotenv.config();

connectDB();

const app: Application = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Cho phép gửi cookie/token nếu cần
  })
);
app.use(express.json());

router(app);
initializeSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
