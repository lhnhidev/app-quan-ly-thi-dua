import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import SocialMessage from '../models/SocialMessage';
import Organization from '../models/Organization';

let io: SocketIOServer | null = null;
const onlineSocketCount = new Map<string, number>();

const orgRoom = (orgId: string) => `org:${orgId}`;
const userRoom = (orgId: string, userId: string) => `org:${orgId}:user:${userId}`;

type SocketAuthPayload = {
  id: string;
};

const updatePresence = async (orgId: string, userId: string, isOnline: boolean) => {
  const now = new Date();
  await User.findByIdAndUpdate(userId, {
    isOnline,
    lastSeenAt: now,
  });

  io?.to(orgRoom(orgId)).emit('social:presence', {
    userId,
    isOnline,
    lastSeenAt: now,
  });
};

const syncDeliveredMessages = async (orgId: string, receiverId: string) => {
  const pending = await SocialMessage.find({
    receiver: receiverId,
    delivered: false,
    recalled: false,
  })
    .select('_id sender')
    .lean();

  if (pending.length === 0) return;

  const now = new Date();
  const messageIds = pending.map((item: any) => item._id);

  await SocialMessage.updateMany(
    { _id: { $in: messageIds } },
    {
      delivered: true,
      deliveredAt: now,
    }
  );

  const groupedBySender = new Map<string, string[]>();

  pending.forEach((item: any) => {
    const senderId = String(item.sender);
    const current = groupedBySender.get(senderId) || [];
    current.push(String(item._id));
    groupedBySender.set(senderId, current);
  });

  groupedBySender.forEach((ids, senderId) => {
    io?.to(userRoom(orgId, senderId)).emit('social:message-status', {
      fromUserId: receiverId,
      status: 'delivered',
      messageIds: ids,
      updatedAt: now,
    });
  });
};

const canCommunicateInOrg = async (orgId: string, fromUserId: string, toUserId: string) => {
  if (!orgId || !fromUserId || !toUserId) return false;
  if (fromUserId === toUserId) return false;

  const organization = await Organization.findOne({
    _id: orgId,
    members: {
      $all: [
        { $elemMatch: { user: fromUserId, status: 'approved' } },
        { $elemMatch: { user: toUserId, status: 'approved' } },
      ],
    },
  })
    .select('_id')
    .lean();

  return Boolean(organization);
};

const attachSocialSocketEvents = (socket: Socket) => {
  const user = (socket as any).user;
  const userId = String(user?._id || '');
  const orgId = String((socket as any).organizationId || '');

  if (!userId || !orgId) {
    socket.disconnect(true);
    return;
  }

  socket.join(userRoom(orgId, userId));
  socket.join(orgRoom(orgId));

  const currentCount = onlineSocketCount.get(userId) || 0;
  onlineSocketCount.set(userId, currentCount + 1);

  if (currentCount === 0) {
    updatePresence(orgId, userId, true).catch((error) => {
      console.error('Update presence (online) error:', error);
    });

    syncDeliveredMessages(orgId, userId).catch((error) => {
      console.error('Sync delivered messages error:', error);
    });
  }

  socket.on('social:typing', (payload: { toUserId: string; isTyping: boolean }) => {
    if (!payload?.toUserId) return;

    canCommunicateInOrg(orgId, userId, payload.toUserId)
      .then((canSend) => {
        if (!canSend) return;
        io?.to(userRoom(orgId, payload.toUserId)).emit('social:typing', {
          fromUserId: userId,
          isTyping: Boolean(payload.isTyping),
        });
      })
      .catch((error) => {
        console.error('Typing permission error:', error);
      });
  });

  socket.on(
    'social:call-request',
    (payload: { toUserId: string; callType: 'audio' | 'video'; caller: unknown }) => {
      if (!payload?.toUserId || payload.toUserId === userId) return;

      canCommunicateInOrg(orgId, userId, payload.toUserId)
        .then((canSend) => {
          if (!canSend) return;
          io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-request', {
            fromUserId: userId,
            callType: payload.callType,
            caller: payload.caller,
          });
        })
        .catch((error) => {
          console.error('Call request permission error:', error);
        });
    }
  );

  socket.on('social:call-cancelled', (payload: { toUserId: string }) => {
    if (!payload?.toUserId || payload.toUserId === userId) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-cancelled', {
      fromUserId: userId,
    });
  });

  socket.on('social:call-accepted', (payload: { toUserId: string; callType: 'audio' | 'video' }) => {
    if (!payload?.toUserId || payload.toUserId === userId) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-accepted', {
      fromUserId: userId,
      callType: payload.callType,
    });
  });

  socket.on('social:call-rejected', (payload: { toUserId: string; reason?: string }) => {
    if (!payload?.toUserId || payload.toUserId === userId) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-rejected', {
      fromUserId: userId,
      reason: payload.reason || 'declined',
    });
  });

  socket.on('social:call-busy', (payload: { toUserId: string }) => {
    if (!payload?.toUserId || payload.toUserId === userId) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-busy', {
      fromUserId: userId,
    });
  });

  socket.on('social:call-offer', (payload: { toUserId: string; offer: RTCSessionDescriptionInit }) => {
    if (!payload?.toUserId || payload.toUserId === userId || !payload.offer) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-offer', {
      fromUserId: userId,
      offer: payload.offer,
    });
  });

  socket.on('social:call-answer', (payload: { toUserId: string; answer: RTCSessionDescriptionInit }) => {
    if (!payload?.toUserId || payload.toUserId === userId || !payload.answer) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-answer', {
      fromUserId: userId,
      answer: payload.answer,
    });
  });

  socket.on('social:call-ice-candidate', (payload: { toUserId: string; candidate: RTCIceCandidateInit }) => {
    if (!payload?.toUserId || payload.toUserId === userId || !payload.candidate) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-ice-candidate', {
      fromUserId: userId,
      candidate: payload.candidate,
    });
  });

  socket.on('social:call-ended', (payload: { toUserId: string }) => {
    if (!payload?.toUserId || payload.toUserId === userId) return;

    io?.to(userRoom(orgId, payload.toUserId)).emit('social:call-ended', {
      fromUserId: userId,
    });
  });

  socket.on('disconnect', () => {
    const count = onlineSocketCount.get(userId) || 0;
    const nextCount = Math.max(0, count - 1);

    if (nextCount === 0) {
      onlineSocketCount.delete(userId);
      updatePresence(orgId, userId, false).catch((error) => {
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
      const organizationId = String(socket.handshake.auth?.organizationId || '').trim();

      if (!token || !organizationId) {
        next(new Error('Unauthorized'));
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as SocketAuthPayload;

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        next(new Error('Unauthorized'));
        return;
      }

      const membership = await Organization.findOne({
        _id: organizationId,
        members: {
          $elemMatch: {
            user: decoded.id,
            status: 'approved',
          },
        },
      })
        .select('_id')
        .lean();

      if (!membership) {
        next(new Error('Unauthorized'));
        return;
      }

      (socket as any).user = user;
      (socket as any).organizationId = organizationId;
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

export const emitToUser = (orgId: string, userId: string, event: string, payload: unknown) => {
  if (!io) return;
  io.to(userRoom(orgId, userId)).emit(event, payload);
};
