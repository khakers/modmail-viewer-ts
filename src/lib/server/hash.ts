import { createHash } from "node:crypto";

export function sha256HashString(str: string): string {
    return createHash('sha256').update(str).digest('hex');
}