const Message = require('../models/Message');
const { ApiResponse } = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const listMessages = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || PAGE_SIZE, MAX_PAGE_SIZE);
  const query = { projectId: req.project._id };

  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!Number.isNaN(before.getTime())) {
      query.createdAt = { $lt: before };
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'username avatarUrl');

  new ApiResponse(200, {
    messages: messages.map((m) => ({
      _id: m._id,
      content: m.content,
      createdAt: m.createdAt,
      user: { id: m.userId._id, username: m.userId.username, avatarUrl: m.userId.avatarUrl },
    })),
  }).send(res);
});

module.exports = { listMessages };