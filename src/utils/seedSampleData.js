import { supabaseAdmin } from '../config/supabase.js';

async function seedSampleData() {
  try {
    console.log('🌱 Seeding sample data...');

    // Seed skills
    const skills = [
      { name: 'React', category: 'Frontend', proficiency: 90, icon: 'react', color: '#61DAFB', sort_order: 1 },
      { name: 'Node.js', category: 'Backend', proficiency: 85, icon: 'node', color: '#339933', sort_order: 2 },
      { name: 'Express.js', category: 'Backend', proficiency: 80, icon: 'express', color: '#000000', sort_order: 3 },
      { name: 'PostgreSQL', category: 'Database', proficiency: 75, icon: 'postgresql', color: '#336791', sort_order: 4 },
      { name: 'Tailwind CSS', category: 'Frontend', proficiency: 85, icon: 'tailwind', color: '#06B6D4', sort_order: 5 },
      { name: 'JavaScript', category: 'Language', proficiency: 95, icon: 'javascript', color: '#F7DF1E', sort_order: 6 },
      { name: 'TypeScript', category: 'Language', proficiency: 80, icon: 'typescript', color: '#3178C6', sort_order: 7 }
    ];

    console.log('📊 Seeding skills...');
    for (const skill of skills) {
      const { error } = await supabaseAdmin
        .from('skills')
        .insert([skill])
        .select()
        .single();
      
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error seeding skill:', error.message);
      }
    }

    // Seed about
    console.log('👤 Seeding about...');
    const aboutData = {
      title: 'Full Stack Developer & Tech Enthusiast',
      description: 'Passionate full-stack developer with 5+ years of experience building modern web applications. Specialized in React, Node.js, and cloud technologies. Always eager to learn new technologies and solve complex problems.',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      cv_url: '/cv.pdf',
      email: 'hello@portfolio.dev',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA'
    };

    const { error: aboutError } = await supabaseAdmin
      .from('about')
      .upsert([aboutData], { onConflict: 'id' });

    if (aboutError) {
      console.error('Error seeding about:', aboutError.message);
    }

    // Seed projects
    console.log('💼 Seeding projects...');
    const projects = [
      {
        title: 'E-commerce Platform',
        description: 'A full-featured e-commerce platform with shopping cart, payment integration, and admin dashboard.',
        short_description: 'Modern e-commerce solution',
        image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w-600&h-400&fit=crop',
        project_url: 'https://demo-ecommerce.com',
        github_url: 'https://github.com/username/ecommerce',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
        featured: true,
        sort_order: 1
      },
      {
        title: 'Portfolio CMS',
        description: 'Custom content management system for portfolio websites with blog, projects, and contact management.',
        short_description: 'Custom portfolio CMS',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w-600&h-400&fit=crop',
        project_url: 'https://cms.portfolio.dev',
        github_url: 'https://github.com/username/portfolio-cms',
        technologies: ['Next.js', 'Express.js', 'Supabase', 'Tailwind CSS'],
        featured: true,
        sort_order: 2
      }
    ];

    for (const project of projects) {
      const { error } = await supabaseAdmin
        .from('projects')
        .insert([project]);
      
      if (error) {
        console.error('Error seeding project:', error.message);
      }
    }

    // Seed testimonials
    console.log('⭐ Seeding testimonials...');
    const testimonials = [
      {
        name: 'Sarah Johnson',
        role: 'Product Manager',
        company: 'TechCorp Inc.',
        content: 'Exceptional work! Delivered exactly what we needed ahead of schedule.',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
        rating: 5,
        featured: true
      },
      {
        name: 'Michael Chen',
        role: 'CTO',
        company: 'StartupXYZ',
        content: 'Highly skilled developer who understands both frontend and backend deeply.',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
        rating: 5,
        featured: true
      }
    ];

    for (const testimonial of testimonials) {
      const { error } = await supabaseAdmin
        .from('testimonials')
        .insert([testimonial]);
      
      if (error) {
        console.error('Error seeding testimonial:', error.message);
      }
    }

    console.log('✅ Sample data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding sample data:', error.message);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSampleData();
}

export default seedSampleData;