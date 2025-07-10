import { Calendar, Download, FileDown, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEpisodes, Episode } from '@/hooks/useEpisodes';
import { useScriptGeneration } from '@/hooks/useScriptGeneration';

export const EpisodeLibrary = () => {
  const { episodes, isLoading, deleteEpisode } = useEpisodes();
  const { downloadElevenLabsScript, downloadTextScript } = useScriptGeneration();

  const handleDownloadElevenLabs = (episode: Episode) => {
    downloadElevenLabsScript(episode.script);
  };

  const handleDownloadText = (episode: Episode) => {
    downloadTextScript(episode.script);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Episode Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading your episodes...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (episodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Episode Library</CardTitle>
          <p className="text-sm text-muted-foreground">Your created episodes will appear here</p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No episodes created yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generate your first podcast episode from a research paper
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Episode Library</CardTitle>
        <p className="text-sm text-muted-foreground">
          {episodes.length} episode{episodes.length !== 1 ? 's' : ''} in your studio
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {episode.episode_number}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{episode.title}</h4>
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {episode.paper_title}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {episode.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(episode.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadElevenLabs(episode)}
                  className="h-8 w-8 p-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadText(episode)}
                  className="h-8 w-8 p-0"
                >
                  <FileDown className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteEpisode(episode.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};