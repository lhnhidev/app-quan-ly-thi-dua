import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import router from './routes';

dotenv.config();

connectDB();

const app: Application = express();

app.use(cors());
app.use(express.json());

router(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
