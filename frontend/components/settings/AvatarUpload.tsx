'use client';

import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { TOKEN_STORAGE_KEY } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface AvatarUploadProps {
  currentUrl?: string;
  onUploaded: (url: string) => void;
}

export function AvatarUpload({ currentUrl, onUploaded }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/uploads/avatar', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem(TOKEN_STORAGE_KEY)}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '上传失败');
      }

      const data = await response.json();
      const uploadedUrl = data.data?.url || data.url;

      setPreview(uploadedUrl);
      onUploaded(uploadedUrl);
      toast.success('头像上传成功');
    } catch (err) {
      const message = err instanceof Error ? err.message : '上传失败，请重试';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    setPreview('');
    onUploaded('');
  }

  return (
    <div className="flex items-center gap-4">
      {/* 头像预览 */}
      <div className="bg-muted relative size-24 overflow-hidden rounded-full">
        {preview ? (
          <>
            <div
              role="img"
              aria-label="头像预览"
              className="size-full bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(preview)})` }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute right-1 top-1 rounded-full p-1"
              aria-label="移除头像"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center text-4xl font-bold">
            ?
          </div>
        )}
      </div>

      {/* 上传按钮 */}
      <div className="space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id="avatar-upload"
        />
        <label htmlFor="avatar-upload">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            asChild
          >
            <span className="cursor-pointer">
              <Upload className="size-4" />
              {uploading ? '上传中…' : '上传头像'}
            </span>
          </Button>
        </label>
        <p className="text-muted-foreground text-xs">
          支持 JPG、PNG，最大 2MB
        </p>
      </div>
    </div>
  );
}
