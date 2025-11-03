# Multi-Project Dashboard Implementation Summary

## Overview

The Spec Workflow MCP Dashboard has been successfully redesigned to support multiple projects in a single dashboard instance. This implementation allows users to manage and switch between multiple active projects seamlessly.

## What Was Implemented

### 1. Global Project Registry (`src/core/project-registry.ts`)
- **Location**: `~/.spec-workflow-mcp/activeProjects.json`
- **Features**:
  - Atomic file operations to prevent race conditions
  - Automatic cleanup of stale projects (dead processes)
  - Project identification by absolute path
  - Auto-detection of project names from directory names

### 2. Backend Changes

#### Dashboard Server (`src/dashboard/server.ts`)
- **New API Endpoints**:
  - `GET /api/projects/list` - Returns all active projects from global registry
  - `GET /api/projects/current` - Returns current project info (path, name)
  - `GET /api/info` - Enhanced to include `projectPath`
- **Registry Integration**:
  - Registers project on startup
  - Unregisters project on shutdown
  - Periodic cleanup of stale projects every 30 seconds
  - Cleanup on initial startup

#### MCP Server (`src/server.ts`)
- **Registry Integration**:
  - Registers project when dashboard is discovered
  - Unregisters project on shutdown
  - Handles dashboard monitoring with registry updates

### 3. Frontend Changes

#### Project Sidebar (`src/dashboard_frontend/src/modules/components/ProjectSidebar.tsx`)
- **Features**:
  - Displays all active projects from global registry
  - Highlights current project
  - Click to switch between projects
  - Auto-refreshes project list every 2.5 seconds
  - Responsive design (collapsible on mobile)
  - Shows project names and paths
  - Empty state handling

#### WebSocket Provider (`src/dashboard_frontend/src/modules/ws/WebSocketProvider.tsx`)
- **Multi-Project Support**:
  - Tracks current project path and dashboard URL
  - `switchProject()` function for changing projects
  - Disconnects from old WebSocket and connects to new one
  - Redirects to new dashboard URL on project switch
  - Fetches current project info on mount

#### API Provider (`src/dashboard_frontend/src/modules/api/api.tsx`)
- **Project Awareness**:
  - Exposes `currentProjectPath` in context
  - All API calls use relative URLs (work correctly after redirect)

#### App Integration (`src/dashboard_frontend/src/modules/app/App.tsx`)
- **UI Updates**:
  - Project sidebar toggle button in header
  - Sidebar state management
  - Responsive layout with sidebar
  - Mobile-friendly design

## How to Test

### 1. Start Multiple Dashboard Instances

Open multiple terminal windows and start dashboards for different projects:

```bash
# Terminal 1 - Project A
cd /path/to/project-a
spec-workflow-mcp --dashboard --port 3001

# Terminal 2 - Project B
cd /path/to/project-b
spec-workflow-mcp --dashboard --port 3002

# Terminal 3 - Project C
cd /path/to/project-c
spec-workflow-mcp --dashboard --port 3003
```

### 2. Verify Global Registry

Check that all projects are registered:

```bash
# On macOS/Linux
cat ~/.spec-workflow-mcp/activeProjects.json

# On Windows
type %USERPROFILE%\.spec-workflow-mcp\activeProjects.json
```

You should see entries for all three projects with their paths, names, dashboard URLs, and PIDs.

### 3. Test Project Switching

