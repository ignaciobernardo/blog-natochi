'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ApplicationFormData,
  ApplicationStore,
  HackerProfile,
  Modality,
  TeamSize,
  TeamStatus,
} from '@/src/lib/types/application';

const INITIAL_FORM_STATE: ApplicationFormData = {
  modality: null,
  members: [],
  eventSuggestions: '',
};

// Step sequence - will be dynamically adjusted based on modality/teamSize
const BASE_STEPS = [
  'welcome-1',
  'welcome-2',
  'modality',
  'team-status',
  'team-size',
  'team-ready',
  'suggestions',
  'summary',
];

const generateMemberSteps = (
  memberIndex: number,
  includeIntro: boolean = false,
): string[] => {
  const steps = [];
  if (includeIntro) {
    steps.push(`member-intro-${memberIndex}`);
  }
  steps.push(
    `member-personal-${memberIndex}`,
    `member-builder-${memberIndex}`,
    `member-education-${memberIndex}`,
    `member-role-${memberIndex}`,
    `member-veteran-${memberIndex}`,
    `member-considerations-${memberIndex}`,
  );
  return steps;
};

const generateTeamSteps = (
  teamStatus: TeamStatus | null,
  teamSize: TeamSize | null,
): string[] => {
  const steps: string[] = ['welcome-1', 'welcome-2', 'modality', 'team-status'];

  // Only include team-size step if team is formed, not if looking
  if (teamStatus === 'formed') {
    // Team is formed - show intro steps and all members
    steps.push('team-size');
    if (teamSize) {
      for (let i = 1; i <= teamSize; i++) {
        steps.push(...generateMemberSteps(i, true)); // includeIntro = true for formed teams
      }
      // Only show team-ready if team is actually formed
      steps.push('team-ready');
    }
  } else {
    // If looking for team, only ask for leader info (1 member) without intro
    steps.push(...generateMemberSteps(1, false)); // includeIntro = false for looking
  }

  steps.push('suggestions', 'summary');
  return steps;
};

const generateSoloSteps = (): string[] => {
  const steps = BASE_STEPS.slice(0, 3); // welcome-1, welcome-2, modality
  steps.push(...generateMemberSteps(1, false)); // single member steps without intro
  steps.push(...BASE_STEPS.slice(6)); // suggestions, summary (skip team steps)
  return steps;
};

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set, get) => ({
      formData: INITIAL_FORM_STATE,
      currentStep: 'welcome-1',
      maxStepReached: 'welcome-1',
      isLoading: false,
      error: null,
      isHydrated: false,

      setModality: (modality: Modality) => {
        set((state) => ({
          formData: { ...state.formData, modality },
        }));
      },

      setTeamStatus: (teamStatus: TeamStatus) => {
        set((state) => ({
          formData: { ...state.formData, teamStatus },
        }));
      },

      setTeamSize: (teamSize: TeamSize) => {
        set((state) => ({
          formData: { ...state.formData, teamSize },
        }));
      },

      addMember: (member: HackerProfile) => {
        set((state) => ({
          formData: {
            ...state.formData,
            members: [...state.formData.members, member],
          },
        }));
      },

      updateMember: (index: number, memberUpdate: Partial<HackerProfile>) => {
        set((state) => ({
          formData: {
            ...state.formData,
            members: state.formData.members.map((member, i) =>
              i === index ? { ...member, ...memberUpdate } : member,
            ),
          },
        }));
      },

      removeMember: (index: number) => {
        set((state) => ({
          formData: {
            ...state.formData,
            members: state.formData.members.filter((_, i) => i !== index),
          },
        }));
      },

      setEventSuggestions: (suggestions: string) => {
        set((state) => ({
          formData: { ...state.formData, eventSuggestions: suggestions },
        }));
      },

      hydrateApplication: (data: ApplicationFormData) => {
        set({
          formData: data,
          currentStep: 'summary',
          maxStepReached: 'summary',
          error: null,
        });
      },

      goToStep: (step: string) => {
        set({ currentStep: step });
      },

      nextStep: () => {
        set((state) => {
          const { formData, currentStep, maxStepReached } = state;
          let steps: string[] = BASE_STEPS;

          // Generate correct step sequence based on form state
          if (formData.modality === 'team') {
            steps = generateTeamSteps(
              formData.teamStatus || null,
              formData.teamSize || null,
            );
          } else if (formData.modality === 'solo') {
            steps = generateSoloSteps();
          }

          const currentIndex = steps.indexOf(currentStep);
          const nextStep = steps[currentIndex + 1];

          if (nextStep) {
            // Update maxStepReached if this step is further than the previous max
            const nextIndex = steps.indexOf(nextStep);
            const maxIndex = steps.indexOf(maxStepReached);
            const newMaxStepReached =
              nextIndex > maxIndex ? nextStep : maxStepReached;

            return { currentStep: nextStep, maxStepReached: newMaxStepReached };
          }
          return {};
        });
      },

      previousStep: () => {
        set((state) => {
          const { formData, currentStep } = state;
          let steps: string[] = BASE_STEPS;

          // Generate correct step sequence based on form state
          if (formData.modality === 'team') {
            steps = generateTeamSteps(
              formData.teamStatus || null,
              formData.teamSize || null,
            );
          } else if (formData.modality === 'solo') {
            steps = generateSoloSteps();
          }

          const currentIndex = steps.indexOf(currentStep);
          const prevStep = steps[currentIndex - 1];

          return prevStep ? { currentStep: prevStep } : {};
        });
      },

      canGoBack: () => {
        const { currentStep } = get();
        return currentStep !== 'welcome-1';
      },

      resetForm: () => {
        set({
          formData: INITIAL_FORM_STATE,
          currentStep: 'welcome-1',
          maxStepReached: 'welcome-1',
          error: null,
        });
      },

      clearStorage: () => {
        // Only clear localStorage without changing current state
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('platanus-hack-apply');
        }
      },

      setHydrated: (hydrated: boolean) => {
        set({ isHydrated: hydrated });
      },
    }),
    {
      name: 'platanus-hack-apply',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      storage:
        typeof window !== 'undefined'
          ? {
              getItem: (key: string) => {
                const item = window.localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
              },
              setItem: (key: string, value: any) => {
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

// Custom hook for getting correct step sequence
export const useStepSequence = () => {
  const { formData } = useApplicationStore();

  if (formData.modality === 'team') {
    return generateTeamSteps(
      formData.teamStatus || null,
      formData.teamSize || null,
    );
  } else if (formData.modality === 'solo') {
    return generateSoloSteps();
  }

  return BASE_STEPS;
};
