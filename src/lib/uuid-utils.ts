import { decodeBase64urlIgnorePadding, decodeHex, encodeBase64urlNoPadding, encodeHexLowerCase } from "@oslojs/encoding";

/**
 * Encodes a UUID string (in standard 36-character format) into a base64url string without padding.
 *
 * @param str - The UUID string to encode. Must be in the standard 36-character format (including hyphens).
 * @returns The base64url-encoded representation of the UUID, without padding.
 * @throws {Error} If the input string is not a valid 36-character UUID.
 */
export function encodeBase64UUID(str: string): string {
    if (str.length !== 36) {
        throw new Error("invalid uuid format")
    }
    // remove '-' characters from uuid
    const concatString = str.split('-').join('');
    console.debug(concatString)

    const data: Uint8Array = decodeHex(concatString);
    return encodeBase64urlNoPadding(data);
}

/**
 * Decodes a base64url-encoded UUID string into its standard UUID string representation.
 *
 * @param str - The base64url-encoded UUID string to decode.
 * @returns The decoded UUID string in the format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
 *
 * @remarks
 * This function expects the input string to be a base64url-encoded 16-byte UUID.
 * It decodes the input, converts it to a lowercase hexadecimal string, and inserts hyphens
 * at the appropriate positions to match the standard UUID format.
 */
export function decodeBase64UUID(str: string): string {
    const raw = decodeBase64urlIgnorePadding(str);
    const hex = encodeHexLowerCase(raw);
    //add hyphens at 8-4-4-4-12
    // 
    return hex.substring(0, 8) + '-' + hex.substring(8, 12) + '-' + hex.substring(12, 16) + '-' + hex.substring(16, 20) + '-' + hex.substring(20)
}