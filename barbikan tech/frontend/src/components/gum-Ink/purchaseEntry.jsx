import React, { useState, useEffect } from "react";
import { ChevronRight, FileText, Pencil, Trash, Plus, X, CheckCircle, XCircle } from "lucide-react";
import ReusableTable from "../Dashboard/reusableTable"; // Assuming this path is correct
import Notification from "../Dashboard/notification"; // Import Notification component
import { PiFilmReelThin } from "react-icons/pi";

const GumPurchase = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [factories, setFactories] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [deletingPurchase, setDeletingPurchase] = useState(null); // New state for item to delete
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null); // Add notification state

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Function to close notifications
  const closeNotification = () => {
    setNotification(null);
  };

  const [formData, setFormData] = useState({
    purchaseDate: "",
    supplier: "",
    type: "",
    billNo: "",
    productEntries: [
      {
        factory: "",
        product: "",
        quantity: ""
      }
    ]
  });

  // --- Data Fetching ---
  useEffect(() => {
    fetchFactories();
    fetchProducts();
    fetchSuppliers();
    fetchPurchases();
  }, []);

  const fetchFactories = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/factories");
      const data = await response.json();

      if (response.status === 200) {
        setFactories(data.factories || []);
        // showNotification("Factories loaded.", "info"); // Optional: notify on load
      } else {
        setError("Failed to fetch factories");
        showNotification("Failed to fetch factories.", "error");
      }
    } catch (err) {
      console.error("Error fetching factories:", err);
      setError("Error fetching factories");
      showNotification("Error fetching factories.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/products");
      const data = await res.json();

      if (res.status === 200) {
        const flatProducts = [];
        if (data.data && data.data.products) {
          data.data.products.forEach(product => {
            if (product.factory_stocks && product.factory_stocks.length > 0) {
              product.factory_stocks.forEach(stock => {
                flatProducts.push({
                  id: stock.stock_id,
                  product_id: product.id,
                  product_name: product.product_name,
                  type: product.type,
                  unit: product.unit,
                  factory_id: stock.factory.id,
                  factory_name: stock.factory.name,
                  opening_stock: stock.opening_stock,
                  current_stock: stock.current_stock,
                  created_at: stock.created_at,
                  updated_at: stock.updated_at
                });
              });
            }
          });
        }
        setProducts(flatProducts);
        setError(null);
        // showNotification("Products loaded.", "info"); // Optional: notify on load
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

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/suppliers");
      const data = await res.json();
      if (res.status === 200) {
        setSuppliers(data.suppliers || []);
        setError(null);
        // showNotification("Suppliers loaded.", "info"); // Optional: notify on load
      } else {
        setError("No suppliers found");
        showNotification("No suppliers found.", "info");
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError("Error fetching suppliers");
      showNotification("Error fetching suppliers.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/purchase-entries");
      const data = await res.json();

      if (res.status === 200) {
        setPurchases(data.purchases || []);
        setError(null);
        // showNotification("Purchase entries loaded.", "info"); // Optional: notify on load
      } else {
        setError("No purchases found.");
        showNotification("No purchase entries found.", "info");
      }
    } catch (err) {
      console.error("Error fetching purchases:", err);
      setError("Error fetching purchases");
      showNotification("Error fetching purchases.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Form Handlers ---

  const uniqueTypes = [...new Set(suppliers.map((s) => s.type).filter(Boolean))];

  const filteredSuppliers = formData.type
    ? suppliers.filter((s) => s.type === formData.type)
    : [];

  const handleTypeChange = (e) => {
    const selectedType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      type: selectedType,
      supplier: "",
      productEntries: prev.productEntries.map(entry => ({
        ...entry,
        product: "",
      })),
    }));
  };

  const handleSupplierChange = (e) => {
    const selectedSupplierId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      supplier: selectedSupplierId,
      productEntries: prev.productEntries.map(entry => ({
        ...entry,
        product: "",
      })),
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductEntryChange = (index, field, value) => {
    const updatedEntries = [...formData.productEntries];
    updatedEntries[index][field] = value;
    setFormData((prev) => ({ ...prev, productEntries: updatedEntries }));
  };

  const addProductEntry = () => {
    setFormData((prev) => ({
      ...prev,
      productEntries: [...prev.productEntries, { factory: "", product: "", quantity: "" }],
    }));
  };

  const removeProductEntry = (index) => {
    if (formData.productEntries.length > 1) {
      const updatedEntries = formData.productEntries.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, productEntries: updatedEntries }));
    }
  };

  const getFilteredProducts = (factoryId, selectedType) => {
    if (!factoryId || !selectedType) {
      return [];
    }

    const filtered = products.filter(product => {
      const factoryMatch = product.factory_id === factoryId;
      const productTypeNormalized = (product.type || "").toLowerCase().trim();
      const selectedTypeNormalized = (selectedType || "").toLowerCase().trim();
      const typeMatch = productTypeNormalized === selectedTypeNormalized;

      return factoryMatch && typeMatch;
    });

    return filtered;
  };

  const resetForm = () => {
    setFormData({
      purchaseDate: "",
      supplier: "",
      type: "",
      billNo: "",
      productEntries: [{ factory: "", product: "", quantity: "" }],
    });
    setEditingPurchase(null);
    setError(null); // Clear form error
  };

  // Helper function to convert date from DD-MM-YYYY to YYYY-MM-DD
  const convertDateForInput = (dateStr) => {
    if (!dateStr) return "";

    if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
      return dateStr;
    }

    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return dateStr;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.purchaseDate || !formData.supplier || !formData.type || !formData.billNo) {
      setError("Please fill in all required fields (Purchase Date, Type, Supplier, Bill No).");
      showNotification("Please fill in all required fields.", "error");
      return;
    }

    const hasInvalidProductEntries = formData.productEntries.some(
      (entry) => !entry.factory || !entry.product || !entry.quantity || Number(entry.quantity) <= 0
    );

    if (hasInvalidProductEntries) {
      setError("Please fill in all product details with valid quantities greater than zero.");
      showNotification("Please fill in all product details with valid quantities greater than zero.", "error");
      return;
    }

    setLoading(true);

    try {
      const formattedDate = (() => {
        const [year, month, day] = formData.purchaseDate.split("-");
        return `${day}-${month}-${year}`;
      })();

      if (editingPurchase) {
        const entry = formData.productEntries[0];
        const payload = {
          purchase_date: formattedDate,
          supplier_id: formData.supplier,
          bill_no: formData.billNo,
          product_id: entry.product,
          factory_id: entry.factory,
          quantity: Number(entry.quantity),
          type: formData.type.toLowerCase(),
        };

        const response = await fetch(`http://localhost:8000/api/purchase-entries/${editingPurchase.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.message === "Purchase entry updated successfully.") {
          await fetchPurchases();
          setShowModal(false);
          resetForm();
          setError(null);
          showNotification("Purchase entry updated successfully!", "success");
        } else {
          setError(data.message || "Failed to update purchase entry.");
          showNotification(data.message || "Failed to update purchase entry.", "error");
        }
      } else {
        const purchasePromises = formData.productEntries.map(async (entry) => {
          const payload = {
            purchase_date: formattedDate,
            supplier_id: formData.supplier,
            bill_no: formData.billNo,
            product_id: entry.product,
            factory_id: entry.factory,
            quantity: Number(entry.quantity),
            type: formData.type.toLowerCase(),
          };

          const response = await fetch("http://localhost:8000/api/purchase-entries", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          return { response, data };
        });

        const responses = await Promise.all(purchasePromises);

        const successfulCount = responses.filter(({ response }) => response.ok).length;
        const totalCount = responses.length;

        if (successfulCount === totalCount) {
          await fetchPurchases();
          setShowModal(false);
          resetForm();
          setError(null);
          showNotification("All purchase entries created successfully!", "success");
        } else if (successfulCount > 0 && successfulCount < totalCount) {
          await fetchPurchases(); // Refresh even if partial success
          setShowModal(false);
          resetForm();
          const failedMessages = responses
            .filter(({ response }) => !response.ok)
            .map(({ data }) => data.message || "Unknown error")
            .join("; ");
          setError(`Some purchases failed: ${failedMessages}`);
          showNotification(`Some purchase entries created, but others failed: ${failedMessages}`, "warning");
        } else {
          const errorMessage = responses[0]?.data?.message || "Failed to create purchase entries.";
          setError(errorMessage);
          showNotification(errorMessage, "error");
        }
      }
    } catch (err) {
      console.error("Error processing purchase:", err);
      setError("Failed to process purchase. Please try again.");
      showNotification("Failed to process purchase. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "purchase_date", label: "Purchase Date" },
    { key: "supplier_id", label: "Supplier Name" },
    { key: "factory_id", label: "Factory Name" },
    { key: "product", label: "Product" },
    { key: "quantity", label: "Quantity" },
  ];

  const tableData = purchases.map((usage) => ({
    id: usage.id,
    purchase_date: usage.purchase_date || "N/A",
    factory_id: usage.factory?.factory_name || "N/A",
    supplier_id: usage.supplier?.supplier_name || "N/A",
    product: usage.product?.product_name || "N/A",
    quantity: usage.quantity || "N/A",
    raw_supplier_id: usage.supplier_id,
    raw_factory_id: usage.factory_id,
    raw_product_id: usage.product_id,
    raw_type: usage.type,
    bill_no: usage.bill_no,
  }));

  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);

    const formattedForInput = convertDateForInput(purchase.purchase_date);

    setFormData({
      purchaseDate: formattedForInput,
      supplier: purchase.raw_supplier_id.toString(),
      type: purchase.raw_type || "",
      billNo: purchase.bill_no || "",
      productEntries: [
        {
          factory: purchase.raw_factory_id.toString(),
          product: purchase.raw_product_id.toString(),
          quantity: purchase.quantity.toString(),
        },
      ],
    });

    setShowModal(true);
    setError(null);
  };

  const handleDeleteClick = (purchase) => {
    setDeletingPurchase(purchase);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPurchase) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/purchase-entries/${deletingPurchase.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPurchases();
        setShowDeleteModal(false);
        setDeletingPurchase(null);
        showNotification("Purchase entry deleted successfully!", "delete-success");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to delete purchase entry.");
        showNotification(errorData.message || "Failed to delete purchase entry.", "error");
      }
    } catch (err) {
      console.error("Error deleting purchase:", err);
      setError("Failed to delete purchase entry.");
      showNotification("Failed to delete purchase entry.", "error");
    } finally {
      setLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingPurchase(null);
    setError(null); // Clear error when closing delete modal
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

      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
<div className="flex items-center text-sm text-gray-500 font-medium space-x-1">
          <span className="flex items-center space-x-1">
            <PiFilmReelThin className="w-5 h-5" />
            <span>Gum & Ink</span>
          </span>
          <ChevronRight className="w-4 h-4" />
          <FileText className="w-4 h-4 text-black" />
          <span className="text-black font-semibold ml-1">Purchase Entry</span>
        </div>        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Create Purchase
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border mt-3 border-gray-200">
        <ReusableTable
          columns={columns}
          data={tableData}
          emptyMessage="No purchases added yet."
          itemsPerPage={10}
          loading={loading}
          showActions={true}
          onEdit={handleEdit}
          onDelete={handleDeleteClick} 
          bordered={false}
        />
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0  bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4 z-50"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-6">
              {editingPurchase ? "Edit Purchase Entry" : "Add Purchase Entry"}
            </h3>

            {error && (
              <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded">
                {error}
              </div>
            )}

            {/* Section 1: Purchase Metadata */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>

                {/* Type Selection - Moved above Supplier */}
                <div>
                  <label className="block text-sm font-medium mb-1">Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="">Select Type</option>
                    {uniqueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supplier Selection - Now depends on Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier *</label>
                  <select
                      name="supplier"
                      value={formData.supplier}
                      onChange={handleSupplierChange}
                      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                      disabled={!formData.type}
                    >
                    <option value="">Select Supplier</option>
                    {filteredSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bill No *</label>
                  <input
                    type="text"
                    name="billNo"
                    value={formData.billNo}
                    onChange={handleChange}
                    placeholder="Enter Bill No"
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Product Details */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-4 border-b pb-2">
                Product Details
              </h4>

              {formData.productEntries.map((entry, index) => {
                const availableProducts = getFilteredProducts(entry.factory, formData.type);

                return (
                  <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Product Entry {index + 1}
                      </span>
                      {formData.productEntries.length > 1 && !editingPurchase && (
                        <button
                          onClick={() => removeProductEntry(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Factory *</label>
                        <select
                          value={entry.factory}
                          onChange={(e) => {
                            handleProductEntryChange(index, "factory", e.target.value);
                            handleProductEntryChange(index, "product", "");
                          }}
                          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
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
                        <label className="block text-sm font-medium mb-1">Product *</label>
                        <select
                          value={entry.product}
                          onChange={(e) =>
                            handleProductEntryChange(index, "product", e.target.value)
                          }
                          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                          disabled={!entry.factory || !formData.type}
                        >
                          <option value="">
                            {!formData.type
                              ? "Select Type First"
                              : !entry.factory
                              ? "Select Factory First"
                              : availableProducts.length === 0
                              ? "No matching products"
                              : "Select Product"}
                          </option>
                          {availableProducts.map((p) => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.product_name} (Stock: {p.current_stock} {p.unit})
                            </option>
                          ))}
                        </select>
                        {entry.factory && formData.type && availableProducts.length === 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            No products found for factory "{factories.find(f => f.id === entry.factory)?.factory_name}" and type "{formData.type}"
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Quantity (Kgs) *
                        </label>
                        <input
                          type="number"
                          value={entry.quantity}
                          onChange={(e) =>
                            handleProductEntryChange(index, "quantity", e.target.value)
                          }
                          placeholder="Enter Quantity"
                          min="0"
                          step="0.01"
                          className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {!editingPurchase && (
                <button
                  onClick={addProductEntry}
                  className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : editingPurchase ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Purchase Entry</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this purchase entry for{" "}
              <strong>{deletingPurchase?.product}</strong> on{" "}
              <strong>{deletingPurchase?.purchase_date}</strong>?
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

export default GumPurchase;