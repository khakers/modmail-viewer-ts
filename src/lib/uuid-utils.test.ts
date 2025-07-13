import { describe, expect, it } from "vitest";
import { decodeBase64UUID, encodeBase64UUID } from "./uuid-utils";

// Example UUID and its expected base64url encoding (no padding, url-safe)
// We'll use a known UUID and its hex/base64 representations for tests
// UUID: 1cb4c59f-1723-4bf5-800a-ff646671b523
// Hex (no hyphens): 1cb4c59f17234bf5800aff646671b523
// Base64url (no padding): HLTFnxcjS_WACv9kZnG1Iw

describe("encodeBase64UUID", () => {
    it("encodes a UUID string to base64url (no padding)", () => {
        const uuid = "1cb4c59f-1723-4bf5-800a-ff646671b523";
        const encoded = encodeBase64UUID(uuid);
        expect(encoded).toBe("HLTFnxcjS_WACv9kZnG1Iw");
    });

    it("throws or returns invalid result for malformed UUID", () => {
        // Should throw or produce an incorrect result for invalid UUID
        expect(() => encodeBase64UUID("invalid-uuid")).toThrow();
    });
});

describe("decodeBase64UUID", () => {
    it("decodes a base64url string to UUID format", () => {
        const base64 = "HLTFnxcjS_WACv9kZnG1Iw";
        const decoded = decodeBase64UUID(base64);
        // Should match the original UUID (with hyphens)
        expect(decoded).toBe("1cb4c59f-1723-4bf5-800a-ff646671b523");
    });

    it("throws or returns invalid result for malformed base64", () => {
        expect(() => decodeBase64UUID("not-base64")).toThrow();
    });
});

describe("encodeBase64UUID and decodeBase64UUID", () => {
    it("is reversible for a valid UUID", () => {
        const uuid = "1cb4c59f-1723-4bf5-800a-ff646671b523";
        const encoded = encodeBase64UUID(uuid);
        console.log(encoded);
        const decoded = decodeBase64UUID(encoded);
        expect(decoded).toBe(uuid);
    });
});