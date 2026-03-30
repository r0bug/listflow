import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// AiAnalysisSchema — Lane B stub
//
// AiAnalysisSchema is already exported from ai.service.ts.  These tests
// document its contract and run immediately.  If Lane B changes the schema
// shape, update these tests accordingly.
// ---------------------------------------------------------------------------

import { AiAnalysisSchema } from '../../src/services/ai.service';

describe('AiAnalysisSchema', () => {
  // -------------------------------------------------------------------------
  // Valid cases
  // -------------------------------------------------------------------------

  it('passes for a valid AI response with all expected fields', () => {
    const result = AiAnalysisSchema.safeParse({
      itemType: 'Camera',
      title: 'Vintage Film Camera Body',
      description: 'A well-used 35mm SLR in good working order.',
      category: 'Film Photography',
      condition: 'Used',
      brand: 'Canon',
      features: ['Manual focus', 'TTL metering', 'Self-timer'],
      keywords: ['film camera', '35mm', 'SLR'],
      specifics: { Brand: 'Canon', Model: 'AE-1' },
      upc: '012345678901',
      isbn: null,
    });

    expect(result.success).toBe(true);
  });

  it('passes when all optional fields are omitted (empty object)', () => {
    const result = AiAnalysisSchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it('passes with only a subset of known fields', () => {
    const result = AiAnalysisSchema.safeParse({
      title: 'Lens',
      brand: 'Nikon',
    });

    expect(result.success).toBe(true);
  });

  it('passes and preserves extra/unknown fields due to passthrough()', () => {
    const result = AiAnalysisSchema.safeParse({
      title: 'Tripod',
      unknownFutureProp: 'some-value',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).unknownFutureProp).toBe('some-value');
    }
  });

  // -------------------------------------------------------------------------
  // Invalid cases
  // -------------------------------------------------------------------------

  it('fails when features is a string instead of an array', () => {
    const result = AiAnalysisSchema.safeParse({
      features: 'Manual focus, zoom',
    });

    expect(result.success).toBe(false);
  });

  it('fails when keywords is a number instead of an array', () => {
    const result = AiAnalysisSchema.safeParse({
      keywords: 42,
    });

    expect(result.success).toBe(false);
  });

  it('fails when specifics is an array instead of a record', () => {
    const result = AiAnalysisSchema.safeParse({
      specifics: ['Brand: Nikon'],
    });

    expect(result.success).toBe(false);
  });

  it('validation failure includes the offending field name in the error', () => {
    const result = AiAnalysisSchema.safeParse({
      features: 'not-an-array',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('features');
    }
  });

  // -------------------------------------------------------------------------
  // Default value behavior
  // -------------------------------------------------------------------------

  it('defaults features to [] when not provided', () => {
    const result = AiAnalysisSchema.safeParse({ title: 'Widget' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.features).toEqual([]);
    }
  });

  it('defaults keywords to [] when not provided', () => {
    const result = AiAnalysisSchema.safeParse({ title: 'Widget' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keywords).toEqual([]);
    }
  });

  it('defaults specifics to {} when not provided', () => {
    const result = AiAnalysisSchema.safeParse({ title: 'Widget' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.specifics).toEqual({});
    }
  });
});
