export interface IStorage {
  put(input: {
    key: string
    body: Buffer
    contentType: string
  }): Promise<{ url: string }>
  delete(key: string): Promise<void>
  publicUrl(key: string): string
}
