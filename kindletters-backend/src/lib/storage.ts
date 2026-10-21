import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload an image to Supabase Storage
 * @param file - The image file to upload
 * @param bucket - Storage bucket name (default: 'images')
 * @param userId - User ID for file organization
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
    file: File,
    bucket: string = 'images',
    userId: string
): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * @param path - File path in storage
 * @param bucket - Storage bucket name
 */
export async function deleteImage(path: string, bucket: string = 'images'): Promise<void> {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
        throw new Error(`Delete failed: ${error.message}`);
    }
}

/**
 * List user's uploaded images
 * @param userId - User ID
 * @param bucket - Storage bucket name
 */
export async function listUserImages(userId: string, bucket: string = 'images') {
    const { data, error } = await supabase.storage.from(bucket).list(userId);

    if (error) {
        throw new Error(`List failed: ${error.message}`);
    }

    return data;
}
