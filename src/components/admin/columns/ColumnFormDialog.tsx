"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Flat form schema — the wire schema (createColumnSchema /
 * updateColumnSchema from "@/lib/schemas/column") nests translations in an
 * array, which is awkward for react-hook-form field paths. We validate the
 * flat shape here and assemble the nested payload at submit time.
 */
const formSchema = z.object({
  slug: z
    .string()
    .min(1, { message: "slug 必填" })
    .max(80, { message: "slug 太长" })
    .regex(/^[a-z0-9-]+$/, {
      message: "slug 只能包含小写字母、数字和连字符",
    }),
  cover: z
    .string()
    .url({ message: "请输入合法的 URL" })
    .optional()
    .or(z.literal("")),
  name: z
    .string()
    .min(1, { message: "名称必填" })
    .max(80, { message: "名称太长" }),
  description: z
    .string()
    .max(500, { message: "简介最多 500 字" })
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export type ColumnFormInitial = {
  id: string;
  slug: string;
  cover: string | null;
  order: number;
  translations: Array<{
    locale: string;
    name: string;
    description: string | null;
  }>;
};

export interface ColumnFormDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initial?: ColumnFormInitial;
  // Loose typing — Column shape lives in agent A's territory; the dialog
  // only forwards whatever the API hands back.
  onSuccess: (column: any) => void;
}

function pickZh(initial: ColumnFormInitial | undefined): {
  name: string;
  description: string;
} {
  if (!initial) return { name: "", description: "" };
  const zh =
    initial.translations.find((t) => t.locale === "zh") ??
    initial.translations[0];
  return {
    name: zh?.name ?? "",
    description: zh?.description ?? "",
  };
}

function defaultsFor(initial: ColumnFormInitial | undefined): FormValues {
  const zh = pickZh(initial);
  return {
    slug: initial?.slug ?? "",
    cover: initial?.cover ?? "",
    name: zh.name,
    description: zh.description,
  };
}

export function ColumnFormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initial,
  onSuccess,
}: ColumnFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(next);
      } else {
        setInternalOpen(next);
      }
    },
    [isControlled, controlledOnOpenChange],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultsFor(initial),
  });

  // Sync defaults when switching between create / edit, or when the
  // edited row's data changes upstream.
  React.useEffect(() => {
    if (open) {
      form.reset(defaultsFor(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id]);

  const isEdit = Boolean(initial);
  const submitting = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      slug: values.slug,
      cover: values.cover ? values.cover : null,
      translations: [
        {
          locale: "zh",
          name: values.name,
          description: values.description ? values.description : null,
        },
      ],
    };

    const url = initial
      ? `/api/admin/columns/${initial.id}`
      : `/api/admin/columns`;
    const method = initial ? "PATCH" : "POST";

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      toast.error("网络异常，请稍后再试");
      return;
    }

    if (!res.ok) {
      type ErrBody = { error?: { code?: string; message?: string } };
      let errBody: ErrBody | null = null;
      try {
        errBody = (await res.json()) as ErrBody;
      } catch {
        errBody = null;
      }
      const code = errBody?.error?.code;
      if (code === "CONFLICT") {
        form.setError("slug", { message: "slug 已被使用" });
        return;
      }
      toast.error(errBody?.error?.message ?? "保存失败");
      return;
    }

    let data: unknown = null;
    try {
      const parsed = (await res.json()) as { data?: unknown };
      data = parsed?.data ?? null;
    } catch {
      data = null;
    }

    toast.success(initial ? "已更新" : "已创建");
    onSuccess(data);
    setOpen(false);
    form.reset(defaultsFor(undefined));
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset(defaultsFor(initial));
        }
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑专栏" : "新建专栏"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="my-column"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cover"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>封面 URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称（中文）</FormLabel>
                  <FormControl>
                    <Input placeholder="专栏名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>简介（中文）</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="一句话描述这个专栏"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "保存中..." : isEdit ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default ColumnFormDialog;
