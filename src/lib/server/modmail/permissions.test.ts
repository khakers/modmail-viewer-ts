import { describe, it, expect } from "vitest";
import { getUserPermissionLevel, type PermissionLevel, type config } from "./permissions";

describe("getUserPermissionLevel", () => {
    const mockPermissions: config["level_permissions"] = {
        OWNER: ["ownerId"],
        ADMINISTRATOR: ["adminId"],
        MODERATOR: ["modId"],
        SUPPORTER: ["supporterId"],
        REGULAR: ["regularId"],
        ANYONE: ["anyoneId"],
    };

    it("should return 'OWNER' if the user ID matches the OWNER level", () => {
        const result = getUserPermissionLevel(mockPermissions, "ownerId", []);
        expect(result).toBe<PermissionLevel>("OWNER");
    });

    it("should return 'ADMINISTRATOR' if the user ID matches the ADMINISTRATOR level", () => {
        const result = getUserPermissionLevel(mockPermissions, "adminId", []);
        expect(result).toBe<PermissionLevel>("ADMINISTRATOR");
    });

    it("should return 'MODERATOR' if the user ID matches the MODERATOR level", () => {
        const result = getUserPermissionLevel(mockPermissions, "modId", []);
        expect(result).toBe<PermissionLevel>("MODERATOR");
    });

    it("should return 'SUPPORTER' if the user ID matches the SUPPORTER level", () => {
        const result = getUserPermissionLevel(mockPermissions, "supporterId", []);
        expect(result).toBe<PermissionLevel>("SUPPORTER");
    });

    it("should return 'REGULAR' if the user ID matches the REGULAR level", () => {
        const result = getUserPermissionLevel(mockPermissions, "regularId", []);
        expect(result).toBe<PermissionLevel>("REGULAR");
    });

    it("should return 'ANYONE' if the user ID matches the ANYONE level", () => {
        const result = getUserPermissionLevel(mockPermissions, "anyoneId", []);
        expect(result).toBe<PermissionLevel>("ANYONE");
    });

    it("should return the highest permission level if the user ID matches multiple levels", () => {
        const customPermissions: config["level_permissions"] = {
            OWNER: ["userId"],
            ADMINISTRATOR: ["userId"],
        };
        const result = getUserPermissionLevel(customPermissions, "userId", []);
        expect(result).toBe<PermissionLevel>("OWNER");
    });

    it("should return the highest permission level if a role matches multiple levels", () => {
        const customPermissions: config["level_permissions"] = {
            ADMINISTRATOR: ["role1"],
            MODERATOR: ["role1"],
        };
        const result = getUserPermissionLevel(customPermissions, "userId", ["role1"]);
        expect(result).toBe<PermissionLevel>("ADMINISTRATOR");
    });

    it("should return 'ANYONE' if no user ID or role matches any level", () => {
        const result = getUserPermissionLevel(mockPermissions, "unknownId", ["unknownRole"]);
        expect(result).toBe<PermissionLevel>("ANYONE");
    });

    it("should handle undefined roles gracefully", () => {
        const result = getUserPermissionLevel(mockPermissions, "unknownId", undefined);
        expect(result).toBe<PermissionLevel>("ANYONE");
    });

    it("should return undefined if permissions are empty", () => {
        const result = getUserPermissionLevel({}, "userId", ["role1"]);
        expect(result).toBe<PermissionLevel>("ANYONE");
    });

    it("should return 'MODERATOR' if the roles match", () => {
        const levelPermissions = {
            "MODERATOR": [
                "1084311478951215114"
            ],
            "OWNER": [
                "184473972446986240"
            ],
            "REGULAR": [
                -1
            ]
        };
        const result = getUserPermissionLevel(levelPermissions, "userId", ["1084311478951215114"]);
        expect(result).toBe<PermissionLevel>("MODERATOR");
    });

    it("should return 'OWNER' if the uid matches", () => {
        const levelPermissions = {
            "MODERATOR": [
                "1084311478951215114",
                "184473972446986240"
            ],
            "OWNER": [
                "184473972446986240"
            ],
            "REGULAR": [
                -1
            ]
        };
        const result = getUserPermissionLevel(levelPermissions, "184473972446986240", ["1084311478951215114"]);
        expect(result).toBe<PermissionLevel>("OWNER");
    });
});