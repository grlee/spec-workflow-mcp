// Common types for the spec workflow MCP server

import { SessionManager } from './core/session-manager.js';

// Automation job types
export interface AutomationJob {
  id: string;
  name: string;
  type: 'cleanup-approvals' | 'cleanup-specs' | 'cleanup-archived-specs';
  enabled: boolean;
  config: {
    daysOld: number; // Number of days to keep; delete older records
  };
  schedule: string; // Cron expression (e.g., "0 2 * * *" for daily at 2 AM)
  lastRun?: string; // ISO timestamp of last execution
  nextRun?: string; // ISO timestamp of next scheduled execution
  createdAt: string; // ISO timestamp
}

export interface GlobalSettings {
  automationJobs: AutomationJob[];
  createdAt?: string;
  lastModified?: string;
}

export interface JobExecutionHistory {
  jobId: string;
  jobName: string;
  jobType: string;
  executedAt: string;
  success: boolean;
  duration: number; // in milliseconds
  itemsProcessed: number;
  itemsDeleted: number;
  error?: string;
}

export interface JobExecutionLog {
  executions: JobExecutionHistory[];
  lastUpdated?: string;
}

export interface ToolContext {
  projectPath: string;
  dashboardUrl?: string; // Optional for backwards compatibility
  sessionManager?: SessionManager; // Optional for accessing session data
  lang?: string; // Language code for i18n (e.g., 'en', 'ja')
}

export interface SpecData {
  name: string;
  description?: string;
  createdAt: string;
  lastModified: string;
  phases: {
    requirements: PhaseStatus;
    design: PhaseStatus;
    tasks: PhaseStatus;
    implementation: PhaseStatus;
  };
  taskProgress?: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface PhaseStatus {
  exists: boolean;
  approved?: boolean; // Optional for backwards compatibility  
  lastModified?: string;
  content?: string;
}


export interface SteeringStatus {
  exists: boolean;
  documents: {
    product: boolean;
    tech: boolean;
    structure: boolean;
  };
  lastModified?: string;
}

export interface PromptSection {
  key: string;
  value: string;
}

export interface TaskInfo {
  id: string;
  description: string;
  leverage?: string;
  requirements?: string;
  completed: boolean;
  details?: string[];
  prompt?: string;
  promptStructured?: PromptSection[];
}
export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
  nextSteps?: string[]; // Optional for backwards compatibility
  projectContext?: {
    projectPath: string;
    workflowRoot: string;
    specName?: string;
    currentPhase?: string;
    dashboardUrl?: string; // Optional for backwards compatibility
  };
}

// MCP-compliant response format (matches CallToolResult from MCP SDK)
export interface MCPToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
  _meta?: Record<string, any>;
}

// Helper function to convert ToolResponse to MCP format
export function toMCPResponse(response: ToolResponse, isError: boolean = false): MCPToolResponse {
  return {
    content: [{
      type: "text",
      text: JSON.stringify(response, null, 2)
    }],
    isError
  };
}