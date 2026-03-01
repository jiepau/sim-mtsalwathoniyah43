import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, description: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    // Get user role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1);

    const roleName = roles?.[0]?.role || 'user';
    const userName = profile?.full_name || user.email || 'Unknown';

    await supabase.from('activity_logs').insert({
      user_id: user.id,
      user_name: userName,
      user_role: roleName,
      action,
      description: `${userName} ${description}`,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
