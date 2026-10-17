import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { membershipQuery } from '@/lib/membership';
import { AppShell } from '@/components/app-shell';
export const Route = createFileRoute('/_authenticated')({ ssr: false, beforeLoad: async () => { const { data, error } = await supabase.auth.getUser(); if (error || !data.user) throw redirect({ to: '/auth' }); if (!await membershipQuery.queryFn()) throw redirect({ to: '/join' }); }, component: () => <AppShell><Outlet /></AppShell> });