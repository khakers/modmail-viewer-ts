import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';

export function hashString(str: string): string {
    return encodeHexLowerCase(sha256(new TextEncoder().encode(str)))
}