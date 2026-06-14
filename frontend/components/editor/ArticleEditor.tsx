'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, Send } from 'lucide-react';
import { toast } from 'sonner';

import { createArticle, updateArticle } from '@/lib/api/article';
import { ApiRequestError } from '@/types/api';
import type { ArticleSummary, UpsertArticleRequest } from '@/types/article';
import type { Category } from '@/types/article';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { ImageUploader } from '@/components/editor/ImageUploader';

const articleSchema = z.object({
  title: z.string().min(1, '请输入标题').max(200, '标题最多 200 字'),
  slug: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
      'slug 只能含小写字母、数字、连字符',
    ),
  summary: z.string().max(500, '摘要最多 500 字').optional(),
  content: z.string().min(1, '请输入正文内容'),
  coverImage: z.string().optional(),
  categoryId: z.number().min(1, '请选择分类'),
  tags: z.array(z.string()).optional(),
  isPremium: z.boolean().optional(),
});
type ArticleFormValues = z.infer<typeof articleSchema>;

interface ArticleEditorProps {
  mode: 'create' | 'edit';
  /** 编辑模式时的文章 ID 与初始数据 */
  articleId?: number;
  initialData?: Partial<ArticleFormValues>;
  /** 分类列表（由 server 组件传入） */
  categories: Category[];
}

export function ArticleEditor({
  mode,
  articleId,
  initialData,
  categories,
}: ArticleEditorProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<'draft' | 'publish' | null>(
    null,
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      summary: initialData?.summary ?? '',
      content: initialData?.content ?? '',
      coverImage: initialData?.coverImage ?? '',
      categoryId: initialData?.categoryId ?? 0,
      isPremium: initialData?.isPremium ?? false,
    },
  });

  function addTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function onSubmit(
    data: ArticleFormValues,
    status: 'draft' | 'published',
  ) {
    setSubmitting(status === 'draft' ? 'draft' : 'publish');
    try {
      const payload: UpsertArticleRequest = {
        title: data.title,
        slug: data.slug || undefined,
        summary: data.summary || '',
        content: data.content,
        coverImage: data.coverImage || '',
        categoryId: data.categoryId,
        tags,
        isPremium: data.isPremium ?? false,
        status,
      };

      let result: ArticleSummary;
      if (mode === 'create') {
        result = await createArticle(payload);
      } else {
        result = await updateArticle(articleId!, payload);
      }
      toast.success(status === 'draft' ? '草稿已保存' : '文章已发布');
      router.push('/admin/articles');
      router.refresh();
      return result;
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : '保存失败，请重试';
      toast.error(message);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <form className="space-y-6">
      {/* 标题 */}
      <div className="space-y-2">
        <Label htmlFor="title">标题</Label>
        <Input
          id="title"
          placeholder="输入文章标题…"
          className="text-lg"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-destructive text-sm">{errors.title.message}</p>
        )}
      </div>

      {/* Slug + 分类 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">URL 别名（可选）</Label>
          <Input
            id="slug"
            placeholder="auto-generated-if-empty"
            {...register('slug')}
          />
          {errors.slug && (
            <p className="text-destructive text-sm">{errors.slug.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>分类</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.categoryId && (
            <p className="text-destructive text-sm">
              {errors.categoryId.message}
            </p>
          )}
        </div>
      </div>

      {/* 封面图 */}
      <div className="space-y-2">
        <Label>封面图</Label>
        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageUploader
              currentUrl={field.value}
              onUploaded={(url) => field.onChange(url)}
            />
          )}
        />
      </div>

      {/* 摘要 */}
      <div className="space-y-2">
        <Label htmlFor="summary">摘要</Label>
        <Input
          id="summary"
          placeholder="一句话概括文章内容…"
          {...register('summary')}
        />
        {errors.summary && (
          <p className="text-destructive text-sm">{errors.summary.message}</p>
        )}
      </div>

      {/* 正文编辑器 */}
      <div className="space-y-2">
        <Label>正文</Label>
        <Controller
          control={control}
          name="content"
          render={({ field }) => (
            <MarkdownEditor
              value={field.value}
              onChange={field.onChange}
              height={500}
            />
          )}
        />
        {errors.content && (
          <p className="text-destructive text-sm">{errors.content.message}</p>
        )}
      </div>

      {/* 标签 */}
      <div className="space-y-2">
        <Label>标签</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="输入标签后回车添加"
          />
          <Button type="button" variant="outline" onClick={addTag}>
            添加
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-xs"
              >
                {tag}
                <span className="text-muted-foreground">×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 付费标记 */}
      <Controller
        control={control}
        name="isPremium"
        render={({ field }) => (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.value ?? false}
              onChange={(e) => field.onChange(e.target.checked)}
              className="accent-primary size-4"
            />
            <span>设为付费内容</span>
          </label>
        )}
      />

      {/* 操作按钮 */}
      <div className="border-border flex gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={submitting !== null}
          onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
        >
          {submitting === 'draft' && (
            <Loader2 className="size-4 animate-spin" />
          )}
          <Save className="size-4" />
          存为草稿
        </Button>
        <Button
          type="button"
          disabled={submitting !== null}
          onClick={handleSubmit((data) => onSubmit(data, 'published'))}
        >
          {submitting === 'publish' && (
            <Loader2 className="size-4 animate-spin" />
          )}
          <Send className="size-4" />
          发布
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="ml-auto"
        >
          取消
        </Button>
      </div>
    </form>
  );
}
