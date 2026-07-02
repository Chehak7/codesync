-- Create snippets table
CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  category TEXT,
  code TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  shortcuts TEXT,
  author_id UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public snippets are viewable by everyone" 
ON public.snippets FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can manage their own snippets" 
ON public.snippets FOR ALL 
USING (auth.uid() = author_id);
