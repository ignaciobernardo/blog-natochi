import { z } from 'zod';
import {
  cohorts,
  reviewQualifications,
  submissionModalities,
  submissionStatuses,
} from '@/src/lib/db/schema';

export const submissionReviewSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1).catch(1),
  limit: z.coerce.number().int().positive().max(100).default(20).catch(20),
  search: z.string().optional(),
  eventId: z.string().uuid().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean) || [])
    .pipe(z.array(z.enum(submissionStatuses)))
    .optional(),
  cohort: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean) || [])
    .pipe(z.array(z.enum(cohorts)))
    .optional(),
  modality: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean) || [])
    .pipe(z.array(z.enum(submissionModalities)))
    .optional(),
  qualification: z
    .string()
    .optional()
    .transform((val) => val?.split(',').filter(Boolean) || [])
    .pipe(z.array(z.enum(reviewQualifications)))
    .optional(),
  country: z.string().optional(),
  hasFlightRequest: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  hasReview: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  hasWomen: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .optional(),
  submittedAfter: z.coerce.date().optional(),
  submittedBefore: z.coerce.date().optional(),
  sortBy: z.enum(['submittedAt']).default('submittedAt').catch('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
});

export type SubmissionReviewSearchParams = z.infer<
  typeof submissionReviewSearchParamsSchema
>;
