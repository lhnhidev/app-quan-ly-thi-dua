import { Application } from 'express';
import userRoutes from './user.routes';

const router = (app: Application): void => {
  app.use('/users', userRoutes);
};

export default router;
