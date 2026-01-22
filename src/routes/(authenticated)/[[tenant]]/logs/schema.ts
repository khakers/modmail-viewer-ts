import z from "zod/v3";

// TODO migrate to zod v4 when possible
// BLOCKED by zod-search-params not supporting v4 yet

export const statusSchema = z.enum(['all', 'open', 'closed']).default('all').catch('all');

export const pageSchema = z.number().int().positive().default(1).catch(1);

export const paramsSchema = z.object({
	status: statusSchema,
	page: pageSchema,
	pageSize: z.number().min(5).positive().int().default(10).catch(10)
});
