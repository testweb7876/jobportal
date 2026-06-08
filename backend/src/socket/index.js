const { Server } = require('socket.io');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const notifService = require('../services/notification.service');
const { setMessageIO } = require('../controllers/extra.controller');
const logger = require('../config/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // ── Auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('firstName lastName role avatar status');
      if (!user || user.status !== 'active') return next(new Error('User not found or inactive'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.user.firstName} (${socket.user._id})`);

    // Join personal room
    socket.join(`user:${socket.user._id}`);

    // Join conversation room
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_typing', {
        userId: socket.user._id,
        name:   `${socket.user.firstName} ${socket.user.lastName}`,
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user_stop_typing', { userId: socket.user._id });
    });

    // Online status
    socket.broadcast.emit('user_online', { userId: socket.user._id });

    // Mark notification read via socket
    socket.on('mark_notification_read', async ({ notificationId }) => {
      await notifService.markRead(socket.user._id, [notificationId]);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`❌ Socket disconnected: ${socket.user.firstName} — ${reason}`);
      socket.broadcast.emit('user_offline', { userId: socket.user._id });
    });

    socket.on('error', (err) => {
      logger.error(`Socket error for ${socket.user._id}:`, err.message);
    });
  });

  // Share io with services
  notifService.setIO(io);
  setMessageIO(io);

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
