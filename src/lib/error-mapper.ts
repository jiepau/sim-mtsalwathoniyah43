/**
 * Error mapper utility to convert database/API errors to user-friendly messages.
 * This prevents leaking internal database structure and security details.
 */

export function mapDatabaseError(error: any): string {
  // Log full error for debugging (developers only in console)
  console.error('Database operation failed:', error);
  
  // PostgreSQL error codes
  if (error?.code === '23505') return 'Data sudah ada dalam sistem';
  if (error?.code === '23503') return 'Tidak dapat menghapus karena data terkait dengan data lain';
  if (error?.code === '23502') return 'Data wajib tidak lengkap';
  if (error?.code === '42501') return 'Anda tidak memiliki izin untuk operasi ini';
  if (error?.code === '22P02') return 'Format data tidak valid';
  
  // RLS/Auth policy errors
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('rls') || message.includes('policy') || message.includes('permission denied')) {
    return 'Anda tidak memiliki izin untuk operasi ini';
  }
  
  // Auth errors
  if (message.includes('invalid login credentials')) {
    return 'Email atau password salah';
  }
  if (message.includes('email already registered') || message.includes('user already registered')) {
    return 'Email sudah terdaftar';
  }
  if (message.includes('email not confirmed')) {
    return 'Email belum diverifikasi. Silakan cek inbox email Anda.';
  }
  if (message.includes('password')) {
    return 'Password tidak valid atau terlalu lemah';
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Koneksi jaringan bermasalah. Silakan coba lagi.';
  }
  
  // Generic fallback - don't expose the actual error
  return 'Terjadi kesalahan. Silakan coba lagi.';
}

export function mapAuthError(error: any): string {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('invalid login credentials')) {
    return 'Email atau password salah';
  }
  if (message.includes('email already registered') || message.includes('user already registered')) {
    return 'Email sudah terdaftar';
  }
  if (message.includes('email not confirmed')) {
    return 'Email belum diverifikasi. Silakan cek inbox email Anda.';
  }
  if (message.includes('signup disabled') || message.includes('signups not allowed')) {
    return 'Pendaftaran tidak tersedia. Hubungi administrator.';
  }
  if (message.includes('rate limit')) {
    return 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
  }
  
  console.error('Auth error:', error);
  return 'Terjadi kesalahan autentikasi. Silakan coba lagi.';
}
