import { Application } from 'express';
import userRoutes from './user.routes';
import dashboardRoutes from './dashboard.routes';

const router = (app: Application): void => {
  app.use('/user', userRoutes);
  app.use('/dashboard', dashboardRoutes);
};

export default router;
