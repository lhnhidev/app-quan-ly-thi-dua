import { Application } from 'express';
import userRoutes from './user.routes';
import checkTokenRoutes from './checkToken.routes';
import classRoutes from './class.routes';
import ruleRoutes from './rule.routes';

const router = (app: Application): void => {
  app.use('/user', userRoutes);
  app.use('/check-token', checkTokenRoutes);
  app.use('/class', classRoutes);
  app.use('/rule', ruleRoutes);
};

export default router;
