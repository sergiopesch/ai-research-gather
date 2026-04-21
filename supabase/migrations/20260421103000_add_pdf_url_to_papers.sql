ALTER TABLE public.papers
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

UPDATE public.papers
SET pdf_url = CONCAT('https://arxiv.org/pdf/', doi, '.pdf')
WHERE pdf_url IS NULL
  AND source = 'arXiv'
  AND doi IS NOT NULL;
