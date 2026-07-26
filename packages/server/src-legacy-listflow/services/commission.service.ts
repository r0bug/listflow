import {
  CommissionRateType,
  AttributionStatus,
  Prisma,
} from '../generated/prisma';
import { prisma } from '../config/database';

export interface RateSpec {
  rateType: CommissionRateType;
  rateValue: number;
}

interface ListingRateFields {
  commissionRateType: CommissionRateType | null;
  commissionRateValue: number | null;
}

interface SaleForCommission {
  id: string;
  itemPrice: number;
  quantity: number;
}

class CommissionService {
  /**
   * Precedence: explicit override > listing override > agent default.
   * A rate is only usable when both type and value are present.
   */
  resolveRate(
    agent: RateSpec,
    listing?: ListingRateFields | null,
    override?: Partial<RateSpec> | null
  ): RateSpec {
    if (override?.rateType != null && override?.rateValue != null) {
      return { rateType: override.rateType, rateValue: override.rateValue };
    }
    if (listing?.commissionRateType != null && listing?.commissionRateValue != null) {
      return {
        rateType: listing.commissionRateType,
        rateValue: listing.commissionRateValue,
      };
    }
    return { rateType: agent.rateType, rateValue: agent.rateValue };
  }

  /** Commission basis: per-unit price times quantity, shipping excluded. */
  computeBasis(sale: SaleForCommission): number {
    return round2(sale.itemPrice * Math.max(1, sale.quantity));
  }

  computeAmount(rate: RateSpec, basis: number): number {
    if (rate.rateValue <= 0 || basis < 0) return 0;
    if (rate.rateType === CommissionRateType.PERCENT) {
      return round2(basis * (rate.rateValue / 100));
    }
    return round2(rate.rateValue);
  }

  /**
   * Create the commission for a sale and mark it attributed, snapshotting the
   * resolved rate. No-op (returns existing) if the sale already has one.
   */
  async createForSale(
    saleId: string,
    agentId: string,
    override?: Partial<RateSpec> | null,
    tx: Prisma.TransactionClient = prisma
  ) {
    const existing = await tx.commission.findUnique({ where: { saleId } });
    if (existing) return existing;

    const sale = await tx.sale.findUniqueOrThrow({
      where: { id: saleId },
      include: { listing: true },
    });
    const agent = await tx.listingAgent.findUniqueOrThrow({ where: { id: agentId } });

    const rate = this.resolveRate(agent, sale.listing, override);
    const basis = this.computeBasis(sale);
    const amount = this.computeAmount(rate, basis);

    const commission = await tx.commission.create({
      data: {
        saleId,
        agentId,
        rateType: rate.rateType,
        rateValue: rate.rateValue,
        basis,
        amount,
      },
    });
    await tx.sale.update({
      where: { id: saleId },
      data: { attributionStatus: AttributionStatus.ATTRIBUTED },
    });
    return commission;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const commissionService = new CommissionService();
