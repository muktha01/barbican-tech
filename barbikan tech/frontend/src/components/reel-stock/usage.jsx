import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, FileText, Pencil, Trash, X } from "lucide-react";
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification"; // Import Notification component
import { PiFilmReelThin } from "react-icons/pi";

const ReelStockUsage = () => {
  const [usages, setUsages] = useState([]);
  const [reelProducts, setReelProducts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal
  const [editMode, setEditMode] = useState(false);
  const [editingUsage, setEditingUsage] = useState(null);
  const [deletingUsage, setDeletingUsage] = useState(null); // New state for item to delete
  const [error, setError] = useState(null); // Used for form-specific errors and general API errors
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
    factory_id: "",
    product_id: "",
    quantity: "",
  });

  // Fetch factories
  useEffect(() => {
    const fetchFactories = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:8000/api/factories");
        const data = await res.json();
        if (res.status === 200) {
          setFactories(data.factories || []);
        } else {
          setError("No factories found.");
          showNotification("No factories found.", "info"); // Info notification for no data
        }
      } catch (err) {
        console.error("Error fetching factories:", err);
        setError("Error fetching factories.");
        showNotification("Error fetching factories.", "error"); // Error notification for fetch failure
      } finally {
        setLoading(false);
      }
    };
    fetchFactories();
  }, []);

  // Fetch reel products
  const fetchReelProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/reelProducts");
      const data = await res.json();
      if (res.status === 200) {
        setReelProducts(data.data.products || []);
      } else {
        setError("No reel products found.");
        showNotification("No reel products found.", "info"); // Info notification for no data
      }
    } catch (err) {
      console.error("Error fetching reel products:", err);
      setError("Error fetching reel products.");
      showNotification("Error fetching reel products.", "error"); // Error notification for fetch failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReelProducts();
  }, [fetchReelProducts]);

  // Fetch usage entries
  const fetchUsages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/reelUsage");
      const data = await res.json();
      if (res.status === 200) {
        setUsages(data.reelUsages || []);
        setError(null); // Clear any previous errors
      } else {
        setError("No usage entries found.");
        showNotification("No usage entries found.", "info"); // Info notification for no data
      }
    } catch (err) {
      console.error("Error fetching usages:", err);
      setError("Error fetching usage entries.");
      showNotification("Error fetching usage entries.", "error"); // Error notification for fetch failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsages();
  }, [fetchUsages]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "factory_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        product_id: "" // Reset product when factory changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setError(null); // Clear any form-specific error on input change
  };

  const resetForm = () => {
    setFormData({
      factory_id: "",
      product_id: "",
      quantity: "",
    });
    setEditMode(false);
    setEditingUsage(null);
    setError(null); // Clear form-specific error
  };

  const handleSubmit = async () => {
    if (!formData.factory_id || !formData.product_id || !formData.quantity) {
      setError("Please fill in all fields.");
      showNotification("Please fill in all required fields.", "error"); // Error notification for validation
      return;
    }

    if (Number(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      showNotification("Quantity must be greater than 0.", "error"); // Error notification for validation
      return;
    }

    let availableStock = getAvailableStock(formData.factory_id, formData.product_id);

    if (editMode && editingUsage && editingUsage.factory_id === formData.factory_id && editingUsage.product_id === formData.product_id) {
        availableStock += editingUsage.quantity;
    }

    if (Number(formData.quantity) > availableStock) {
      setError(`Usage quantity (${formData.quantity}) exceeds available stock (${availableStock}).`);
      showNotification(`Usage quantity (${formData.quantity}) exceeds available stock (${availableStock}).`, "warning"); // Warning notification for insufficient stock
      return;
    }

    setLoading(true);
    try {
      const payload = {
        factory_id: formData.factory_id,
        product_id: formData.product_id,
        quantity: Number(formData.quantity)
      };

      let res;
      let successMessage;
      if (editMode && editingUsage) {
        res = await fetch(`http://localhost:8000/api/reelUsage/${editingUsage.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        successMessage = "Usage entry updated successfully!";
      } else {
        res = await fetch("http://localhost:8000/api/reelUsage", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        successMessage = "Usage entry added successfully!";
      }

      if (res.status === 200 || res.status === 201) {
        await fetchUsages();
        await fetchReelProducts(); // Re-fetch products to update stock display
        setShowModal(false);
        resetForm();
        setError(null); // Clear form error on success
        showNotification(successMessage, "success"); // Success notification
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to process usage.");
        showNotification(errorData.message || "Failed to process usage.", "error"); // Error notification from API
      }
    } catch (err) {
      console.error("Error with usage operation:", err);
      setError("Failed to process usage. Please try again.");
      showNotification("Failed to process usage. Please try again.", "error"); // General error notification
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (usage) => {
    setFormData({
      factory_id: usage.factory_id,
      product_id: usage.product_id,
      quantity: usage.quantity.toString(),
    });
    setEditingUsage(usage);
    setEditMode(true);
    setShowModal(true);
    setError(null); // Clear any previous error when opening edit modal
  };

  const handleDeleteClick = (usage) => {
    setDeletingUsage(usage);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUsage) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/reelUsage/${deletingUsage.id}`, {
        method: 'DELETE'
      });

      if (res.status === 200) {
        await fetchUsages();
        await fetchReelProducts(); // Re-fetch products to update stock after deletion
        setShowDeleteModal(false);
        setDeletingUsage(null);
        setError(null); // Clear error on successful deletion
        showNotification("Usage entry deleted successfully!", "delete-success"); // Success notification for delete
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to delete usage.");
        showNotification(errorData.message || "Failed to delete usage.", "error"); // Error notification for delete failure
      }
    } catch (err) {
      console.error("Error deleting usage:", err);
      setError("Failed to delete usage. Network error?");
      showNotification("Failed to delete usage. Please try again.", "error"); // General error notification for delete
    } finally {
      setLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUsage(null);
    setError(null); // Clear error when closing delete modal
  };

  const getFactoryName = (factoryId) => {
    const factory = factories.find(f => f.id === factoryId);
    return factory ? factory.factory_name : "Unknown Factory";
  };

  const getProductName = (productId) => {
    const product = reelProducts.find(p => p.id === productId);
    return product ? product.product_name : "Unknown Product";
  };

  const getProductUnit = (productId) => {
    const product = reelProducts.find(p => p.id === productId);
    return product ? product.unit : "";
  };

  const getAvailableProducts = (factoryId) => {
    if (!factoryId) return [];

    return reelProducts.filter(product => {
      return product.factory_stocks && product.factory_stocks.some(stock =>
        stock.factory.id === factoryId && stock.current_stock > 0
      );
    });
  };

  const getAvailableStock = (factoryId, productId) => {
    if (!factoryId || !productId) return 0;

    const product = reelProducts.find(p => p.id === productId);
    if (!product || !product.factory_stocks) return 0;

    const stock = product.factory_stocks.find(s => s.factory.id === factoryId);
    return stock ? stock.current_stock : 0;
  };

  const columns = [
    { key: "s_no", label: "S.NO" },
    { key: "factory_name", label: "Factory" },
    { key: "product_name", label: "Product" },
    { key: "quantity", label: "Quantity" },
    { key: "date", label: "Date" },
  ];

  const tableData = usages.map((item, index) => ({
    id: item.id,
    s_no: index + 1,
    factory_name: item.Factory?.factory_name || getFactoryName(item.factory_id),
    product_name: item.ReelProduct?.product_name || getProductName(item.product_id),
    quantity: `${item.quantity} ${item.ReelProduct?.unit || getProductUnit(item.product_id)}`,
    date: new Date(item.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    raw_factory_id: item.factory_id,
    raw_product_id: item.product_id,
    raw_quantity: item.quantity
  }));

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
                           <span>Reel Stock</span>
                         </span>
                         <ChevronRight className="w-4 h-4" />
                         <FileText className="w-4 h-4 text-black" />
                         <span className="text-black font-semibold ml-1">Usage</span>
                       </div>
        <button
          onClick={() => {
            setShowModal(true);
            resetForm();
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
                showNotification("Could not find usage to edit.", "error");
              }
            }}
            onDelete={(row) => handleDeleteClick(usages.find(u => u.id === row.id))}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4 z-50"
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

            {error && (
              <div className="mb-4 text-red-600 text-sm p-3 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Factory</label>
                <select
                  name="factory_id"
                  value={formData.factory_id}
                  onChange={handleChange}
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  disabled={editMode || loading}
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
                <label className="block text-sm font-medium mb-2">Reel Product</label>
                <select
                  name="product_id"
                  value={formData.product_id}
                  onChange={handleChange}
                  disabled={!formData.factory_id || editMode || loading}
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {formData.factory_id
                      ? "Select Reel Product"
                      : "First select a factory"}
                  </option>
                  {getAvailableProducts(formData.factory_id).map((p) => {
                    const availableStock = getAvailableStock(formData.factory_id, p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.product_name} - {availableStock} {p.unit} available
                      </option>
                    );
                  })}
                </select>
                {!formData.factory_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Please select a factory first
                  </p>
                )}
                {formData.factory_id && getAvailableProducts(formData.factory_id).length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    No products with available stock in this factory.
                  </p>
                )}
              </div>

              {formData.product_id && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Current Available Stock:</strong>{" "}
                    {getAvailableStock(formData.factory_id, formData.product_id)}{" "}
                    {getProductUnit(formData.product_id)}
                  </p>
                  {editMode && editingUsage && editingUsage.factory_id === formData.factory_id && editingUsage.product_id === formData.product_id && (
                     <p className="text-sm text-blue-800">
                     <strong>Original Usage Quantity:</strong>{" "}
                     {editingUsage.quantity}{" "}
                     {getProductUnit(formData.product_id)}
                   </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Usage Quantity{" "}
                  {formData.product_id
                    ? `(${getProductUnit(formData.product_id)})`
                    : ""}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter quantity to use"
                  disabled={loading}
                />
                 {formData.product_id && (
                <p className="text-xs text-gray-500 mt-1">
  Maximum: {(Number(getAvailableStock(formData.factory_id, formData.product_id)) + (editMode && editingUsage && editingUsage.factory_id === formData.factory_id && editingUsage.product_id === formData.product_id ? Number(editingUsage.quantity) : 0))} {getProductUnit(formData.product_id) || ''}
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
              <strong>{deletingUsage?.ReelProduct?.product_name || getProductName(deletingUsage?.product_id) || 'this product'}</strong> from{" "}
              <strong>{deletingUsage?.Factory?.factory_name || getFactoryName(deletingUsage?.factory_id) || 'this factory'}</strong>?
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

export default ReelStockUsage;