'use client';

import { Loader2, Search, UserPlus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from '@/src/components/toast';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Input } from '@/src/components/ui/input';
import type { AvailableHacker } from '@/src/queries/teams';
import {
  addHackerToTeamAction,
  searchHackersAction,
} from '../_actions/teams.actions';

interface AddHackerDialogProps {
  teamId: string;
}

export function AddHackerDialog({ teamId }: AddHackerDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AvailableHacker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const performSearch = useDebouncedCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const result = await searchHackersAction(query);

    if (result.success && result.hackers) {
      setSearchResults(result.hackers);
    } else {
      toast({
        type: 'error',
        description: result.error || 'Failed to search hackers',
      });
      setSearchResults([]);
    }
    setIsSearching(false);
  }, 500);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    performSearch(value);
  };

  const handleAddHacker = (hackerProfileId: string, hackerName: string) => {
    startTransition(async () => {
      const result = await addHackerToTeamAction(hackerProfileId, teamId);

      if (result.success) {
        toast({
          type: 'success',
          description: `${hackerName} added to team successfully`,
        });
        setOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        toast({
          type: 'error',
          description: result.error || 'Failed to add hacker to team',
        });
      }
    });
  };

  const getGithubUsername = (url: string | null) => {
    if (!url) return null;
    return url
      .replace(/^https?:\/\/(www\.)?github\.com\//, '')
      .replace(/\/$/, '');
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add Hacker
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Hacker to Team</DialogTitle>
            <DialogDescription>
              Search for hackers by name or GitHub username. Only hackers who
              have completed onboarding will appear.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or GitHub username..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute top-3 right-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {searchQuery.length < 2 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Enter at least 2 characters to search
                </div>
              ) : searchResults.length === 0 && !isSearching ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No hackers found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                searchResults.map((hacker) => (
                  <div
                    key={hacker.id}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{hacker.fullName}</span>
                        {hacker.currentTeam && (
                          <Badge variant="secondary">
                            In team: {hacker.currentTeam.slug}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <span>{hacker.email}</span>
                        {hacker.github && (
                          <span className="text-blue-600">
                            @{getGithubUsername(hacker.github)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAddHacker(hacker.id, hacker.fullName)
                      }
                      disabled={isPending}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
