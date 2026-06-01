import { useState, useCallback } from 'react';
import { UploadedDocument } from '@/types';

export function useDocuments() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const simulateUpload = useCallback((id: string) => {
    setTimeout(() => {
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'indexing' } : d)));
    }, 1000);
    setTimeout(() => {
      setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'ready' } : d)));
    }, 3000);
  }, []);

  const handleUpload = useCallback(
    (files: File[]) => {
      const newDocs: UploadedDocument[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        status: 'uploading',
        uploadedAt: new Date(),
        file,
      }));

      setDocuments((prev) => [...newDocs, ...prev]);
      newDocs.forEach((doc) => simulateUpload(doc.id));
    },
    [simulateUpload]
  );

  const handleRetry = useCallback(
    (id: string) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'uploading', errorMessage: undefined } : d))
      );
      simulateUpload(id);
    },
    [simulateUpload]
  );

  return { documents, handleUpload, handleRetry };
}
