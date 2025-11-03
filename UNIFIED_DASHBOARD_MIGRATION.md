# Unified Multi-Project Dashboard - Migration Guide

## Overview

The Spec Workflow MCP system has been redesigned to use a **single unified dashboard** that manages multiple projects concurrently on one port. This is a significant architectural change from the previous multi-dashboard approach.

## What Changed

### Before (Old Architecture)
- Each project had its own dashboard server on a separate port
- Projects linked to each other via redirects
- `--AutoStartDashboard` flag started a per-project dashboard
- Registry tracked dashboard URLs for each project

### After (New Architecture)
- **One dashboard server** manages all projects on a single port
- Projects appear/disappear dynamically based on MCP server registration
- Dashboard watches the global registry and auto-loads projects
- No page redirects - project switching happens in-memory
- `--AutoStartDashboard` is deprecated

## New Usage

### 1. Start the Unified Dashboard (Once)

```bash
# Start the dashboard server on port 5000 (or any port you prefer)
spec-workflow-mcp --dashboard --port 5000
```

This single dashboard will:
- Monitor `~/.spec-workflow-mcp/activeProjects.json`
- Automatically load projects as MCP servers register
- Handle multiple projects concurrently
- Provide a sidebar to switch between projects

### 2. Start MCP Servers (Per Project)

```bash
# Terminal 1 - Project A
cd /path/to/project-a
spec-workflow-mcp

# Terminal 2 - Project B
cd /path/to/project-b
spec-workflow-mcp

# Terminal 3 - Project C
cd /path/to/project-c
spec-workflow-mcp
```

Each MCP server will:
- Register itself in `~/.spec-workflow-mcp/activeProjects.json`
- Appear automatically in the dashboard sidebar
- Unregister when stopped

### 3. Use the Dashboard

1. Open http://localhost:5000 in your browser
2. Click the hamburger menu (☰) to open the project sidebar
3. See all active projects listed
4. Click any project to switch to it
5. All data updates in real-time without page reload

## Migration Steps

### For Existing Users

1. **Stop all existing dashboards and MCP servers**
   ```bash
   # Stop all running instances
   ```

2. **Clear old registry** (optional, for clean start)
   ```bash
   rm ~/.spec-workflow-mcp/activeProjects.json
   ```

3. **Start the new unified dashboard**
   ```bash
   spec-workflow-mcp --dashboard --port 5000
   ```

4. **Start your MCP servers** (without `--AutoStartDashboard`)
   ```bash
   cd /path/to/project
   spec-workflow-mcp
   ```

5. **Open the dashboard**
   - Navigate to http://localhost:5000
   - Your projects will appear in the sidebar

### Deprecated Flags

- `--AutoStartDashboard`: Still works but shows a deprecation warning. The flag is ignored, and you should start the dashboard separately.

## Architecture Details

### Backend

#### Global Registry
- **Location**: `~/.spec-workflow-mcp/activeProjects.json`
- **Format**:
  ```json
  {
    "projectId": {
      "projectId": "abc123...",
      "projectPath": "/absolute/path/to/project",
      "projectName": "project-name",
      "pid": 12345,
      "registeredAt": "2025-01-01T00:00:00.000Z"
    }
  }
  ```
- **Project ID**: SHA-1 hash of absolute path (first 16 chars, base64url)

#### Multi-Project Dashboard Server
- **File**: `src/dashboard/multi-server.ts`
- **Class**: `MultiProjectDashboardServer`
- **Features**:
  - Watches registry file for changes
  - Manages multiple `ProjectContext` instances
  - One `SpecParser`, `SpecWatcher`, `ApprovalStorage` per project
  - Project-scoped API endpoints
  - WebSocket multiplexing with `projectId`

#### API Endpoints
All endpoints are now project-scoped:
- `GET /api/projects/list` - List all projects
- `GET /api/projects/:projectId/info` - Project info
- `GET /api/projects/:projectId/specs` - Specs list
- `GET /api/projects/:projectId/approvals` - Approvals list
- `PUT /api/projects/:projectId/specs/:name/:document` - Save spec
- And all other endpoints follow the same pattern

#### WebSocket
- **Endpoint**: `/ws?projectId=<id>`
- **Messages**: All include `projectId` field
- **Types**:
  - `initial` - Initial data for a project
  - `projects-update` - Global project list update
  - `spec-update` - Project-scoped spec changes
  - `approval-update` - Project-scoped approval changes
  - `steering-update` - Project-scoped steering changes
  - `task-status-update` - Project-scoped task updates

### Frontend

