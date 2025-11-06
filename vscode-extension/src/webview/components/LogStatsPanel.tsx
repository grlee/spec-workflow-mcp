import { Card, CardContent } from './ui/card';

interface LogStatsPanelProps {
  stats: {
    totalEntries: number;
    totalLinesAdded: number;
    totalLinesRemoved: number;
    totalFilesChanged: number;
  } | null;
}

export function LogStatsPanel({ stats }: LogStatsPanelProps) {
  if (!stats) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <div className="text-xs text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalLinesAdded}</div>
            <div className="text-xs text-muted-foreground">Lines Added</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalLinesRemoved}</div>
            <div className="text-xs text-muted-foreground">Lines Removed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalFilesChanged}</div>
            <div className="text-xs text-muted-foreground">Files Changed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
