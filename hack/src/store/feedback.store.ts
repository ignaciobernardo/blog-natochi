'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventQualityRatings } from '@/src/lib/db/schema';
import type { FeedbackFormData } from '@/src/lib/schemas/feedback.schema';

export const FEEDBACK_STEPS = [
  'overall',
  'quality',
  'improvement',
  'sponsors',
  'future',
  'extras',
  'thank-you',
] as const;

export type FeedbackStep = (typeof FEEDBACK_STEPS)[number];

const INITIAL_QUALITY_RATINGS: EventQualityRatings = {
  oficina: 0,
  wifi: 0,
  comida: 0,
  software: 0,
  comunicacion: 0,
  branding: 0,
  mentores: 0,
  jueces: 0,
  sponsors: 0,
  nivelTecnico: 0,
  tracks: 0,
  premios: 0,
  procesoEvaluacion: 0,
  publicVoting: 0,
  organizacion: 0,
};

export interface FeedbackFormState extends Partial<FeedbackFormData> {
  eventQualityRatings: EventQualityRatings;
}

const INITIAL_FORM_STATE: FeedbackFormState = {
  overallRating: undefined,
  npsScore: undefined,
  participationIntent: undefined,
  eventQualityRatings: INITIAL_QUALITY_RATINGS,
  bestPart: '',
  worstPart: '',
  suggestions: '',
  sponsorUnaidedRecall: '',
  sponsorsInteracted: [],
  sponsorWorkIntent: undefined,
  sponsorComments: '',
  startupIntent: undefined,
  fundingPreference: undefined,
  startupAmbition: undefined,
  howHeardAbout: '',
  additionalComments: '',
  mediaUrls: [],
  feedbackUsagePermission: undefined,
  mentorRating: undefined,
};

interface FeedbackStore {
  formData: FeedbackFormState;
  currentStep: FeedbackStep;
  maxStepReached: FeedbackStep;
  isLoading: boolean;
  error: string | null;
  isSubmitted: boolean;

  // Field setters
  setOverallRating: (rating: number) => void;
  setNpsScore: (score: number) => void;
  setParticipationIntent: (intent: 'yes' | 'no' | 'maybe') => void;
  setEventQualityRating: (
    key: keyof EventQualityRatings,
    value: number,
  ) => void;
  setBestPart: (text: string) => void;
  setWorstPart: (text: string) => void;
  setSuggestions: (text: string) => void;
  setSponsorUnaidedRecall: (text: string) => void;
  setSponsorsInteracted: (sponsors: string[]) => void;
  setSponsorWorkIntent: (intent: 'yes' | 'no' | 'already_did') => void;
  setSponsorComments: (text: string) => void;
  setStartupIntent: (intent: 'yes' | 'no' | 'already_building') => void;
  setFundingPreference: (preference: 'bootstrapped' | 'vc' | 'other') => void;
  setStartupAmbition: (
    ambition:
      | 'up_to_100k'
      | '100k_to_1m'
      | '1m_to_10m'
      | '10m_plus'
      | 'not_sure',
  ) => void;
  setHowHeardAbout: (text: string) => void;
  setAdditionalComments: (text: string) => void;
  setMediaUrls: (urls: string[]) => void;
  setFeedbackUsagePermission: (
    permission: 'yes_with_name' | 'yes_anonymous' | 'no',
  ) => void;
  setMentorRating: (rating: number) => void;

