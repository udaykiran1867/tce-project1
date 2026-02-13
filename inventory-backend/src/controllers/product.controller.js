//feb13
import { supabase } from '../config/supabase.js';

export const addProduct = async (req, res) => {
  try {
    const { name, description, masterCount, availability } = req.body;
    const masterValueRaw = Number(masterCount);
    const masterValue = Number.isFinite(masterValueRaw) && masterValueRaw > 0
      ? masterValueRaw
      : 0;
    const availabilityValue = Number(availability);
    const safeAvailability = Number.isFinite(availabilityValue)
      ? Math.min(Math.max(availabilityValue, 0), Math.max(masterValue, 0))
      : Math.max(masterValue, 0);

    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({ name, description })
      .select()
      .single();

    if (productError) {
      return res.status(400).json({ error: productError.message });
    }

    const { error: stockError } = await supabase.from('product_stock').insert({
      product_id: product.id,
      master_count: masterValue,
      available_count: safeAvailability
    });

    await supabase.from('inventory_logs').insert({
      product_id: product.id,
      action_type: 'company_purchase',
      quantity_changed: masterValue,
      created_at: new Date().toISOString(),
    });

    const responseData = {
      id: product.id,
      name: product.name,
      description: product.description,
      masterCount: masterValue,
      availability: safeAvailability,
      createdAt: new Date()
    };

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add product' });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { data } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        product_stock (master_count, available_count)
      `);

    const mappedProducts = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      masterCount: product.product_stock?.[0]?.master_count || 0,
      availability: product.product_stock?.[0]?.available_count || 0,
      createdAt: new Date()
    }));

    res.json(mappedProducts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const updateMaster = async (req, res) => {
  const { id } = req.params;
  const { masterCount } = req.body;
  const quantity = Number(masterCount || 0);

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  const { data: stock, error: stockFetchError } = await supabase
    .from('product_stock')
    .select('available_count, master_count')
    .eq('product_id', id)
    .single();

  if (stockFetchError || !stock) {
    return res.status(400).json({ error: stockFetchError?.message || 'Stock not found' });
  }

  const nextMaster = (stock.master_count || 0) + quantity;
  const nextAvailable = (stock.available_count || 0) + quantity;

  const { error: updateError } = await supabase
    .from('product_stock')
    .update({ master_count: nextMaster, available_count: nextAvailable })
    .eq('product_id', id);

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  await supabase.from('inventory_logs').insert({
    product_id: id,
    action_type: 'company_purchase',
    quantity_changed: quantity,
    created_at: new Date().toISOString(),
  });

  res.json({ message: 'Updated', masterCount: nextMaster, availability: nextAvailable });
};

export const markDefective = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const removeQty = Number(quantity || 0);

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    if (!Number.isFinite(removeQty) || removeQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    const { data: stock, error: stockFetchError } = await supabase
      .from('product_stock')
      .select('available_count, master_count')
      .eq('product_id', id)
      .single();

    if (stockFetchError || !stock) {
      return res.status(400).json({ error: stockFetchError?.message || 'Stock not found' });
    }

    if ((stock.available_count || 0) < removeQty) {
      return res.status(400).json({ error: 'Insufficient available stock' });
    }

    const nextAvailable = (stock.available_count || 0) - removeQty;
    const nextMaster = stock.master_count || 0;

    const { error: updateError } = await supabase
      .from('product_stock')
      .update({ available_count: nextAvailable })
      .eq('product_id', id);

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    await supabase.from('inventory_logs').insert({
      product_id: id,
      action_type: 'defective_removed',
      quantity_changed: -removeQty,
      created_at: new Date().toISOString(),
    });

    res.json({ message: 'Defective items removed', masterCount: nextMaster, availability: nextAvailable });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update defective items' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Delete related inventory logs first
    await supabase
      .from('inventory_logs')
      .delete()
      .eq('product_id', id);

    // Delete product stock
    await supabase
      .from('product_stock')
      .delete()
      .eq('product_id', id);

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Product deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

