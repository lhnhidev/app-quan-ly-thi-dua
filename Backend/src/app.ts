import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import router from './routes';

const allowedOrigins = ['https://app-quan-ly-thi-dua.vercel.app', 'http://localhost:5173'];

dotenv.config();

connectDB();

const app: Application = express();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
