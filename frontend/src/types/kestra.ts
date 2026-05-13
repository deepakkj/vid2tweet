export type ExecutionState =
  | 'CREATED'
  | 'RUNNING'
  | 'PAUSED'
  | 'SUCCESS'
  | 'FAILED'
  | 'KILLED'
  | 'WARNING';

export interface TaskRun {
  id: string;
  taskId: string;
  state: {
    current: ExecutionState;
    startDate?: string;
    endDate?: string;
  };
  outputs?: Record<string, unknown>;
}

export interface Execution {
  id: string;
  namespace: string;
  flowId: string;
  state: {
    current: ExecutionState;
    startDate?: string;
    endDate?: string;
  };
  inputs?: {
    youtube_url?: string;
    youtube_cookies?: string;
    [key: string]: unknown;
  };
  taskRunList?: TaskRun[];
  outputs?: Record<string, unknown>;
}
