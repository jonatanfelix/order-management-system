const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Starting migration...\n');

  // Initialize Supabase client with service role key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Read the migration SQL file
  const sqlPath = path.join(__dirname, 'RUN_THIS_IN_SUPABASE.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Migration file loaded:', sqlPath);
  console.log('📊 SQL content length:', sqlContent.length, 'characters\n');

  try {
    // Execute the migration SQL
    console.log('⏳ Executing migration SQL...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct SQL execution
      console.log('⚠️  exec_sql RPC not found, trying alternative method...\n');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql_query: statement
          });
          
          if (stmtError) {
            console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify the changes in your Supabase dashboard');
    console.log('   2. Check that orders table has new columns');
    console.log('   3. Check that order_tasks table was created');
    
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.error('👉 https://supabase.com/dashboard/project/xjiwnmnccjlhrkgtaflk/sql/new');
    process.exit(1);
  }
}

runMigration();