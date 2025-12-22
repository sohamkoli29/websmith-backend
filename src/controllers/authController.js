import { supabase } from '../config/supabase.js';
import {
  generateToken,
  generateRefreshToken,
  verifyToken,
  comparePassword,
  validateEmail,
  validatePassword,
  AuthError
} from '../utils/authUtils.js';

export const authController = {
  // Login admin user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw new AuthError('Email and password are required', 400);
      }

      if (!validateEmail(email)) {
        throw new AuthError('Invalid email format', 400);
      }

      // Find user by email
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, password_hash, name, role')
        .eq('email', email)
        .single();

      if (error || !user) {
        throw new AuthError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new AuthError('Invalid credentials', 401);
      }

      // Generate tokens
      const accessToken = generateToken(user.id, user.role);
      const refreshToken = generateRefreshToken(user.id);

      // Store refresh token (optional - could store in database for better security)
      // For simplicity, we're returning it directly
      // In production, consider storing hashed refresh tokens in database

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60 // 24 hours in seconds
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Refresh access token
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AuthError('Refresh token is required', 400);
      }

      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new AuthError('Invalid token type', 401);
      }

      // Get user data
      const { data: user, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', decoded.sub)
        .single();

      if (error || !user) {
        throw new AuthError('User not found', 401);
      }

      // Generate new access token
      const newAccessToken = generateToken(user.id, user.role);

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: 24 * 60 * 60 // 24 hours in seconds
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.sub;

      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new AuthError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  async changePassword(req, res, next) {
    try {
      const userId = req.user.sub;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AuthError('Current password and new password are required', 400);
      }

      if (!validatePassword(newPassword)) {
        throw new AuthError(
          'New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character',
          400
        );
      }

      // Get current user with password hash
      const { data: user, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (error || !user) {
        throw new AuthError('User not found', 404);
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new AuthError('Current password is incorrect', 401);
      }

      // Hash new password
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const newPasswordHash = await bcrypt.hash(newPassword, salt);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      res.status(200).json({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout (client-side should delete tokens)
  async logout(req, res, next) {
    try {
      // In a more secure implementation, we could blacklist the token
      // For now, just return success - client should delete tokens
      res.status(200).json({
        success: true,
        message: 'Logout successful. Please delete tokens on client side.'
      });
    } catch (error) {
      next(error);
    }
  }
};