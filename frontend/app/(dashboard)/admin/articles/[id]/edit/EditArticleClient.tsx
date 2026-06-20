'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { ArticleEditor } from '@/components/editor/ArticleEditor';
import { getArticleById } from '@/lib/api/article';
import { ApiRequestError } from '@/types/api';
import type { Category, UpsertArticleRequest } from '@/types/article';

interface EditArticleClientProps {
  articleId: number;
  categories: Category[];
}

export function EditArticleClient({
  articleId,
  categories,
}: EditArticleClientProps) {
  const [initialData, setInitialData] = useState<
    Partial<UpsertArticleRequest> | null
  >(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const article = await getArticleById(articleId);
        if (!active) return;

        setInitialData({
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          content: article.content,
          coverImage: article.coverImage,
          categoryId: article.categoryId,
          tags: article.tags?.map((tag) => tag.name) ?? [],
          isPremium: article.isPremium,
        });
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof ApiRequestError ? err.message : '加载文章失败，请重试',
        );
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [articleId]);

  if (error) {
    return (
      <main className="mx-auto max-w-[1080px] px-6 py-12">
        <p className="text-sm text-red-500">{error}</p>
      </main>
    );
  }

  if (!initialData) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-[1080px] items-center justify-center px-6">
        <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          loading article...
        </div>
      </main>
    );
  }

  return (
    <ArticleEditor
      mode="edit"
      articleId={articleId}
      categories={categories}
      initialData={initialData}
    />
  );
}
