'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteArticle } from '@/lib/api/article';
import { ApiRequestError } from '@/types/api';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface DeleteArticleDialogProps {
  articleId: number;
  articleTitle: string;
  onDeleted?: () => void;
}

export function DeleteArticleDialog({
  articleId,
  articleTitle,
  onDeleted,
}: DeleteArticleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteArticle(articleId);
      toast.success('文章已删除');
      setOpen(false);

      // 调用回调或刷新页面
      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : '删除失败，请重试';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="size-4" />
          删除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除文章？</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>您即将删除以下文章：</p>
            <p className="font-medium">{articleTitle}</p>
            <p className="text-destructive">此操作不可撤销，文章将被永久删除。</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="size-4 animate-spin" />}
            确认删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
