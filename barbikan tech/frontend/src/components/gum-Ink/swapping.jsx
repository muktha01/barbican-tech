import { ChevronRight, FileText, Pencil, Trash } from "lucide-react";
import { PiFilmReelThin } from "react-icons/pi";
import { useEffect, useState } from "react";
import axios from "axios";
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification"; // Import Notification component

const GumSwapTable = () => {
  const [formData, setFormData] = useState({
    type: "",
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

  // Fetch initial data
  useEffect(() => {
    fetchSwaps();
    fetchFactories();
  }, []);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/api/swaps");
      setSwaps(response.data.swaps || []);
    } catch (err) {
      console.error("Error fetching swaps:", err);
      setError("Error fetching swaps");
      showNotification("Error fetching swaps.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFactories = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/factories");
      console.log("Factories response:", response.data);
      setFactories(response.data.factories || []);
    } catch (err) {
      console.error("Error fetching factories:", err);
      showNotification("Error fetching factories.", "error");
    }
  };

  // Fetch products by type
  const fetchProductsByType = async (type) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/swaps/products-by-type/${type.toLowerCase()}`);
      console.log("Products by type response:", response.data);
      setProducts(response.data.products || []);
      return response.data.products || [];
    } catch (err) {
      console.error("Error fetching products by type:", err);
      setProducts([]);
      showNotification("Error fetching products.", "error");
      return [];
    }
  };

  // Fetch available factories for a product (excluding current factory)
  const fetchAvailableFactories = async (productId, excludeFactoryId) => {
    console.log("Fetching available factories for product:", productId, "excluding factory:", excludeFactoryId);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/swaps/factories-by-product?product_id=${productId}&exclude_factory_id=${excludeFactoryId}`
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
  };

  // Handle type change
  useEffect(() => {
    if (formData.type && !editingSwap) {
      fetchProductsByType(formData.type);
      setFormData(prev => ({
        ...prev,
        productId: "",
        stockId: "",
        fromFactory: "",
        toFactory: "",
        qty: ""
      }));
    } else if (!formData.type) {
      setProducts([]);
      setProductStocks([]);
    }
  }, [formData.type, editingSwap]);

  // Handle product change
  useEffect(() => {
    if (formData.productId && !editingSwap) {
      const selectedProduct = products.find(p => p.id === formData.productId);
      if (selectedProduct) {
        console.log("Selected product stocks:", selectedProduct.stocks);
        setProductStocks(selectedProduct.stocks || []);
        setFormData(prev => ({
          ...prev,
          stockId: "",
          fromFactory: "",
          toFactory: "",
          qty: ""
        }));
      }
    } else if (!formData.productId) {
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

  // Handle stock selection (which determines the from factory)
  useEffect(() => {
    if (formData.stockId && formData.productId) {
      console.log("Selected stock ID:", formData.stockId);
      console.log("Product id:", formData.productId);
      console.log("productStocks:", productStocks);
      
      // Debug: Log all stock objects to see their structure
      productStocks.forEach((stock, index) => {
        console.log(`Stock ${index}:`, stock);
        console.log(`Stock ${index} keys:`, Object.keys(stock));
      });
      
      // Try multiple possible property names for stock identification
      const selectedStock = productStocks.find(stock => {
        // Check multiple possible property names
        const stockId = stock.stock_id || stock.id || stock.stockId || stock.factory_id;
        console.log(`Comparing ${formData.stockId} with ${stockId}`);
        return stockId?.toString().toLowerCase().trim() === formData.stockId.toLowerCase().trim();
      });
      
      console.log("Selected stock:", selectedStock);
      
      if (selectedStock) {
        const factoryId = selectedStock.factory_id || selectedStock.factoryId;
        setFormData(prev => ({
          ...prev,
          fromFactory: factoryId,
          toFactory: editingSwap ? prev.toFactory : ""
        }));
        // Fetch available factories for this product (excluding current factory)
        if (!editingSwap || editingSwap.from_factory_id !== factoryId) {
          fetchAvailableFactories(formData.productId, factoryId);
        }
      } else {
        console.warn("Stock not found! Available stocks:", productStocks);
      }
    } else if (!editingSwap) {
      setFormData(prev => ({
        ...prev,
        fromFactory: "",
        toFactory: ""
      }));
      setAvailableFactories([]);
    }
  }, [formData.stockId, formData.productId, productStocks, editingSwap]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
const validateForm = () => {
  const errors = {};

  // Basic validations
  if (!formData.type) errors.type = "Type is required";
  if (!formData.productId) errors.productId = "Product is required";
  if (!formData.stockId) errors.stockId = "Please select a factory stock";
  if (!formData.fromFactory) errors.fromFactory = "From Factory is required";
  if (!formData.toFactory) errors.toFactory = "To Factory is required";
  if (!formData.qty || Number(formData.qty) <= 0) {
    errors.qty = "Quantity must be greater than 0";
  }

  // Stock availability validation
  const selectedStock = getSelectedStock();
  if (selectedStock && formData.qty) {
    const currentStock = parseFloat(selectedStock.current_stock) || 0;
    const requestedQty = parseFloat(formData.qty) || 0;

    let maxAllowedQuantity = currentStock;

    // Check if it's in edit mode for the same factory and product
    const isEditingSameItem =
      editingSwap &&
      editingSwap.from_factory_id === selectedStock.factory_id &&
      editingSwap.product_id === formData.productId;

    if (isEditingSameItem) {
      const originalSwapQty = parseFloat(editingSwap.quantity) || 0;
      maxAllowedQuantity = currentStock + originalSwapQty;

      console.log(
        `Edit mode: Current stock: ${currentStock}, Original swap: ${originalSwapQty}, Max allowed: ${maxAllowedQuantity}`
      );
    }

    if (requestedQty > maxAllowedQuantity) {
      errors.qty = isEditingSameItem
        ? `Insufficient stock. Currently available: ${currentStock} kgs. Maximum allowed (including previous swap): ${maxAllowedQuantity} kgs.`
        : `Insufficient stock. Available: ${currentStock} kgs.`;
    }
  }

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
};


const getMaxAllowedQuantity = () => {
  const selectedStock = getSelectedStock();
  if (!selectedStock) return 0;

  const currentStock = parseFloat(selectedStock.current_stock) || 0;
  let maxAllowed = currentStock;

  if (
    editingSwap &&
    editingSwap.from_factory_id === selectedStock.factory_id &&
    editingSwap.product_id === formData.productId
  ) {
    const editingQty = parseFloat(editingSwap.quantity) || 0;
    maxAllowed = currentStock + editingQty;
    console.log(currentStock, editingQty, maxAllowed);
  }

  return maxAllowed;
};


  const handleSubmit = async () => {
    if (!validateForm()) return;

    const swapData = {
      type: formData.type,
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
        response = await axios.put(`http://localhost:8000/api/swaps/${editingSwap.id}`, swapData);
        successMessage = "Swap updated successfully!";
      } else {
        response = await axios.post("http://localhost:8000/api/swaps", swapData);
        successMessage = "Swap created successfully!";
      }

      if (response.status === 200 || response.status === 201) {
        await fetchSwaps(); // Refresh the swaps list
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

  const handleEdit = async (swap) => {
    console.log("Editing swap:", swap);
    setEditingSwap(swap);
    setError(null);
    
    // First set the basic form data
    setFormData({
      type: swap.type,
      productId: swap.product_id,
      stockId: "", // Will be set after products load
      fromFactory: swap.from_factory_id,
      toFactory: swap.to_factory_id,
      qty: swap.quantity.toString(),
    });

    // Fetch products by type first
    const fetchedProducts = await fetchProductsByType(swap.type);
    
    // Find the product and set its stocks
    const selectedProduct = fetchedProducts.find(p => p.id === swap.product_id);
    if (selectedProduct && selectedProduct.stocks) {
      setProductStocks(selectedProduct.stocks);
      
      // Find the correct stock entry that matches the from_factory_id
      const matchingStock = selectedProduct.stocks.find(stock => 
        stock.factory_id === swap.from_factory_id
      );
      
      if (matchingStock) {
        const stockId = matchingStock.stock_id || matchingStock.id || matchingStock.stockId || matchingStock.factory_id;
        
        // Update form data with the correct stock ID
        setFormData(prev => ({
          ...prev,
          stockId: stockId.toString()
        }));
      }
    }

    // Fetch available factories (excluding the from factory)
    await fetchAvailableFactories(swap.product_id, swap.from_factory_id);
    
    setShowModal(true);
  };

  // Function to open the delete confirmation modal
  const handleDeleteClick = (swapRow) => {
    // Find the actual swap object using the row id
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
      const response = await axios.delete(`http://localhost:8000/api/swaps/${deletingSwap.id}`);
      
      if (response.status === 200 || response.status === 204) {
        await fetchSwaps(); // Refresh the swaps list
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

  const resetForm = () => {
    setFormData({
      type: "",
      productId: "",
      stockId: "",
      fromFactory: "",
      toFactory: "",
      qty: "",
    });
    setFormErrors({});
    setShowModal(false);
    setEditingSwap(null);
    setProducts([]);
    setProductStocks([]);
    setAvailableFactories([]);
    setError(null);
  };

  // Get factory name by ID
  const getFactoryName = (factoryId) => {
    const factory = factories.find(f => f.id === factoryId);
    return factory ? factory.factory_name : "";
  };

  // Get selected stock info - Updated to handle different property names
  const getSelectedStock = () => {
    return productStocks.find(stock => {
      const stockId = stock.stock_id || stock.id || stock.stockId || stock.factory_id;
      return stockId?.toString() === formData.stockId;
    });
  };

  // Get selected product info
  const getSelectedProduct = () => {
    return products.find(p => p.id === formData.productId);
  };

  // Get selected product stock info - similar to GumUsage component
  const getSelectedProductInfo = () => {
    if (formData.stockId) {
      const stock = productStocks.find(
        (s) => {
          const stockId = s.stock_id || s.id || s.stockId || s.factory_id;
          return stockId?.toString() === formData.stockId;
        }
      );
      return stock;
    }
    return null;
  };

  const columns = [
    { key: "type", label: "Type" },
    { key: "product", label: "Product" },
    { key: "from_factory", label: "From Factory" },
    { key: "to_factory", label: "To Factory" },
    { key: "quantity", label: "Quantity" },
  ];

  const tableData = swaps.map((swap) => ({
    type: swap.type || "N/A",
    product: swap.Product?.product_name || "N/A",
    from_factory: swap.fromFactory?.factory_name || "N/A",
    to_factory: swap.toFactory?.factory_name || "N/A",
    quantity: swap.quantity ? `${swap.quantity} kgs` : "N/A",
    id: swap.id, // Required for onEdit/onDelete handlers
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
                    <span>Gum & Ink</span>
                  </span>
                  <ChevronRight className="w-4 h-4" />
                  <FileText className="w-4 h-4 text-black" />
                  <span className="text-black font-semibold ml-1">Swap</span>
                </div>
         <button
          onClick={() => {
            resetForm(); // Reset form first to clear any previous edit state
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
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={editingSwap || submitting} // Disable type selection in edit mode
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Type</option>
                  <option value="Gum">Gum</option>
                  <option value="Ink">Ink</option>
                </select>
                {formErrors.type && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.type}</p>
                )}
              </div>

              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!formData.type || editingSwap || submitting}
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

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Factory Stock</label>
                <select
                  name="stockId"
                  value={formData.stockId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!formData.productId || editingSwap || submitting}
                >
                  <option value="">Select Stock</option>
                  {productStocks.map((stock, index) => {
                    // Handle different possible property names for stock identification
                    const stockId = stock.stock_id || stock.id || stock.stockId || stock.factory_id;
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

              {/* Show selected stock info - Similar to GumUsage component */}
              {getSelectedProductInfo() && (
                <div className="bg-blue-50 p-3 rounded-md">
                
                  <p className="text-sm text-blue-800">
                    <strong>Current Available Stock:</strong> {getSelectedProductInfo().current_stock} kgs
                  </p>
                  {editingSwap && (
                    <p className="text-sm text-blue-800">
                      <strong>Original Swap Quantity:</strong> {editingSwap.quantity} kgs
                    </p>
                  )}
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
    Quantity (kgs)
  </label>
  <input
    type="number"
    name="qty"
    value={formData.qty}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
    placeholder="Enter quantity"
    min="1"
    max={getMaxAllowedQuantity() || undefined}
    disabled={submitting}
  />

  {getSelectedProductInfo() && (
    <p className="text-xs text-gray-500 mt-1">
      {editingSwap ? (
        <>
          Current available: {getSelectedProductInfo().current_stock} kgs | 
          Maximum allowed: {getMaxAllowedQuantity()} kgs
        </>
      ) : (
        <>Maximum: {getMaxAllowedQuantity()} kgs</>
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

export default GumSwapTable;