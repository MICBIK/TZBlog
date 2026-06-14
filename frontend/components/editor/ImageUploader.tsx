'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

import { uploadImage } from '@/lib/api/upload';
import { ApiRequestError } from '@/types/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  /** 上传成功后回调，返回图片 URL */
  onUploaded: (url: string) => void;
  /** 当前已上传的 URL（用于预览） */
  currentUrl?: string;
  className?: string;
}

/** 支持的图片格式 */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageUploader({
  onUploaded,
  currentUrl,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl ?? '');

  async function handleFile(file: File) {
    // 校验
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('仅支持 JPG、PNG、WebP、GIF 格式');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadImage(file);
      setPreview(result.url);
      onUploaded(result.url);
      toast.success('图片上传成功');
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : '上传失败，请重试';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function clearImage() {
    setPreview('');
    onUploaded('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className={cn('space-y-2', className)}>
      {preview ? (
        <div className="border-border relative overflow-hidden rounded-md border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="封面预览"
            className="h-40 w-full object-cover"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute right-2 top-2 size-7"
            onClick={clearImage}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-border hover:border-primary flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed transition-colors"
        >
          {uploading ? (
            <Loader2 className="text-muted-foreground size-6 animate-spin" />
          ) : (
            <>
              <ImagePlus className="text-muted-foreground size-6" />
              <p className="text-muted-foreground text-sm">
                点击或拖拽图片到此处上传
              </p>
              <p className="text-muted-foreground text-xs">
                JPG / PNG / WebP / GIF，最大 5MB
              </p>
            </>
          )}
        </div>
      )}
      <Input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
