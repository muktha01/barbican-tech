import React, { useEffect, useState } from "react";
import { ChevronRight, FileText, Pencil, Trash, PlusCircle, RotateCw, X } from "lucide-react";
import { PiFactoryLight } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification";

const OffsetStockTable = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [stockData, setStockData] = useState([]);
  const [filteredStockData, setFilteredStockData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStock, setDeletingStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    companyId: "", // This will now hold the UUID string
    stockName: "",
    unit: "",
    quantity: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  // --- Data Fetching ---

  useEffect(() => {
    fetchStockData();
  }, []);

  // --- Filtering Logic (UPDATED) ---
  useEffect(() => {
    console.log("Filtering useEffect triggered:");
    console.log("  stockData length:", stockData.length);
    console.log("  selectedCompany:", selectedCompany, typeof selectedCompany); // selectedCompany is the UUID string
    console.log("  searchTerm:", searchTerm);

    let filtered = stockData;

    if (selectedCompany) {
      // Direct comparison of strings (UUIDs)
      filtered = filtered.filter(item => {
        const itemCompanyId = item.Company?.id; // This should be the UUID string from your stock data
        const matchesCompany = itemCompanyId === selectedCompany; // Direct string comparison
        console.log(`    Item ID: ${item.id}, Company ID from item: ${itemCompanyId}, Selected Company ID: ${selectedCompany}, Matches: ${matchesCompany}`);
        return matchesCompany;
      });
      console.log("  Filtered by company, new length:", filtered.length);
    }

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const matchesStockName = item.stock_name?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesCompanyName = item.Company?.company_name?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesUnit = item.unit?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesQuantity = item.quantity?.toString().includes(lowerCaseSearchTerm);
        return matchesStockName || matchesCompanyName || matchesUnit || matchesQuantity;
      });
      console.log("  Filtered by search term, new length:", filtered.length);
    }
    setFilteredStockData(filtered);
  }, [stockData, selectedCompany, searchTerm]);

  // Fetches all stock entries from the API
  const fetchStockData = async () => {
    console.log("Attempting to fetch stock data...");
    try {
      setLoading(true);
      setError("");
      closeNotification();
      const res = await fetch("http://localhost:8000/api/boardstock_stock", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP error! status: ${res.status}, Message: ${errorData.message || res.statusText}`);
      }
      const data = await res.json();
      console.log("Stock data fetched successfully:", data);
      // IMPORTANT: Log a sample item's Company.id to confirm it's a UUID string
      if (data.length > 0) {
        console.log("Sample stock item company ID:", data[0].Company?.id, typeof data[0].Company?.id);
      }
      setStockData(data);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      const errorMessage = "Failed to fetch stock data. Please try again. " + error.message;
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetches the list of companies for the dropdown
  const handleFocusToGetCompanies = async () => {
    if (companies.length > 0) return;
    console.log("Attempting to fetch companies...");
    try {
      const res = await fetch("http://localhost:8000/api/boardstock", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`HTTP error! status: ${res.status}, Message: ${errorData.message || res.statusText}`);
      }
      const data = await res.json();
      console.log("Companies fetched successfully:", data);
      // IMPORTANT: Log a sample company ID to confirm it's a UUID string
      if (data.length > 0) {
        console.log("Sample company ID:", data[0].id, typeof data[0].id);
      }
      setCompanies(data);
    } catch (error) {
      console.error("Error fetching companies:", error);
      const errorMessage = "Failed to fetch companies. Please try again. " + error.message;
      setError(errorMessage);
      showNotification(errorMessage, "error");
    }
  };

  // --- Form Handling ---

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error && (e.target.name === 'companyId' || e.target.name === 'stockName' || e.target.name === 'quantity' || e.target.name === 'unit')) {
      setError("");
    }
  };

  const validateForm = () => {
    if (!formData.companyId) {
      setError("Please select a company");
      return false;
    }
    if (!formData.stockName.trim()) {
      setError("Please enter stock name");
      return false;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError("Please enter a valid quantity");
      return false;
    }
    if (!formData.unit) {
      setError("Please enter a unit");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");
    closeNotification();
    if (!validateForm()) {
      return;
    }
    try {
      setSubmitLoading(true);
      const submitData = {
        // Pass companyId directly as a string (UUID)
        companyId: formData.companyId,
        stockName: formData.stockName.trim(),
        unit: formData.unit,
        quantity: parseFloat(formData.quantity),
      };
      console.log("Submitting data:", submitData);

      let res;
      let url = "http://localhost:8000/api/boardstock_stock";
      let method = "POST";
      let successMessage = "Stock entry created successfully!";

      if (isEditing) {
        url = `http://localhost:8000/api/boardstock_stock/boardstock_stock/${formData.id}`;
        method = "PUT";
        successMessage = "Stock entry updated successfully!";
      }

      res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const responseData = await res.json();
      console.log("Server response:", responseData);
      if (res.ok) {
        await fetchStockData();
        setShowModal(false);
        resetForm();
        setIsEditing(false);
        showNotification(successMessage, "success");
        console.log("Stock operation successful:", responseData);
      } else {
        throw new Error(responseData.message || responseData.error || "Failed to perform stock operation");
      }
    } catch (error) {
      console.error("Error during submission:", error);
      const errorMessage = error.message || "Failed to perform stock operation. Please try again.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      companyId: "",
      stockName: "",
      unit: "",
      quantity: "",
    });
    setError("");
    setIsEditing(false);
  };

  const handleEditStockData = (item) => {
    setIsEditing(true);
    setError("");
    setFormData({
      id: item.id,
      companyId: item.Company?.id || "", // Keep as string (UUID)
      stockName: item.stock_name,
      unit: item.unit,
      quantity: item.quantity,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item) => {
    setDeletingStock(item);
    setShowDeleteModal(true);
    setError("");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStock) return;

    setLoading(true);
    setError("");
    closeNotification();

    try {
      const res = await fetch(`http://localhost:8000/api/boardstock_stock/${deletingStock.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        setStockData(prev => prev.filter(stockdata => stockdata.id !== deletingStock.id));
        showNotification("Stock entry deleted successfully!", "delete-success");
        setShowDeleteModal(false);
        setDeletingStock(null);
        console.log("Stock deleted successfully");
      } else {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete stock");
      }
    } catch (error) {
      console.error("Error deleting stock:", error);
      const errorMessage = "Failed to delete stock. Please try again.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingStock(null);
    setError("");
  };

  const handleClearFilter = () => {
    setSelectedCompany("");
    setSearchTerm("");
  };

  // Transform data for the reusable table
  const transformedData = filteredStockData.map((item) => ({
    ...item,
    companyName: item.Company?.company_name || 'N/A',
    stockDisplay: `${item.quantity} ${item.unit}`,
    formattedCreatedAt: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'
  }));

  // Table columns configuration
  const columns = [
    {
      key: "companyName",
      label: "Company Name"
    },
    { 
      key: "stock_name", 
      label: "Board/Paper" 
    },
    { 
      key: "stockDisplay", 
      label: "Current Stock" 
    },
    { 
      key: "formattedCreatedAt", 
      label: "Created Date" 
    },
  ];

  const getEmptyStateMessage = () => {
    if (loading) return "Loading stock entries...";
    if (searchTerm || selectedCompany) return "No matching stock entries found.";
    return "No stock entries added yet. Click 'Add New' to get started!";
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl w-full h-full p-6 sm:p-10 border-md flex flex-col min-h-[80vh]">
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
            <PiFactoryLight className="w-5 h-5" />
            <span>Stock List</span>
          </span>
          <ChevronRight className="w-4 h-4" />
          <FileText className="w-4 h-4 text-black" />
          <span className="text-black font-semibold ml-1">Offset Stock</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Company Filter Dropdown */}
         
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-full md:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setShowModal(true);
              setIsEditing(false);
              resetForm();
            }}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-grow flex flex-col mt-4 border border-gray-200 rounded-lg overflow-hidden min-h-0">
        <div className="h-full">
          <ReusableTable
            columns={columns}
            data={transformedData}
            emptyMessage={getEmptyStateMessage()}
            itemsPerPage={10}
            loading={loading}
            showActions={true}
            onEdit={handleEditStockData}
            onDelete={handleDeleteClick}
            bordered={false}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center px-4 py-2 text-gray-500 text-xs md:text-sm border-t mt-6 flex-shrink-0">
        <p>© All rights reserved by Krishna Packaging</p>
        <p className="mt-2 md:mt-0">Developed by Barbikan Technologies</p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
              <h2 className="text-2xl font-bold">
                {isEditing ? "Edit Stock Entry" : "Create New Stock Entry"}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm my-4 mx-2">
                {error}
              </div>
            )} */}

            <form className="space-y-4 pt-4 overflow-y-auto" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleInputChange}
                    onFocus={handleFocusToGetCompanies}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                    disabled={submitLoading}
                  >
                    <option value="">Choose Company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Board/Paper <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="stockName"
                    value={formData.stockName}
                    onChange={handleInputChange}
                    placeholder="Enter board/paper name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                    disabled={submitLoading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Opening Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="Enter quantity"
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                      disabled={submitLoading}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="e.g., kgs, grams"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required
                      disabled={submitLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-400 transition"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <RotateCw className="animate-spin h-4 w-4" />
                      {isEditing ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    isEditing ? "Update Stock" : "Add Stock"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Stock Entry</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the stock entry:{" "}
              <strong>{deletingStock?.stock_name}</strong> from{" "}
              <strong>{deletingStock?.Company?.company_name}</strong>? This action cannot be undone.
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
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffsetStockTable;