-- Force drop legacy tables if they exist
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.image_tasks CASCADE;
DROP TABLE IF EXISTS public.user_tasks CASCADE;
DROP TABLE IF EXISTS public.enhancement_tasks CASCADE;
DROP TABLE IF EXISTS public.legacy_tasks CASCADE;
