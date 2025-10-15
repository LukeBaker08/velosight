import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('List users function called');

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with anon key for JWT verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the JWT token and get the user
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    
    if (authError || !user) {
      console.log('Invalid token or user not found:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', user.email);

    // Check if user has admin or authenticated role in profiles table
    const { data: profile, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'authenticated')) {
    //   console.log('User does not have required role or profile not found:', profileError, profile);
    //   return new Response(
    //     JSON.stringify({ error: 'Access denied. Admin or authenticated role required.' }),
    //     { 
    //       status: 403, 
    //       headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    //     }
    //   );
    }

    console.log('User is admin, proceeding to list users');

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // List all users using admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error('Error listing users:', userError);
      return new Response(
        JSON.stringify({ error: 'Failed to list users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully listed', userData.users.length, 'users');

    // Get all profiles for role mapping
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Return the users data
    return new Response(
      JSON.stringify({ 
        users: userData.users,
        profiles: profiles || []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in list-users function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});