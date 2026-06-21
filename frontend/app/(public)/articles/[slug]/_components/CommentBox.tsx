'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createComment } from '@/lib/api/comment';
import { ApiRequestError } from '@/types/api';

interface CommentBoxProps {
  articleId: number;
  onCreated?: () => Promise<void> | void;
}

/**
 * 评论发布框。
 * 接真实评论创建 API；401 由全局 client 清登录并跳登录页，其余错误本地提示。
 */
export function CommentBox({ articleId, onCreated }: CommentBoxProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      await createComment({
        articleId,
        content: trimmed,
      });
      setContent('');
      toast.success('评论已发布');
      await onCreated?.();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : '评论发布失败，请稍后重试';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6 flex gap-2.5">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="// 写下你的想法… 登录后发布"
        className="border-[var(--line-2)] bg-panel text-fg min-h-[48px] flex-1 resize-y rounded-lg border px-3.5 py-[11px] font-sans text-sm focus:border-[var(--acc-dim)] focus:outline-none"
      />
      <button
        type="button"
        disabled={submitting || !content.trim()}
        onClick={handleSubmit}
        className="bg-acc cursor-pointer self-end rounded-md border-none px-[18px] py-2.5 font-mono text-[13px] font-bold text-[#06120b]"
      >
        {submitting ? <Loader2 className="size-4 animate-spin" /> : '发布'}
      </button>
    </div>
  );
}
