'use client';

import { AlertCircle, Film, Image, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/src/lib/utils';
import { uploadMediaFile } from '@/src/lib/utils/blob';
import {
  ALLOWED_MEDIA_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_MEDIA_SIZE,
} from '@/src/lib/validations/file';
import { Button } from './button';

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: 'image' | 'video';
}

interface MediaUploadProps {
  onFilesChange: (urls: string[]) => void;
  currentUrls?: string[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  description?: string;
  maxFiles?: number;
  prefix?: string;
}

function getFileTypeFromUrl(url: string): 'image' | 'video' {
  const videoExtensions = ['.mp4', '.mov', '.webm'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext))
    ? 'video'
    : 'image';
}

function getFilenameFromUrl(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const cleanName = filename.split('?')[0];
  const timestampMatch = cleanName.match(/^\d+-(.+)$/);
  return timestampMatch ? timestampMatch[1] : cleanName;
}

export function MediaUpload({
  onFilesChange,
  currentUrls = [],
  disabled = false,
  className,
  placeholder = 'Arrastra fotos o videos aquí o haz clic para seleccionar',
  description = 'Soporta JPEG, PNG, WebP, MP4, MOV, WebM hasta 30MB',
  maxFiles = 5,
  prefix = 'feedback-media',
}: MediaUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() =>
    currentUrls.map((url) => ({
      url,
      name: getFilenameFromUrl(url),
      size: 0,
      type: getFileTypeFromUrl(url),
    })),
  );

  useEffect(() => {
    if (currentUrls.length > 0 && uploadedFiles.length === 0) {
      setUploadedFiles(
        currentUrls.map((url) => ({
          url,
          name: getFilenameFromUrl(url),
          size: 0,
          type: getFileTypeFromUrl(url),
        })),
      );
    }
  }, [currentUrls, uploadedFiles.length]);

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    if (file.size > MAX_MEDIA_SIZE) {
      setError('El archivo debe ser menor a 30MB');
      return false;
    }

    if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
      setError('Formato no soportado. Usa JPEG, PNG, WebP, MP4, MOV o WebM.');
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      const validFiles = files.filter(validateFile);

      if (validFiles.length === 0) return;

      const remainingSlots = maxFiles - uploadedFiles.length;
      if (remainingSlots <= 0) {
        setError(`Máximo ${maxFiles} archivos permitidos`);
        return;
      }

      const filesToUpload = validFiles.slice(0, remainingSlots);

      setIsUploading(true);
      setError(null);

      const newFiles: UploadedFile[] = [];

      for (const file of filesToUpload) {
        try {
          const url = await uploadMediaFile(file, prefix);
          const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
          newFiles.push({
            url,
            name: file.name,
            size: file.size,
            type: isVideo ? 'video' : 'image',
          });
        } catch (err) {
          console.error('File upload error:', err);
          setError(
            err instanceof Error ? err.message : 'Error al subir archivo',
          );
        }
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...uploadedFiles, ...newFiles];
        setUploadedFiles(updatedFiles);
        onFilesChange(updatedFiles.map((f) => f.url));
      }

      setIsUploading(false);
    },
    [validateFile, onFilesChange, uploadedFiles, maxFiles, prefix],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files);
      }
    },
    [handleFileSelect],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(Array.from(files));
      }
      e.target.value = '';
    },
    [handleFileSelect],
  );

  const removeFile = useCallback(
    (index: number) => {
      setError(null);
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(newFiles);
      onFilesChange(newFiles.map((f) => f.url));
    },
    [uploadedFiles, onFilesChange],
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const canUploadMore = uploadedFiles.length < maxFiles;

  return (
    <div className={cn('w-full space-y-3', className)}>
      {canUploadMore && (
        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50',
            (disabled || isUploading) && 'cursor-not-allowed opacity-50',
          )}
          role="button"
          tabIndex={disabled || isUploading ? -1 : 0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={ALLOWED_MEDIA_TYPES.join(',')}
            onChange={handleInputChange}
            disabled={disabled || isUploading}
            multiple
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />

          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {isUploading ? 'Subiendo...' : placeholder}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {uploadedFiles.length}/{maxFiles} archivos
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, index) => (
            <div
              key={file.url}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              {file.type === 'video' ? (
                <Film className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Image className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)} •{' '}
                  {file.type === 'video' ? 'Video' : 'Imagen'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={disabled || isUploading}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
