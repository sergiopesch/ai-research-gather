-- Create episodes table for The Notebook Pod Studio
CREATE TABLE public.episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  paper_id TEXT NOT NULL,
  paper_title TEXT NOT NULL,
  script JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'GENERATED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Create policies for episodes
CREATE POLICY "Episodes are viewable by everyone" 
ON public.episodes 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can modify episodes" 
ON public.episodes 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create index for episode ordering
CREATE INDEX idx_episodes_episode_number ON public.episodes(episode_number);

-- Create function to auto-increment episode numbers
CREATE OR REPLACE FUNCTION public.get_next_episode_number()
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(episode_number), 0) + 1 INTO next_num FROM public.episodes;
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_episodes_updated_at
BEFORE UPDATE ON public.episodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();