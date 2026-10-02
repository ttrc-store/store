import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

async function promptPassword(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter Admin Password: ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@ttrc.store';
  let password = process.env.ADMIN_PASSWORD;

  if (!password) {
    password = await promptPassword();
  }

  if (!email || !password) {
    console.error('Error: Email and password are required.');
    console.error('Usage: $env:ADMIN_PASSWORD="<password>"; pnpm --filter=@ttrc/web run create-admin <email>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn('[TTRC Warning] SUPABASE_SERVICE_ROLE_KEY environment variable is missing.');
    console.log(`[Mock Environment] Admin creation simulated for ${email} with role 'admin'.`);
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existingUser = usersData?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;

    if (existingUser) {
      console.log(`User ${email} already exists (${existingUser.id}). Updating password and admin role...`);
      userId = existingUser.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

      if (updateError) {
        console.error('Failed to update user password:', updateError.message);
        process.exit(1);
      }
    } else {
      console.log(`Creating user ${email} in Supabase Auth...`);
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError || !createData.user) {
        console.error('Failed to create user:', createError?.message || 'Unknown error');
        process.exit(1);
      }

      userId = createData.user.id;
    }

    // Assign role 'admin' in user_roles and profiles
    await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });

    await supabase.from('profiles').upsert({
      id: userId,
      full_name: 'Store Admin',
      role: 'admin',
      updated_at: new Date().toISOString(),
    });

    console.log(` Successfully created/updated admin account for ${email}!`);
    console.log('You can now log in at /admin/login.');
  } catch (err: any) {
    console.error('Unexpected error creating admin account:', err.message || err);
    process.exit(1);
  }
}

main();
