import { formatISO, parseISO } from 'date-fns';
import { z } from 'zod';

export const isoDateStringToDate = z.codec(
	z.union([z.iso.date(), z.literal('')]).optional(),
	z.date().optional(),
	{
		decode: (isoString) => (isoString && isoString !== '' ? parseISO(isoString) : undefined),
		encode: (date) => (date ? formatISO(date, { representation: 'date' }) : undefined)
	}
);
