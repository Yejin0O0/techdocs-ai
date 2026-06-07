export type UploadStatus = 'uploading' | 'indexing' | 'ready' | 'error';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  isStreaming?: boolean;
}

export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  status: UploadStatus;
  uploadedAt: Date;
  indexingStartedAt?: Date;
  errorMessage?: string;
  uploadedBy?: string;
  file?: File;
  progress?: number;
}
