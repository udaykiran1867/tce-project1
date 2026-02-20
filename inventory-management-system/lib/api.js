const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const apiCall = async (endpoint, options = {}) => {
  const {
    method = "GET",
    body = null,
    headers = {},
  } = options;

  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "API Error");
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error at ${endpoint}:`, error.message);
    if (error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend at ${API_BASE_URL}. Make sure the server is running on port 5000.`);
    }
    throw error;
  }
};

const apiCallForm = async (endpoint, formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || "API Error");
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error at ${endpoint}:`, error.message);
    if (error.message === "Failed to fetch") {
      throw new Error(
        `Cannot connect to backend at ${API_BASE_URL}. Make sure the server is running on port 5000.`
      );
    }
    throw error;
  }
};

export const authAPI = {
  signup: (name, email, password) =>
    apiCall("/auth/signup", {
      method: "POST",
      body: { name, email, password },
    }),
  login: (email, password) =>
    apiCall("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
};

export const productAPI = {
  getAll: () => apiCall("/products", { method: "GET" }),
  add: (name, description, masterCount, availability, price, imageUrl) =>
    apiCall("/products", {
      method: "POST",
      body: { name, description, masterCount, availability, price: price || null, imageUrl: imageUrl || null },
    }),
  update: (id, price, imageUrl, masterCount, availability) =>
    apiCall(`/products/${id}`, {
      method: "PUT",
      body: {
        price: price || null,
        imageUrl: imageUrl || null,
        ...(masterCount !== undefined ? { masterCount } : {}),
        ...(availability !== undefined ? { availability } : {}),
      },
    }),
  updateMaster: (id, masterCount) =>
    apiCall(`/products/${id}/master`, {
      method: "PUT",
      body: { masterCount },
    }),
  markDefective: (id, quantity, defectReason) =>
    apiCall(`/products/${id}/defective`, {
      method: "PUT",
      body: {
        quantity,
        ...(defectReason ? { defectReason } : {}),
      },
    }),
  delete: (id) =>
    apiCall(`/products/${id}`, {
      method: "DELETE",
    }),
};

export const transactionAPI = {
  getAll: () => apiCall("/transactions", { method: "GET" }),
  create: (productId, studentName, usn, section, transactionType, phoneNumber, quantity, takenDate, returnDate) => {
    const body = {
      productId,
      student_name: studentName,
      usn,
      section,
      issue_date: takenDate || new Date().toISOString().split("T")[0],
      transaction_type: transactionType === 'purchase' ? 'purchased' : 'borrowed',
    };
    if (phoneNumber) {
      body.phone_number = phoneNumber;
    }
    if (quantity) {
      body.quantity = quantity;
    }
    if (returnDate) {
      body.return_date = returnDate;
    }
    return apiCall("/transactions", {
      method: "POST",
      body,
    });
  },
  update: (id, updates) => {
    const body = {};
    if (Object.prototype.hasOwnProperty.call(updates, 'studentName')) {
      body.student_name = updates.studentName;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'usn')) {
      body.usn = updates.usn;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'section')) {
      body.section = updates.section;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'phoneNumber')) {
      body.phone_number = updates.phoneNumber;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'takenDate')) {
      body.issue_date = updates.takenDate;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'returnDate')) {
      body.return_date = updates.returnDate || null;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'quantity')) {
      body.quantity = updates.quantity;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
      body.transaction_type = updates.type === 'purchase' ? 'purchased' : 'borrowed';
    }
    return apiCall(`/transactions/${id}`, {
      method: "PUT",
      body,
    });
  },
  delete: (id) =>
    apiCall(`/transactions/${id}`, {
      method: "DELETE",
    }),
  return: (id) =>
    apiCall(`/transactions/${id}/return`, {
      method: "PUT",
    }),
};

export const logsAPI = {
  downloadPDF: (month, year) => {
    const params = new URLSearchParams();
    params.append('month', month);
    if (year) params.append('year', year);
    window.location.href = `${API_BASE_URL}/logs/download?${params.toString()}`;
  },
  getMonthlySummary: (months = 6) =>
    apiCall(`/logs/monthly?months=${months}`, { method: "GET" }),
  getMonthlyProductReport: (month, year) => {
    const params = new URLSearchParams();
    params.append('month', month);
    if (year) params.append('year', year);
    return apiCall(`/logs/monthly-products?${params.toString()}`, { method: "GET" });
  },
  getDefectiveRemarks: (limit = 500) =>
    apiCall(`/logs/defective-remarks?limit=${limit}`, { method: "GET" }),
};

export const invoicesAPI = {
  getAll: () => apiCall("/invoices", { method: "GET" }),
  upload: ({ title, file, invoiceDate }) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", file);
    if (invoiceDate) {
      formData.append("invoiceDate", invoiceDate);
    }
    return apiCallForm("/invoices", formData);
  },
  update: (id, updates) =>
    apiCall(`/invoices/${id}`, {
      method: "PUT",
      body: updates,
    }),
  delete: (id) => apiCall(`/invoices/${id}`, { method: "DELETE" }),
};
