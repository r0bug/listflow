import { z } from 'zod';

const rateType = z.enum(['PERCENT', 'FLAT']);

// ---- Agents ----

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email().optional(),
  rateType: rateType.default('PERCENT'),
  rateValue: z.number().min(0).default(0),
  active: z.boolean().default(true),
});

export const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  rateType: rateType.optional(),
  rateValue: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

// ---- Sales ----

export const salesQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  ebayAccountId: z.string().optional(),
  attribution: z.enum(['pending', 'attributed', 'house', 'all']).default('all'),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const assignAgentSchema = z.object({
  agentId: z.string().min(1, 'Agent is required'),
  rateType: rateType.optional(),
  rateValue: z.number().min(0).optional(),
});

export const tagListingAgentSchema = z.object({
  agentId: z.string().nullable(),
  commissionRateType: rateType.nullable().optional(),
  commissionRateValue: z.number().min(0).nullable().optional(),
});

// ---- Commissions ----

export const commissionReportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  agentId: z.string().optional(),
});

export const markPaidSchema = z.object({
  agentId: z.string().min(1, 'Agent is required'),
  through: z.string().optional(), // ISO date; pays commissions on sales up to this date
});
