import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid roles enum
const validRoles = ["admin", "bendahara", "operator", "guru"] as const;
type AppRole = typeof validRoles[number];

// Validation schemas
const createUserSchema = z.object({
  action: z.literal("create"),
  email: z.string()
    .trim()
    .email({ message: "Format email tidak valid" })
    .max(255, { message: "Email maksimal 255 karakter" }),
  password: z.string()
    .min(8, { message: "Password minimal 8 karakter" })
    .max(72, { message: "Password maksimal 72 karakter" })
    .regex(/[A-Za-z]/, { message: "Password harus mengandung huruf" })
    .regex(/[0-9]/, { message: "Password harus mengandung angka" }),
  full_name: z.string()
    .trim()
    .min(1, { message: "Nama lengkap tidak boleh kosong" })
    .max(100, { message: "Nama lengkap maksimal 100 karakter" }),
  roles: z.array(z.enum(validRoles)).optional().default([]),
});

const updateUserSchema = z.object({
  action: z.literal("update"),
  user_id: z.string().uuid({ message: "User ID tidak valid" }),
  email: z.string()
    .trim()
    .email({ message: "Format email tidak valid" })
    .max(255, { message: "Email maksimal 255 karakter" })
    .optional(),
  password: z.string()
    .min(8, { message: "Password minimal 8 karakter" })
    .max(72, { message: "Password maksimal 72 karakter" })
    .regex(/[A-Za-z]/, { message: "Password harus mengandung huruf" })
    .regex(/[0-9]/, { message: "Password harus mengandung angka" })
    .optional()
    .or(z.literal("")),
  full_name: z.string()
    .trim()
    .min(1, { message: "Nama lengkap tidak boleh kosong" })
    .max(100, { message: "Nama lengkap maksimal 100 karakter" })
    .optional(),
  roles: z.array(z.enum(validRoles)).optional(),
});

const deleteUserSchema = z.object({
  action: z.literal("delete"),
  user_id: z.string().uuid({ message: "User ID tidak valid" }),
});

const requestSchema = z.discriminatedUnion("action", [
  createUserSchema,
  updateUserSchema,
  deleteUserSchema,
]);

// Helper to format Zod errors
function formatZodErrors(error: z.ZodError): string {
  return error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .single();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Only admins can manage users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const rawBody = await req.json();
    const parseResult = requestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: formatZodErrors(parseResult.error) }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = parseResult.data;

    // CREATE USER
    if (body.action === "create") {
      const { email, password, full_name, roles } = body;

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Assign roles
      if (roles && roles.length > 0 && newUser.user) {
        const rolesToInsert = roles.map((role: AppRole) => ({
          user_id: newUser.user!.id,
          role: role,
        }));

        await supabaseAdmin.from("user_roles").insert(rolesToInsert);
      }

      return new Response(
        JSON.stringify({ success: true, user: { id: newUser.user?.id, email: newUser.user?.email, full_name } }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UPDATE USER
    if (body.action === "update") {
      const { user_id, email, password, full_name, roles } = body;

      // Prevent self-demotion from admin
      if (user_id === requestingUser.id && roles && !roles.includes('admin')) {
        return new Response(
          JSON.stringify({ error: "Cannot remove admin role from yourself" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update auth user (email, password)
      const updateData: { email?: string; password?: string; user_metadata?: { full_name: string } } = {};
      if (email) updateData.email = email;
      if (password && password.length > 0) updateData.password = password;
      if (full_name) updateData.user_metadata = { full_name };

      if (Object.keys(updateData).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user_id, updateData);
        if (updateAuthError) {
          return new Response(
            JSON.stringify({ error: updateAuthError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Update profile
      if (full_name) {
        await supabaseAdmin
          .from("profiles")
          .update({ full_name, updated_at: new Date().toISOString() })
          .eq("user_id", user_id);
      }

      // Update roles
      if (roles !== undefined) {
        // Delete existing roles
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        
        // Insert new roles
        if (roles.length > 0) {
          const rolesToInsert = roles.map((role: AppRole) => ({
            user_id: user_id,
            role: role,
          }));
          await supabaseAdmin.from("user_roles").insert(rolesToInsert);
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DELETE USER
    if (body.action === "delete") {
      const { user_id } = body;

      // Prevent self-deletion
      if (user_id === requestingUser.id) {
        return new Response(
          JSON.stringify({ error: "Cannot delete your own account" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Delete from auth (this will cascade to profiles and user_roles via foreign keys/triggers)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      
      if (deleteError) {
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
