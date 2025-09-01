import React, { useState, useEffect } from "react";
import { Plus, X, FileText, ChevronRight } from "lucide-react";
import ReusableTable from "../Dashboard/reusableTable"; // Assuming this path is correct
import Notification from "../Dashboard/notification"; // Import Notification component
import { PiFilmReelThin } from "react-icons/pi";

const ReelStockPurchaseTable = () => {
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
    supplier: "", // This will be the supplier ID
    billNo: "",
    productEntries: [
      {
        factory: "", // Factory ID
        product: "", // Product ID
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
      const res = await fetch("http://localhost:8000/api/reelProducts"); // Fetch reel products
      const data = await res.json();

      if (res.status === 200) {
        const flatProducts = [];
        if (data.data && data.data.products) {
          data.data.products.forEach(product => {
            if (product.factory_stocks && product.factory_stocks.length > 0) {
              product.factory_stocks.forEach(stock => {
                flatProducts.push({
                  id: stock.stock_id, // Use stock_id as the unique identifier if products are per stock
                  product_id: product.id, // Store original product ID for backend submission
                  product_name: product.product_name,
                  unit: product.unit,
                  factory_id: stock.factory.id,
                  factory_name: stock.factory.name,
                  current_stock: stock.current_stock,
                });
              });
            } else {
              // Fallback for products without factory_stocks, if applicable
              flatProducts.push({
                id: product.id, // Use product.id if no stock_id
                product_id: product.id,
                product_name: product.product_name,
                unit: product.unit,
                factory_id: null,
                factory_name: "N/A",
                current_stock: null,
              });
            }
          });
        }
        setProducts(flatProducts);
        setError(null);
      } else {
        setError("Failed to fetch reel products");
        showNotification("Failed to fetch reel products.", "error");
      }
    } catch (err) {
      console.error("Error fetching reel products:", err);
      setError("Error fetching reel products");
      showNotification("Error fetching reel products.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/reelSupplier"); // Fetch reel suppliers
      const data = await res.json();
      if (res.status === 200) {
        setSuppliers(data.suppliers || []);
        setError(null);
      } else {
        setError("No reel suppliers found");
        showNotification("No reel suppliers found.", "info");
      }
    } catch (err) {
      console.error("Error fetching reel suppliers:", err);
      setError("Error fetching reel suppliers");
      showNotification("Error fetching reel suppliers.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/reelPurchase"); // Fetch reel purchases
      const data = await res.json();

      if (res.status === 200) {
        setPurchases(data.purchases || []);
        setError(null);
      } else {
        setError("No reel purchases found.");
        showNotification("No reel purchases found.", "info");
      }
    } catch (err) {
      console.error("Error fetching reel purchases:", err);
      setError("Error fetching reel purchases");
      showNotification("Error fetching reel purchases.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Form Handlers ---
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

  const getFilteredProducts = (factoryId) => {
    if (!factoryId) {
      return [];
    }
    // Filter products based on the selected factory
    const filtered = products.filter(product =>
      // Ensure factory_id exists and matches
      product.factory_id?.toString() === factoryId.toString()
    );
    return filtered;
  };

  const resetForm = () => {
    setFormData({
      purchaseDate: "",
      supplier: "",
      billNo: "",
      productEntries: [{ factory: "", product: "", quantity: "" }],
    });
    setEditingPurchase(null);
    setError(null); // Clear form error
  };

  // Helper function to convert date from DD-MM-YYYY to YYYY-MM-DD
  const convertDateForInput = (dateStr) => {
    if (!dateStr) return "";

    // Check if it's already in YYYY-MM-DD format
    if (dateStr.includes("-") && dateStr.split("-")[0].length === 4) {
      return dateStr;
    }

    // Convert from DD-MM-YYYY to YYYY-MM-DD
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return dateStr;
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.purchaseDate || !formData.supplier || !formData.billNo) {
      setError("Please fill in all required fields (Purchase Date, Supplier, Bill No).");
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
      // Format date to DD-MM-YYYY for backend
      const formattedDate = (() => {
        const [year, month, day] = formData.purchaseDate.split("-");
        return `${day}-${month}-${year}`;
      })();

      if (editingPurchase) {
        // Handle editing a single purchase entry
        const entry = formData.productEntries[0]; // During edit, there's only one product entry
        const payload = {
          purchase_date: formattedDate,
          supplier_id: formData.supplier,
          bill_no: formData.billNo,
          product_id: entry.product,
          factory_id: entry.factory,
          quantity: Number(entry.quantity),
        };

        const response = await fetch(`http://localhost:8000/api/reelPurchase/${editingPurchase.id}`, {
          method: "PATCH", // Use PATCH for updating
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.message === "Reel purchase entry updated successfully.") {
          await fetchPurchases(); // Refresh the purchases list
          setShowModal(false);
          resetForm();
          setError(null);
          showNotification("Purchase entry updated successfully!", "success");
        } else {
          setError(data.message || "Failed to update reel purchase entry.");
          showNotification(data.message || "Failed to update reel purchase entry.", "error");
        }
      } else {
        // Handle creating new entries (potentially multiple)
        const purchasePromises = formData.productEntries.map(async (entry) => {
          const payload = {
            purchase_date: formattedDate,
            supplier_id: formData.supplier,
            bill_no: formData.billNo,
            product_id: entry.product,
            factory_id: entry.factory,
            quantity: Number(entry.quantity),
          };

          const response = await fetch("http://localhost:8000/api/reelPurchase", {
            method: "POST", // Use POST for creating
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          const data = await response.json();
          return { response, data };
        });

        const responses = await Promise.all(purchasePromises);

        // Check if all requests were successful
        const successfulCount = responses.filter(({ response }) => response.ok).length;
        const totalCount = responses.length;

        if (successfulCount === totalCount) {
          await fetchPurchases(); // Refresh the purchases list
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
      console.error("Error processing reel purchase:", err);
      setError("Failed to process reel purchase. Please try again.");
      showNotification("Failed to process reel purchase. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Table Configuration ---
  const columns = [
    { key: "purchase_date", label: "Purchase Date" },
    { key: "supplier_name", label: "Purchase Party" },
    { key: "bill_no", label: "Bill No" },
    { key: "product_name", label: "Product" },
    { key: "factory_name", label: "Factory" },
    { key: "quantity", label: "Quantity (Kgs)" },
  ];

  const tableData = purchases.map((purchase, index) => ({
    id: purchase.id, // Important for edit/delete actions
    s_no: index + 1,
    purchase_date: purchase.purchase_date || "N/A",
    supplier_name: purchase.supplier?.supplier_name || suppliers.find(s => s.id === purchase.supplier_id)?.supplier_name || "N/A",
    bill_no: purchase.bill_no || "N/A",
    product_name: purchase.product?.product_name || products.find(p => p.product_id === purchase.product_id)?.product_name || "N/A",
    factory_name: purchase.factory?.factory_name || factories.find(f => f.id === purchase.factory_id)?.factory_name || "N/A",
    quantity: purchase.quantity || "N/A",
    // Store raw IDs for editing purposes
    raw_supplier_id: purchase.supplier_id,
    raw_product_id: purchase.product_id,
    raw_factory_id: purchase.factory_id,
  }));


  const handleEdit = (purchase) => {
    setEditingPurchase(purchase);

    // Convert purchase_date from DD-MM-YYYY to YYYY-MM-DD for the input
    const formattedForInput = convertDateForInput(purchase.purchase_date);

    setFormData({
      purchaseDate: formattedForInput,
      supplier: purchase.raw_supplier_id.toString(), // Use raw ID
      billNo: purchase.bill_no,
      productEntries: [
        {
          factory: purchase.raw_factory_id.toString(), // Use raw ID
          product: purchase.raw_product_id.toString(), // Use raw ID
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
      const response = await fetch(`http://localhost:8000/api/reelPurchase/${deletingPurchase.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPurchases(); // Refresh the purchases list
        setShowDeleteModal(false);
        setDeletingPurchase(null);
        showNotification("Purchase entry deleted successfully!", "delete-success");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to delete purchase entry.");
        showNotification(errorData.message || "Failed to delete purchase entry.", "error");
      }
    } catch (err) {
      console.error("Error deleting reel purchase:", err);
      setError("Failed to delete reel purchase entry.");
      showNotification("Failed to delete reel purchase entry.", "error");
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
                           <span>Reel Stock</span>
                         </span>
                         <ChevronRight className="w-4 h-4" />
                         <FileText className="w-4 h-4 text-black" />
                         <span className="text-black font-semibold ml-1">Purchase Entry</span>
                       </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          <Plus size={16} className="inline mr-1" />
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
          onDelete={handleDeleteClick} // Changed to open delete confirmation modal
          bordered={false}
        />
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
            className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-6">
              {editingPurchase ? "Edit Reel Purchase Entry" : "Add Reel Purchase Entry"}
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

                <div>
                  <label className="block text-sm font-medium mb-1">Supplier *</label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
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
                const availableProducts = getFilteredProducts(entry.factory);

                return (
                  <div key={index} className="border rounded-lg p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Product Entry {index + 1}
                      </span>
                      {/* Hide remove button if editing to ensure only one entry is modified */}
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
                            // Clear product selection when factory changes
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
                          disabled={!entry.factory}
                        >
                          <option value="">
                            {!entry.factory
                              ? "Select Factory First"
                              : availableProducts.length === 0
                                ? "No products for this factory"
                                : "Select Product"}
                          </option>
                          {availableProducts.map((p) => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.product_name} {p.current_stock !== null && `(Stock: ${p.current_stock} ${p.unit})`}
                            </option>
                          ))}
                        </select>
                        {entry.factory && availableProducts.length === 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            No products found for factory "{factories.find(f => f.id === entry.factory)?.factory_name}"
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

              {/* Only show "Add Product" button if not in editing mode */}
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

            {error && (
              <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded">
                {error}
              </div>
            )}

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
              <strong>{deletingPurchase?.product_name}</strong> on{" "}
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

export default ReelStockPurchaseTable;