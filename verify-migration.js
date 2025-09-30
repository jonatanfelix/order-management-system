const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyMigration() {
  console.log('🔍 Verifying migration...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if orders table has new columns by trying to select them
    console.log('📊 Checking orders table columns...');
    const { data: orderCheck, error: orderError } = await supabase
      .from('orders')
      .select('is_task_based, total_duration_days, estimated_start_date, estimated_end_date')
      .limit(1);

    if (orderError) {
      console.error('❌ Orders table missing new columns:', orderError.message);
    } else {
      console.log('✅ Orders table has all new columns');
    }

    // Check if order_tasks table exists
    console.log('\n📊 Checking order_tasks table...');
    const { data: taskCheck, error: taskError } = await supabase
      .from('order_tasks')
      .select('id, order_id, name, start_date, end_date, progress')
      .limit(1);

    if (taskError) {
      console.error('❌ order_tasks table not found:', taskError.message);
    } else {
      console.log('✅ order_tasks table exists and is accessible');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (!orderError && !taskError) {
      console.log('✅ MIGRATION VERIFIED SUCCESSFULLY!');
      console.log('='.repeat(50));
      console.log('\n🎉 Your database is ready to use!');
      console.log('\n📋 Next steps:');
      console.log('   1. Test creating a task-based order');
      console.log('   2. Verify the Gantt chart displays correctly');
      console.log('   3. Check that order saving works without errors');
    } else {
      console.log('❌ MIGRATION INCOMPLETE');
      console.log('='.repeat(50));
      console.log('\n⚠️  Please check the errors above');
    }

  } catch (err) {
    console.error('\n❌ Verification failed:', err.message);
    process.exit(1);
  }
}

verifyMigration();