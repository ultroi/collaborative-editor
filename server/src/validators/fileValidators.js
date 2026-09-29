const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const createNodeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  type: z.enum(['file', 'folder']),
  parentId: objectId.nullable().optional().default(null),
  content: z.string().max(2_000_000, 'File is too large').optional().default(''),
});

const renameNodeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
});

const updateContentSchema = z.object({
  content: z.string().max(2_000_000, 'File is too large'),
});

const setPermissionSchema = z.object({
  userId: objectId,
  read: z.boolean().default(true),
  write: z.boolean().default(false),
});

module.exports = {
  createNodeSchema,
  renameNodeSchema,
  updateContentSchema,
  setPermissionSchema,
};
