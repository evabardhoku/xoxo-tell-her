ALTER TABLE public.reports DROP CONSTRAINT reports_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_check CHECK (num_nonnulls(question_id, reply_id, message_id) = 1);