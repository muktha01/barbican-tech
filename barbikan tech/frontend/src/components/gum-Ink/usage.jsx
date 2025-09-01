import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, FileText, Pencil, Trash, X } from "lucide-react";
import { PiFilmReelThin } from "react-icons/pi";
import axios from "axios";
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification"; // Import Notification component

const GumUsage = () => {
  const [products, setProducts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingUsage, setEditingUsage] = useState(null);
  const [deletingUsage, setDeletingUsage] = useState(null); 
  const [error, setError] = useState(null); // Used for form-specific errors and general API errors
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(false); // General loading state for API calls
  const [notification, setNotification] = useState(null); // Notification state

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Function to close notifications
  const closeNotification = () => {
    setNotification(null);
  };

  const [formData, setFormData] = useState({
    factory: "",
    productName: "", // This will hold the stock_id
    qty: "",
  });

  // --- Define fetchUsages outside useEffect ---
  const fetchUsages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/usages");
      if (res.status === 200) {
        setUsages(res.data.usages || []);
        setError(null); // Clear any previous errors
        // showNotification("Usage entries loaded successfully.", "info"); // Optional: notify on load
      } else {
        setError("No usage entries found.");
        showNotification("No usage entries found.", "info");
      }
    } catch (err) {
      console.error("Error fetching usages:", err);
      setError("Error fetching usage entries");
      showNotification("Error fetching usage entries.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Call fetchUsages in useEffect for initial load ---
  useEffect(() => {
    fetchUsages();
  }, [fetchUsages]);

  // Fetch factories
  useEffect(() => {
    const fetchFactories = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:8000/api/factories");
        if (res.status === 200) {
          setFactories(res.data.factories || []);
        } else {
          setError("No factories found");
          showNotification("No factories found.", "info");
        }
      } catch (err) {
        console.error("Error fetching factories:", err);
        setError("Error fetching factories");
        showNotification("Error fetching factories.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchFactories();
  }, []);

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products (flat list with factory stock info)
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/products");
      const data = await res.json();

      if (res.status === 200) {
        const flatProducts = [];
        if (data.data && data.data.products) {
          data.data.products.forEach((product) => {
            if (product.factory_stocks && product.factory_stocks.length > 0) {
              product.factory_stocks.forEach((stock) => {
                flatProducts.push({
                  id: stock.stock_id, // This is the stock ID, crucial for selection
                  product_id: product.id, // The actual product ID
                  product_name: product.product_name,
                  type: product.type,
                  unit: product.unit,
                  factory_id: stock.factory.id,
                  factory_name: stock.factory.name,
                  opening_stock: stock.opening_stock,
                  current_stock: stock.current_stock,
                  created_at: stock.created_at,
                  updated_at: stock.updated_at,
                });
              });
            }
          });
        }
        setProducts(flatProducts);
        setError(null);
      } else {
        setError("Failed to fetch products");
        showNotification("Failed to fetch products.", "error");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Error fetching products");
      showNotification("Error fetching products.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on selected factory
  useEffect(() => {
    if (formData.factory) {
      const filtered = products.filter(
        (product) => product.factory_id === formData.factory
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
    // Only reset product selection if not in edit mode, or if factory changes while editing
    if (!editMode || (editMode && formData.factory !== editingUsage?.factory_id)) {
      setFormData((prev) => ({ ...prev, productName: "" }));
    }
  }, [formData.factory, products, editMode, editingUsage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "factory") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        productName: "", // Reset product when factory changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(null); // Clear error on change
  };

  const resetForm = () => {
    setFormData({
      factory: "",
      productName: "",
      qty: "",
    });
    setEditMode(false);
    setEditingUsage(null);
    setError(null); // Clear form error
  };

  const handleSubmit = async () => {
    if (!formData.factory || !formData.productName || !formData.qty) {
      setError("Please fill in all fields.");
      showNotification("Please fill in all required fields.", "error");
      return;
    }

    if (Number(formData.qty) <= 0) {
      setError("Quantity must be greater than 0.");
      showNotification("Quantity must be greater than 0.", "error");
      return;
    }

    const selectedProductStock = filteredProducts.find(
      (p) => p.id === formData.productName // p.id here refers to stock_id
    );

    if (!selectedProductStock) {
      setError("Selected product not found or no stock available in this factory.");
      showNotification("Selected product not found or no stock available.", "error");
      return;
    }

    let availableStockForValidation = selectedProductStock.current_stock;

    if (editMode && editingUsage) {
      // If editing, find the original usage to add its quantity back to the current stock
      // for correct validation (allowing to increase quantity up to current_stock + original_quantity)
      const originalUsage = usages.find(u => u.id === editingUsage.id);
      if (originalUsage && originalUsage.product_id === selectedProductStock.product_id && originalUsage.factory_id === selectedProductStock.factory_id) {
          availableStockForValidation = selectedProductStock.current_stock + originalUsage.quantity;
      }
    }

    if (Number(formData.qty) > availableStockForValidation) {
        setError(`Insufficient stock. Available: ${selectedProductStock.current_stock} ${selectedProductStock.unit}. You can use up to ${availableStockForValidation} ${selectedProductStock.unit} including current usage amount for editing.`);
        showNotification(`Insufficient stock. Available: ${selectedProductStock.current_stock} ${selectedProductStock.unit}.`, "warning");
        return;
    }

    setLoading(true);
    try {
      const payload = {
        factory_id: formData.factory,
        product_id: selectedProductStock.product_id, // This is the product's actual ID
        quantity: Number(formData.qty),
        type: selectedProductStock.type.toLowerCase(),
      };

      let res;
      if (editMode && editingUsage) {
        res = await axios.patch(
          `http://localhost:8000/api/usages/${editingUsage.id}`,
          payload
        );
        if (res.status === 200) {
          showNotification("Usage entry updated successfully!", "success");
        }
      } else {
        res = await axios.post("http://localhost:8000/api/usages", payload);
        if (res.status === 201) {
          showNotification("Usage entry added successfully!", "success");
        }
      }

      if (res.status === 200 || res.status === 201) {
        await fetchUsages();
        await fetchProducts(); // Refresh products to get updated stock
        setShowModal(false);
        resetForm();
        setError(null);
      }
    } catch (err) {
      console.error("Error with usage operation:", err);
      setError(err.response?.data?.message || "Failed to process usage.");
      showNotification(err.response?.data?.message || "Failed to process usage.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usage) => {
    const productInStock = products.find(
      (p) =>
        p.product_id === usage.product_id && p.factory_id === usage.factory_id
    );

    if (productInStock) {
      setFormData({
        factory: usage.factory_id,
        productName: productInStock.id, // Set the stock_id here for productName
        qty: usage.quantity.toString(),
      });
      setEditingUsage(usage);
      setEditMode(true);
      setShowModal(true);
      setError(null);
    } else {
      setError("Product stock information not found for editing. Please ensure the product still exists in that factory.");
      showNotification("Product stock information not found for editing.", "error");
    }
  };

  const handleDeleteClick = (usage) => {
    setDeletingUsage(usage);
    setShowDeleteModal(true);
  };

const handleDeleteConfirm = async () => {
    if (!deletingUsage) return;

    setLoading(true);
    try {
      const res = await axios.delete(
        `http://localhost:8000/api/usages/${deletingUsage.id}`
      );
      if (res.status === 200) {
        await fetchUsages();
        await fetchProducts(); // Refresh products to update stock after deletion
        setShowDeleteModal(false);
        setDeletingUsage(null);
        // Corrected: Use "delete-success" type for a successful deletion notification
        showNotification("Usage entry deleted successfully!", "delete-success");
        setError(null);
      } else {
        const errorData = res.data; // Ensure you get error data from response
        setError(errorData.message || "Failed to delete usage.");
        showNotification(errorData.message || "Failed to delete usage.", "error");
      }
    } catch (err) {
      console.error("Error deleting usage:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete usage. Network error?";
      setError(errorMessage);
      // Corrected: This should typically be an "error" type if the deletion failed
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUsage(null);
    setError(null);
  };


  const columns = [
    { key: "used_by", label: "Used By" },
    { key: "product_name", label: "Product" },
    { key: "type", label: "Type" },
    { key: "used_quantity", label: "Used Quantity" },
    { key: "date", label: "Date" },
  ];

  const tableData = usages.map((usage) => ({
    id: usage.id,
    used_by: usage.Factory?.factory_name || "N/A",
    product_name: usage.Product?.product_name || "N/A",
    used_quantity: `${usage.quantity} ${usage.Product?.unit || "N/A"}`,
    type: usage.type || "N/A",
    date: usage.updatedAt
      ? new Date(usage.updatedAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "N/A",
  }));

  const getSelectedProductInfo = () => {
    if (formData.productName) {
      const product = filteredProducts.find(
        (p) => p.id === formData.productName
      );
      return product;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl flex p-6 flex-col backdrop-blur-md w-full h-full border-md">
      {/* Notification Component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-200 gap-4">
        <div className="flex items-center text-sm text-gray-500 font-medium space-x-1">
                  <span className="flex items-center space-x-1">
                    <PiFilmReelThin className="w-5 h-5" />
                    <span>Gum & Ink</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                  <FileText className="w-4 h-4 text-black" />
                  <span className="text-black font-semibold ml-1">Usage</span>
                </div>
        <button
          onClick={() => {
            setShowModal(true);
            resetForm(); // Reset form when adding new
          }}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Usage
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border mt-3 border-gray-200">
        <div className="h-full">
          <ReusableTable
            columns={columns}
            data={tableData}
            emptyMessage="No usage records available yet."
            itemsPerPage={10}
            loading={loading}
            showActions={true}
            onEdit={(row) => {
              const usageToEdit = usages.find(u => u.id === row.id);
              if (usageToEdit) {
                handleEdit(usageToEdit);
              } else {
                showNotification("Could not find usage to edit.", "error"); // Notify if not found
              }
            }}
            onDelete={(row) => handleDeleteClick(usages.find(u => u.id === row.id))} // Pass the full usage object
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-opacity-40 flex justify-center items-center p-4 z-50"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">
              {editMode ? "Edit Usage Entry" : "Add Usage Entry"}
            </h3>

            {/* Error display inside modal */}
            {error && (
              <div className="mb-4 text-red-600 text-sm p-3 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Factory
                </label>
                <select
                  name="factory"
                  value={formData.factory}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  disabled={editMode || loading} // Disable factory selection in edit mode and while loading
                >
                  <option value="">Select Factory</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.factory_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Product
                </label>
                <select
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  disabled={!formData.factory || editMode || loading} // Disable product selection in edit mode and while loading
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.factory
                      ? "Select Product"
                      : "First select a factory"}
                  </option>
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.product_name} ({p.type}) - {p.current_stock}{" "}
                      {p.unit} available
                    </option>
                  ))}
                </select>
                {!formData.factory && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please select a factory first
                  </p>
                )}
                {formData.factory && filteredProducts.length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    No products with available stock in this factory for the selected type.
                  </p>
                )}
              </div>

              {/* Show selected product stock info */}
              {getSelectedProductInfo() && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Current Available Stock:</strong>{" "}
                    {getSelectedProductInfo().current_stock}{" "}
                    {getSelectedProductInfo().unit}
                  </p>
                  {editMode && editingUsage && (
                     <p className="text-sm text-blue-800">
                     <strong>Original Usage Quantity:</strong>{" "}
                     {editingUsage.quantity}{" "}
                     {getSelectedProductInfo().unit}
                   </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Usage Quantity{" "}
                  {getSelectedProductInfo()
                    ? `(${getSelectedProductInfo().unit})`
                    : ""}
                </label>
                <input
                  type="number"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                  min="1"
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter quantity to use"
                  disabled={loading}
                />
                 {getSelectedProductInfo() && (
                <p className="text-xs text-gray-500 mt-1">
  Maximum: {(Number(getSelectedProductInfo()?.current_stock || 0) + Number(editingUsage?.quantity || 0))} {getSelectedProductInfo()?.unit || ''}
</p>

                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                disabled={loading}
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : editMode ? "Update" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Usage Entry</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the usage entry for{" "}
              <strong>{deletingUsage?.Product?.product_name || 'this product'}</strong> from{" "}
              <strong>{deletingUsage?.Factory?.factory_name || 'this factory'}</strong>?
              This action cannot be undone.
            </p>

            {error && (
              <div className="text-red-600 text-sm mb-4">{error}</div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
                onClick={closeDeleteModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GumUsage;