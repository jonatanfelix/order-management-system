const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.log('Pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ada di .env.local')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoUsers = [
  {
    email: 'admin@demo.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'ADMIN'
  },
  {
    email: 'input@demo.com', 
    password: 'input',
    name: 'Input User',
    role: 'INPUTER'
  },
  {
    email: 'approval@demo.com',
    password: 'approval', 
    name: 'Approval User',
    role: 'APPROVER'
  }
]

async function createDemoUsers() {
  console.log('🚀 Membuat akun demo...\n')
  
  for (const user of demoUsers) {
    try {
      console.log(`📝 Membuat akun: ${user.email}`)
      
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name
        }
      })

      if (authError) {
        console.error(`❌ Error creating ${user.email}:`, authError.message)
        continue
      }

      console.log(`✅ User created: ${authData.user.id}`)

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            name: user.name,
            role: user.role
          }
        ])

      if (profileError) {
        console.error(`❌ Error creating profile for ${user.email}:`, profileError.message)
        continue
      }

      console.log(`✅ Profile created with role: ${user.role}`)
      console.log()

    } catch (error) {
      console.error(`❌ Unexpected error for ${user.email}:`, error.message)
    }
  }

  console.log('🎉 Demo users creation completed!')
  console.log('\n📋 Summary:')
  console.log('- admin@demo.com (password: admin123) - ADMIN role')
  console.log('- input@demo.com (password: input) - INPUTER role') 
  console.log('- approval@demo.com (password: approval) - APPROVER role')
  
  // Verify users were created
  console.log('\n🔍 Verifying created users...')
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching profiles:', error.message)
    } else {
      console.table(profiles)
    }
  } catch (error) {
    console.error('Error verifying users:', error.message)
  }
}

// Run the script
createDemoUsers().catch(console.error)