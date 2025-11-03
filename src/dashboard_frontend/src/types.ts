export interface AutomationJob {
  id: string;
  name: string;
  type: 'cleanup-approvals' | 'cleanup-specs' | 'cleanup-archived-specs';
  enabled: boolean;
  config: {
    daysOld: number;
  };
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
}
