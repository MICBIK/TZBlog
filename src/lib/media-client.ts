type ApiErrorBody = {
  error?: {
    message?: string;
  };
};

type UploadMediaBody = {
  data?: {
    url?: string;
  };
};

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function uploadMediaFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.set("file", file);

  let response: Response;
  try {
    response = await fetch("/api/admin/uploads", {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new Error("网络异常，请稍后再试");
  }

  const body = await readJson<ApiErrorBody & UploadMediaBody>(response);
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "上传失败");
  }

  const url = body?.data?.url;
  if (!url) {
    throw new Error("上传成功但未返回 URL");
  }

  return url;
}

export async function deleteMediaById(id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/media/${id}`, {
      method: "DELETE",
    });
  } catch {
    throw new Error("网络异常，请稍后再试");
  }

  const body = await readJson<ApiErrorBody>(response);
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "删除失败");
  }
}
