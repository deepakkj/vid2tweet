'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { KESTRA_BASE_URL, getExecution, getKestraHeaders, resumeExecution } from '@/lib/kestra-client';
import type { Execution } from '@/types/kestra';

const STEPS = [
  { id: 'fetch_thumbnail', label: 'Extract Image' },
  { id: 'download_audio', label: 'Download Audio' },
  { id: 'transcribe_audio', label: 'Transcribe Audio' },
  { id: 'generate_tweet', label: 'Generate Tweet' },
  { id: 'resolve_final_tweet', label: 'Finalize Tweet' },
  { id: 'human_approval', label: 'Human Approval' },
  { id: 'post_tweet', label: 'Post Tweet' }
];

type OutputFiles = Record<string, string>;

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function getOutputFiles(value: unknown): OutputFiles | undefined {
  const outputFiles = getRecord(value)?.outputFiles;
  if (!outputFiles || typeof outputFiles !== 'object') {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(outputFiles).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

function getSubflowOutputs(execution: Execution | null, taskId: string): Record<string, unknown> | undefined {
  const topLevelOutput = getRecord(execution?.outputs?.[taskId]);
  const nestedTopLevelOutput = getRecord(topLevelOutput?.outputs);
  if (nestedTopLevelOutput) {
    return nestedTopLevelOutput;
  }

  const taskRunOutput = getRecord(
    execution?.taskRunList?.find((taskRun) => taskRun.taskId === taskId)?.outputs
  );
  const nestedTaskRunOutput = getRecord(taskRunOutput?.outputs);

  return nestedTaskRunOutput ?? taskRunOutput;
}

function getExecutionOutputFile(execution: Execution | null, taskId: string, fileName: string) {
  if (!execution) {
    return null;
  }

  const topLevelOutput = getOutputFiles(execution.outputs?.[taskId]);
  if (topLevelOutput?.[fileName]) {
    return topLevelOutput[fileName];
  }

  const taskRunOutput = getOutputFiles(
    execution.taskRunList?.find((taskRun) => taskRun.taskId === taskId)?.outputs
  );

  return taskRunOutput?.[fileName] ?? null;
}

function getTaskOutputUri(execution: Execution | null, taskId: string): string | null {
  return getStringValue(getSubflowOutputs(execution, taskId)?.thumbnail_uri)
    ?? getStringValue(getSubflowOutputs(execution, taskId)?.uri)
    ?? getStringValue(execution?.outputs?.thumbnail_uri);
}

function getTaskState(execution: Execution | null, taskId: string) {
  return execution?.taskRunList?.find((taskRun) => taskRun.taskId === taskId)?.state.current;
}

export default function PipelinePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editedTweet, setEditedTweet] = useState('');
  const [generatedTweet, setGeneratedTweet] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [thumbnailObjectUrl, setThumbnailObjectUrl] = useState<string | null>(null);
  const executionState = execution?.state.current;

  const fetchExecution = useCallback(async () => {
    try {
      const data = await getExecution(id);
      setExecution(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch execution');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const initialFetch = setTimeout(() => {
      void fetchExecution();
    }, 0);

    const intervalId = setInterval(() => {
      if (
        executionState === 'SUCCESS' ||
        executionState === 'FAILED' ||
        executionState === 'KILLED'
      ) {
        return;
      }
      void fetchExecution();
    }, 5000);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(intervalId);
    };
  }, [executionState, fetchExecution]);

  const thumbnailUri = getTaskOutputUri(execution, 'fetch_thumbnail');
  let thumbnailUrl: string | null = null;
  if (thumbnailUri) {
    thumbnailUrl = `${KESTRA_BASE_URL}/api/v1/main/executions/${id}/file?path=${encodeURIComponent(thumbnailUri)}`;
  }

  useEffect(() => {
    if (!thumbnailUrl) {
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;

    fetch(thumbnailUrl, { headers: getKestraHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`Thumbnail fetch failed: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const imageBlob = blob.type.startsWith('image/') ? blob : new Blob([blob], { type: 'image/jpeg' });
        objectUrl = URL.createObjectURL(imageBlob);
        if (!revoked) setThumbnailObjectUrl(objectUrl);
      })
      .catch(err => console.error('[thumbnail] fetch error', err));

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [thumbnailUrl]);

  useEffect(() => {
    if ((execution?.state.current === 'PAUSED' || execution?.state.current === 'SUCCESS') && !editedTweet) {
      const getTweetText = async () => {
        const directTweet = getStringValue(getSubflowOutputs(execution, 'generate_tweet')?.tweet_text)
          ?? getStringValue(execution?.outputs?.generated_tweet_text);

        if (directTweet) {
          setGeneratedTweet(directTweet);
          setEditedTweet(directTweet);
          return;
        }

        const uri = getStringValue(getSubflowOutputs(execution, 'generate_tweet')?.tweet_file_uri)
          ?? getStringValue(execution?.outputs?.generated_tweet_uri)
          ?? getExecutionOutputFile(execution, 'validate_tweet', 'tweet.txt');

        if (uri && typeof uri === 'string') {
          try {
            const res = await fetch(`${KESTRA_BASE_URL}/api/v1/main/executions/${id}/file?path=${encodeURIComponent(uri)}`, {
              headers: getKestraHeaders(),
            });
            if (res.ok) {
              const text = await res.text();
              setGeneratedTweet(text);
              setEditedTweet(text);
            }
          } catch (e) {
            console.error('Failed to fetch tweet text', e);
          }
        }
      };

      void getTweetText();
    }
  }, [execution, id, editedTweet]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await resumeExecution(id, true, editedTweet);
      await fetchExecution();
    } catch (err) {
      console.error('Failed to approve', err);
      setError(err instanceof Error ? err.message : 'Failed to approve pipeline');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await resumeExecution(id, false);
      await fetchExecution();
    } catch (err) {
      console.error('Failed to reject', err);
      setError(err instanceof Error ? err.message : 'Failed to reject pipeline');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAUSED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SUCCESS': return 'bg-green-100 text-green-800 border-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepInfo = (stepId: string) => {
    const task = execution?.taskRunList?.find(t => t.taskId === stepId);
    if (!task) return { icon: '⏳', color: 'text-gray-400', state: 'PENDING' };
    
    switch(task.state.current) {
      case 'SUCCESS': return { icon: '✅', color: 'text-green-600', state: 'SUCCESS' };
      case 'FAILED': return { icon: '❌', color: 'text-red-600', state: 'FAILED' };
      case 'RUNNING': return { icon: '🔄', color: 'text-blue-600', state: 'RUNNING' };
      case 'PAUSED': return { icon: '⏸️', color: 'text-amber-600', state: 'PAUSED' };
      default: return { icon: '⏳', color: 'text-gray-500', state: task.state.current };
    }
  };

  if (loading) {
    return (
      <main className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="text-gray-500 font-medium text-lg flex items-center gap-3">
          <span className="animate-spin text-2xl">🔄</span> Loading execution...
        </div>
      </main>
    );
  }

  if (error || !execution) {
    return (
      <main className="flex-1 bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">
          <h2 className="text-xl font-bold mb-2">Error Loading Pipeline</h2>
          <p>{error || 'Execution not found'}</p>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const charCount = editedTweet.length;
  const maxChars = 280;
  const tweetPosted = getTaskState(execution, 'post_tweet') === 'SUCCESS';

  return (
    <main className="flex-1 bg-gray-50 text-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <title>Back</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Pipeline Status</h1>
              <div className="text-sm text-gray-500 flex flex-col gap-1">
                <p>
                  <span className="font-semibold text-gray-700">ID:</span> {id}
                </p>
                {execution.inputs?.youtube_url && (
                  <p>
                    <span className="font-semibold text-gray-700">Source:</span>{' '}
                    <a 
                      href={execution.inputs.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {execution.inputs.youtube_url}
                    </a>
                  </p>
                )}
              </div>
            </div>
            <div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(execution.state.current)}`}>
                {execution.state.current}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold mb-6">Execution Steps</h2>
          <div className="flex flex-col gap-4">
            {STEPS.map((step) => {
              const info = getStepInfo(step.id);
              const isRunning = info.state === 'RUNNING';
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 text-lg shadow-sm ${isRunning ? 'animate-pulse ring-2 ring-blue-300' : ''}`}>
                    <span className={isRunning ? 'animate-spin' : ''}>{info.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${info.state === 'PENDING' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{info.state}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {execution.state.current === 'SUCCESS' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
              <span>✅</span> {tweetPosted ? 'Tweet posted successfully!' : 'Pipeline completed'}
            </h3>
            <div className="bg-white p-5 rounded-lg border border-green-100 whitespace-pre-wrap text-gray-800 shadow-sm font-medium">
              {editedTweet || generatedTweet || (tweetPosted ? 'Tweet text was posted.' : 'Pipeline completed.')}
            </div>
            {thumbnailObjectUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-green-700 mb-2">Included Image:</p>
                <img 
                  src={thumbnailObjectUrl} 
                  alt="Thumbnail" 
                  className="rounded-lg border border-green-200 max-h-64 object-contain"
                />
              </div>
            )}
          </div>
        )}

        {execution.state.current === 'PAUSED' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 border-l-4 border-l-amber-400">
            <h2 className="text-xl font-bold mb-2 text-gray-900">Human Approval Required</h2>
            <p className="text-gray-600 mb-6">Review the generated content before posting to Twitter.</p>
            
            <div className="flex flex-col md:flex-row gap-8 mb-6">
              <div className="flex-1 flex flex-col gap-2">
                <label htmlFor="tweet-content" className="font-semibold text-gray-700 text-sm">Tweet Content</label>
                <textarea
                  id="tweet-content"
                  value={editedTweet}
                  onChange={(e) => setEditedTweet(e.target.value)}
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Loading tweet content..."
                  disabled={actionLoading}
                />
                <div className="flex justify-between items-center text-sm">
                  <span className={`${charCount > maxChars ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                    {charCount} / {maxChars} characters
                  </span>
                </div>
              </div>
              
              <div className="md:w-64 flex flex-col gap-2 shrink-0">
                <p className="font-semibold text-gray-700 text-sm">Generated Image</p>
                <div className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center aspect-square">
                  {thumbnailObjectUrl ? (
                    <img 
                      src={thumbnailObjectUrl} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No image preview available</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading || charCount > maxChars || charCount === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? <span className="animate-spin">⏳</span> : <span>✅</span>}
                Approve & Post
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3 px-6 rounded-lg border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? <span className="animate-spin">⏳</span> : <span>❌</span>}
                Reject
              </button>
            </div>
          </div>
        )}

        {thumbnailObjectUrl && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 flex flex-col gap-2">
            <p className="font-semibold text-gray-700 text-sm">Thumbnail</p>
            <img
              src={thumbnailObjectUrl}
              alt="Video thumbnail"
              className="rounded-lg border border-gray-200 max-h-48 object-contain"
            />
          </div>
        )}
      </div>
    </main>
  );
}
