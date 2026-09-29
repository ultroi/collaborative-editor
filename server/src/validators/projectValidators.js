const { z } = require('zod');

const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(100),

  description: z
    .string()
    .trim()
    .max(500)
    .optional()
    .default(''),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  settings: z
    .object({
      visibility: z
        .enum(['private', 'team'])
        .optional(),

      collaboration: z
        .object({
          enabled: z
            .boolean()
            .optional(),

          presenceEnabled: z
            .boolean()
            .optional(),

          fileLockingEnabled: z
            .boolean()
            .optional(),

          teamChatEnabled: z
            .boolean()
            .optional(),
        })
        .optional(),

      editor: z
        .object({
          autoSave: z
            .boolean()
            .optional(),

          minimap: z
            .boolean()
            .optional(),

          wordWrap: z
            .boolean()
            .optional(),

          formatOnSave: z
            .boolean()
            .optional(),
        })
        .optional(),

      files: z
        .object({
          confirmDelete: z
            .boolean()
            .optional(),

          showHiddenFiles: z
            .boolean()
            .optional(),
        })
        .optional(),

      notifications: z
        .object({
          memberJoin: z
            .boolean()
            .optional(),

          fileLock: z
            .boolean()
            .optional(),

          chat: z
            .boolean()
            .optional(),
        })
        .optional(),
    })
    .optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};