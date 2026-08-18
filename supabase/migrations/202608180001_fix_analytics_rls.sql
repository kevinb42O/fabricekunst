-- ========================================================
-- Fix Analytics RLS — page_views & analytics_events
-- Both tables exist but have NO insert/select policies for
-- anon, causing all tracking to silently fail.
-- Run this in Supabase SQL Editor.
-- ========================================================

-- ===================== page_views ========================

-- Allow anyone (anon) to INSERT page views
DROP POLICY IF EXISTS "Anon insert page_views" ON public.page_views;
CREATE POLICY "Anon insert page_views"
  ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to SELECT page views (needed by admin dashboard)
DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;
CREATE POLICY "Public read page_views"
  ON public.page_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ================== analytics_events =====================

-- Allow anyone (anon) to INSERT analytics events
DROP POLICY IF EXISTS "Anon insert analytics_events" ON public.analytics_events;
CREATE POLICY "Anon insert analytics_events"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow anyone to SELECT analytics events (needed by admin dashboard)
DROP POLICY IF EXISTS "Public read analytics_events" ON public.analytics_events;
CREATE POLICY "Public read analytics_events"
  ON public.analytics_events
  FOR SELECT
  TO anon, authenticated
  USING (true);
