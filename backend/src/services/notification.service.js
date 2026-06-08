const { Notification } = require('../models/Communication.model');
const logger = require('../config/logger');

let io; // set by socket init

const setIO = (socketIO) => { io = socketIO; };

const create = async ({ recipientId, senderId, type, title, message, refModel, refId, actionUrl, actionText, channels = {} }) => {
  try {
    const notif = await Notification.create({
      recipientId, senderId, type, title, message,
      refModel, refId, actionUrl, actionText,
      channels: { inApp: true, ...channels },
    });

    // Emit socket
    if (io) {
      io.to(`user:${recipientId}`).emit('notification', notif);
    }

    return notif;
  } catch (err) {
    logger.error('Notification create error:', err.message);
  }
};

const markRead = async (userId, ids = 'all') => {
  if (ids === 'all') {
    return Notification.updateMany({ recipientId: userId, isRead: false }, { isRead: true, readAt: new Date() });
  }
  return Notification.updateMany({ _id: { $in: ids }, recipientId: userId }, { isRead: true, readAt: new Date() });
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipientId: userId, isRead: false, isDeleted: false });
};

module.exports = { setIO, create, markRead, getUnreadCount };
