import { z } from 'zod';
import {
  GITHUB_PROFILE_URL_MESSAGE,
  GITHUB_PROFILE_URL_REGEX,
  LINKEDIN_PROFILE_URL_MESSAGE,
  LINKEDIN_PROFILE_URL_REGEX,
} from '@/src/lib/validations/social-profiles';

export const hackerProfileSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  country: z.string().min(1, 'Country is required'),
  githubProfile: z
    .string()
    .url('Must be a valid GitHub URL')
    .regex(GITHUB_PROFILE_URL_REGEX, GITHUB_PROFILE_URL_MESSAGE),
  email: z.string().email('Invalid email address'),
  linkedinProfile: z
    .string()
    .url('Must be a valid LinkedIn URL')
    .regex(LINKEDIN_PROFILE_URL_REGEX, LINKEDIN_PROFILE_URL_MESSAGE),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(13, 'You must be at least 13 years old')
    .max(120, 'Please enter a valid age'),
  builderDescription: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description is too long'),
  education: z
    .string()
    .min(20, 'Education must be at least 20 characters')
    .max(500, 'Education info is too long'),
  roles: z
    .array(z.enum(['desarrollo', 'producto', 'diseno', 'ventas', 'qa']))
    .min(1, 'Please select at least one role'),
  isVeteran: z.boolean(),
  previousHackathons: z
    .string()
    .max(500, 'Hackathon list is too long')
    .optional()
    .refine(
      (val) => !val || val.length > 0,
      'Please list the hackathons you attended',
    ),
  shirtSize: z.enum(['S', 'M', 'L', 'XL']),
  diet: z.enum(['omnivora', 'vegetariana', 'vegana']),
  foodAllergies: z.string().max(500, 'Allergies info is too long').optional(),
  physicalIssues: z
    .string()
    .max(500, 'Physical issues info is too long')
    .optional(),
  shareWithSponsors: z.boolean().default(true),
});

export const applicationSchema = z.object({
  modality: z.enum(['team', 'solo'], {
    errorMap: () => ({ message: 'Please select a modality' }),
  }),
  teamStatus: z.enum(['formed', 'looking']).optional(),
  teamSize: z.union([z.literal(3), z.literal(4), z.literal(5)]).optional(),
  members: z
    .array(hackerProfileSchema)
    .min(1, 'At least one member is required'),
  eventSuggestions: z
    .string()
    .min(1, 'Please provide your suggestions')
    .max(2000, 'Suggestions are too long'),
});

export type HackerProfileType = z.infer<typeof hackerProfileSchema>;
export type ApplicationFormDataType = z.infer<typeof applicationSchema>;
