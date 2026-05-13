'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listExecutions, triggerPipeline } from '@/lib/kestra-client';
import type { Execution } from '@/types/kestra';

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [cookies, setCookies] = useState('');
  const [dryRun, setDryRun] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [executionsError, setExecutionsError] = useState('');

  const validateYoutubeUrl = (url: string) => {
    const regex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return regex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateYoutubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }
    if (!cookies.trim()) {
      setError('Please paste your YouTube cookies.txt contents');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await triggerPipeline(url, cookies, dryRun);
      router.push(`/pipeline/${res.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to trigger pipeline');
      setLoading(false);
    }
  };

  const fetchExecutions = useCallback(async () => {
    try {
      setExecutionsError('');
      const data = await listExecutions();
      const executionList = Array.isArray(data) ? data : (data.results || data.data || []);

      executionList.sort((a: Execution, b: Execution) => {
        const dateA = a.state.startDate ? new Date(a.state.startDate).getTime() : 0;
        const dateB = b.state.startDate ? new Date(b.state.startDate).getTime() : 0;
        return dateB - dateA;
      });

      setExecutions(executionList);
    } catch (err) {
      console.error('Failed to fetch executions', err);
      setExecutions([]);
      setExecutionsError('Kestra is unavailable. Start the stack to view recent pipelines.');
    }
  }, []);

  useEffect(() => {
    void fetchExecutions();
    const interval = setInterval(fetchExecutions, 10000);
    return () => clearInterval(interval);
  }, [fetchExecutions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAUSED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SUCCESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const comingSoonFeatures = [
    { name: 'LinkedIn Posts', emoji: '💼' },
    { name: 'Blog Articles', emoji: '📝' },
    { name: 'YouTube Shorts', emoji: '📱' },
    { name: 'Instagram Reels', emoji: '📸' },
    { name: 'TikTok', emoji: '🎵' },
    { name: 'Growth Prediction', emoji: '📈' },
    { name: 'AI Memory', emoji: '🧠' },
    { name: 'A/B Testing', emoji: '⚖️' },
    { name: 'Brand-Safe Scoring', emoji: '🛡️' },
  ];

  return (
    <main className="flex-1 bg-gray-50 text-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Vid2Tweet</h1>
          <p className="text-lg text-gray-600 font-medium">YouTube → Tweet, powered by AI + Kestra</p>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-12">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Paste YouTube URL here..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <textarea
                placeholder="Paste your YouTube cookies.txt contents here (Netscape format)"
                value={cookies}
                onChange={(e) => {
                  setCookies(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                rows={6}
                className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs transition-all"
                spellCheck={false}
              />
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={loading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Dry run (skip actual Twitter posting)
              </label>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {loading ? 'Generating...' : 'Generate Tweet'}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          </form>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Recent Pipelines</h2>
          {executionsError && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {executionsError}
            </div>
          )}
          {executions.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200 border-dashed text-gray-500 font-medium">
              No recent pipelines found.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="divide-y divide-gray-200">
                {executions.map((execution) => (
                  <button
                    type="button"
                    key={execution.id}
                    onClick={() => router.push(`/pipeline/${execution.id}`)}
                    className="w-full p-4 text-left md:p-5 hover:bg-gray-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {execution.inputs?.youtube_url || 'Unknown URL'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1.5">
                        {execution.state.startDate ? new Date(execution.state.startDate).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(execution.state.current)}`}>
                        {execution.state.current}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Coming Soon</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {comingSoonFeatures.map((feature) => (
              <div
                key={feature.name}
                className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4 opacity-75 grayscale-[30%] select-none cursor-default"
              >
                <span className="text-2xl">{feature.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-700 text-sm mb-1.5">{feature.name}</h3>
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold uppercase rounded-sm tracking-widest border border-gray-200">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
