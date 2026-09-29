const { z } = require('zod');

const booleanField = z.boolean();

const updateProjectSettingsSchema = z
  .object({
    visibility: z
      .enum(['private', 'team'])
      .optional(),

    collaboration: z
      .object({
        enabled: booleanField.optional(),

        presenceEnabled: booleanField.optional(),

        fileLockingEnabled: booleanField.optional(),

        teamChatEnabled: booleanField.optional(),
      })
      .optional(),

    editor: z
      .object({
        autoSave: booleanField.optional(),

        minimap: booleanField.optional(),

        wordWrap: booleanField.optional(),

        formatOnSave: booleanField.optional(),
      })
      .optional(),

    files: z
      .object({
        confirmDelete: booleanField.optional(),

        showHiddenFiles: booleanField.optional(),
      })
      .optional(),

    notifications: z
      .object({
        memberJoin: booleanField.optional(),

        fileLock: booleanField.optional(),

        chat: booleanField.optional(),
      })
      .optional(),
  })
  .strict();

module.exports = {
  updateProjectSettingsSchema,
};