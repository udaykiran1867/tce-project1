import multer from 'multer';
import { supabase } from '../config/supabase.js';

const upload = multer();

// ===============================
// Upload Invoiceabc
// ===============================
export const uploadInvoice = [
  upload.single('file'),
  async (req, res) => {
    try {
      const { title, invoiceDate } = req.body;

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
          uploaded_at: invoiceDate ? new Date(`${invoiceDate}T00:00:00`).toISOString() : undefined,
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

export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, invoiceDate } = req.body || {};

    if (!id) {
      return res.status(400).json({ message: 'Invoice id is required' });
    }

    const updateData = {};
    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      updateData.title = String(title).trim();
    }

    if (invoiceDate !== undefined) {
      if (!invoiceDate) {
        return res.status(400).json({ message: 'Invoice date cannot be empty' });
      }
      const parsed = new Date(`${invoiceDate}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid invoice date' });
      }
      updateData.uploaded_at = parsed.toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Invoice updated successfully', invoice: data });
  } catch (err) {
    console.error('Update invoice error:', err);
    res.status(500).json({ error: err.message });
  }
};

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

    // Try to delete storage file (don't fail if it doesn't exist)
    const { error: removeError } = await supabase.storage
      .from('invoices')
      .remove([data.file_path]);

    if (removeError) {
      console.warn(`Storage file removal warning for ${data.file_path}:`, removeError.message);
    }

    // Always delete from database regardless of storage status
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
