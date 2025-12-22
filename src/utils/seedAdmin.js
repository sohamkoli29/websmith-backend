import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';

async function seedAdminUser() {
  try {
    const adminEmail = 'sohamkoli@portfolio.com';
    const adminPassword = 'KOLIkoli@029'; // Change this in production!
    const adminName = 'Soham Koli Admin';

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // Create admin user
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

    if (error) {
      throw error;
    }

    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  Change these credentials immediately!');

    return data;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdminUser();
}

export default seedAdminUser;