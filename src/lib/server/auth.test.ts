import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as auth from './auth';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '$lib/server/db/schema';
import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { addDays } from 'date-fns';

type DbSchema = typeof schema;

// Mock logger and discord
vi.mock('$lib/logger', () => ({
	logger: { trace: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }
}));
vi.mock('arctic', () => ({
	Discord: vi.fn().mockImplementation(() => ({ revokeToken: vi.fn() }))
}));

// Mock the database module
vi.mock('$lib/server/db', () => ({
	db: null // Will be set in beforeEach
}));

describe('auth', () => {
	let db: Database.Database;
	let client: BetterSQLite3Database<DbSchema>;
	let now: Date;
	let user: typeof schema.user;
	let session: typeof schema.session;

	beforeEach(async () => {
		// Set up encryption key for tests
		if (!process.env.ENCRYPTION_SECRET_KEY) {
			process.env.ENCRYPTION_SECRET_KEY = '0'.repeat(64); // 32 bytes in hex
		}

		// Use the real schema
		user = schema.user;
		session = schema.session;
		db = new Database(':memory:');
		client = drizzle(db, { schema });
		now = new Date();

		// Use Drizzle migrations to create the exact production schema
		migrate(client, { migrationsFolder: './drizzle' });

		// Replace the mocked database with our test database
		const dbModule = await import('$lib/server/db');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(dbModule).db = client as any;
	});
	afterEach(() => {
		db.close();
	});

	describe('token generation', () => {
		it('should generate a session token', () => {
			const token = auth.generateSessionToken();
			expect(typeof token).toBe('string');
			expect(token.length).toBeGreaterThan(0);
		});
	});

	describe('user operations', () => {
		it('should insert and fetch a user', async () => {
			// Use drizzle insert
			client
				.insert(user)
				.values({
					uid: 'real-uid',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();
			const rows = client.select().from(user).where(eq(user.uid, 'real-uid')).all();
			expect(rows[0].uid).toBe('real-uid');
			expect(rows[0].refreshToken).toBe('refresh');
		});
	});

	describe('session creation', () => {
		it('should create a session and user with createSession', async () => {
			const token = 'tokentest';
			const discordTokens = {
				uid: 'u1',
				refreshToken: 'r1',
				accessToken: 'a1',
				accessTokenExpiresAt: now
			};

			// Test the actual createSession function
			await auth.createSession(token, discordTokens);

			// Verify the session was created
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			
			const dbSessions = client.select().from(session).where(eq(session.id, sessionId)).all();
			expect(dbSessions).toHaveLength(1);
			expect(dbSessions[0].discordUserId).toBe('u1');
			expect(dbSessions[0].id).toBe(sessionId);

			// Verify the user was created
			const dbUsers = client.select().from(user).where(eq(user.uid, 'u1')).all();
			expect(dbUsers).toHaveLength(1);
			expect(dbUsers[0].uid).toBe('u1');
			expect(dbUsers[0].refreshToken).toBe('r1');
			expect(dbUsers[0].accessToken).toBe('a1');
		});

		it('should update existing user when creating session for existing user', async () => {
			const token = 'tokentest-existing';
			const originalTokens = {
				uid: 'existing-user',
				refreshToken: 'old-refresh',
				accessToken: 'old-access',
				accessTokenExpiresAt: new Date(now.getTime() + 1000)
			};

			// Create an existing user first
			client
				.insert(user)
				.values(originalTokens)
				.run();

			// Create session with updated tokens for existing user
			const updatedTokens = {
				uid: 'existing-user',
				refreshToken: 'new-refresh',
				accessToken: 'new-access',
				accessTokenExpiresAt: new Date(now.getTime() + 2000)
			};

			await auth.createSession(token, updatedTokens);

			// Verify the session was created
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			
			const dbSessions = client.select().from(session).where(eq(session.id, sessionId)).all();
			expect(dbSessions).toHaveLength(1);
			expect(dbSessions[0].discordUserId).toBe('existing-user');

			// Verify the user was updated, not duplicated
			const afterUsers = client.select().from(user).where(eq(user.uid, 'existing-user')).all();
			expect(afterUsers).toHaveLength(1); // Still only one user
			expect(afterUsers[0].refreshToken).toBe('new-refresh'); // Updated tokens
			expect(afterUsers[0].accessToken).toBe('new-access');
		});
	});

	describe('session validation', () => {
		it('should validate a session token', async () => {
			const token = 'tokentest2';
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

			// Insert user first due to foreign key constraint
			client
				.insert(user)
				.values({
					uid: 'u2',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			client
				.insert(session)
				.values({
					id: sessionId,
					discordUserId: 'u2',
					expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
					createdAt: now
				})
				.run();

			// Test the actual validateSessionToken function
			const result = await auth.validateSessionToken(token);

			expect(result.session).not.toBeNull();
			expect(result.user).not.toBeNull();
			expect(result.session!.discordUserId).toBe('u2');
			expect(result.user!.uid).toBe('u2');
		});

		it('should return null for non-existent session', async () => {
			const token = 'nonexistent-token';
			const result = await auth.validateSessionToken(token);
			
			expect(result.session).toBeNull();
			expect(result.user).toBeNull();
		});

		it('should delete and return null for expired session', async () => {
			const token = 'expired-token';
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			
			// Insert user first due to foreign key constraint
			client
				.insert(user)
				.values({
					uid: 'expired-user',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			// Insert session that expired 1 day ago
			const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
			client
				.insert(session)
				.values({
					id: sessionId,
					discordUserId: 'expired-user',
					expiresAt: expiredDate,
					createdAt: now
				})
				.run();

			const result = await auth.validateSessionToken(token);
			
			// Should return null for expired session
			expect(result.session).toBeNull();
			expect(result.user).toBeNull();
			
			// Session should be deleted from database by the function
			const dbSessions = client
				.select()
				.from(session)
				.where(eq(session.id, sessionId))
				.all();
			expect(dbSessions).toHaveLength(0);
		});

		it('should renew session when within 15 days of expiration', async () => {
			const token = 'renewal-token';
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			
			// Insert user first due to foreign key constraint
			client
				.insert(user)
				.values({
					uid: 'renewal-user',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			// Insert session that expires in 10 days (should trigger renewal)
			const nearExpiryDate = addDays(Date.now(), 10);
			client
				.insert(session)
				.values({
					id: sessionId,
					discordUserId: 'renewal-user',
					expiresAt: nearExpiryDate,
					createdAt: now
				})
				.run();

			const result = await auth.validateSessionToken(token);
			
			// Should return valid session and user
			expect(result.session).not.toBeNull();
			expect(result.user).not.toBeNull();
			expect(result.session!.discordUserId).toBe('renewal-user');
			expect(result.user!.uid).toBe('renewal-user');
			
			// Session expiration should be updated to 30 days from now by the function
			const dbSessions = client
				.select()
				.from(session)
				.where(eq(session.id, sessionId))
				.all();
			expect(dbSessions).toHaveLength(1);
			
			// Check that the expiration date was renewed (should be ~30 days from now)
			const renewedSession = dbSessions[0];
			const expectedRenewalDate = addDays(Date.now(), 30);
			const timeDiff = Math.abs(renewedSession.expiresAt.getTime() - expectedRenewalDate.getTime());
			expect(timeDiff).toBeLessThan(2000); // Within 2 seconds tolerance
		});

		it('should not renew session when there is more than 15 days until expiration', async () => {
			const token = 'no-renewal-token';
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			
			// Insert user first due to foreign key constraint
			client
				.insert(user)
				.values({
					uid: 'no-renewal-user',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			// Insert session that expires in 20 days (should NOT trigger renewal)
			const futureExpiryDate = addDays(Date.now(), 20);
			client
				.insert(session)
				.values({
					id: sessionId,
					discordUserId: 'no-renewal-user',
					expiresAt: futureExpiryDate,
					createdAt: now
				})
				.run();

			// Test the actual validateSessionToken function
			const result = await auth.validateSessionToken(token);
			
			// Should return valid session and user
			expect(result.session).not.toBeNull();
			expect(result.user).not.toBeNull();
			expect(result.session!.discordUserId).toBe('no-renewal-user');
			expect(result.user!.uid).toBe('no-renewal-user');
			
			// Session expiration should remain unchanged
			const dbSessions = client
				.select()
				.from(session)
				.where(eq(session.id, sessionId))
				.all();
			expect(dbSessions).toHaveLength(1);
			
			// Check that the expiration date was NOT changed
			const unchangedSession = dbSessions[0];
			const timeDiff = Math.abs(unchangedSession.expiresAt.getTime() - futureExpiryDate.getTime());
			expect(timeDiff).toBeLessThan(1000); // Should be the same within 1 second tolerance
		});

		it('should validate session at the exact 15-day renewal boundary', async () => {
			const token = 'boundary-token';
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
			
			// Insert user first due to foreign key constraint
			client
				.insert(user)
				.values({
					uid: 'boundary-user',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			// Insert session that expires in exactly 15 days (boundary case)
			const boundaryExpiryDate = addDays(Date.now(), 15);
			client
				.insert(session)
				.values({
					id: sessionId,
					discordUserId: 'boundary-user',
					expiresAt: boundaryExpiryDate,
					createdAt: now
				})
				.run();

			// Test the actual validateSessionToken function
			const result = await auth.validateSessionToken(token);
			
			// Should return valid session and user
			expect(result.session).not.toBeNull();
			expect(result.user).not.toBeNull();
			expect(result.session!.discordUserId).toBe('boundary-user');
			expect(result.user!.uid).toBe('boundary-user');
			
			// Check that session exists regardless of renewal decision
			const dbSessions = client
				.select()
				.from(session)
				.where(eq(session.id, sessionId))
				.all();
			expect(dbSessions).toHaveLength(1);
		});
	});

	describe('session invalidation', () => {
		it('should invalidate a session', async () => {
			const token = 'tokentest3';
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

			// Insert user first due to foreign key constraint
			client
				.insert(user)
				.values({
					uid: 'u3',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			client
				.insert(session)
				.values({
					id: sessionId,
					discordUserId: 'u3',
					expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
					createdAt: now
				})
				.run();

			// Test the actual invalidateSession function
			await auth.invalidateSession(sessionId);

			// Verify the session was deleted
			const dbSessions = client.select().from(session).where(eq(session.id, sessionId)).all();
			expect(dbSessions.length).toBe(0);
		});

		it('should revoke refresh token when invalidating the last session for a user', async () => {
			const token = 'last-session-token';
			const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

			// Insert user
			client
				.insert(user)
				.values({
					uid: 'user-last-session',
					refreshToken: 'refresh-to-revoke',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			// Insert only one session for this user
			client
				.insert(session)
				.values({
					id: sessionId,
					discordUserId: 'user-last-session',
					expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
					createdAt: now
				})
				.run();

			// Mock the discord.revokeToken function to verify it's called
			const mockRevokeToken = vi.fn().mockResolvedValue(undefined);
			const discordModule = await import('$lib/server/auth');
			vi.spyOn(discordModule.discord, 'revokeToken').mockImplementation(mockRevokeToken);

			// Test the actual invalidateSession function
			await auth.invalidateSession(sessionId);

			// Verify the session was deleted
			const dbSessions = client.select().from(session).where(eq(session.id, sessionId)).all();
			expect(dbSessions.length).toBe(0);

			// Verify that discord.revokeToken was called with the correct refresh token
			expect(mockRevokeToken).toHaveBeenCalledWith('refresh-to-revoke');
			expect(mockRevokeToken).toHaveBeenCalledTimes(1);
		});

		it('should not revoke refresh token when invalidating one of multiple sessions', async () => {
			const token1 = 'multi-session-token-1';
			const token2 = 'multi-session-token-2';
			const sessionId1 = encodeHexLowerCase(sha256(new TextEncoder().encode(token1)));
			const sessionId2 = encodeHexLowerCase(sha256(new TextEncoder().encode(token2)));

			// Insert user
			client
				.insert(user)
				.values({
					uid: 'user-multi-session',
					refreshToken: 'refresh-keep',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			// Insert multiple sessions for this user
			client
				.insert(session)
				.values([
					{
						id: sessionId1,
						discordUserId: 'user-multi-session',
						expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
						createdAt: now
					},
					{
						id: sessionId2,
						discordUserId: 'user-multi-session',
						expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
						createdAt: now
					}
				])
				.run();

			// Mock the discord.revokeToken function to verify it's NOT called
			const mockRevokeToken = vi.fn().mockResolvedValue(undefined);
			const discordModule = await import('$lib/server/auth');
			vi.spyOn(discordModule.discord, 'revokeToken').mockImplementation(mockRevokeToken);

			// Test the actual invalidateSession function (invalidate first session)
			await auth.invalidateSession(sessionId1);

			// Verify only one session was deleted
			const remainingSessions = client
				.select()
				.from(session)
				.where(eq(session.discordUserId, 'user-multi-session'))
				.all();
			expect(remainingSessions.length).toBe(1);
			expect(remainingSessions[0].id).toBe(sessionId2);

			// Verify that discord.revokeToken was NOT called since user still has another session
			expect(mockRevokeToken).not.toHaveBeenCalled();
		});

		it('should handle gracefully when trying to invalidate non-existent session', async () => {
			const nonExistentSessionId = 'non-existent-session-id';

			// Mock the discord.revokeToken function to verify it's NOT called
			const mockRevokeToken = vi.fn().mockResolvedValue(undefined);
			const discordModule = await import('$lib/server/auth');
			vi.spyOn(discordModule.discord, 'revokeToken').mockImplementation(mockRevokeToken);

			// Test the actual invalidateSession function with non-existent session
			await auth.invalidateSession(nonExistentSessionId);

			// Verify that discord.revokeToken was NOT called
			expect(mockRevokeToken).not.toHaveBeenCalled();
		});

		it('should invalidate all sessions for a user', async () => {
			// Insert user first due to foreign key constraint
			client
				.insert(user)
				.values({
					uid: 'u4',
					refreshToken: 'refresh',
					accessToken: 'access',
					accessTokenExpiresAt: new Date(now.getTime() + 1000)
				})
				.run();

			client
				.insert(session)
				.values([
					{
						id: 'sid1',
						discordUserId: 'u4',
						expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
						createdAt: now
					},
					{
						id: 'sid2',
						discordUserId: 'u4',
						expiresAt: new Date(Date.now() + 60 * 60 * 24 * 1000),
						createdAt: now
					}
				])
				.run();

			// Test the actual invalidateAllSessions function
			await auth.invalidateAllSessions('u4');

			// Verify all sessions were deleted
			const dbSessions = client
				.select()
				.from(session)
				.where(eq(session.discordUserId, 'u4'))
				.all();
			expect(dbSessions.length).toBe(0);
		});
	});
});
