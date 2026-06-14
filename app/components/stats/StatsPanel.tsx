'use client';

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { UploadedDocument } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  PDF: '#6366f1',
  MD: '#22c55e',
  TXT: '#f59e0b',
  기타: '#94a3b8',
};

const STATUS_COLORS: Record<string, string> = {
  ready: '#22c55e',
  indexing: '#6366f1',
  uploading: '#f59e0b',
  error: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  ready: '준비 완료',
  indexing: '인덱싱 중',
  uploading: '업로드 중',
  error: '오류',
};

function getFileType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (ext === 'md') return 'MD';
  if (ext === 'txt') return 'TXT';
  return '기타';
}

interface StatsPanelProps {
  documents: UploadedDocument[];
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
      <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{value}</span>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}

export default function StatsPanel({ documents }: StatsPanelProps) {
  const readyCount = documents.filter((d) => d.status === 'ready').length;
  const indexingCount = documents.filter((d) => d.status === 'indexing').length;

  const typeData = Object.entries(
    documents.reduce<Record<string, number>>((acc, doc) => {
      const t = getFileType(doc.name);
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {})
  )
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const statusData = (['ready', 'indexing', 'uploading', 'error'] as const).map((s) => ({
    name: STATUS_LABELS[s],
    value: documents.filter((d) => d.status === s).length,
    color: STATUS_COLORS[s],
  }));

  return (
    <div className="flex flex-col gap-6 py-2">
      {/* 문서 현황 */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">문서 현황</p>
          <p className="text-xs text-zinc-400">업로드된 문서의 상태를 한눈에 확인해요</p>
        </div>

        {documents.length === 0 ? (
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
            업로드된 문서가 없어요
          </p>
        ) : (
          <>
            {/* 요약 숫자 카드 */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="전체" value={documents.length} />
              <StatCard label="준비 완료" value={readyCount} />
              <StatCard label="처리 중" value={indexingCount} />
            </div>

            {/* 파일 형식 분포 */}
            <div>
              <p className="mb-1 text-xs text-zinc-500">파일 형식 분포</p>
              <div className="flex items-center gap-2">
                <PieChart width={90} height={90}>
                  <Pie
                    data={typeData}
                    cx={45}
                    cy={45}
                    innerRadius={22}
                    outerRadius={38}
                    dataKey="value"
                    strokeWidth={0}
                    isAnimationActive={false}
                  >
                    {typeData.map((entry) => (
                      <Cell key={entry.name} fill={TYPE_COLORS[entry.name] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: 11 }} />
                </PieChart>
                {/* 범례 */}
                <div className="flex flex-col gap-1">
                  {typeData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[entry.name] ?? '#94a3b8' }}
                      />
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {entry.name} ({entry.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 상태별 분포 */}
            <div>
              <p className="mb-1 text-xs text-zinc-500">상태별 분포</p>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={statusData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
