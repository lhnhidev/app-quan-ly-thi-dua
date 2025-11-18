import { Application } from 'express';
import userRoutes from './user.routes';

const router = (app: Application): void => {
  app.use('/user', userRoutes);
};

export default router;
