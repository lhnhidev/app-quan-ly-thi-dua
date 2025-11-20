import { Application } from 'express';
import userRoutes from './user.routes';
import checkTokenRoutes from './checkToken.routes';
import classRoutes from './class.routes';
import ruleRoutes from './rule.routes';
import studentRoutes from './student.routes';
import recordFormRoutes from './recordForm.routes';

const router = (app: Application): void => {
  app.use('/user', userRoutes);
  app.use('/check-token', checkTokenRoutes);
  app.use('/class', classRoutes);
  app.use('/rule', ruleRoutes);
  app.use('/student', studentRoutes);
  app.use('/record-form', recordFormRoutes);
};

export default router;
