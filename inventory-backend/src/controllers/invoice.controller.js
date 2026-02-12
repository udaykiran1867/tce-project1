import multer from 'multer';
import { supabase } from '../config/supabase.js';

const upload = multer();

// ===============================
// Upload Invoice
// ===============================
export const uploadInvoice = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { title } = req.body;

      if (!title || !req.file) {
        return res.status(400).json({ message: 'Title and file are required' });
      }

      const file = req.file;

      // Create unique file path
      const filePath = `invoices/${Date.now()}-${file.originalname}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Insert metadata into invoices table
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          title,
          file_name: file.originalname,
          file_path: filePath,
          file_type: file.mimetype,
          file_size: file.size,
          // uploaded_by: req.user?.id, // enable later when auth middleware is added
        });

      if (insertError) {
        throw insertError;
      }

      res.status(201).json({
        message: 'Invoice uploaded successfully',
      });
    } catch (err) {
      console.error('Invoice upload error:', err);
      res.status(500).json({ error: err.message });
    }
  },
];

// ===============================
// Fetch Invoices (Newest First)
// ===============================
export const getInvoices = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    // Attach signed and public URLs dynamically
    const invoicesWithUrl = await Promise.all(
      data.map(async (invoice) => {
        const { data: publicData } = supabase.storage
          .from('invoices')
          .getPublicUrl(invoice.file_path);

        const { data: viewData } = await supabase.storage
          .from('invoices')
          .createSignedUrl(invoice.file_path, 60 * 60);

        const { data: downloadData } = await supabase.storage
          .from('invoices')
          .createSignedUrl(invoice.file_path, 60 * 60, { download: true });

        return {
          ...invoice,
          file_url: publicData.publicUrl,
          view_url: viewData?.signedUrl || null,
          download_url: downloadData?.signedUrl || null,
        };
      })
    );

    res.json(invoicesWithUrl);
  } catch (err) {
    console.error('Fetch invoices error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// Delete Invoice
// ===============================
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Invoice id is required' });
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('id, file_path')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const { error: removeError } = await supabase.storage
      .from('invoices')
      .remove([data.file_path]);

    if (removeError) {
      throw removeError;
    }

    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    console.error('Delete invoice error:', err);
    res.status(500).json({ error: err.message });
  }
};