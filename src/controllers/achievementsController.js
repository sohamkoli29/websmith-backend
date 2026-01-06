// src/controllers/achievementsController.js
import { supabase, supabaseAdmin } from '../config/supabase.js';

export class AchievementError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AchievementError';
    this.status = status;
  }
}

export const achievementsController = {
  // Get all achievements
  async getAchievements(req, res, next) {
    try {
      const { featured, category, sort = 'achievement_date', order = 'desc' } = req.query;

      let query = supabase
        .from('achievements')
        .select('*')
        .order(sort, { ascending: order === 'asc' });

      if (featured !== undefined) {
        query = query.eq('featured', featured === 'true');
      }

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

  // Get single achievement
  async getAchievement(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new AchievementError('Achievement not found', 404);
      }

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create achievement
  async createAchievement(req, res, next) {
    try {
      const {
        title,
        description,
        achievement_date,
        category,
        organization,
        image_url,
        icon,
        color,
        featured,
        sort_order
      } = req.body;

      if (!title || !description || !achievement_date) {
        throw new AchievementError('Title, description, and achievement date are required', 400);
      }

      // Validate date format
      if (!Date.parse(achievement_date)) {
        throw new AchievementError('Invalid achievement date format', 400);
      }

      const achievementData = {
        title,
        description,
        achievement_date,
        category: category || null,
        organization: organization || null,
        image_url: image_url || null,
 
        icon: icon || null,
        color: color || '#3B82F6',
        featured: featured || false,
        sort_order: sort_order || 0
      };

      const { data, error } = await supabaseAdmin
        .from('achievements')
        .insert([achievementData])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Achievement created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update achievement
  async updateAchievement(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if achievement exists
      const { data: existingAchievement, error: checkError } = await supabaseAdmin
        .from('achievements')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new AchievementError('Achievement not found', 404);
      }

      // Validate date if provided
      if (updates.achievement_date && !Date.parse(updates.achievement_date)) {
        throw new AchievementError('Invalid achievement date format', 400);
      }

      const { data, error } = await supabaseAdmin
        .from('achievements')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Achievement updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete achievement
  async deleteAchievement(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('achievements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Achievement deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};