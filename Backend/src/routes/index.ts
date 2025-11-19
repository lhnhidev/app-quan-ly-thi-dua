import { Application } from 'express';
import userRoutes from './user.routes';
import checkTokenRoutes from './checkToken.routes';

const router = (app: Application): void => {
  app.use('/user', userRoutes);
  app.use('/check-token', checkTokenRoutes);
};

export default router;
