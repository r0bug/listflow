import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { validate } from '../../src/middleware/validate.middleware';

function createMockReqRes(body = {}, query = {}, params = {}) {
  const req = { body, query, params } as any;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as any;
  const next = vi.fn();
  return { req, res, next };
}

describe('validate middleware', () => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  it('should call next() when validation passes', () => {
    const { req, res, next } = createMockReqRes({
      email: 'test@example.com',
      password: 'password123',
    });

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 with errors when validation fails', () => {
    const { req, res, next } = createMockReqRes({
      email: 'not-an-email',
      password: '123',
    });

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        details: expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ]),
      })
    );
  });

  it('should return 400 when required fields are missing', () => {
    const { req, res, next } = createMockReqRes({});

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should validate query params when source is "query"', () => {
    const querySchema = z.object({
      page: z.coerce.number().int().min(1),
    });

    const { req, res, next } = createMockReqRes({}, { page: '5' });

    validate(querySchema, 'query')(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.query.page).toBe(5);
  });

  it('should strip unknown fields from parsed output', () => {
    const { req, res, next } = createMockReqRes({
      email: 'test@example.com',
      password: 'password123',
      extraField: 'should be stripped',
    });

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.extraField).toBeUndefined();
  });
});
