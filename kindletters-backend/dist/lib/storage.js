"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.uploadImage = uploadImage;
exports.deleteImage = deleteImage;
exports.listUserImages = listUserImages;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
/**
 * Upload an image to Supabase Storage
 * @param file - The image file to upload
 * @param bucket - Storage bucket name (default: 'images')
 * @param userId - User ID for file organization
 * @returns Public URL of uploaded image
 */
async function uploadImage(file, bucket = 'images', userId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const { data, error } = await exports.supabase.storage
        .from(bucket)
        .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
    });
    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }
    // Get public URL
    const { data: urlData } = exports.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
    return urlData.publicUrl;
}
/**
 * Delete an image from Supabase Storage
 * @param path - File path in storage
 * @param bucket - Storage bucket name
 */
async function deleteImage(path, bucket = 'images') {
    const { error } = await exports.supabase.storage.from(bucket).remove([path]);
    if (error) {
        throw new Error(`Delete failed: ${error.message}`);
    }
}
/**
 * List user's uploaded images
 * @param userId - User ID
 * @param bucket - Storage bucket name
 */
async function listUserImages(userId, bucket = 'images') {
    const { data, error } = await exports.supabase.storage.from(bucket).list(userId);
    if (error) {
        throw new Error(`List failed: ${error.message}`);
    }
    return data;
}
