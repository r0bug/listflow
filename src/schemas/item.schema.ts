import { z } from 'zod';

export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  brand: z.string().optional(),
  startingPrice: z.number().positive().optional(),
  buyNowPrice: z.number().positive().optional(),
  locationId: z.string().optional(),
});

export const updateItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  brand: z.string().optional(),
  startingPrice: z.number().positive().nullable().optional(),
  buyNowPrice: z.number().positive().nullable().optional(),
  locationId: z.string().optional(),
});

export const completeStepSchema = z.object({
  step: z.string().min(1, 'Step is required'),
  action: z.enum(['advance', 'reject'], { message: 'Action must be advance or reject' }),
  notes: z.string().optional(),
  reason: z.string().optional(),
});

export const itemQuerySchema = z.object({
  step: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});
