import axios from 'axios';

import { UploadedDocument } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function extractErrorMessage(e: unknown, fallback: string): never {
  if (axios.isAxiosError(e)) {
    throw new Error(e.response?.data?.detail ?? fallback);
  }
  throw e;
}

function parseDocument(doc: UploadedDocument & { uploadedAt: string }): UploadedDocument {
  return { ...doc, uploadedAt: new Date(doc.uploadedAt) };
}

export async function fetchDocuments(): Promise<UploadedDocument[]> {
  try {
    const { data } = await axios.get(`${BASE_URL}/documents`);
    return Array.isArray(data) ? data.map(parseDocument) : [];
  } catch (e) {
    extractErrorMessage(e, '문서 목록을 불러오지 못했어요.');
  }
}

export async function uploadDocument(
  file: File,
  onProgress: (progress: number) => void
): Promise<UploadedDocument> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    });

    return parseDocument(data);
  } catch (e) {
    extractErrorMessage(e, '파일 업로드 중 오류가 발생했어요.');
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    await axios.delete(`${BASE_URL}/documents/${id}`);
  } catch (e) {
    extractErrorMessage(e, '문서 삭제 중 오류가 발생했어요.');
  }
}

export function subscribeDocumentStatus(
  onEvent: (event: { id: string; status: string; errorMessage?: string }) => void,
  onError?: (message: string) => void
): () => void {
  const es = new EventSource(`${BASE_URL}/documents/status`);

  es.addEventListener('message', (e) => {
    onEvent(JSON.parse(e.data));
  });

  let retries = 0;
  es.onerror = () => {
    retries += 1;
    if (retries >= 3) {
      es.close();
      onError?.('서버와의 실시간 연결이 끊겼어요. 페이지를 새로고침해주세요.');
    }
  };

  return () => es.close();
}
