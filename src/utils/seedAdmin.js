import bcrypt from 'bcryptjs';
import { pathToFileURL } from 'url';
import { supabaseAdmin } from '../config/supabase.js';

async function seedAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'sohamkoli@portfolio.com';
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || 'Soham Koli Admin';

    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD is not set in .env');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const { data: existingAdmin } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .maybeSingle();

    // Admin exists -> update password
    if (existingAdmin) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', existingAdmin.id);

      if (updateError) throw updateError;

      console.log('✅ Admin password updated');
      return existingAdmin;
    }

    // Admin missing -> create
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: adminEmail,
          password_hash: passwordHash,
          name: adminName,
          role: 'admin'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminEmail}`);
    return data;
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    throw error;
  }
}

// Run if this file is executed directly (works on Windows too)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedAdminUser().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default seedAdminUser;
