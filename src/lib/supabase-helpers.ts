import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'bendahara' | 'operator' | 'guru' | 'siswa' | 'panitia';

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  console.log('getUserRoles: Starting query for', userId);
  
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  console.log('getUserRoles: Query completed', { data, error });
  
  if (error) throw error;
  return data?.map(r => r.role as AppRole) || [];
}

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Normalize jenis_kelamin value to single char: 'L' | 'P' | null.
 * Handles legacy values like 'Laki-laki', 'Perempuan', mixed case.
 */
export function normalizeGender(g: string | null | undefined): 'L' | 'P' | null {
  if (!g) return null;
  const s = g.trim().toLowerCase();
  if (s === 'l' || s.startsWith('laki')) return 'L';
  if (s === 'p' || s.startsWith('perem')) return 'P';
  return null;
}

export function genderLabel(g: string | null | undefined): string {
  const n = normalizeGender(g);
  if (n === 'L') return 'Laki-laki';
  if (n === 'P') return 'Perempuan';
  return '-';
}
