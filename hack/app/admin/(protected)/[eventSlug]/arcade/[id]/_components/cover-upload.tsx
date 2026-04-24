'use client';

import { Image as ImageIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { updateCoverAction } from '../_actions/update-cover.action';

interface CoverUploadProps {
  gameId: string;
  currentCover: string | null;
  gameTitle: string;
}

export function CoverUpload({
  gameId,
  currentCover,
  gameTitle,
}: CoverUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCover);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setPreviewUrl(base64String);

      // Upload to server
      startTransition(async () => {
        const result = await updateCoverAction(gameId, base64String);

        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
          // Reset preview on error
          setPreviewUrl(currentCover);
        }
      });
    };

    reader.onerror = () => {
      toast.error('Failed to read image file');
    };

    reader.readAsDataURL(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {previewUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-border bg-muted">
            <Image
              src={previewUrl}
              alt={`Cover for ${gameTitle}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-lg border-2 border-border border-dashed bg-muted">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-12 w-12" />
              <p className="text-sm">No cover image</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isPending}
        />

        <Button
          onClick={handleButtonClick}
          disabled={isPending}
          variant="outline"
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isPending ? 'Uploading...' : 'Upload Cover Image'}
        </Button>

        <p className="text-muted-foreground text-xs">
          Recommended: 16:9 aspect ratio, max 2MB (PNG, JPG, GIF)
        </p>
      </div>
    </div>
  );
}