#### Provider Hierarchy
```
App
├── ThemeProvider
└── ProjectProvider (manages project list & selection)
    └── AppWithProviders
        └── WebSocketProvider (connects with projectId)
            └── AppInner
                └── ApiProvider (project-scoped APIs)
                    └── NotificationProvider
                        └── Routes & Components
```

#### Key Components
- **ProjectProvider**: Manages projects list, current selection, polling
- **WebSocketProvider**: Connects to `/ws?projectId=X`, handles project-scoped messages
- **ApiProvider**: Prefixes all calls with `/api/projects/${projectId}`
- **ProjectSidebar**: Displays projects, allows switching

#### Project Switching
1. User clicks project in sidebar
2. `ProjectProvider` updates `currentProjectId`
3. `WebSocketProvider` reconnects with new `projectId`
4. `ApiProvider` updates API prefix
5. Data reloads for new project
6. No page redirect needed

## Benefits

### For Users
- **Single browser tab** for all projects
- **Faster switching** - no page reloads
- **Unified interface** - consistent experience
- **Auto-discovery** - projects appear automatically
- **Resource efficient** - one dashboard process

### For Developers
- **Cleaner architecture** - centralized management
- **Better scalability** - handles many projects efficiently
- **Simpler deployment** - one dashboard to manage
- **Easier testing** - single endpoint to test

## Troubleshooting

### Projects Not Appearing
1. Check registry file exists: `cat ~/.spec-workflow-mcp/activeProjects.json`
2. Verify MCP servers are running: `ps aux | grep spec-workflow-mcp`
3. Check dashboard logs for errors
4. Wait 2-3 seconds for auto-refresh

### Dashboard Won't Start
1. Check port is not in use: `lsof -i :5000`
2. Try a different port: `--port 5001`
3. Check file permissions on `~/.spec-workflow-mcp/`

### WebSocket Connection Issues
1. Check browser console for errors
2. Verify dashboard is running
3. Try refreshing the page
4. Check firewall settings

### Stale Projects in List
- Projects are auto-cleaned every 30 seconds
- Manual cleanup: Delete registry file and restart dashboard

## API Changes Summary

### Removed
- `/api/specs` (non-scoped)
- `/api/approvals` (non-scoped)
- `/api/info` (non-scoped)
- `/api/projects/current` (no longer needed)

### Added
- `/api/projects/list`
- `/api/projects/:projectId/*` (all project-scoped endpoints)

### Changed
- All endpoints now require `projectId` parameter
- WebSocket requires `?projectId=` query parameter
- All WebSocket messages include `projectId` field

## Code Examples

### Starting Dashboard Programmatically
```typescript
import { MultiProjectDashboardServer } from './dashboard/multi-server.js';

const dashboard = new MultiProjectDashboardServer({
  port: 5000,
  autoOpen: true
});

await dashboard.start();
```

### Registering a Project
```typescript
import { ProjectRegistry } from './core/project-registry.js';

const registry = new ProjectRegistry();
const projectId = await registry.registerProject('/path/to/project', process.pid);
console.log('Registered:', projectId);
```

### Frontend: Using Project Context
```typescript
import { useProjects } from './modules/projects/ProjectProvider';

function MyComponent() {
  const { projects, currentProject, setCurrentProject } = useProjects();

  return (
    <select onChange={(e) => setCurrentProject(e.target.value)}>
      {projects.map(p => (
        <option key={p.projectId} value={p.projectId}>
          {p.projectName}
        </option>
      ))}
    </select>
  );
}
```

## Performance Considerations

- **Registry polling**: Every 2.5 seconds (frontend)
- **Cleanup interval**: Every 30 seconds (backend)
- **WebSocket reconnect**: 2 seconds delay on disconnect
- **File watching**: Uses chokidar for efficient file system monitoring

## Security Notes

- Registry file is in user's home directory (`~/.spec-workflow-mcp/`)
- Dashboard binds to `0.0.0.0` (accessible on network)
- No authentication - intended for local development
- Process IDs used for cleanup validation

## Future Enhancements

Potential improvements for future versions:
- Project groups/workspaces
- Project search/filter
- Recent projects list
- Project favorites
- Custom project metadata
- Multi-window support
- Project health indicators
- Keyboard shortcuts for switching

## Support

For issues or questions:
- GitHub: https://github.com/Pimzino/spec-workflow-mcp
- Documentation: Check the docs/ folder
- Logs: Check console output from dashboard and MCP servers

## Conclusion

The unified dashboard architecture provides a better user experience and cleaner codebase. While it requires a small change in workflow (starting dashboard separately), the benefits of having all projects in one place far outweigh the migration effort.

**Happy multi-project development!** 🚀
