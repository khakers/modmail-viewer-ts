import { z } from "zod/v4";

export const formSchema = z.object({

    requireAuthentication: z.boolean().default(true).nonoptional(),
    showInternalMessages: z.boolean().default(false).nonoptional(),
    showAnonymouseSenderName: z.boolean().default(false).nonoptional(),
    showSystemMessages: z.boolean().default(false).nonoptional(),
    expiresAt: z.date()
        .min(Date.now(), "Expiration must be in the future")
        .nullable(),
});

export type LogSharingFormSchema = typeof formSchema;