  // Navigation
  goToStep: (step: FeedbackStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoBack: () => boolean;

  // State management
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setIsSubmitted: (submitted: boolean) => void;
  resetForm: () => void;
  clearStorage: () => void;
}

export const useFeedbackStore = create<FeedbackStore>()(
  persist(
    (set, get) => ({
      formData: INITIAL_FORM_STATE,
      currentStep: 'overall',
      maxStepReached: 'overall',
      isLoading: false,
      error: null,
      isSubmitted: false,

      // Field setters
      setOverallRating: (rating) =>
        set((state) => ({
          formData: { ...state.formData, overallRating: rating },
        })),

      setNpsScore: (score) =>
        set((state) => ({
          formData: { ...state.formData, npsScore: score },
        })),

      setParticipationIntent: (intent) =>
        set((state) => ({
          formData: { ...state.formData, participationIntent: intent },
        })),

      setEventQualityRating: (key, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            eventQualityRatings: {
              ...state.formData.eventQualityRatings,
              [key]: value,
            },
          },
        })),

      setBestPart: (text) =>
        set((state) => ({
          formData: { ...state.formData, bestPart: text },
        })),

      setWorstPart: (text) =>
        set((state) => ({
          formData: { ...state.formData, worstPart: text },
        })),

      setSuggestions: (text) =>
        set((state) => ({
          formData: { ...state.formData, suggestions: text },
        })),

      setSponsorUnaidedRecall: (text) =>
        set((state) => ({
          formData: { ...state.formData, sponsorUnaidedRecall: text },
        })),

      setSponsorsInteracted: (sponsors) =>
        set((state) => ({
          formData: { ...state.formData, sponsorsInteracted: sponsors },
        })),

      setSponsorWorkIntent: (intent) =>
        set((state) => ({
          formData: { ...state.formData, sponsorWorkIntent: intent },
        })),

      setSponsorComments: (text) =>
        set((state) => ({
          formData: { ...state.formData, sponsorComments: text },
        })),

      setStartupIntent: (intent) =>
        set((state) => ({
          formData: { ...state.formData, startupIntent: intent },
        })),

      setFundingPreference: (preference) =>
        set((state) => ({
          formData: { ...state.formData, fundingPreference: preference },
        })),

      setStartupAmbition: (ambition) =>
        set((state) => ({
          formData: { ...state.formData, startupAmbition: ambition },
        })),

      setHowHeardAbout: (text) =>
        set((state) => ({
          formData: { ...state.formData, howHeardAbout: text },
        })),

      setAdditionalComments: (text) =>
        set((state) => ({
          formData: { ...state.formData, additionalComments: text },
        })),

      setMediaUrls: (urls) =>
        set((state) => ({
          formData: { ...state.formData, mediaUrls: urls },
        })),

      setFeedbackUsagePermission: (permission) =>
        set((state) => ({
          formData: { ...state.formData, feedbackUsagePermission: permission },
        })),

      setMentorRating: (rating) =>
        set((state) => ({
          formData: { ...state.formData, mentorRating: rating },
        })),

      // Navigation
      goToStep: (step) => {
        set({ currentStep: step });
      },

      nextStep: () => {
        set((state) => {
          const currentIndex = FEEDBACK_STEPS.indexOf(state.currentStep);
          const nextStep = FEEDBACK_STEPS[currentIndex + 1];

          if (nextStep) {
            const nextIndex = FEEDBACK_STEPS.indexOf(nextStep);
            const maxIndex = FEEDBACK_STEPS.indexOf(state.maxStepReached);
            const newMaxStepReached =
              nextIndex > maxIndex ? nextStep : state.maxStepReached;

            return { currentStep: nextStep, maxStepReached: newMaxStepReached };
          }
          return {};
        });
      },

      previousStep: () => {
        set((state) => {
          const currentIndex = FEEDBACK_STEPS.indexOf(state.currentStep);
          const prevStep = FEEDBACK_STEPS[currentIndex - 1];

          return prevStep ? { currentStep: prevStep } : {};
        });
      },

      canGoBack: () => {
        const { currentStep } = get();
        return currentStep !== 'overall';
      },

      // State management
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setIsSubmitted: (submitted) => set({ isSubmitted: submitted }),

      resetForm: () => {
        set({
          formData: INITIAL_FORM_STATE,
          currentStep: 'overall',
          maxStepReached: 'overall',
          error: null,
          isSubmitted: false,
        });
      },

      clearStorage: () => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('platanus-hack-feedback');
        }
      },
    }),
    {
      name: 'platanus-hack-feedback',
      storage:
        typeof window !== 'undefined'
          ? {
              getItem: (key: string) => {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
              },
              setItem: (key: string, value: unknown) => {
                window.localStorage.setItem(key, JSON.stringify(value));
              },
              removeItem: (key: string) => {
                window.localStorage.removeItem(key);
              },
            }
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
    },
  ),
);
