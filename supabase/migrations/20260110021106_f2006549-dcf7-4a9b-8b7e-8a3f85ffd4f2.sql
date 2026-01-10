-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)));
  RETURN new;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mandalarts table (the 9x9 chart)
CREATE TABLE public.mandalarts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Goals',
  start_date DATE DEFAULT CURRENT_DATE,
  theme_color TEXT DEFAULT '#F59E0B',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.mandalarts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mandalarts"
  ON public.mandalarts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mandalarts"
  ON public.mandalarts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mandalarts"
  ON public.mandalarts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mandalarts"
  ON public.mandalarts FOR DELETE
  USING (auth.uid() = user_id);

-- Cell level enum
CREATE TYPE public.cell_level AS ENUM ('CENTER', 'SUB_CENTER', 'LEAF');

-- Cells table (81 cells per mandalart)
CREATE TABLE public.cells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandalart_id UUID NOT NULL REFERENCES public.mandalarts(id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position >= 0 AND position <= 80),
  level public.cell_level NOT NULL,
  content TEXT DEFAULT '',
  progress FLOAT DEFAULT 0.0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mandalart_id, position)
);

ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cells"
  ON public.cells FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.mandalarts m 
    WHERE m.id = cells.mandalart_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own cells"
  ON public.cells FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mandalarts m 
    WHERE m.id = mandalart_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own cells"
  ON public.cells FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.mandalarts m 
    WHERE m.id = cells.mandalart_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own cells"
  ON public.cells FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.mandalarts m 
    WHERE m.id = cells.mandalart_id AND m.user_id = auth.uid()
  ));

-- Action plan type enum
CREATE TYPE public.action_type AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- Action plans table
CREATE TABLE public.action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_id UUID NOT NULL REFERENCES public.cells(id) ON DELETE CASCADE,
  type public.action_type NOT NULL DEFAULT 'DAILY',
  target_count INTEGER DEFAULT 1,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own action plans"
  ON public.action_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cells c 
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE c.id = action_plans.cell_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own action plans"
  ON public.action_plans FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cells c 
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE c.id = cell_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own action plans"
  ON public.action_plans FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.cells c 
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE c.id = action_plans.cell_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own action plans"
  ON public.action_plans FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.cells c 
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE c.id = action_plans.cell_id AND m.user_id = auth.uid()
  ));

-- Action log status enum
CREATE TYPE public.action_status AS ENUM ('DONE', 'SKIP');

-- Action logs table
CREATE TABLE public.action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_plan_id UUID NOT NULL REFERENCES public.action_plans(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  status public.action_status NOT NULL DEFAULT 'DONE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(action_plan_id, log_date)
);

ALTER TABLE public.action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own action logs"
  ON public.action_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.action_plans ap
    JOIN public.cells c ON c.id = ap.cell_id
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE ap.id = action_logs.action_plan_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own action logs"
  ON public.action_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.action_plans ap
    JOIN public.cells c ON c.id = ap.cell_id
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE ap.id = action_plan_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own action logs"
  ON public.action_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.action_plans ap
    JOIN public.cells c ON c.id = ap.cell_id
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE ap.id = action_logs.action_plan_id AND m.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own action logs"
  ON public.action_logs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.action_plans ap
    JOIN public.cells c ON c.id = ap.cell_id
    JOIN public.mandalarts m ON m.id = c.mandalart_id
    WHERE ap.id = action_logs.action_plan_id AND m.user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_mandalarts_updated_at
  BEFORE UPDATE ON public.mandalarts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cells_updated_at
  BEFORE UPDATE ON public.cells
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at
  BEFORE UPDATE ON public.action_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();