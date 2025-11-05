import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { ToolContext, ToolResponse } from '../types.js';
import { PathUtils } from '../core/path-utils.js';
import { ImplementationLogManager } from '../dashboard/implementation-log-manager.js';

export const getImplementationLogsTool: Tool = {
  name: 'get-implementation-logs',
  description: `Query implementation logs for a specification to discover existing APIs, components, functions, and integration patterns.

⚠️ CRITICAL: Always use this tool BEFORE implementing a task to:
- Find existing API endpoints (avoid creating duplicates or using wrong endpoints)
- Discover reusable components (avoid duplicating UI code)
- Find utility functions and classes (avoid reimplementing logic)
- Understand integration patterns (ensure consistency)

🔍 REQUIRED: You MUST provide at least ONE filter parameter (taskId, search, or artifactType) OR set all=true.
NEVER call this tool with only projectPath and specName - this discourages efficient queries.

Returns structured artifacts including:
- API endpoints with methods, paths, request/response formats
- Reusable components with props and locations
- Functions and classes with signatures
- Frontend-backend integration patterns

# Recommended Approach (Use These)

✅ Search for specific code pattern:
\`\`\`
projectPath: "/path/to/project"
specName: "my-feature"
search: "authentication"
\`\`\`

✅ Find all API endpoints:
\`\`\`
projectPath: "/path/to/project"
specName: "my-feature"
artifactType: "apiEndpoints"
\`\`\`

✅ Get logs for specific task:
\`\`\`
projectPath: "/path/to/project"
specName: "my-feature"
taskId: "2.3"
\`\`\`

# Not Recommended (Avoid This)

❌ Retrieving all logs (too much data):
\`\`\`
projectPath: "/path/to/project"
specName: "my-feature"
all: true  // Only use if absolutely necessary - strongly discouraged
\`\`\``,

  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Absolute path to the project root'
      },
      specName: {
        type: 'string',
        description: 'Name of the specification to query logs for'
      },
      taskId: {
        type: 'string',
        description: 'Optional: Filter by specific task ID (e.g., "2.3")'
      },
      search: {
        type: 'string',
        description: 'Optional: Search term to filter logs (searches summary, files, artifact data)'
      },
      artifactType: {
        type: 'string',
        enum: ['apiEndpoints', 'components', 'functions', 'classes', 'integrations'],
        description: 'Optional: Filter to only logs containing this artifact type'
      },
      all: {
        type: 'boolean',
        description: 'Set to true to retrieve ALL logs without filters. ⚠️ STRONGLY DISCOURAGED - only use when absolutely necessary and you need complete implementation history. Defaults to false. You MUST use filters (taskId, search, or artifactType) if all is false or omitted.'
      }
    },
    required: ['projectPath', 'specName']
  }
};

export async function getImplementationLogsHandler(
  args: any,
  context: ToolContext
): Promise<ToolResponse> {
  const {
    projectPath,
    specName,
    taskId,
    search,
    artifactType,
    all = false
  } = args;

  try {
    // Validation: Require filters when all=false (default)
    if (!all && !taskId && !search && !artifactType) {
      return {
        success: false,
        message: `❌ Filter Required: You must provide at least ONE filter parameter:
- taskId: Filter by specific task (e.g., "2.3")
- search: Search for specific patterns (e.g., "authentication", "api", "component name")
- artifactType: Filter by type (e.g., "apiEndpoints", "components", "functions", "classes", "integrations")

Retrieving all logs without filters fills your context with irrelevant information.
Use targeted searches to find exactly what you need.

If you absolutely need all logs, set all: true (strongly discouraged).`,
        projectContext: {
          projectPath,
          workflowRoot: PathUtils.getWorkflowRoot(projectPath),
          specName
        }
      };
    }

    // Construct spec path
    const specPath = PathUtils.getSpecPath(projectPath, specName);
    const logManager = new ImplementationLogManager(specPath);

    let logs: any[] = [];
    let filterUsed = '';

    // Load logs using most efficient method (avoid loading all first)
    if (all) {
      // User explicitly requested all logs
      logs = await logManager.getAllLogs();
      filterUsed = 'NONE (all logs retrieved)';
    } else if (search) {
      // Use search method (more efficient than loading all)
      logs = await logManager.searchLogs(search);
      filterUsed = `search: "${search}"`;
    } else if (taskId) {
      // Filter by task
      const allLogs = await logManager.getAllLogs();
      logs = allLogs.filter(log => log.taskId === taskId);
      filterUsed = `task: ${taskId}`;
    } else if (artifactType) {
      // Filter by artifact type
      logs = await logManager.getLogsByArtifactType(artifactType as any);
      filterUsed = `artifact type: ${artifactType}`;
    }

    // Format response
    const formattedLogs = logs.map(log => ({
      taskId: log.taskId,
      timestamp: log.timestamp,
      summary: log.summary,
      artifacts: log.artifacts,
      files: {
        modified: log.filesModified,
        created: log.filesCreated
      },
      statistics: log.statistics
    }));

    // Build response message
    let message = `Found ${logs.length} implementation log(s) for spec "${specName}" (${filterUsed})`;

    // Add warning if user retrieved all logs
    if (all) {
      message = `⚠️ WARNING: Retrieved ALL logs without filters.\n${message}\n\nConsider using filters in future queries for better context usage.`;
    }

    return {
      success: true,
      message,
      data: {
        spec: specName,
        totalLogs: logs.length,
        allLogsRetrieved: all,
        filters: {
          taskId: taskId || null,
          search: search || null,
          artifactType: artifactType || null,
          all
        },
        logs: formattedLogs
      },
      projectContext: {
        projectPath,
        workflowRoot: PathUtils.getWorkflowRoot(projectPath),
        specName
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to query implementation logs: ${error.message}`,
      projectContext: {
        projectPath,
        workflowRoot: PathUtils.getWorkflowRoot(projectPath),
        specName
      }
    };
  }
}
