export type UploadStatus = 'uploading' | 'indexing' | 'ready' | 'error';

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  uploadedAt: Date;
  errorMessage?: string;
  uploadedBy?: string;
  file?: File;
  progress?: number;
}
