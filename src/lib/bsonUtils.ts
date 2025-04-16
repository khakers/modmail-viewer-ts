import { Long, ObjectId, Decimal128, Timestamp } from 'mongodb';

/**
 * Recursively converts MongoDB BSON types in an object into standard JS types.
 * - Long is converted to number.
 * - ObjectId is converted to its hex string.
 * - Decimal128 is converted to a number.
 *
 * @param value Any value potentially containing BSON types.
 * @returns The value with BSON types converted to normal JavaScript types.
 */
export function convertBSONtoJS(value: unknown): unknown {
    if (value instanceof Long) {
        return value.toString();
    }

    if (value instanceof ObjectId) {
        return value.toHexString();
    }

    if (value instanceof Decimal128) {
        // parseFloat may lose precision; customize as needed.
        return value.toString();
    }

    if (value instanceof Timestamp) {
        return value.toString();
    }

    if (Array.isArray(value)) {
        return value.map(convertBSONtoJS);
    }

    if (value !== null && typeof value === 'object') {
        const result: object = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                result[key] = convertBSONtoJS(value[key]);
            }
        }
        return result;
    }

    return value;
}