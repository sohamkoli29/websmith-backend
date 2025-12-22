import { supabase } from '../config/supabase.js';
import { 
  uploadFile, 
  deleteFile, 
  STORAGE_BUCKETS,
  ensureBuckets,
  listFiles 
} from '../config/storage.js';
import { 
  generateFilename, 
  getFileCategory,
  UPLOAD_CONFIGS 
} from '../config/upload.js';
import { 
  processImage, 
  generateImageSizes,
  getDominantColor,
  validateImage,
  IMAGE_CONFIGS 
} from '../utils/imageProcessor.js';
import path from 'path';

export class UploadError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'UploadError';
    this.status = status;
  }
}

// Initialize buckets on first use
let bucketsInitialized = false;

export const uploadController = {
  
  // Single file upload
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        throw new UploadError('No file uploaded', 400);
      }

      // Ensure buckets exist
      if (!bucketsInitialized) {
        await ensureBuckets();
        bucketsInitialized = true;
      }

      const file = req.file;
      const { type = 'general', folder = '' } = req.body;
      const userId = req.user?.sub;

      // Determine bucket based on file type
      let bucket;
      let filePath;

      switch (type.toLowerCase()) {
        case 'profile':
          bucket = STORAGE_BUCKETS.AVATARS;
          filePath = `profiles/${generateFilename(file.originalname, 'profile_')}`;
          break;
        case 'project':
          bucket = STORAGE_BUCKETS.PROJECTS;
          filePath = folder ? `${folder}/${generateFilename(file.originalname, 'project_')}` 
                           : generateFilename(file.originalname, 'project_');
          break;
        case 'blog':
          bucket = STORAGE_BUCKETS.BLOGS;
          filePath = folder ? `${folder}/${generateFilename(file.originalname, 'blog_')}` 
                           : generateFilename(file.originalname, 'blog_');
          break;
        case 'avatar':
          bucket = STORAGE_BUCKETS.AVATARS;
          filePath = `avatars/${generateFilename(file.originalname, 'avatar_')}`;
          break;
        case 'document':
          bucket = STORAGE_BUCKETS.DOCUMENTS;
          filePath = folder ? `${folder}/${generateFilename(file.originalname, 'doc_')}` 
                           : generateFilename(file.originalname, 'doc_');
          break;
        default:
          bucket = STORAGE_BUCKETS.IMAGES;
          filePath = folder ? `${folder}/${generateFilename(file.originalname, 'img_')}` 
                           : generateFilename(file.originalname, 'img_');
      }

      let uploadResult;
      let processedBuffer = file.buffer;
      let imageInfo = null;
      let dominantColor = null;

      // Process images
      if (getFileCategory(file.mimetype) === 'image') {
        try {
          // Validate image
          imageInfo = await validateImage(file.buffer);
          
          // Get dominant color
          dominantColor = await getDominantColor(file.buffer);

          // Process and optimize image
          const result = await processImage(file.buffer, IMAGE_CONFIGS.LARGE);
          processedBuffer = result.buffer;

          // Also generate thumbnail
          const thumbnailResult = await processImage(file.buffer, IMAGE_CONFIGS.THUMBNAIL);
          const thumbnailPath = `thumbnails/${filePath}`;
          
          // Upload thumbnail
          await uploadFile(
            bucket,
            thumbnailPath,
            thumbnailResult.buffer,
            `image/${thumbnailResult.format}`
          );

        } catch (imageError) {
          console.error('Image processing error:', imageError);
          throw new UploadError(`Image processing failed: ${imageError.message}`, 400);
        }
      }

      // Upload main file
      uploadResult = await uploadFile(
        bucket,
        filePath,
        processedBuffer,
        file.mimetype
      );

      // Prepare media data for database
      const mediaData = {
        filename: path.basename(filePath),
        original_name: file.originalname,
        mime_type: file.mimetype,
        size: processedBuffer.length,
        url: uploadResult.url,
        bucket: uploadResult.bucket,
        path: uploadResult.path,
        category: getFileCategory(file.mimetype),
        uploader_id: userId
      };

      // Add metadata as JSON
      const metadata = {
        type,
        folder,
        ...(imageInfo && {
          width: imageInfo.width,
          height: imageInfo.height,
          format: imageInfo.format,
          has_alpha: imageInfo.hasAlpha,
          is_animated: imageInfo.isAnimated,
          dominant_color: dominantColor,
          optimized_size: processedBuffer.length,
          original_size: file.size
        })
      };

      // Insert into database
      const { data: savedMedia, error: dbError } = await supabase
        .from('media')
        .insert([{ ...mediaData, metadata }])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to delete uploaded file if DB save fails
        try {
          await deleteFile(bucket, filePath);
        } catch (deleteError) {
          console.error('Failed to clean up file after DB error:', deleteError);
        }
        throw new UploadError(`Failed to save media record: ${dbError.message}`, 500);
      }

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          media: savedMedia,
          upload: {
            url: uploadResult.url,
            path: uploadResult.path,
            bucket: uploadResult.bucket
          },
          ...(imageInfo && {
            image: {
              width: imageInfo.width,
              height: imageInfo.height,
              format: imageInfo.format,
              dominant_color: dominantColor,
              size_reduction: Math.round(((file.size - processedBuffer.length) / file.size) * 100)
            }
          })
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Multiple file upload
  async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        throw new UploadError('No files uploaded', 400);
      }

      // Ensure buckets exist
      if (!bucketsInitialized) {
        await ensureBuckets();
        bucketsInitialized = true;
      }

      const files = req.files;
      const { type = 'general', folder = '' } = req.body;
      const userId = req.user?.sub;

      const uploadResults = [];
      const errors = [];

      // Process each file
      for (const file of files) {
        try {
          let bucket = STORAGE_BUCKETS.IMAGES;
          let filePath;

          // Determine bucket
          if (type === 'document' || getFileCategory(file.mimetype) === 'document') {
            bucket = STORAGE_BUCKETS.DOCUMENTS;
            filePath = folder ? `${folder}/${generateFilename(file.originalname, 'doc_')}` 
                             : generateFilename(file.originalname, 'doc_');
          } else {
            filePath = folder ? `${folder}/${generateFilename(file.originalname, 'img_')}` 
                             : generateFilename(file.originalname, 'img_');
          }

          let processedBuffer = file.buffer;

          // Process images
          if (getFileCategory(file.mimetype) === 'image') {
            try {
              const result = await processImage(file.buffer, IMAGE_CONFIGS.MEDIUM);
              processedBuffer = result.buffer;
            } catch (imageError) {
              console.error('Image processing error:', imageError);
              // Continue with original if processing fails
            }
          }

          // Upload file
          const uploadResult = await uploadFile(
            bucket,
            filePath,
            processedBuffer,
            file.mimetype
          );

          // Prepare media data
          const mediaData = {
            filename: path.basename(filePath),
            original_name: file.originalname,
            mime_type: file.mimetype,
            size: processedBuffer.length,
            url: uploadResult.url,
            bucket: uploadResult.bucket,
            path: uploadResult.path,
            category: getFileCategory(file.mimetype),
            uploader_id: userId,
            metadata: { type, folder }
          };

          // Save to database
          const { data: savedMedia, error: dbError } = await supabase
            .from('media')
            .insert([mediaData])
            .select()
            .single();

          if (dbError) {
            // Clean up uploaded file
            try {
              await deleteFile(bucket, filePath);
            } catch (deleteError) {
              console.error('Failed to clean up file:', deleteError);
            }
            throw dbError;
          }

          uploadResults.push({
            originalName: file.originalname,
            media: savedMedia,
            upload: uploadResult
          });

        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Uploaded ${uploadResults.length} files successfully`,
        data: {
          uploaded: uploadResults,
          errors: errors.length > 0 ? errors : undefined,
          stats: {
            total: files.length,
            successful: uploadResults.length,
            failed: errors.length
          }
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // List media files
  async listMedia(req, res, next) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        type,
        sort = 'created_at',
        order = 'desc' 
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      let query = supabase
        .from('media')
        .select('*', { count: 'exact' });

      if (category) {
        query = query.eq('category', category);
      }

      if (type) {
        query = query.eq('metadata->>type', type);
      }

      // Sorting
      query = query.order(sort, { ascending: order === 'asc' });

      // Pagination
      query = query.range(offset, offset + limitNum - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Database error:', error);
        throw new UploadError(`Failed to fetch media: ${error.message}`, 500);
      }

      res.status(200).json({
        success: true,
        data: {
          media: data || [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: count || 0,
            pages: Math.ceil((count || 0) / limitNum)
          }
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Get single media
  async getMedia(req, res, next) {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new UploadError('Media not found', 404);
        }
        throw new UploadError(`Failed to fetch media: ${error.message}`, 500);
      }

      res.status(200).json({
        success: true,
        data
      });

    } catch (error) {
      next(error);
    }
  },

  // Delete media
  async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;

      // Get media record first
      const { data: media, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new UploadError('Media not found', 404);
        }
        throw new UploadError(`Failed to fetch media: ${fetchError.message}`, 500);
      }

      // Delete from storage
      try {
        await deleteFile(media.bucket, media.path);
        
        // Also delete thumbnail if it exists
        if (media.category === 'image') {
          const thumbnailPath = `thumbnails/${media.path}`;
          try {
            await deleteFile(media.bucket, thumbnailPath);
          } catch (thumbError) {
            // Ignore thumbnail deletion errors
            console.warn('Could not delete thumbnail:', thumbError.message);
          }
        }
      } catch (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with DB deletion even if storage fails
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new UploadError(`Failed to delete media record: ${deleteError.message}`, 500);
      }

      res.status(200).json({
        success: true,
        message: 'Media deleted successfully',
        data: {
          deleted: media
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Delete multiple media
  async deleteMultipleMedia(req, res, next) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        throw new UploadError('Array of media IDs is required', 400);
      }

      // Get media records
      const { data: mediaList, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .in('id', ids);

      if (fetchError) {
        throw new UploadError(`Failed to fetch media: ${fetchError.message}`, 500);
      }

      const deletedFromStorage = [];
      const storageErrors = [];

      // Delete from storage
      for (const media of mediaList || []) {
        try {
          await deleteFile(media.bucket, media.path);
          deletedFromStorage.push(media.id);
        } catch (storageError) {
          storageErrors.push({
            id: media.id,
            error: storageError.message
          });
        }
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('media')
        .delete()
        .in('id', ids);

      if (deleteError) {
        throw new UploadError(`Failed to delete media records: ${deleteError.message}`, 500);
      }

      res.status(200).json({
        success: true,
        message: `Deleted ${mediaList?.length || 0} media items`,
        data: {
          deleted: mediaList || [],
          storage: {
            successful: deletedFromStorage.length,
            errors: storageErrors.length > 0 ? storageErrors : undefined
          }
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Update media metadata
  async updateMedia(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if media exists
      const { data: existingMedia, error: checkError } = await supabase
        .from('media')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          throw new UploadError('Media not found', 404);
        }
        throw new UploadError(`Failed to fetch media: ${checkError.message}`, 500);
      }

      // Prepare update data
      const updateData = { ...updates };
      
      // Handle metadata updates separately
      if (updates.metadata) {
        // Merge metadata instead of replacing
        const { data: currentMedia } = await supabase
          .from('media')
          .select('metadata')
          .eq('id', id)
          .single();

        const currentMetadata = currentMedia?.metadata || {};
        updateData.metadata = { ...currentMetadata, ...updates.metadata };
      }

      const { data, error } = await supabase
        .from('media')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new UploadError(`Failed to update media: ${error.message}`, 500);
      }

      res.status(200).json({
        success: true,
        message: 'Media updated successfully',
        data
      });

    } catch (error) {
      next(error);
    }
  },

  // Get storage statistics
  async getStorageStats(req, res, next) {
    try {
      // Get all media
      const { data: allMedia, error: mediaError } = await supabase
        .from('media')
        .select('id, category, size, filename, created_at')
        .order('created_at', { ascending: false });

      if (mediaError) {
        throw new UploadError(`Failed to fetch media stats: ${mediaError.message}`, 500);
      }

      const mediaList = allMedia || [];

      // Calculate statistics
      const stats = {
        total: mediaList.length,
        totalSize: 0,
        byCategory: {},
        recent: []
      };

      mediaList.forEach(media => {
        stats.totalSize += media.size || 0;

        const category = media.category || 'other';
        if (!stats.byCategory[category]) {
          stats.byCategory[category] = {
            count: 0,
            size: 0
          };
        }

        stats.byCategory[category].count++;
        stats.byCategory[category].size += media.size || 0;

        // Add to recent (first 10)
        if (stats.recent.length < 10) {
          stats.recent.push({
            id: media.id,
            filename: media.filename,
            category: media.category,
            size: media.size,
            created_at: media.created_at
          });
        }
      });

      // Convert sizes to human readable format
      const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          totalSizeFormatted: formatBytes(stats.totalSize),
          byCategory: Object.entries(stats.byCategory).reduce((acc, [category, data]) => ({
            ...acc,
            [category]: {
              ...data,
              sizeFormatted: formatBytes(data.size),
              percentage: stats.totalSize > 0 ? Math.round((data.size / stats.totalSize) * 100) : 0
            }
          }), {})
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Upload profile image
  async uploadProfileImage(req, res, next) {
    try {
      if (!req.file) {
        throw new UploadError('No image uploaded', 400);
      }

      const file = req.file;
      const userId = req.user.sub;

      // Validate it's an image
      if (!file.mimetype.startsWith('image/')) {
        throw new UploadError('Only image files are allowed', 400);
      }

      // Process image
      const processed = await processImage(file.buffer, IMAGE_CONFIGS.AVATAR);
      const dominantColor = await getDominantColor(file.buffer);

      // Upload to avatars bucket
      const filename = `profile_${userId}_${Date.now()}.webp`;
      const filePath = `profiles/${filename}`;

      const uploadResult = await uploadFile(
        STORAGE_BUCKETS.AVATARS,
        filePath,
        processed.buffer,
        'image/webp'
      );

      // Prepare media data
      const mediaData = {
        filename: filename,
        original_name: file.originalname,
        mime_type: 'image/webp',
        size: processed.size,
        url: uploadResult.url,
        bucket: STORAGE_BUCKETS.AVATARS,
        path: filePath,
        category: 'image',
        uploader_id: userId,
        metadata: {
          type: 'profile',
          width: processed.width,
          height: processed.height,
          format: processed.format,
          dominant_color: dominantColor,
          original_size: file.size,
          optimized_size: processed.size
        }
      };

      const { data: savedMedia, error: dbError } = await supabase
        .from('media')
        .insert([mediaData])
        .select()
        .single();

      if (dbError) {
        // Clean up uploaded file
        try {
          await deleteFile(STORAGE_BUCKETS.AVATARS, filePath);
        } catch (deleteError) {
          console.error('Failed to clean up file:', deleteError);
        }
        throw new UploadError(`Failed to save media: ${dbError.message}`, 500);
      }

      res.status(201).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          media: savedMedia,
          url: uploadResult.url
        }
      });

    } catch (error) {
      next(error);
    }
  },

  // Get signed URL for private access
  async getSignedUrl(req, res, next) {
    try {
      const { id } = req.params;
      const { expiresIn = 3600 } = req.query; // Default 1 hour

      // Get media record
      const { data: media, error: fetchError } = await supabase
        .from('media')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new UploadError('Media not found', 404);
        }
        throw new UploadError(`Failed to fetch media: ${fetchError.message}`, 500);
      }

      // In this implementation, all files are public
      // For private files, you would create a signed URL here
      res.status(200).json({
        success: true,
        data: {
          url: media.url,
          expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
        }
      });

    } catch (error) {
      next(error);
    }
  }
};