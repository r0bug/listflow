import { describe, it, expect } from 'vitest';
import { loginSchema, pinLoginSchema } from '../../src/schemas/auth.schema';
import { createItemSchema, updateItemSchema, completeStepSchema, itemQuerySchema } from '../../src/schemas/item.schema';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('pinLoginSchema', () => {
    it('should accept valid 4-digit PIN', () => {
      const result = pinLoginSchema.safeParse({
        userId: 'user-123',
        pin: '1234',
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-numeric PIN', () => {
      const result = pinLoginSchema.safeParse({
        userId: 'user-123',
        pin: 'abcd',
      });
      expect(result.success).toBe(false);
    });

    it('should reject PIN that is not 4 digits', () => {
      const result = pinLoginSchema.safeParse({
        userId: 'user-123',
        pin: '123',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Item Schemas', () => {
  describe('createItemSchema', () => {
    it('should accept valid item data', () => {
      const result = createItemSchema.safeParse({
        title: 'Test Item',
        description: 'A test item description',
        category: 'Electronics',
        condition: 'Used',
      });
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const result = createItemSchema.safeParse({
        description: 'A test item',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const result = createItemSchema.safeParse({
        title: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative prices', () => {
      const result = createItemSchema.safeParse({
        title: 'Test Item',
        startingPrice: -5,
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const result = createItemSchema.safeParse({
        title: 'Test Item',
        startingPrice: 19.99,
        buyNowPrice: 29.99,
        brand: 'TestBrand',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateItemSchema', () => {
    it('should accept partial updates', () => {
      const result = updateItemSchema.safeParse({
        title: 'Updated Title',
      });
      expect(result.success).toBe(true);
    });

    it('should accept empty object (no updates)', () => {
      const result = updateItemSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should allow nullable prices', () => {
      const result = updateItemSchema.safeParse({
        startingPrice: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('completeStepSchema', () => {
    it('should accept advance action', () => {
      const result = completeStepSchema.safeParse({
        step: 'REVIEW_EDIT',
        action: 'advance',
      });
      expect(result.success).toBe(true);
    });

    it('should accept reject action with reason', () => {
      const result = completeStepSchema.safeParse({
        step: 'REVIEW_EDIT',
        action: 'reject',
        reason: 'Poor quality photos',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid action', () => {
      const result = completeStepSchema.safeParse({
        step: 'REVIEW_EDIT',
        action: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('itemQuerySchema', () => {
    it('should provide defaults for page and limit', () => {
      const result = itemQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should coerce string page to number', () => {
      const result = itemQuerySchema.safeParse({ page: '3', limit: '10' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject limit over 100', () => {
      const result = itemQuerySchema.safeParse({ limit: '200' });
      expect(result.success).toBe(false);
    });
  });
});
