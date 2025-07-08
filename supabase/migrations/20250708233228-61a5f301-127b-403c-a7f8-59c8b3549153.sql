-- Create status enum for papers
CREATE TYPE paper_status AS ENUM ('NEW', 'SELECTED', 'PROCESSED');

-- Create papers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.papers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  doi TEXT,
  source TEXT NOT NULL,
  published_date DATE NOT NULL,
  status paper_status NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create paper_assets table
CREATE TABLE public.paper_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id UUID NOT NULL REFERENCES public.papers(id) ON DELETE CASCADE,
  full_text_path TEXT,
  summary TEXT,
  script TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for papers (public read, service role can modify)
CREATE POLICY "Papers are viewable by everyone" 
ON public.papers 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can modify papers" 
ON public.papers 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create policies for paper_assets (public read, service role can modify)
CREATE POLICY "Paper assets are viewable by everyone" 
ON public.paper_assets 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can modify paper assets" 
ON public.paper_assets 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_papers_updated_at
  BEFORE UPDATE ON public.papers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paper_assets_updated_at
  BEFORE UPDATE ON public.paper_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();