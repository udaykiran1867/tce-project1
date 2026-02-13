import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY;

// Lazy initialization - only create client when needed
let supabaseClient = null;

const getSupabaseClient = () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  return supabaseClient;
};

export const uploadProductImage = async (file) => {
  try {
    const supabase = getSupabaseClient();
    
    if (!supabase) {
      throw new Error(
        "Image upload is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY in .env.local file. Until then, you can use image URLs instead."
      );
    }

    if (!file) {
      throw new Error("No file provided");
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      throw new Error("Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("File size must be less than 5MB");
    }

    // Create unique file path
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomString}-${file.name}`;
    const filePath = `product-images/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("products").getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      filePath,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload image",
    };
  }
};

export const deleteProductImage = async (filePath) => {
  try {
    if (!filePath) {
      return { success: true };
    }

    const supabase = getSupabaseClient();
    
    if (!supabase) {
      console.warn("Supabase not configured, skipping image deletion");
      return { success: true };
    }

    const { error } = await supabase.storage
      .from("products")
      .remove([filePath]);

    if (error) {
      console.error("Delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
};
