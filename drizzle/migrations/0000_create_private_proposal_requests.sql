CREATE TABLE public.proposal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('OFF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  buyer_name text NOT NULL CHECK (char_length(buyer_name) BETWEEN 1 AND 120),
  work_email text NOT NULL CHECK (char_length(work_email) BETWEEN 3 AND 254),
  company text NOT NULL CHECK (char_length(company) BETWEEN 1 AND 160),
  quantity text NOT NULL DEFAULT '' CHECK (char_length(quantity) <= 120),
  timing text NOT NULL DEFAULT '' CHECK (char_length(timing) <= 120),
  budget text NOT NULL DEFAULT '' CHECK (char_length(budget) <= 160),
  priorities text NOT NULL DEFAULT '' CHECK (char_length(priorities) <= 2000),
  brand_name text NOT NULL CHECK (char_length(brand_name) BETWEEN 1 AND 120),
  website text NOT NULL DEFAULT '' CHECK (char_length(website) <= 300),
  concept_story text NOT NULL CHECK (char_length(concept_story) BETWEEN 1 AND 6000),
  asset_ids uuid[] NOT NULL CHECK (cardinality(asset_ids) = 4),
  concept_summary jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(concept_summary::text) <= 24000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.proposal_requests TO service_role;
ALTER TABLE public.proposal_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX proposal_requests_created_at_idx ON public.proposal_requests (created_at DESC);

CREATE TABLE public.proposal_request_limits (
  key text PRIMARY KEY,
  used integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL
);
GRANT ALL ON public.proposal_request_limits TO service_role;
ALTER TABLE public.proposal_request_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reserve_proposal_request(client_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_count integer;
  global_count integer;
  bucket text := to_char(now() at time zone 'UTC', 'YYYY-MM-DD');
BEGIN
  IF client_key IS NULL OR char_length(client_key) < 8 OR char_length(client_key) > 128 THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(826193);
  DELETE FROM public.proposal_request_limits WHERE expires_at < now();
  SELECT used INTO client_count FROM public.proposal_request_limits WHERE key = 'client:' || bucket || ':' || client_key;
  SELECT used INTO global_count FROM public.proposal_request_limits WHERE key = 'global:' || bucket;
  IF coalesce(client_count, 0) >= 5 OR coalesce(global_count, 0) >= 50 THEN RETURN false; END IF;
  INSERT INTO public.proposal_request_limits VALUES ('client:' || bucket || ':' || client_key, 1, now() + interval '2 days')
    ON CONFLICT (key) DO UPDATE SET used = public.proposal_request_limits.used + 1;
  INSERT INTO public.proposal_request_limits VALUES ('global:' || bucket, 1, now() + interval '2 days')
    ON CONFLICT (key) DO UPDATE SET used = public.proposal_request_limits.used + 1;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_proposal_request(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_proposal_request(text) TO service_role;