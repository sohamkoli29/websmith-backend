import { supabase } from '../config/supabase.js';

export class ContentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ContentError';
    this.status = status;
  }
}

export const contentController = {
  
  // ==================== ABOUT SECTION ====================
  
  // Get about information
  async getAbout(req, res, next) {
    try {
      const { data, error } = await supabase
        .from('about')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      res.status(200).json({
        success: true,
        data: data || null
      });
    } catch (error) {
      next(error);
    }
  },

  // Create or update about information
  async updateAbout(req, res, next) {
    try {
      const { 
        title, 
        description, 
        image_url, 
        cv_url, 
        email, 
        phone, 
        location 
      } = req.body;

      // Check if about entry exists
      const { data: existingAbout } = await supabase
        .from('about')
        .select('id')
        .limit(1)
        .single();

      let result;

      if (existingAbout) {
        // Update existing
        const { data, error } = await supabase
          .from('about')
          .update({
            title,
            description,
            image_url,
            cv_url,
            email,
            phone,
            location,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAbout.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('about')
          .insert([{
            title,
            description,
            image_url,
            cv_url,
            email,
            phone,
            location
          }])
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      res.status(200).json({
        success: true,
        message: 'About information saved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== SKILLS ====================

  // Get all skills
  async getSkills(req, res, next) {
    try {
      const { category, sort = 'sort_order' } = req.query;

      let query = supabase
        .from('skills')
        .select('*')
        .order(sort);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single skill
  async getSkill(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create skill
  async createSkill(req, res, next) {
    try {
      const { name, category, proficiency, icon, color, sort_order } = req.body;

      if (!name) {
        throw new ContentError('Skill name is required', 400);
      }

      const { data, error } = await supabase
        .from('skills')
        .insert([{
          name,
          category,
          proficiency: proficiency || 50,
          icon,
          color,
          sort_order: sort_order || 0
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Skill created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update skill
  async updateSkill(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if skill exists
      const { data: existingSkill, error: checkError } = await supabase
        .from('skills')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new ContentError('Skill not found', 404);
      }

      const { data, error } = await supabase
        .from('skills')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Skill updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete skill
  async deleteSkill(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('skills')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Skill deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== PROJECTS ====================

  // Get all projects
  async getProjects(req, res, next) {
    try {
      const { featured, technology, sort = 'sort_order' } = req.query;

      let query = supabase
        .from('projects')
        .select('*')
        .order(sort);

      if (featured !== undefined) {
        query = query.eq('featured', featured === 'true');
      }

      if (technology) {
        query = query.contains('technologies', [technology]);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single project
  async getProject(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create project
  async createProject(req, res, next) {
    try {
      const {
        title,
        description,
        short_description,
        image_url,
        project_url,
        github_url,
        technologies,
        featured,
        sort_order
      } = req.body;

      if (!title || !description) {
        throw new ContentError('Title and description are required', 400);
      }

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          title,
          description,
          short_description,
          image_url,
          project_url,
          github_url,
          technologies: technologies || [],
          featured: featured || false,
          sort_order: sort_order || 0
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update project
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data: existingProject, error: checkError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new ContentError('Project not found', 404);
      }

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete project
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== BLOGS ====================

  // Get all blogs
  async getBlogs(req, res, next) {
    try {
      const { published, tag, author, sort = 'created_at', order = 'desc' } = req.query;

      let query = supabase
        .from('blogs')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (published !== undefined) {
        query = query.eq('published', published === 'true');
      }

      if (tag) {
        query = query.contains('tags', [tag]);
      }

      if (author) {
        query = query.eq('author', author);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single blog by ID or slug
  async getBlog(req, res, next) {
    try {
      const { idOrSlug } = req.params;

      // Check if it's a UUID or slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

      let query = supabase
        .from('blogs')
        .select('*');

      if (isUuid) {
        query = query.eq('id', idOrSlug);
      } else {
        query = query.eq('slug', idOrSlug);
      }

      const { data, error } = await query.single();

      if (error) throw error;

      // Increment views (if you add a views column later)
      // await supabase
      //   .from('blogs')
      //   .update({ views: (data.views || 0) + 1 })
      //   .eq('id', data.id);

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create blog
  async createBlog(req, res, next) {
    try {
      const {
        title,
        slug,
        content,
        excerpt,
        cover_image,
        author,
        tags,
        published
      } = req.body;

      if (!title || !slug || !content) {
        throw new ContentError('Title, slug, and content are required', 400);
      }

      // Check if slug already exists
      const { data: existingSlug } = await supabase
        .from('blogs')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existingSlug) {
        throw new ContentError('Slug already exists', 400);
      }

      const blogData = {
        title,
        slug,
        content,
        excerpt: excerpt || content.substring(0, 200) + '...',
        cover_image,
        author: author || 'Admin',
        tags: tags || [],
        published: published || false
      };

      // If publishing, set published_at
      if (blogData.published) {
        blogData.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('blogs')
        .insert([blogData])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Blog created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update blog
  async updateBlog(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data: existingBlog, error: checkError } = await supabase
        .from('blogs')
        .select('id, published, published_at')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new ContentError('Blog not found', 404);
      }

      // If publishing for the first time, set published_at
      if (updates.published && !existingBlog.published_at) {
        updates.published_at = new Date().toISOString();
      }

      // If unpublishing, clear published_at
      if (updates.published === false) {
        updates.published_at = null;
      }

      const { data, error } = await supabase
        .from('blogs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Blog updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete blog
  async deleteBlog(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== EXPERIENCE ====================

  // Get all experiences
  async getExperiences(req, res, next) {
    try {
      const { current, sort = 'sort_order' } = req.query;

      let query = supabase
        .from('experience')
        .select('*')
        .order(sort);

      if (current !== undefined) {
        query = query.eq('current', current === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single experience
  async getExperience(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('experience')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create experience
  async createExperience(req, res, next) {
    try {
      const {
        company,
        position,
        description,
        start_date,
        end_date,
        current,
        location,
        technologies,
        sort_order
      } = req.body;

      if (!company || !position || !start_date) {
        throw new ContentError('Company, position, and start date are required', 400);
      }

      const experienceData = {
        company,
        position,
        description,
        start_date,
        end_date: current ? null : end_date,
        current: current || false,
        location,
        technologies: technologies || [],
        sort_order: sort_order || 0
      };

      const { data, error } = await supabase
        .from('experience')
        .insert([experienceData])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Experience created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update experience
  async updateExperience(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data: existingExperience, error: checkError } = await supabase
        .from('experience')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new ContentError('Experience not found', 404);
      }

      const { data, error } = await supabase
        .from('experience')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Experience updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete experience
  async deleteExperience(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('experience')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Experience deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== TESTIMONIALS ====================

  // Get all testimonials
  async getTestimonials(req, res, next) {
    try {
      const { featured, sort = 'created_at', order = 'desc' } = req.query;

      let query = supabase
        .from('testimonials')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (featured !== undefined) {
        query = query.eq('featured', featured === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single testimonial
  async getTestimonial(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create testimonial
  async createTestimonial(req, res, next) {
    try {
      const {
        name,
        role,
        company,
        content,
        avatar_url,
        rating,
        featured
      } = req.body;

      if (!name || !content) {
        throw new ContentError('Name and content are required', 400);
      }

      const { data, error } = await supabase
        .from('testimonials')
        .insert([{
          name,
          role,
          company,
          content,
          avatar_url,
          rating: rating || 5,
          featured: featured || false
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Testimonial created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update testimonial
  async updateTestimonial(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data: existingTestimonial, error: checkError } = await supabase
        .from('testimonials')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new ContentError('Testimonial not found', 404);
      }

      const { data, error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Testimonial updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete testimonial
  async deleteTestimonial(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Testimonial deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== SERVICES ====================

  // Get all services
  async getServices(req, res, next) {
    try {
      const { sort = 'sort_order' } = req.query;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order(sort);

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single service
  async getService(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create service
  async createService(req, res, next) {
    try {
      const {
        title,
        description,
        icon,
        features,
        sort_order
      } = req.body;

      if (!title || !description) {
        throw new ContentError('Title and description are required', 400);
      }

      const { data, error } = await supabase
        .from('services')
        .insert([{
          title,
          description,
          icon,
          features: features || [],
          sort_order: sort_order || 0
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update service
  async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const { data: existingService, error: checkError } = await supabase
        .from('services')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new ContentError('Service not found', 404);
      }

      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Service updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete service
  async deleteService(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== CONTACT MESSAGES ====================

  // Get all messages
  async getMessages(req, res, next) {
    try {
      const { read, sort = 'created_at', order = 'desc' } = req.query;

      let query = supabase
        .from('messages')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (read !== undefined) {
        query = query.eq('read', read === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.status(200).json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get single message
  async getMessage(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Mark as read when retrieved
      if (!data.read) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', id);
      }

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create message (contact form submission)
  async createMessage(req, res, next) {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !message) {
        throw new ContentError('Name, email, and message are required', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ContentError('Invalid email format', 400);
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          name,
          email,
          subject,
          message
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update message (mark as read/unread)
  async updateMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { read } = req.body;

      const { data: existingMessage, error: checkError } = await supabase
        .from('messages')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new ContentError('Message not found', 404);
      }

      const { data, error } = await supabase
        .from('messages')
        .update({ read })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Message updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete message
  async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // ==================== STATISTICS ====================

  // Get dashboard statistics
  async getStats(req, res, next) {
    try {
      // Get counts for each content type
      const [
        projectsCount,
        blogsCount,
        messagesCount,
        testimonialsCount,
        skillsCount,
        unreadMessages
      ] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('blogs').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('testimonials').select('id', { count: 'exact', head: true }),
        supabase.from('skills').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('read', false)
      ]);

      // Get recent activities
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: recentBlogs } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      res.status(200).json({
        success: true,
        data: {
          counts: {
            projects: projectsCount.count || 0,
            blogs: blogsCount.count || 0,
            messages: messagesCount.count || 0,
            testimonials: testimonialsCount.count || 0,
            skills: skillsCount.count || 0,
            unreadMessages: unreadMessages.count || 0
          },
          recent: {
            messages: recentMessages || [],
            blogs: recentBlogs || []
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};