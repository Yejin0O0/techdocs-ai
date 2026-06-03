'use client';

import { useCallback, useEffect, useState } from 'react';

import { deleteDocument, fetchDocuments, subscribeDocumentStatus, uploadDocument } from '@/lib/api';
import { UploadedDocument } from '@/types';

export function useDocuments() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  useEffect(() => {
    fetchDocuments().then((docs) => setDocuments(docs));

    const unsubscribe = subscribeDocumentStatus(({ id, status, errorMessage }) => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: status as UploadedDocument['status'],
                errorMessage,
                progress: undefined,
              }
            : d
        )
      );
    });

    return unsubscribe;
  }, []);

  const handleUpload = useCallback(async (files: File[]) => {
    for (const file of files) {
      const tempId = crypto.randomUUID();

      setDocuments((prev) => [
        {
          id: tempId,
          name: file.name,
          size: file.size,
          status: 'uploading',
          uploadedAt: new Date(),
          file,
          progress: 0,
        },
        ...prev,
      ]);

      try {
        const doc = await uploadDocument(file, (progress) => {
          setDocuments((prev) => prev.map((d) => (d.id === tempId ? { ...d, progress } : d)));
        });

        setDocuments((prev) =>
          prev.map((d) => (d.id === tempId ? { ...doc, status: 'indexing', file } : d))
        );
      } catch (e) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === tempId
              ? { ...d, status: 'error', errorMessage: (e as Error).message, progress: undefined }
              : d
          )
        );
      }
    }
  }, []);

  const handleRetry = useCallback(
    async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc?.file) return;

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'uploading', errorMessage: undefined, progress: 0 } : d
        )
      );

      try {
        await uploadDocument(doc.file, (progress) => {
          setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, progress } : d)));
        });

        setDocuments((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: 'indexing', progress: undefined } : d))
        );
      } catch (e) {
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === id
              ? { ...d, status: 'error', errorMessage: (e as Error).message, progress: undefined }
              : d
          )
        );
      }
    },
    [documents]
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      console.error('삭제 실패:', (e as Error).message);
    }
  }, []);

  return { documents, handleUpload, handleRetry, handleDelete };
}
