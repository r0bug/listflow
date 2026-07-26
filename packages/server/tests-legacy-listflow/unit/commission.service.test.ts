import { describe, it, expect } from 'vitest';
import { commissionService } from '../../src/services/commission.service';
import { CommissionRateType } from '../../src/generated/prisma';

const PERCENT = CommissionRateType.PERCENT;
const FLAT = CommissionRateType.FLAT;

describe('CommissionService', () => {
  describe('resolveRate', () => {
    const agent = { rateType: PERCENT, rateValue: 10 };

    it('falls back to agent default when no overrides', () => {
      expect(commissionService.resolveRate(agent, null, null)).toEqual({
        rateType: PERCENT,
        rateValue: 10,
      });
    });

    it('prefers listing override over agent default', () => {
      const listing = { commissionRateType: FLAT, commissionRateValue: 5 };
      expect(commissionService.resolveRate(agent, listing)).toEqual({
        rateType: FLAT,
        rateValue: 5,
      });
    });

    it('prefers explicit override over listing and agent', () => {
      const listing = { commissionRateType: FLAT, commissionRateValue: 5 };
      const override = { rateType: PERCENT, rateValue: 15 };
      expect(commissionService.resolveRate(agent, listing, override)).toEqual({
        rateType: PERCENT,
        rateValue: 15,
      });
    });

    it('ignores incomplete listing override (type without value)', () => {
      const listing = { commissionRateType: FLAT, commissionRateValue: null };
      expect(commissionService.resolveRate(agent, listing)).toEqual({
        rateType: PERCENT,
        rateValue: 10,
      });
    });

    it('ignores incomplete explicit override', () => {
      expect(
        commissionService.resolveRate(agent, null, { rateValue: 20 })
      ).toEqual({ rateType: PERCENT, rateValue: 10 });
    });
  });

  describe('computeBasis', () => {
    it('multiplies per-unit price by quantity', () => {
      expect(
        commissionService.computeBasis({ id: 's', itemPrice: 12.5, quantity: 3 })
      ).toBe(37.5);
    });

    it('treats quantity below 1 as 1', () => {
      expect(
        commissionService.computeBasis({ id: 's', itemPrice: 9.99, quantity: 0 })
      ).toBe(9.99);
    });
  });

  describe('computeAmount', () => {
    it('computes percent of basis', () => {
      expect(
        commissionService.computeAmount({ rateType: PERCENT, rateValue: 10 }, 200)
      ).toBe(20);
    });

    it('rounds percent to cents', () => {
      expect(
        commissionService.computeAmount({ rateType: PERCENT, rateValue: 7.5 }, 33.33)
      ).toBe(2.5); // 2.49975 -> 2.50
    });

    it('returns flat value regardless of basis', () => {
      expect(
        commissionService.computeAmount({ rateType: FLAT, rateValue: 4 }, 999)
      ).toBe(4);
    });

    it('returns 0 for zero or negative rate', () => {
      expect(
        commissionService.computeAmount({ rateType: PERCENT, rateValue: 0 }, 100)
      ).toBe(0);
      expect(
        commissionService.computeAmount({ rateType: FLAT, rateValue: -5 }, 100)
      ).toBe(0);
    });

    it('returns 0 for negative basis', () => {
      expect(
        commissionService.computeAmount({ rateType: PERCENT, rateValue: 10 }, -50)
      ).toBe(0);
    });
  });
});
