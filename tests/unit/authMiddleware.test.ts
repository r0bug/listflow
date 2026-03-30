import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock jsonwebtoken and Prisma before importing the middleware
// ---------------------------------------------------------------------------

const { mockVerify, mockPrisma } = vi.hoisted(() => ({
  mockVerify: vi.fn(),
  mockPrisma: { user: { findUnique: vi.fn() } } as any,
}));

vi.mock('jsonwebtoken', () => ({
  default: { verify: mockVerify },
  verify: mockVerify,
}));

vi.mock('../../src/config/database', () => ({ prisma: mockPrisma }));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { authMiddleware, roleMiddleware, adminMiddleware, AuthRequest } from '../../src/middleware/auth.middleware';

// ---------------------------------------------------------------------------
// Helper: create minimal req / res / next mocks
// ---------------------------------------------------------------------------

function createMocks(authHeader?: string) {
  const req: Partial<AuthRequest> = {
    headers: authHeader ? { authorization: authHeader } : {},
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
  const next = vi.fn();
  return { req: req as AuthRequest, res, next };
}

// ---------------------------------------------------------------------------
// authMiddleware
// ---------------------------------------------------------------------------

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets req.user and calls next() for a valid token', async () => {
    mockVerify.mockReturnValue({ userId: 'user-1' });
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Alice',
      role: 'PROCESSOR',
      locationId: null,
    });

    const { req, res, next } = createMocks('Bearer valid.token.here');

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 'user-1', role: 'PROCESSOR' });
  });

  it('returns 401 when Authorization header is missing', async () => {
    const { req, res, next } = createMocks(); // no auth header

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  it('returns 401 for an expired JWT', async () => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    mockVerify.mockImplementation(() => { throw expiredError; });

    const { req, res, next } = createMocks('Bearer expired.token');

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for a malformed JWT', async () => {
    const malformedError = new Error('invalid token');
    malformedError.name = 'JsonWebTokenError';
    mockVerify.mockImplementation(() => { throw malformedError; });

    const { req, res, next } = createMocks('Bearer malformed.token');

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is valid but user does not exist in DB', async () => {
    mockVerify.mockReturnValue({ userId: 'ghost-user' });
    mockPrisma.user.findUnique.mockResolvedValue(null); // user not found

    const { req, res, next } = createMocks('Bearer valid.token.here');

    await authMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'User not found' })
    );
  });
});

// ---------------------------------------------------------------------------
// roleMiddleware
// ---------------------------------------------------------------------------

describe('roleMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls next() when user has the required role', () => {
    const { req, res, next } = createMocks();
    req.user = { id: 'u1', email: 'a@b.com', name: 'A', role: 'PROCESSOR', locationId: null };

    roleMiddleware(['PROCESSOR', 'ADMIN'])(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when user lacks the required role', () => {
    const { req, res, next } = createMocks();
    req.user = { id: 'u1', email: 'a@b.com', name: 'A', role: 'PHOTOGRAPHER', locationId: null };

    roleMiddleware(['PROCESSOR', 'ADMIN'])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Insufficient permissions' })
    );
  });

  it('returns 401 when req.user is not set', () => {
    const { req, res, next } = createMocks();
    // No req.user

    roleMiddleware(['PROCESSOR'])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ---------------------------------------------------------------------------
// adminMiddleware
// ---------------------------------------------------------------------------

describe('adminMiddleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls next() for an ADMIN user', () => {
    const { req, res, next } = createMocks();
    req.user = { id: 'admin-1', email: 'admin@x.com', name: 'Admin', role: 'ADMIN', locationId: null };

    adminMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 for a non-ADMIN user', () => {
    const { req, res, next } = createMocks();
    req.user = { id: 'u1', email: 'u@x.com', name: 'User', role: 'PROCESSOR', locationId: null };

    adminMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, error: 'Admin access required' })
    );
  });

  it('returns 401 when req.user is not set', () => {
    const { req, res, next } = createMocks();

    adminMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
