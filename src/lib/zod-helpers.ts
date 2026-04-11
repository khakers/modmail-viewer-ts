import { formatISO, parse, parseISO } from 'date-fns';
import {z} from 'zod';

export const isoDateStringToDate = z.codec(
    z.iso.date(),
    z.date(),
    {
        decode: (isoString) => parseISO(isoString),
        encode: (date) => formatISO(date, { representation: 'date' })
    }
)