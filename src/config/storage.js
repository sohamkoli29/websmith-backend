import { supabaseAdmin } from './supabase.js';
import { createClient } from '@supabase/supabase-js';

// Create storage client with service role for admin operations
const supabaseStorage = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Storage bucket names
export const STORAGE_BUCKETS = {
  IMAGES: 'images',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
  PROJECTS: 'projects',
  BLOGS: 'blogs'
};

// Ensure buckets exist
export async function ensureBuckets() {
  const buckets = Object.values(STORAGE_BUCKETS);
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabaseStorage
        .storage
        .getBucket(bucket);

      if (error && error.message.includes('not found')) {
        console.log(`Creating bucket: ${bucket}`);
        const { error: createError } = await supabaseStorage
          .storage
          .createBucket(bucket, {
            public: true,
            fileSizeLimit: 10 * 1024 * 1024, // 10MB
            allowedMimeTypes: bucket === STORAGE_BUCKETS.DOCUMENTS 
              ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
              : ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
          });

        if (createError && !createError.message.includes('already exists')) {
          console.error(`Error creating bucket ${bucket}:`, createError.message);
        }
      }
    } catch (error) {
      console.error(`Error checking bucket ${bucket}:`, error.message);
    }
  }
}

// Upload file to Supabase Storage
export async function uploadFile(bucket, filePath, fileBuffer, contentType) {
  try {
    const { data, error } = await supabaseStorage
      .storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseStorage
      .storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: publicUrl,
      bucket: bucket
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Delete file from Supabase Storage
export async function deleteFile(bucket, filePath) {
  try {
    const { data, error } = await supabaseStorage
      .storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    throw error;
  }
}

// Get file URL
export function getFileUrl(bucket, filePath) {
  const { data: { publicUrl } } = supabaseStorage
    .storage
    .from(bucket)
    .getPublicUrl(filePath);
  return publicUrl;
}

// List files in bucket
export async function listFiles(bucket, folder = '', limit = 100, offset = 0) {
  try {
    const { data, error } = await supabaseStorage
      .storage
      .from(bucket)
      .list(folder, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data.map(file => ({
      name: file.name,
      path: folder ? `${folder}/${file.name}` : file.name,
      url: getFileUrl(bucket, folder ? `${folder}/${file.name}` : file.name),
      size: file.metadata?.size || 0,
      contentType: file.metadata?.mimetype || '',
      updated_at: file.updated_at,
      created_at: file.created_at
    }));
  } catch (error) {
    console.error('List error:', error);
    throw error;
  }
}

// Create signed URL (for private files)
export async function createSignedUrl(bucket, filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabaseStorage
      .storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Signed URL failed: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    throw error;
  }
}

export default supabaseStorage;