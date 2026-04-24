'use client';

import {
  ChevronDown,
  Plane,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Checkbox } from '@/src/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/src/components/ui/collapsible';
import { Combobox } from '@/src/components/ui/combobox';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { getAdminEventPath } from '@/src/lib/admin/routes';
import { COUNTRIES } from '@/src/lib/constants';
import {
  type Cohort,
  cohorts,
  type ReviewQualification,
  reviewQualifications,
  type SubmissionModality,
  type SubmissionStatus,
  submissionModalities,
  submissionStatuses,
} from '@/src/lib/db/schema';
import type { SubmissionReviewSearchParams } from '@/src/lib/schemas/submission-review.schema';

interface SubmissionReviewFiltersProps {
  eventSlug: string;
  initialParams: SubmissionReviewSearchParams;
  countries: string[];
}

export function SubmissionReviewFilters({
  eventSlug,
  initialParams,
  countries,
}: SubmissionReviewFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialParams.search || '');
  const [selectedStatuses, setSelectedStatuses] = useState<SubmissionStatus[]>(
    initialParams.status || [],
  );
  const [selectedCohorts, setSelectedCohorts] = useState<Cohort[]>(
    initialParams.cohort || [],
  );
  const [selectedModalities, setSelectedModalities] = useState<
    SubmissionModality[]
  >(initialParams.modality || []);
  const [selectedQualifications, setSelectedQualifications] = useState<
    ReviewQualification[]
  >(initialParams.qualification || []);
  const [submittedAfter, setSubmittedAfter] = useState(
    initialParams.submittedAfter
      ? new Date(initialParams.submittedAfter).toISOString().split('T')[0]
      : '',
  );
  const [submittedBefore, setSubmittedBefore] = useState(
    initialParams.submittedBefore
      ? new Date(initialParams.submittedBefore).toISOString().split('T')[0]
      : '',
  );
  const [sortOrder, setSortOrder] = useState(initialParams.sortOrder);
  const [selectedCountry, setSelectedCountry] = useState(
    initialParams.country || '',
  );
  const [hasFlightRequest, setHasFlightRequest] = useState(
    initialParams.hasFlightRequest || false,
  );
  const [hasReview, setHasReview] = useState<boolean | undefined>(
    initialParams.hasReview,
  );
  const [hasWomen, setHasWomen] = useState(initialParams.hasWomen || false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const updateFilters = () => {
    const params = new URLSearchParams(searchParams);

    if (search) {
      params.set('search', search);
    } else {
      params.delete('search');
    }

    if (selectedStatuses.length > 0) {
      params.set('status', selectedStatuses.join(','));
    } else {
      params.delete('status');
    }

    if (selectedCohorts.length > 0) {
      params.set('cohort', selectedCohorts.join(','));
    } else {
      params.delete('cohort');
    }

    if (selectedModalities.length > 0) {
      params.set('modality', selectedModalities.join(','));
    } else {
      params.delete('modality');
    }

    if (selectedQualifications.length > 0) {
      params.set('qualification', selectedQualifications.join(','));
    } else {
      params.delete('qualification');
    }

    if (selectedCountry) {
      params.set('country', selectedCountry);
    } else {
      params.delete('country');
    }

    if (hasFlightRequest) {
      params.set('hasFlightRequest', 'true');
    } else {
      params.delete('hasFlightRequest');
    }

    if (hasReview !== undefined) {
      params.set('hasReview', hasReview.toString());
    } else {
      params.delete('hasReview');
    }

    if (hasWomen) {
      params.set('hasWomen', 'true');
    } else {
      params.delete('hasWomen');
    }

    if (submittedAfter) {
      params.set('submittedAfter', submittedAfter);
    } else {
      params.delete('submittedAfter');
    }

    if (submittedBefore) {
      params.set('submittedBefore', submittedBefore);
    } else {
      params.delete('submittedBefore');
    }

    params.set('sortOrder', sortOrder);

    params.delete('page');

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedStatuses([]);
    setSelectedCohorts([]);
    setSelectedModalities([]);
    setSelectedQualifications([]);
    setSelectedCountry('');
    setHasFlightRequest(false);
    setHasReview(undefined);
    setHasWomen(false);
    setSubmittedAfter('');
    setSubmittedBefore('');
    setSortOrder('desc');

    startTransition(() => {
      router.push(getAdminEventPath(eventSlug, 'review'));
    });
  };

  const toggleStatus = (status: SubmissionStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const toggleCohort = (cohort: Cohort) => {
    setSelectedCohorts((prev) =>
      prev.includes(cohort)
        ? prev.filter((c) => c !== cohort)
        : [...prev, cohort],
    );
  };

  const toggleModality = (modality: SubmissionModality) => {
    setSelectedModalities((prev) =>
      prev.includes(modality)
        ? prev.filter((m) => m !== modality)
        : [...prev, modality],
    );
  };

  const toggleQualification = (qual: ReviewQualification) => {
    setSelectedQualifications((prev) =>
      prev.includes(qual) ? prev.filter((q) => q !== qual) : [...prev, qual],
    );
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateFilters();
    }
  };

  const statusLabels: Record<SubmissionStatus, string> = {
    received: 'Received',
    priority_waiting: 'Priority Waiting',
    asking_self_finance_trip: 'Asking Self Finance',
    approved: 'Approved',
    onboarding_request: 'Onboarding Request',
    onboarding_expired: 'Onboarding Expired',
    onboarding_complete: 'Onboarding Complete',
    rejected: 'Rejected',
    waiting_list: 'Waiting List',
    withdrawn: 'Withdrawn',
    archived: 'Archived',
  };

  return (
    <div className="space-y-4">
      {/* Always visible search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or GitHub username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-10"
          />
        </div>

        {/* Advanced filters toggle */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isFiltersOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </div>

      {/* Collapsible advanced filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[180px] flex-1">
              <label
                htmlFor="submitted-after"
                className="mb-2 block font-medium text-sm"
              >
                Submitted After
              </label>
              <Input
                id="submitted-after"
                type="date"
                value={submittedAfter}
                onChange={(e) => setSubmittedAfter(e.target.value)}
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <label
                htmlFor="submitted-before"
                className="mb-2 block font-medium text-sm"
              >
                Submitted Before
              </label>
              <Input
                id="submitted-before"
                type="date"
                value={submittedBefore}
                onChange={(e) => setSubmittedBefore(e.target.value)}
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <div className="mb-2 font-medium text-sm">Country</div>
              <Combobox
                options={countries.map((country) => ({
                  value: country,
                  label:
                    COUNTRIES.find((c) => c.code === country)?.name ?? country,
                  emoji: COUNTRIES.find((c) => c.code === country)?.emoji,
                }))}
                value={selectedCountry}
                onValueChange={(value) => setSelectedCountry(value)}
                placeholder="select country..."
                searchPlaceholder="search countries..."
                emptyText="no country found."
              />
            </div>

            <div className="min-w-[180px] flex-1">
              <div className="mb-2 font-medium text-sm">Sort Order</div>
              <Select
                value={sortOrder}
                onValueChange={(value: any) => setSortOrder(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 font-medium text-sm">
              Filter by Status
            </div>
            <div className="flex flex-wrap gap-2">
              {submissionStatuses.map((status) => (
                <Badge
                  key={status}
                  variant={
                    selectedStatuses.includes(status) ? 'default' : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleStatus(status)}
                >
                  {statusLabels[status]}
                  {selectedStatuses.includes(status) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 font-medium text-sm">
              Filter by Cohort
            </div>
            <div className="flex flex-wrap gap-2">
              {cohorts.map((cohort) => (
                <Badge
                  key={cohort}
                  variant={
                    selectedCohorts.includes(cohort) ? 'default' : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleCohort(cohort)}
                >
                  {cohort === 'priority' ? 'Priority' : 'Final'}
                  {selectedCohorts.includes(cohort) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 font-medium text-sm">
              Filter by Modality
            </div>
            <div className="flex flex-wrap gap-2">
              {submissionModalities.map((modality) => (
                <Badge
                  key={modality}
                  variant={
                    selectedModalities.includes(modality)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleModality(modality)}
                >
                  {modality === 'solo'
                    ? 'Solo'
                    : modality === 'team'
                      ? 'Team'
                      : 'Team Looking'}
                  {selectedModalities.includes(modality) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 font-medium text-sm">
              Filter by Review Qualification
            </div>
            <div className="flex flex-wrap gap-2">
              {reviewQualifications.map((qual) => {
                const qualLabels: Record<ReviewQualification, string> = {
                  hell_yes: '🔥 Hell Yes',
                  yes: '✅ Yes',
                  maybe: '🤔 Maybe',
                  no: '❌ No',
                  hell_no: '💀 Hell No',
                };
                return (
                  <Badge
                    key={qual}
                    variant={
                      selectedQualifications.includes(qual)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleQualification(qual)}
                  >
                    {qualLabels[qual]}
                    {selectedQualifications.includes(qual) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 font-medium text-sm">
              Other Filters
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasWomen"
                  checked={hasWomen}
                  onCheckedChange={(checked) => setHasWomen(checked === true)}
                />
                <label
                  htmlFor="hasWomen"
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <UserRound className="h-4 w-4" />
                  Has Women
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasFlightRequest"
                  checked={hasFlightRequest}
                  onCheckedChange={(checked) =>
                    setHasFlightRequest(checked === true)
                  }
                />
                <label
                  htmlFor="hasFlightRequest"
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Plane className="h-4 w-4" />
                  Has Flight Request
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="noReview"
                  checked={hasReview === false}
                  onCheckedChange={(checked) =>
                    setHasReview(checked === true ? false : undefined)
                  }
                />
                <label htmlFor="noReview" className="cursor-pointer text-sm">
                  No Review Yet
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={updateFilters} disabled={isPending}>
              {isPending ? 'Applying...' : 'Apply Filters'}
            </Button>
            <Button
              variant="outline"
              onClick={resetFilters}
              disabled={isPending}
            >
              Reset
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export { SubmissionReviewFilters as TeamReviewFilters };
