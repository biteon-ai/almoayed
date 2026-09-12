-- TEACH-017: stable friendly slug for teacher quiz URLs
-- Shape: {titleSlug}-{id8} — Arabic letters kept; never rewritten on UPDATE.

CREATE OR REPLACE FUNCTION public.quiz_friendly_slug(p_title text, p_id uuid)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  title_slug text;
  id8 text;
  result text;
BEGIN
  id8 := left(replace(lower(p_id::text), '-', ''), 8);

  title_slug := normalize(coalesce(p_title, ''), NFC);
  title_slug := lower(btrim(title_slug));
  title_slug := regexp_replace(title_slug, '[[:space:]_]+', '-', 'g');
  title_slug := regexp_replace(title_slug, '[^[:alnum:]-]+', '', 'g');
  title_slug := regexp_replace(title_slug, '-{2,}', '-', 'g');
  title_slug := trim(both '-' from title_slug);

  IF char_length(title_slug) > 48 THEN
    title_slug := left(title_slug, 48);
    IF position('-' in title_slug) > 0 THEN
      title_slug := regexp_replace(title_slug, '-[^-]*$', '');
    END IF;
    title_slug := trim(both '-' from title_slug);
  END IF;

  IF title_slug IS NULL OR title_slug = '' THEN
    result := id8;
  ELSE
    result := title_slug || '-' || id8;
  END IF;

  IF result = 'new' THEN
    result := 'quiz-' || result;
  END IF;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.quiz_friendly_slug(text, uuid) IS
  'TEACH-017: {titleSlug}-{id8} for teacher quiz URLs. Must match src/lib/teacher-quiz-path.ts buildQuizSlug.';

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE quizzes
SET slug = public.quiz_friendly_slug(title, id)
WHERE slug IS NULL OR btrim(slug) = '';

ALTER TABLE quizzes
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS quizzes_created_by_slug_key
  ON quizzes (created_by, slug);

CREATE OR REPLACE FUNCTION public.quizzes_set_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := public.quiz_friendly_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quizzes_set_slug ON quizzes;
CREATE TRIGGER quizzes_set_slug
  BEFORE INSERT ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.quizzes_set_slug();

COMMENT ON COLUMN quizzes.slug IS
  'TEACH-017: Canonical teacher path segment. Set on insert; never overwritten on title UPDATE.';
