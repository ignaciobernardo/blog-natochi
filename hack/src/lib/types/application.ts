export type Modality = 'team' | 'solo';
export type TeamStatus = 'formed' | 'looking';
export type TeamSize = 3 | 4 | 5;
export type ShirtSize = 'S' | 'M' | 'L' | 'XL';
export type Diet = 'omnivora' | 'vegetariana' | 'vegana';
export type HackerRole = 'desarrollo' | 'producto' | 'diseno' | 'ventas' | 'qa';

export interface HackerProfile {
  // Personal info
  fullName: string;
  country: string;
  githubProfile: string;
  email: string;
  linkedinProfile: string;
  age: number;

  // Builder profile
  builderDescription: string;

  // Education
  education: string;

  // Roles
  roles: HackerRole[];

  // Experience
  isVeteran: boolean;
  previousHackathons?: string; // conditional, only if isVeteran=true

  // Considerations
  shirtSize: ShirtSize;
  diet: Diet;
  foodAllergies?: string;
  physicalIssues?: string;
  shareWithSponsors: boolean;
}

export interface ApplicationFormData {
  // Step 1-3: Setup
  modality: Modality | null;
  teamStatus?: TeamStatus | null;
  teamSize?: TeamSize | null;

  // Step 4+: Members (array for team, single for solo)
  members: HackerProfile[];

  // Final
  eventSuggestions: string;

  // Metadata
  submittedAt?: string;
  submissionId?: string;
}

export interface ApplicationStore {
  // State
  formData: ApplicationFormData;
  currentStep: string;
  maxStepReached: string;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  setModality: (modality: Modality) => void;
  setTeamStatus: (status: TeamStatus) => void;
  setTeamSize: (size: TeamSize) => void;
  addMember: (member: HackerProfile) => void;
  updateMember: (index: number, member: Partial<HackerProfile>) => void;
  removeMember: (index: number) => void;
  setEventSuggestions: (suggestions: string) => void;
  hydrateApplication: (data: ApplicationFormData) => void;
  goToStep: (step: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoBack: () => boolean;

  // Persistence
  resetForm: () => void;
  clearStorage: () => void;
  setHydrated: (hydrated: boolean) => void;
}
