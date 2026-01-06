// src/controllers/certificatesController.js
import { supabase, supabaseAdmin } from '../config/supabase.js';

export class CertificateError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'CertificateError';
    this.status = status;
  }
}

export const certificatesController = {
  // Get all certificates
  async getCertificates(req, res, next) {
    try {
      const { featured, sort = 'issue_date', order = 'desc' } = req.query;

      let query = supabase
        .from('certificates')
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

  // Get single certificate
  async getCertificate(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new CertificateError('Certificate not found', 404);
      }

      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create certificate
  async createCertificate(req, res, next) {
    try {
      const {
        title,
        issuer,
        issue_date,
        credential_id,  // Keep this
        verification_url,  // Changed from credential_url
        image_url,
        description,
        featured,
        sort_order
      } = req.body;

      if (!title || !issuer || !issue_date) {
        throw new CertificateError('Title, issuer, and issue date are required', 400);
      }

      // Validate date format
      if (!Date.parse(issue_date)) {
        throw new CertificateError('Invalid issue date format', 400);
      }

      const certificateData = {
        title,
        issuer,
        issue_date,
        credential_id: credential_id || null,
       
        image_url: image_url || null,
        description: description || null,
        // Removed: skills, expiry_date
        featured: featured || false,
        sort_order: sort_order || 0
      };

      const { data, error } = await supabaseAdmin
        .from('certificates')
        .insert([certificateData])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Certificate created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update certificate
  async updateCertificate(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if certificate exists
      const { data: existingCertificate, error: checkError } = await supabaseAdmin
        .from('certificates')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new CertificateError('Certificate not found', 404);
      }

      // Validate date if provided
      if (updates.issue_date && !Date.parse(updates.issue_date)) {
        throw new CertificateError('Invalid issue date format', 400);
      }

      const { data, error } = await supabaseAdmin
        .from('certificates')
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
        message: 'Certificate updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete certificate
  async deleteCertificate(req, res, next) {
    try {
      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from('certificates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.status(200).json({
        success: true,
        message: 'Certificate deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};