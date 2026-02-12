
CREATE TABLE public.learning_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('video', 'podcast', 'pdf')),
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view learning resources"
ON public.learning_resources
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage learning resources"
ON public.learning_resources
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
