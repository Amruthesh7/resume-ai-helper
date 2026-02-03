-- Create analyses table to store resume analysis results
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  keyword_score INTEGER NOT NULL DEFAULT 0,
  format_score INTEGER NOT NULL DEFAULT 0,
  language_score INTEGER NOT NULL DEFAULT 0,
  missing_keywords TEXT[] DEFAULT '{}',
  keyword_suggestions TEXT[] DEFAULT '{}',
  format_issues TEXT[] DEFAULT '{}',
  format_suggestions TEXT[] DEFAULT '{}',
  language_issues TEXT[] DEFAULT '{}',
  action_verb_suggestions TEXT[] DEFAULT '{}',
  general_recommendations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analyses"
ON public.analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analyses"
ON public.analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses"
ON public.analyses
FOR DELETE
USING (auth.uid() = user_id);

-- Create an index for better query performance
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);