1. Open any dashboard (e.g., http://localhost:3001)
2. Click the hamburger menu icon (☰) in the header to open the project sidebar
3. You should see:
   - Current project highlighted at the top
   - List of other available projects below
4. Click on another project to switch to it
5. The page should redirect to that project's dashboard
6. Verify that the data shown is for the new project

### 4. Test Auto-Discovery

1. With one dashboard open, start a new dashboard for another project
2. Wait 2-3 seconds
3. The project sidebar should automatically update to show the new project
4. Stop one of the dashboards
5. Wait 2-3 seconds
6. The stopped project should disappear from the sidebar

### 5. Test Cleanup

1. Start a dashboard
2. Verify it appears in the registry
3. Kill the process forcefully (Ctrl+C or kill command)
4. Start another dashboard
5. The stale entry should be cleaned up automatically

### 6. Test MCP Server Integration

```bash
# Start MCP server with auto-start dashboard
spec-workflow-mcp /path/to/project --AutoStartDashboard --port 3000

# Verify the project is registered in the global registry
cat ~/.spec-workflow-mcp/activeProjects.json
```

## Key Features

### 1. Seamless Project Switching
- Click to switch between any active project
- Automatic redirect to the correct dashboard URL
- No data mixing between projects

### 2. Auto-Discovery
- Projects automatically appear when dashboards start
- Projects automatically disappear when dashboards stop
- Real-time updates every 2.5 seconds

### 3. Process Management
- Automatic cleanup of dead processes
- Atomic file operations prevent corruption
- Safe concurrent access to registry

### 4. User Experience
- Responsive sidebar design
- Mobile-friendly interface
- Clear visual indicators for current project
- Project paths shown for disambiguation

### 5. Robustness
- Handles multiple dashboards on different ports
- Graceful handling of network issues
- Proper cleanup on shutdown

## Architecture Decisions

1. **Global Registry**: Centralized in `~/.spec-workflow-mcp/` for cross-dashboard visibility
2. **Project Identification**: Auto-detect from directory name using `path.basename()`
3. **WebSocket Architecture**: One connection per project (disconnect old, connect new on switch)
4. **UI Pattern**: Sidebar for project list, single active project view at a time
5. **Auto-Discovery**: Poll registry every 2.5 seconds for dynamic updates
6. **Redirect Strategy**: Full page redirect when switching projects (simplest and most reliable)

## Files Modified

### New Files
- `src/core/project-registry.ts` - Global registry manager
- `src/dashboard_frontend/src/modules/components/ProjectSidebar.tsx` - Project switcher UI
- `MULTI_PROJECT_IMPLEMENTATION.md` - This documentation

### Modified Files
- `src/dashboard/server.ts` - Registry integration, new API endpoints
- `src/server.ts` - Registry integration
- `src/dashboard_frontend/src/modules/ws/WebSocketProvider.tsx` - Multi-project WS support
- `src/dashboard_frontend/src/modules/api/api.tsx` - Project-aware API calls
- `src/dashboard_frontend/src/modules/app/App.tsx` - UI layout with sidebar

## Future Enhancements

Potential improvements for future versions:

1. **Project Groups**: Organize projects into groups/workspaces
2. **Recent Projects**: Show recently accessed projects
3. **Project Search**: Filter projects by name or path
4. **Project Favorites**: Pin frequently used projects
5. **Project Metadata**: Store custom project descriptions/tags
6. **Multi-Window Support**: Open multiple projects in separate browser windows
7. **Project Health**: Show status indicators (specs count, tasks progress, etc.)
8. **Keyboard Shortcuts**: Quick project switching with keyboard

## Troubleshooting

### Projects Not Appearing in Sidebar
- Check that dashboards are running on different ports
- Verify the global registry file exists: `~/.spec-workflow-mcp/activeProjects.json`
- Check browser console for errors
- Wait 2-3 seconds for auto-refresh

### Stale Projects in List
- The cleanup runs every 30 seconds
- Manually start any dashboard to trigger cleanup
- Delete the registry file to reset: `rm ~/.spec-workflow-mcp/activeProjects.json`

### Project Switch Not Working
- Ensure the target dashboard is still running
- Check that the dashboard URL is accessible
- Verify no firewall blocking localhost connections
- Check browser console for errors

## Conclusion

The multi-project dashboard support is now fully implemented and ready for use. Users can seamlessly manage multiple projects from a single dashboard interface, with automatic discovery and cleanup of projects.
