import { Application } from 'express';
import userRoutes from './user.routes';
import checkTokenRoutes from './checkToken.routes';
import classRoutes from './class.routes';
import roleRoutes from './role.routes';
import studentRoutes from './student.routes';
import recordFormRoutes from './recordForm.routes';
import teacherRoutes from './teacher.routes';
import assignClassesRoutes from './assignClasses.routes';
import responseRoutes from './response.routes';

const router = (app: Application): void => {
  app.use('/user', userRoutes);
  app.use('/check-token', checkTokenRoutes);
  app.use('/class', classRoutes);
  app.use('/role', roleRoutes);
  app.use('/student', studentRoutes);
  app.use('/record-form', recordFormRoutes);
  app.use('/teacher', teacherRoutes);
  app.use('/assign-classes', assignClassesRoutes);
  app.use('/response', responseRoutes);
};

export default router;
