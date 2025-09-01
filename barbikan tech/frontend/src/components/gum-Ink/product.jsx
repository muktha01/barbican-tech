import React, { useState, useEffect } from "react";
import { ChevronRight, FileText, Pencil, Search, Trash, X } from "lucide-react";
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification"; // Import Notification component
import { PiFilmReelThin } from "react-icons/pi";

const GumProduct = () => {
  const [products, setProducts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal
  const [deletingProduct, setDeletingProduct] = useState(null); // New state for product to delete
  const [loadingFactories, setLoadingFactories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedFactory, setSelectedFactory] = useState("");
  const [notification, setNotification] = useState(null); // Add notification state

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Function to close notifications
  const closeNotification = () => {
    setNotification(null);
  };

  // State for bulk creation
  const [bulkFormData, setBulkFormData] = useState({
    productName: "",
    type: "",
    unit: "",
    factoryStocks: []
  });

  // Fetch factories on mount
  useEffect(() => {
    const fetchFactories = async () => {
      setLoadingFactories(true);
      try {
        const response = await fetch("http://localhost:8000/api/factories");
        const data = await response.json();
        console.log("Fetched factories:", data.factories);
        if (response.status === 200) {
          setFactories(data.factories || []);
          setBulkFormData(prev => ({
            ...prev,
            factoryStocks: data.factories?.map(factory => ({
              factory_id: factory.id,
              factory_name: factory.factory_name,
              opening_stock: "",
              selected: false
            })) || []
          }));
        } else {
          console.error("No factories found from API response:", data.message || "No factories found");
          showNotification("No factories found.", "info"); // Show notification
        }
      } catch (err) {
        console.error("Error fetching factories:", err);
        showNotification("Error fetching factories.", "error"); // Show notification
      } finally {
        setLoadingFactories(false);
      }
    };
    fetchFactories();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("http://localhost:8000/api/products");
        const data = await res.json();
        if (res.status === 200) {
          setProducts(data.data.products || []);
          console.log("Fetched products:", data.data.products);
          // showNotification("Products loaded successfully!", "info"); // Optional: show on successful fetch
        } else {
          console.error("No products found from API response:", data.message || "No products found.");
          showNotification("No products found.", "info"); // Show notification
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        showNotification("Error fetching products.", "error"); // Show notification
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Transform products data to flatten factory stocks for table display
  const getTableData = () => {
    const tableRows = [];
    products.forEach((product) => {
      if (product.factory_stocks && product.factory_stocks.length > 0) {
        product.factory_stocks.forEach((factoryStock) => {
          // Filter by selected factory if one is chosen
          if (selectedFactory === "" || factoryStock.factory?.id === selectedFactory) {
            tableRows.push({
              id: factoryStock.stock_id,
              product_id: product.id,
              product_name: product.product_name,
              factory_name: factoryStock.factory?.name || "Unknown Factory",
              factory_id: factoryStock.factory?.id,
              opening_stock: `${factoryStock.opening_stock} ${product.unit}`,
              current_stock: `${factoryStock.current_stock} ${product.unit}`,
              unit: product.unit,
              type: product.type,
              created_at: factoryStock.created_at,
              originalProduct: product // Keep original product data for editing
            });
          }
        });
      } else {
        // Only show products without factory stock if no specific factory is selected
        if (selectedFactory === "") {
          tableRows.push({
            id: `product-${product.id}`,
            product_id: product.id,
            product_name: product.product_name,
            factory_name: "No Factory Assigned",
            factory_id: null,
            opening_stock: 0,
            current_stock: 0,
            unit: product.unit,
            type: product.type,
            created_at: product.created_at,
            originalProduct: product
          });
        }
      }
    });
    return tableRows;
  };

  const handleBulkChange = (e) => {
    const { name, value } = e.target;
    setBulkFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFactoryStockChange = (factoryId, field, value) => {
    setBulkFormData(prev => ({
      ...prev,
      factoryStocks: prev.factoryStocks.map(factory =>
        factory.factory_id === factoryId
          ? { ...factory, [field]: value }
          : factory
      )
    }));
  };

  const resetBulkForm = () => {
    setBulkFormData(prev => ({
      productName: "",
      type: "",
      unit: "",
      factoryStocks: prev.factoryStocks.map(factory => ({
        ...factory,
        opening_stock: "",
        selected: false
      }))
    }));
    setEditingProductId(null);
  };

  const handleBulkSubmit = async () => {
    if (!bulkFormData.productName || !bulkFormData.type || !bulkFormData.unit) {
      showNotification("Product name, type, and unit are required.", "error"); // Show error notification
      return;
    }

    const selectedFactoriesData = bulkFormData.factoryStocks.filter(factory =>
      factory.opening_stock && Number(factory.opening_stock) >= 0
    ).map(factory => ({
        factory_id: factory.factory_id,
        opening_stock: Number(factory.opening_stock)
    }));

    setSubmitting(true);
    try {
      const payload = {
        product_name: bulkFormData.productName,
        type: bulkFormData.type.toLowerCase(),
        unit: bulkFormData.unit,
        factory_stocks: selectedFactoriesData
      };

      let res;
      let url = "http://localhost:8000/api/products";
      let method = 'POST';
      let successMessage = "Product created successfully!";

      if (editingProductId) {
        url = `http://localhost:8000/api/products/${editingProductId}`;
        method = 'PUT';
        successMessage = "Product updated successfully!";
      }

      res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok || res.status === 207) {
        // const { successful_operations, errors, total_factories_processed } = data; // Not using these specific fields

        const updatedRes = await fetch("http://localhost:8000/api/products");
        const updatedData = await updatedRes.json();
        if (updatedRes.ok) {
          setProducts(updatedData.data.products || []);
        } else {
            console.error("Failed to refresh product list after operation:", updatedData.message || "Unknown error");
        }

        if (data.errors && data.errors.length > 0) { // Check data.errors
            let errorDetails = data.errors.map(err => `${err.factory_name}: ${err.message}`).join("; ");
            showNotification(`${successMessage} Some factories had issues: ${errorDetails}`, "warning");
        } else {
            showNotification(successMessage, "success");
        }

        setShowBulkModal(false);
        resetBulkForm();
      } else {
        const errorMessage = data.message || `Failed to ${editingProductId ? 'update' : 'create'} product.`;
        showNotification(errorMessage, "error"); // Show error notification
      }
    } catch (err) {
      console.error(`Error during ${editingProductId ? 'update' : 'creation'} operation:`, err);
      showNotification(`Error during ${editingProductId ? 'update' : 'creation'} operation.`, "error"); // Show error notification
    } finally {
      setSubmitting(false);
    }
  };

  // Function to open the delete confirmation modal
  const handleDeleteClick = (productRow) => {
    // The `productRow` here is the flattened table row, not the original product object
    // We need the `product_id` to delete the main product, and `product_name` for the modal message.
    setDeletingProduct(productRow);
    setShowDeleteModal(true);
  };

  // Function to handle the actual deletion after confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingProduct || !deletingProduct.product_id) return;

    setSubmitting(true); // Use submitting for delete modal too
    try {
      const res = await fetch(`http://localhost:8000/api/products/${deletingProduct.product_id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        // Re-fetch products to ensure the table is up-to-date
        const updatedRes = await fetch("http://localhost:8000/api/products");
        const updatedData = await updatedRes.json();
        if (updatedRes.ok) {
          setProducts(updatedData.data.products || []);
        } else {
            console.error("Failed to refresh product list after deletion:", updatedData.message || "Unknown error");
        }
        showNotification("Product deleted successfully!", "delete-success"); // Show success notification
        setShowDeleteModal(false); // Close delete modal
        setDeletingProduct(null); // Clear deleting product
      } else {
        const data = await res.json().catch(() => ({}));
        const errorMessage = data.message || "Failed to delete product.";
        showNotification(errorMessage, "error"); // Show error notification
      }
    } catch (err) {
      console.error(`Error deleting product with ID ${deletingProduct.product_id}:`, err);
      showNotification(`Error deleting product.`, "error"); // Show error notification
    } finally {
      setSubmitting(false);
    }
  };

  // Function to close the delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingProduct(null);
  };

  const columns = [
    { key: "product_name", label: "Product Name" },
    { key: "type", label: "Type" },
    { key: "factory_name", label: "Factory Name" },
    { key: "current_stock", label: "Current Stock" },
  ];

  const handleEdit = (tableRow) => {
    const productToEdit = tableRow.originalProduct;
    if (!productToEdit) {
        console.error("Cannot edit: Original product data not found for the selected row.", tableRow);
        showNotification("Cannot edit: Product data not found.", "error"); // Show error notification
        return;
    }

    setBulkFormData(prev => ({
      productName: productToEdit.product_name || "",
      type: (productToEdit.type || "").toUpperCase(),
      unit: productToEdit.unit || "",
      factoryStocks: prev.factoryStocks.map(modalFactory => {
        const existingStock = productToEdit.factory_stocks?.find(fs => fs.factory?.id === modalFactory.factory_id);
        return {
          ...modalFactory,
          opening_stock: existingStock ? existingStock.opening_stock.toString() : "",
        };
      })
    }));
    setEditingProductId(productToEdit.id);
    setShowBulkModal(true);
  };

  const handleFactoryFilterChange = (e) => {
    setSelectedFactory(e.target.value);
  };

  const tableData = getTableData();

  return (
   <div className="bg-white rounded-3xl shadow-xl flex p-6 flex-col backdrop-blur-md w-full  h-full border-md">
      {/* Notification Component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-200 gap-4">
        <div className="flex items-center text-sm text-gray-500 font-medium space-x-1">
                  <span className="flex items-center space-x-1">
                    <PiFilmReelThin className="w-5 h-5" />
                    <span>Gum & Ink</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                  <FileText className="w-4 h-4 text-black" />
                  <span className="text-black font-semibold ml-1">Product Stock</span>
                </div>
        <div className="flex gap-2">
           <div className="relative flex-1 lg:flex-none">
            <select
              name="factory"
              value={selectedFactory}
              onChange={handleFactoryFilterChange}
              className="border rounded px-3 py-2 w-full lg:w-64 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <option value="">All Factories</option> {/* Option to show all products */}
              {factories.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.factory_name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              resetBulkForm();
              setShowBulkModal(true);
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition"
          >
            Add Product
          </button>
        </div>
      </div>

           <div className="flex-1 overflow-auto rounded-lg border mt-3 border-gray-200">
  <div className="h-full">
      <ReusableTable
        columns={columns}
        data={getTableData()}
        emptyMessage="No products available yet."
        itemsPerPage={10}
        loading={loadingProducts}
        showActions={true}
        onEdit={handleEdit}
        onDelete={handleDeleteClick} 
      />
  </div>
</div>

      {/* Bulk Creation/Edit Modal */}
     {showBulkModal && (
  <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl p-6 max-h-[90vh] flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
        <h2 className="text-2xl font-bold">
          {editingProductId ? "Edit Product Stock" : "Add Product to Factories"}
        </h2>
        <button
          onClick={() => { setShowBulkModal(false); resetBulkForm(); }}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>
      




            <div className="space-y-6 mt-3">
              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    name="productName"
                    value={bulkFormData.productName}
                    onChange={handleBulkChange}
                    placeholder="Enter product name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    value={bulkFormData.type}
                    onChange={handleBulkChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    disabled={submitting}
                  >
                    <option value="">Select type</option>
                    <option value="GUM">GUM</option>
                    <option value="INK">INK</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    name="unit"
                    value={bulkFormData.unit}
                    onChange={handleBulkChange}
                    placeholder="Enter unit (Kgs, ltr, etc.)"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Factory Section - Conditional */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Enter Stock Amount for Each Factory
                </label>

                {!(bulkFormData.productName.trim() === "" ||
                bulkFormData.type.trim() === "" ||
                bulkFormData.unit.trim() === "") ? (
                  <div className="max-h-64 overflow-y-auto p-2 rounded-md border border-gray-200 bg-white shadow-sm">
                    {loadingFactories ? (
                        <div className="text-sm text-gray-500 p-4 text-center">Loading factories...</div>
                    ) : bulkFormData.factoryStocks.length > 0 ? (
                      bulkFormData.factoryStocks.map((factory) => (
                        <div
                          key={factory.factory_id}
                          className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center mb-3 p-3 bg-gray-50 rounded-md"
                        >
                          <label className="text-sm font-semibold text-gray-700">
                            {factory.factory_name}
                          </label>
                          <input
                            type="number"
                            value={factory.opening_stock}
                            onChange={(e) =>
                              handleFactoryStockChange(factory.factory_id, 'opening_stock', e.target.value)
                            }
                            placeholder="Enter opening stock"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={submitting}
                            min="0"
                            step="0.01"
                          />
                        </div>
                      ))
                    ) : (
                        <div className="text-sm text-gray-500 p-4 text-center">No factories available or loaded.</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic p-4 border border-gray-200 rounded-md bg-gray-50">
                    Please fill in Product Name, Type, and Unit above to manage factory stocks.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    resetBulkForm();
                    setShowBulkModal(false);
                  }}
                  type="button"
                  className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 hover:bg-gray-100 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkSubmit}
                  disabled={submitting || bulkFormData.productName.trim() === "" || bulkFormData.type.trim() === "" || bulkFormData.unit.trim() === ""}
                  className={`px-4 py-2 rounded-md text-white transition-colors ${
                    submitting || bulkFormData.productName.trim() === "" || bulkFormData.type.trim() === "" || bulkFormData.unit.trim() === ""
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {submitting
                    ? editingProductId
                      ? "Updating..."
                      : "Creating..."
                    : editingProductId
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Product</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the product{" "}
              <strong>{deletingProduct?.product_name}</strong> and all its associated stock records across factories?
              This action cannot be undone.
            </p>

            {notification && notification.type === 'error' && ( // Display error if present
              <div className="text-red-600 text-sm mb-4">{notification.message}</div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 transition"
                onClick={closeDeleteModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteConfirm}
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GumProduct;