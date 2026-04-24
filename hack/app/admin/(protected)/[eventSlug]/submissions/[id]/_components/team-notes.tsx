'use client';

import { formatDistanceToNow } from 'date-fns';
import { Loader2, User } from 'lucide-react';
import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Textarea } from '@/src/components/ui/textarea';
import type { SubmissionNote } from '@/src/lib/db/schema';
import { addNoteAction } from '../_actions/add-note.action';

interface TeamNotesProps {
  notes: Array<
    SubmissionNote & { author: { fullName: string; email: string } }
  >;
  submissionId: string;
}

export function TeamNotes({ notes, submissionId }: TeamNotesProps) {
  const [noteInput, setNoteInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || isPending) return;

    setError(null);
    const noteToSubmit = noteInput;
    setNoteInput('');

    startTransition(async () => {
      const result = await addNoteAction(submissionId, noteToSubmit);
      if (!result.success) {
        setError(result.error || 'Failed to add note');
        setNoteInput(noteToSubmit);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notes ({notes.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add note input */}
          <div className="space-y-2">
            <div className="relative">
              <Textarea
                placeholder="Add a note... (Press Enter to submit, Shift+Enter for new line)"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPending}
                className="min-h-[80px] resize-none pr-10"
              />
              {isPending && (
                <div className="absolute top-3 right-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No notes yet
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="space-y-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <User className="h-3 w-3" />
                      {note.author.fullName}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-sm">{note.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
