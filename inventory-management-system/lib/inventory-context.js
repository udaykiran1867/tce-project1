"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { productAPI, transactionAPI, logsAPI } from "./api";

const InventoryContext = createContext();

export function InventoryProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await transactionAPI.getAll();
      const formattedRecords = Array.isArray(data) ? data.map(tx => ({
        id: tx.id,
        productId: tx.product_id,
        studentName: tx.student_name,
        usn: tx.usn,
        phoneNumber: tx.phone_number,
        section: tx.section,
        takenDate: tx.issue_date,
        returnDate: tx.return_date,
        type: tx.transaction_type === 'borrowed' ? 'borrow' : tx.transaction_type === 'purchased' ? 'purchase' : tx.transaction_type,
        quantity: tx.quantity || 1,
        createdAt: new Date(tx.created_at),
      })) : [];
      setBorrowRecords(formattedRecords);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productAPI.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyReport = useCallback(async () => {
    try {
      const data = await logsAPI.getMonthlySummary(6);
      setMonthlyReport(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch monthly summary:', err);
      setMonthlyReport([]);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchProducts();
    await fetchTransactions();
    await fetchMonthlyReport();
  }, [fetchProducts, fetchTransactions, fetchMonthlyReport]);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
    fetchMonthlyReport();
  }, [fetchProducts, fetchTransactions, fetchMonthlyReport]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addProduct = useCallback(async (name, masterCount, availability, price, imageUrl) => {
    try {
      const newProduct = await productAPI.add(
        name,
        "Product description",
        masterCount,
        availability,
        price,
        imageUrl
      );
      setProducts((prev) => [...prev, newProduct]);
      // Ensure monthly analytics (additions/scrap) reflect newly added items immediately
      await fetchMonthlyReport();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchMonthlyReport]);

  const updateProduct = useCallback((id, updates) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, ...updates } : product))
    );
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      // Call API to delete from backend
      await productAPI.delete(id);
      
      // Update local state
      setProducts((prev) => prev.filter((product) => product.id !== id));
      setBorrowRecords((prev) => prev.filter((record) => record.productId !== id));
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  }, []);

  const updateProductDetails = useCallback(async (id, price, imageUrl) => {
    try {
      const result = await productAPI.update(id, price, imageUrl);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? {
                ...product,
                price: result.price,
                imageUrl: result.imageUrl,
              }
            : product
        )
      );
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const addPurchasedItems = useCallback(async (id, quantity) => {
    try {
      const updated = await productAPI.updateMaster(id, quantity);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? {
                ...product,
                masterCount: updated.masterCount ?? product.masterCount + quantity,
                availability: updated.availability ?? product.availability + quantity,
              }
            : product
        )
      );
      await fetchProducts();
      await fetchMonthlyReport();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchMonthlyReport, fetchProducts]);

  const markDefective = useCallback(async (id, quantity) => {
    try {
      const updated = await productAPI.markDefective(id, quantity);
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? {
                ...product,
                masterCount: updated.masterCount ?? product.masterCount,
                availability: updated.availability ?? product.availability,
              }
            : product
        )
      );
      await fetchProducts();
      await fetchMonthlyReport();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchMonthlyReport, fetchProducts]);

  const addBorrowRecord = useCallback(async (record) => {
    try {
      const response = await transactionAPI.create(
        record.productId,
        record.studentName,
        record.usn,
        record.section,
        record.type,
        record.phoneNumber,
        record.quantity,
        record.takenDate,
        record.returnDate
      );

      await fetchTransactions();
      const updatedProducts = await productAPI.getAll();
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      await fetchMonthlyReport();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchMonthlyReport, fetchTransactions]);

  const updateBorrowRecord = useCallback(async (recordId, updates) => {
    try {
      await transactionAPI.update(recordId, updates);

      await fetchTransactions();
      const updatedProducts = await productAPI.getAll();
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      await fetchMonthlyReport();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchMonthlyReport, fetchTransactions]);

  const returnProduct = useCallback(async (recordId) => {
    try {
      const record = borrowRecords.find((r) => r.id === recordId);
      await transactionAPI.return(recordId);

      await fetchTransactions();
      const updatedProducts = await productAPI.getAll();
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      await fetchMonthlyReport();

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [borrowRecords, fetchMonthlyReport, fetchTransactions]);

  const deleteBorrowRecord = useCallback(async (recordId) => {
    try {
      await transactionAPI.delete(recordId);

      await fetchTransactions();
      const updatedProducts = await productAPI.getAll();
      setProducts(Array.isArray(updatedProducts) ? updatedProducts : []);
      await fetchMonthlyReport();

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [fetchMonthlyReport, fetchTransactions]);

  const getProductRecords = useCallback((productId) => {
    return borrowRecords.filter((record) => record.productId === productId);
  }, [borrowRecords]);

  const getMonthlyReport = useCallback(() => {
    return monthlyReport;
  }, [monthlyReport]);

  const downloadMonthlyReport = useCallback((month) => {
    logsAPI.downloadPDF(month);
  }, []);

  return (
    <InventoryContext.Provider
      value={{
        products,
        setProducts,
        borrowRecords,
        searchQuery,
        setSearchQuery,
        filteredProducts,
        addProduct,
        updateProduct,
        updateProductDetails,
        deleteProduct,
        addPurchasedItems,
        markDefective,
        addBorrowRecord,
        updateBorrowRecord,
        deleteBorrowRecord,
        returnProduct,
        getProductRecords,
        getMonthlyReport,
        downloadMonthlyReport,
        fetchTransactions,
        refreshData,
        loading,
        error,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
