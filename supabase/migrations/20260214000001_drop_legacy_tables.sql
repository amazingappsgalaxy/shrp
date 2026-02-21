
-- Drop legacy tables if they exist

DROP TABLE IF EXISTS public.tasks;
DROP TABLE IF EXISTS public.image_tasks;
DROP TABLE IF EXISTS public.user_tasks;
DROP TABLE IF EXISTS public.enhancement_tasks;
DROP TABLE IF EXISTS public.legacy_tasks;

-- Also check for any related sequences or types if necessary, but usually dropping tables is enough for now.
