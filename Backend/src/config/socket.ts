import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';

let io: SocketIOServer | null = null;
const onlineSocketCount = new Map<string, number>();

const userRoom = (userId: string) => `user:${userId}`;

type SocketAuthPayload = {
  id: string;
};

const updatePresence = async (userId: string, isOnline: boolean) => {
  const now = new Date();
  await User.findByIdAndUpdate(userId, {
    isOnline,
    lastSeenAt: now,
  });

  io?.emit('social:presence', {
    userId,
    isOnline,
    lastSeenAt: now,
  });
};

const attachSocialSocketEvents = (socket: Socket) => {
  const user = (socket as any).user;
  const userId = String(user?._id || '');

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  socket.join(userRoom(userId));

  const currentCount = onlineSocketCount.get(userId) || 0;
  onlineSocketCount.set(userId, currentCount + 1);

  if (currentCount === 0) {
    updatePresence(userId, true).catch((error) => {
      console.error('Update presence (online) error:', error);
    });
  }

  socket.on('social:typing', (payload: { toUserId: string; isTyping: boolean }) => {
    if (!payload?.toUserId) return;

    io?.to(userRoom(payload.toUserId)).emit('social:typing', {
      fromUserId: userId,
      isTyping: Boolean(payload.isTyping),
    });
  });

  socket.on('disconnect', () => {
    const count = onlineSocketCount.get(userId) || 0;
    const nextCount = Math.max(0, count - 1);

    if (nextCount === 0) {
      onlineSocketCount.delete(userId);
      updatePresence(userId, false).catch((error) => {
        console.error('Update presence (offline) error:', error);
      });
    } else {
      onlineSocketCount.set(userId, nextCount);
    }
  });
};

export const initializeSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: ['https://app-quan-ly-thi-dua.vercel.app', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = String(socket.handshake.auth?.token || '');

      if (!token) {
        next(new Error('Unauthorized'));
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as SocketAuthPayload;

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        next(new Error('Unauthorized'));
        return;
      }

      (socket as any).user = user;
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  io.on('connection', attachSocialSocketEvents);

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO chưa được khởi tạo');
  }

  return io;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
};
