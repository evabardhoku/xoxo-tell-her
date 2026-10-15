ALTER TABLE public.wingwoman_sessions
 ADD COLUMN IF NOT EXISTS context text,
 ADD COLUMN IF NOT EXISTS situation text,
 ADD COLUMN IF NOT EXISTS instinct text,
 ADD COLUMN IF NOT EXISTS reflection jsonb;
ALTER TABLE public.wingwoman_sessions
 ADD CONSTRAINT wingwoman_context_chk CHECK (context IS NULL OR context IN ('Dating','Work','Friendship','Family','Other')),
 ADD CONSTRAINT wingwoman_instinct_chk CHECK (instinct IS NULL OR instinct IN ('feels_okay','unsure','feels_off')),
 ADD CONSTRAINT wingwoman_situation_len CHECK (situation IS NULL OR char_length(situation) BETWEEN 10 AND 4000);