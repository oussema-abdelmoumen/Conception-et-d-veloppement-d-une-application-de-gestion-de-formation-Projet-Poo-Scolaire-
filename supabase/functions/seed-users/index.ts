import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const users = [
    { email: 'admin@greenbuilding.com', password: 'admin123', role: 'administrateur' },
    { email: 'responsable@greenbuilding.com', password: 'resp123', role: 'responsable' },
    { email: 'user1@greenbuilding.com', password: 'user123', role: 'simple_utilisateur' },
  ]

  const results = []

  for (const u of users) {
    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(eu => eu.email === u.email)
    
    if (existing) {
      results.push({ email: u.email, status: 'already exists' })
      continue
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    })

    if (error) {
      results.push({ email: u.email, status: 'error', error: error.message })
      continue
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: data.user.id,
      role: u.role,
    })

    results.push({ email: u.email, status: 'created', roleError: roleError?.message })
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
