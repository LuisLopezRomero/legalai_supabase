// Supabase Edge Function: Invite User
// This function creates a new user with admin privileges (service_role key)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create a Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify the user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized: Invalid user token')
    }

    // Verify the user has admin role
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('role, organization_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('User profile not found')
    }

    if (userProfile.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can invite users')
    }

    // Parse request body
    const { email, fullName, role } = await req.json()

    if (!email || !fullName || !role) {
      throw new Error('Missing required fields: email, fullName, role')
    }

    if (!['admin', 'member'].includes(role)) {
      throw new Error('Invalid role. Must be "admin" or "member"')
    }

    // Create Supabase admin client with service_role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users.some(u => u.email === email)
    
    if (userExists) {
      throw new Error('A user with this email already exists')
    }

    // Create the auth user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    if (!newUser.user) {
      throw new Error('User creation failed: no user returned')
    }

    // Create user profile in the database
    const { error: profileInsertError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: newUser.user.id,
        organization_id: userProfile.organization_id,
        email,
        full_name: fullName,
        role,
        is_active: true,
        preferences: {},
      })

    if (profileInsertError) {
      // If profile creation fails, delete the auth user to maintain consistency
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      console.error('Error creating user profile:', profileInsertError)
      throw new Error(`Failed to create user profile: ${profileInsertError.message}`)
    }

    // Send password reset email (this will allow the user to set their password)
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/`,
      },
    })

    if (resetError) {
      console.error('Error sending invite email:', resetError)
      // Don't throw here, user is created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User invited successfully',
        user: {
          id: newUser.user.id,
          email,
          full_name: fullName,
          role,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in invite-user function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
