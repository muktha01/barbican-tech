import { ChevronRight, FileText, Pencil, Trash } from "lucide-react";
import { PiFilmReelThin } from "react-icons/pi";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification"; // Import Notification component

const ReelStockSwapTable = () => {
  const [formData, setFormData] = useState({
    productId: "",
    stockId: "", // Track which specific stock entry is selected
    fromFactory: "",
    toFactory: "",
    qty: "",
  });
  const [factories, setFactories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productStocks, setProductStocks] = useState([]); // Stocks for selected product
  const [availableFactories, setAvailableFactories] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal
  const [deletingSwap, setDeletingSwap] = useState(null); // New state for swap to delete
  const [editingSwap, setEditingSwap] = useState(null);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); // Add submitting state for better UX
  const [notification, setNotification] = useState(null); // Add notification state

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Function to close notifications
  const closeNotification = () => {
    setNotification(null);
  };

  // Memoized fetch functions to avoid re-creation on every render
  const fetchSwaps = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/api/reelSwap");
      console.log("Swaps response:", response.data);
      setSwaps(response.data.swaps || []);
    } catch (err) {
      console.error("Error fetching swaps:", err);
      setError("Error fetching swaps");
      showNotification("Error fetching swaps.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFactories = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/factories");
      console.log("Factories response:", response.data);
      setFactories(response.data.factories || []);
    } catch (err) {
      console.error("Error fetching factories:", err);
      showNotification("Error fetching factories.", "error");
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/reelSwap/products-with-stock");
      console.log("Products with stock response:", response.data);
      setProducts(response.data.products || []);
      return response.data.products || []; // Return products for immediate use in handleEdit
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
      showNotification("Error fetching products.", "error");
      return [];
    }
  }, []);

  const fetchAvailableFactories = useCallback(async (productId, excludeFactoryId) => {
    console.log("Fetching available factories for product:", productId, "excluding factory:", excludeFactoryId);
    if (!productId || !excludeFactoryId) {
      setAvailableFactories([]);
      return [];
    }
    try {
      const response = await axios.get(
        `http://localhost:8000/api/reelSwap/factories-by-product?product_id=${productId}&exclude_factory_id=${excludeFactoryId}`
      );
      console.log("Available factories response:", response.data);
      setAvailableFactories(response.data.factories || []);
      return response.data.factories || [];
    } catch (err) {
      console.error("Error fetching available factories:", err);
      setAvailableFactories([]);
      showNotification("Error fetching available factories.", "error");
      return [];
    }
  }, []);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchSwaps();
    fetchFactories();
    fetchProducts();
  }, [fetchSwaps, fetchFactories, fetchProducts]);

  // Reset product-related fields when product changes (for new swaps)
  useEffect(() => {
    if (formData.productId && !editingSwap) {
      const selectedProduct = products.find(p => p.id === formData.productId);
      if (selectedProduct) {
        setProductStocks(selectedProduct.stocks || []);
        setFormData(prev => ({
          ...prev,
          stockId: "",
          fromFactory: "",
          toFactory: "",
          qty: ""
        }));
      }
    } else if (!formData.productId && !editingSwap) {
      setProductStocks([]);
      setFormData(prev => ({
        ...prev,
        stockId: "",
        fromFactory: "",
        toFactory: "",
        qty: ""
      }));
    }
    if (!editingSwap) {
      setAvailableFactories([]);
    }
  }, [formData.productId, products, editingSwap]);

  // Handle stock selection (which determines the from factory and available quantity)
  useEffect(() => {
    if (formData.stockId && formData.productId) {
      const selectedStock = productStocks.find(stock => {
        const stockId = stock.stock_id || stock.id;
        return stockId?.toString() === formData.stockId.toString();
      });

      if (selectedStock) {
        const factoryId = selectedStock.factory_id;
        setFormData(prev => ({
          ...prev,
          fromFactory: factoryId,
          toFactory: editingSwap ? prev.toFactory : ""
        }));
        if (!editingSwap || editingSwap.from_factory_id !== factoryId) {
          fetchAvailableFactories(formData.productId, factoryId);
        }
      } else {
        console.warn("Stock not found for selected stockId:", formData.stockId, "in productStocks:", productStocks);
        if (!editingSwap) {
            setFormData(prev => ({ ...prev, fromFactory: "", toFactory: "" }));
            setAvailableFactories([]);
        }
      }
    } else if (!editingSwap) {
      setFormData(prev => ({
        ...prev,
        fromFactory: "",
        toFactory: ""
      }));
      setAvailableFactories([]);
    }
  }, [formData.stockId, formData.productId, productStocks, editingSwap, fetchAvailableFactories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper function to get the selected stock object
  const getSelectedStock = useCallback(() => {
    return productStocks.find(stock => {
      const stockId = stock.stock_id || stock.id;
      return stockId?.toString() === formData.stockId.toString();
    });
  }, [productStocks, formData.stockId]);

  // Helper function to get the maximum allowed quantity for the input field
  const getMaxAllowedQuantity = useCallback(() => {
    const selectedStock = getSelectedStock();
    if (!selectedStock) return 0;

    const currentStock = parseFloat(selectedStock.current_stock) || 0;
    let maxAllowed = currentStock;

    if (
      editingSwap &&
      editingSwap.from_factory_id === selectedStock.factory_id &&
      editingSwap.product_id === formData.productId
    ) {
      const originalSwapQty = parseFloat(editingSwap.quantity) || 0;
      maxAllowed = currentStock + originalSwapQty;
      console.log(
        `Edit mode: Current stock: ${currentStock}, Original swap: ${originalSwapQty}, Max allowed: ${maxAllowed}`
      );
    }

    return maxAllowed;
  }, [getSelectedStock, editingSwap, formData.productId]);


  const validateForm = useCallback(() => {
    const errors = {};

    // Basic validations
    if (!formData.productId) errors.productId = "Product is required";
    if (!formData.stockId) errors.stockId = "Please select a factory stock";
    if (!formData.fromFactory) errors.fromFactory = "From Factory is required";
    if (!formData.toFactory) errors.toFactory = "To Factory is required";
    if (!formData.qty || Number(formData.qty) <= 0) {
      errors.qty = "Quantity must be greater than 0";
    }

    // Ensure fromFactory and toFactory are different
    if (formData.fromFactory && formData.toFactory && formData.fromFactory === formData.toFactory) {
      errors.toFactory = "Cannot swap to the same factory.";
      errors.fromFactory = "Cannot swap from and to the same factory.";
    }

    // Stock availability validation using getMaxAllowedQuantity
    const selectedStock = getSelectedStock();
    if (selectedStock && formData.qty) {
      const requestedQty = parseFloat(formData.qty) || 0;
      const maxAllowedQuantity = getMaxAllowedQuantity();

      if (requestedQty > maxAllowedQuantity) {
        errors.qty = editingSwap
          ? `Insufficient stock. Currently available: ${parseFloat(selectedStock.current_stock) || 0} units. Maximum allowed (including previous swap): ${maxAllowedQuantity} units.`
          : `Insufficient stock. Available: ${maxAllowedQuantity} units.`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, getSelectedStock, getMaxAllowedQuantity, editingSwap]);


  const handleSubmit = async () => {
    if (!validateForm()) return;

    const swapData = {
      quantity: Number(formData.qty),
      product_id: formData.productId,
      from_factory_id: formData.fromFactory,
      to_factory_id: formData.toFactory,
    };

    try {
      setSubmitting(true);
      let response;
      let successMessage;
      if (editingSwap) {
        response = await axios.put(`http://localhost:8000/api/reelSwap/${editingSwap.id}`, swapData);
        successMessage = "Swap updated successfully!";
      } else {
        response = await axios.post("http://localhost:8000/api/reelSwap", swapData);
        successMessage = "Swap created successfully!";
      }

      if (response.status === 200 || response.status === 201) {
        await fetchSwaps();
        await fetchProducts();
        resetForm();
        setError(null);
        showNotification(successMessage, "success");
      }
    } catch (err) {
      console.error("Failed to submit swap:", err);
      const errorMessage = err.response?.data?.message || "Failed to submit swap";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = useCallback(async (swap) => {
    console.log("Editing swap:", swap);
    setEditingSwap(swap);
    setError(null);

    setFormData({
      productId: swap.product_id,
      stockId: "",
      fromFactory: swap.from_factory_id,
      toFactory: swap.to_factory_id,
      qty: swap.quantity.toString(),
    });

    const fetchedProducts = await fetchProducts();

    const selectedProduct = fetchedProducts.find(p => p.id === swap.product_id);

    if (selectedProduct) {
        setProductStocks(selectedProduct.stocks || []);

        const matchingStock = selectedProduct.stocks.find(stock =>
            stock.factory_id === swap.from_factory_id
        );

        if (matchingStock) {
            const stockId = matchingStock.stock_id || matchingStock.id;
            setFormData(prev => ({
                ...prev,
                stockId: stockId.toString(),
                fromFactory: matchingStock.factory_id
            }));
        } else {
            console.warn("No matching stock found for from_factory_id during edit:", swap.from_factory_id);
            setFormData(prev => ({ ...prev, stockId: "" }));
        }

        await fetchAvailableFactories(swap.product_id, swap.from_factory_id);
    } else {
        console.warn("Product not found for editing:", swap.product_id);
        setError("Product not found for editing.");
        showNotification("Product not found for editing.", "error");
    }

    setShowModal(true);
  }, [fetchProducts, fetchAvailableFactories]);

  // Function to open the delete confirmation modal
  const handleDeleteClick = (swapRow) => {
    const swapToDelete = swaps.find(s => s.id === swapRow.id);
    if (swapToDelete) {
      setDeletingSwap(swapToDelete);
      setShowDeleteModal(true);
    } else {
      showNotification("Could not find swap to delete.", "error");
    }
  };

  // Function to handle the actual deletion after confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingSwap || !deletingSwap.id) return;

    setSubmitting(true);
    try {
      const response = await axios.delete(`http://localhost:8000/api/reelSwap/${deletingSwap.id}`);
      
      if (response.status === 200 || response.status === 204) {
        await fetchSwaps();
        await fetchProducts(); // Refresh products to update stock levels
        setError(null);
        showNotification("Swap deleted successfully!", "delete-success");
        setShowDeleteModal(false);
        setDeletingSwap(null);
      }
    } catch (err) {
      console.error("Failed to delete swap:", err);
      const errorMessage = err.response?.data?.message || "Failed to delete swap";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Function to close the delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingSwap(null);
  };

  const resetForm = useCallback(() => {
    setFormData({
      productId: "",
      stockId: "",
      fromFactory: "",
      toFactory: "",
      qty: "",
    });
    setFormErrors({});
    setShowModal(false);
    setEditingSwap(null);
    setProductStocks([]);
    setAvailableFactories([]);
    setError(null);
  }, []);

  // Get factory name by ID
  const getFactoryName = (factoryId) => {
    const factory = factories.find(f => f.id === factoryId);
    return factory ? factory.factory_name : "N/A";
  };

  // Get selected product info for unit display
  const getSelectedProduct = useCallback(() => {
    return products.find(p => p.id === formData.productId);
  }, [products, formData.productId]);

  const columns = [
    { key: "product", label: "Product" },
    { key: "from_factory", label: "From Factory" },
    { key: "to_factory", label: "To Factory" },
    { key: "quantity", label: "Quantity" },
    { key: "date", label: "Date" },
  ];

  const tableData = swaps.map((swap) => ({
    product: swap.Product?.product_name || "N/A",
    from_factory: swap.fromFactory?.factory_name || "N/A",
    to_factory: swap.toFactory?.factory_name || "N/A",
    quantity: swap.quantity ? `${swap.quantity} ${swap.Product?.unit || "units"}` : "N/A",
    date: new Date(swap.createdAt).toLocaleDateString(),
    id: swap.id,
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
          <span className="text-black font-semibold ml-1">Swap</span>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          disabled={loading}
          className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Swap
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="my-3 p-3 bg-blue-100 text-blue-700 rounded text-center">
          Loading...
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-lg border mt-3 border-gray-200">
        <div className="h-full">
        <ReusableTable
          columns={columns}
          data={tableData}
          emptyMessage="No swaps available."
          itemsPerPage={10}
          loading={loading}
          showActions={true}
          onEdit={(row) => {
            const swapToEdit = swaps.find(s => s.id === row.id);
            if (swapToEdit) {
              handleEdit(swapToEdit);
            } else {
              showNotification("Could not find swap to edit.", "error");
            }
          }}
          onDelete={handleDeleteClick}
          bordered={false}
        />
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4 z-50"
          onClick={() => {
            setShowModal(false);
            resetForm();
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingSwap ? "Edit Swap" : "Create Swap"}
            </h2>

            {/* Error display inside modal */}
            {error && (
              <div className="mb-4 text-red-600 text-sm p-3 bg-red-50 rounded">
                {error}
              </div>
            )}

            {/* Swap Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="space-y-4"
            >
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!!editingSwap || submitting}
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
                {formErrors.productId && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.productId}</p>
                )}
              </div>

              {/* From Factory Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Factory Stock</label>
                <select
                  name="stockId"
                  value={formData.stockId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!formData.productId || !!editingSwap || submitting}
                >
                  <option value="">Select Stock</option>
                  {productStocks.map((stock, index) => {
                    const stockId = stock.stock_id || stock.id || stock.factory_id;
                    return (
                      <option key={stockId || index} value={stockId}>
                        {getFactoryName(stock.factory_id)} (Available: {stock.current_stock})
                      </option>
                    );
                  })}
                </select>
                {formErrors.stockId && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.stockId}</p>
                )}
              </div>

              {/* Show selected stock info */}
              {getSelectedStock() && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>From Factory:</strong> {getFactoryName(formData.fromFactory)}
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>Available Stock:</strong> {getSelectedStock().current_stock} {getSelectedProduct()?.unit || "units"}
                  </p>
                </div>
              )}

              {/* To Factory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Factory</label>
                <select
                  name="toFactory"
                  value={formData.toFactory}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!formData.fromFactory || submitting}
                >
                  <option value="">Select To Factory</option>
                  {availableFactories.map(factory => (
                    <option key={factory.id} value={factory.id}>
                      {factory.factory_name}
                    </option>
                  ))}
                </select>
                {formErrors.toFactory && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.toFactory}</p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity ({getSelectedProduct()?.unit || "units"})
                </label>
                <input
                  type="number"
                  name="qty"
                  value={formData.qty}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter quantity"
                  min="1"
                  step="0.01"
                  max={getMaxAllowedQuantity() || undefined}
                  disabled={submitting}
                />
                {getSelectedStock() && (
                  <p className="text-xs text-gray-500 mt-1">
                    {editingSwap ? (
                      <>
                        Current available: {parseFloat(getSelectedStock().current_stock) || 0} {getSelectedProduct()?.unit || "units"} |
                        Maximum allowed: {getMaxAllowedQuantity()} {getSelectedProduct()?.unit || "units"}
                      </>
                    ) : (
                      <>Maximum: {getMaxAllowedQuantity()} {getSelectedProduct()?.unit || "units"}</>
                    )}
                  </p>
                )}
                {formErrors.qty && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.qty}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                  className="px-4 py-2 rounded-md border border-gray-400 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-md text-white transition-colors ${
                    submitting 
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {submitting
                    ? editingSwap
                      ? "Updating..."
                      : "Creating..."
                    : editingSwap
                    ? "Update Swap"
                    : "Create Swap"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Swap</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this swap for{" "}
              <strong>{deletingSwap?.Product?.product_name || 'this product'}</strong>{" "}
              from <strong>{deletingSwap?.fromFactory?.factory_name || 'source factory'}</strong>{" "}
              to <strong>{deletingSwap?.toFactory?.factory_name || 'destination factory'}</strong>?
              This action cannot be undone.
            </p>

            {/* Error display inside delete modal */}
            {error && (
              <div className="text-red-600 text-sm mb-4">{error}</div>
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

export default ReelStockSwapTable;