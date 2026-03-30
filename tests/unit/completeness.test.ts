import { describe, it, expect } from 'vitest';
import { computeCompleteness } from '../../src/utils/completeness';

// ---------------------------------------------------------------------------
// Helper: a fully-complete item satisfying all 7 checks
// ---------------------------------------------------------------------------

const FULL_ITEM = {
  photos: [{ id: 'p1' }, { id: 'p2' }],
  title: 'Vintage Camera Body',
  description: 'Excellent working condition with original strap.',
  ebayCategoryId: '9355',
  brand: 'Nikon',
  condition: 'Used',
  startingPrice: 49.99,
  buyNowPrice: null,
  shippingProfileId: 'profile-123',
  weight: 24, // 1.5 lbs in oz
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeCompleteness', () => {
  it('returns 100% and score 7 for item with all fields', () => {
    const result = computeCompleteness(FULL_ITEM);

    expect(result.hasPhotos).toBe(true);
    expect(result.aiProcessed).toBe(true);
    expect(result.categorySet).toBe(true);
    expect(result.specificsPopulated).toBe(true);
    expect(result.priceSet).toBe(true);
    expect(result.shippingPolicyChosen).toBe(true);
    expect(result.weightEntered).toBe(true);
    expect(result.readyToList).toBe(true);
    expect(result.score).toBe(7);
    expect(result.percentage).toBe(100);
  });

  it('fails hasPhotos when photos array is empty', () => {
    const result = computeCompleteness({ ...FULL_ITEM, photos: [] });

    expect(result.hasPhotos).toBe(false);
    expect(result.score).toBe(6);
    expect(result.readyToList).toBe(false);
  });

  it('fails hasPhotos when photos is undefined', () => {
    const { photos: _, ...itemWithoutPhotos } = FULL_ITEM;
    const result = computeCompleteness(itemWithoutPhotos);

    expect(result.hasPhotos).toBe(false);
  });

  it('fails aiProcessed when title is missing', () => {
    const result = computeCompleteness({ ...FULL_ITEM, title: null });

    expect(result.aiProcessed).toBe(false);
    expect(result.score).toBe(6);
  });

  it('fails aiProcessed when description is missing', () => {
    const result = computeCompleteness({ ...FULL_ITEM, description: null });

    expect(result.aiProcessed).toBe(false);
  });

  it('fails categorySet when ebayCategoryId is null', () => {
    const result = computeCompleteness({ ...FULL_ITEM, ebayCategoryId: null });

    expect(result.categorySet).toBe(false);
    expect(result.score).toBe(6);
  });

  it('fails specificsPopulated when brand is missing', () => {
    const result = computeCompleteness({ ...FULL_ITEM, brand: null });

    expect(result.specificsPopulated).toBe(false);
    expect(result.score).toBe(6);
  });

  it('fails specificsPopulated when condition is missing', () => {
    const result = computeCompleteness({ ...FULL_ITEM, condition: null });

    expect(result.specificsPopulated).toBe(false);
  });

  it('fails priceSet when both startingPrice and buyNowPrice are null', () => {
    const result = computeCompleteness({
      ...FULL_ITEM,
      startingPrice: null,
      buyNowPrice: null,
    });

    expect(result.priceSet).toBe(false);
    expect(result.score).toBe(6);
  });

  it('passes priceSet when only buyNowPrice is provided', () => {
    const result = computeCompleteness({
      ...FULL_ITEM,
      startingPrice: null,
      buyNowPrice: 79.99,
    });

    expect(result.priceSet).toBe(true);
  });

  it('fails shippingPolicyChosen when shippingProfileId is null', () => {
    const result = computeCompleteness({ ...FULL_ITEM, shippingProfileId: null });

    expect(result.shippingPolicyChosen).toBe(false);
    expect(result.score).toBe(6);
  });

  it('fails weightEntered when weight is null', () => {
    const result = computeCompleteness({ ...FULL_ITEM, weight: null });

    expect(result.weightEntered).toBe(false);
    expect(result.score).toBe(6);
  });

  it('fails weightEntered when weight is 0', () => {
    const result = computeCompleteness({ ...FULL_ITEM, weight: 0 });

    expect(result.weightEntered).toBe(false);
  });

  it('item with everything except weight has score 6 and ~86%', () => {
    const result = computeCompleteness({ ...FULL_ITEM, weight: null });

    expect(result.score).toBe(6);
    expect(result.percentage).toBe(Math.round((6 / 7) * 100)); // 86
    expect(result.readyToList).toBe(false);
  });

  it('score is always in the 0–7 range', () => {
    // Completely empty item
    const result = computeCompleteness({});
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(7);
  });

  it('percentage equals Math.round(score / 7 * 100)', () => {
    for (let score = 0; score <= 7; score++) {
      // Build an item that hits exactly `score` checks
      const item = {
        photos: score >= 1 ? [{ id: 'p1' }] : [],
        title: score >= 2 ? 'Title' : null,
        description: score >= 2 ? 'Desc' : null,
        ebayCategoryId: score >= 3 ? '9355' : null,
        brand: score >= 4 ? 'Brand' : null,
        condition: score >= 4 ? 'Used' : null,
        startingPrice: score >= 5 ? 10 : null,
        buyNowPrice: null,
        shippingProfileId: score >= 6 ? 'sp-1' : null,
        weight: score >= 7 ? 10 : null,
      };
      const result = computeCompleteness(item);
      expect(result.percentage).toBe(Math.round((result.score / 7) * 100));
    }
  });
});
