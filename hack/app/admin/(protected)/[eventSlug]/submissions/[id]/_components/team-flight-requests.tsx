'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Plane, Plus, User } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Textarea } from '@/src/components/ui/textarea';
import type { FlightRequest } from '@/src/lib/db/schema';
import { addFlightRequestAction } from '../_actions/add-flight-request.action';

interface TeamFlightRequestsProps {
  flightRequests: Array<
    FlightRequest & { author: { fullName: string; email: string } }
  >;
  submissionId: string;
}

export function TeamFlightRequests({
  flightRequests,
  submissionId,
}: TeamFlightRequestsProps) {
  const [flightRequestInput, setFlightRequestInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightRequestInput.trim() || isPending) return;

    setError(null);
    const contentToSubmit = flightRequestInput;

    startTransition(async () => {
      const result = await addFlightRequestAction(
        submissionId,
        contentToSubmit,
      );
      if (!result.success) {
        setError(result.error || 'Failed to add flight request');
      } else {
        setFlightRequestInput('');
        setIsDialogOpen(false);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Requests ({flightRequests.length})
          </span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogPrimitive.Trigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Flight Request
              </Button>
            </DialogPrimitive.Trigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Flight Request</DialogTitle>
                <DialogDescription>
                  Paste the email content from the flight request here.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="Paste the email content here..."
                  value={flightRequestInput}
                  onChange={(e) => setFlightRequestInput(e.target.value)}
                  disabled={isPending}
                  className="min-h-[200px]"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setFlightRequestInput('');
                      setError(null);
                    }}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !flightRequestInput.trim()}
                  >
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Flight Request
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {flightRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No flight requests yet
            </div>
          ) : (
            <div className="space-y-3">
              {flightRequests.map((request) => (
                <div
                  key={request.id}
                  className="space-y-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <User className="h-3 w-3" />
                      {request.author.fullName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(request.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-sm">
                    {request.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
