import React, { useState, useEffect } from "react";
import { ChevronRight, FileText, Pencil, Trash } from "lucide-react";
import { PiFilmReelThin } from "react-icons/pi";
import axios from "axios";
import ReusableTable from "../Dashboard/reusableTable"; // Assuming ReusableTable is in this path
import Notification from "../Dashboard/notification"; // Assuming Notification component is available

const ReelStockSupplierForm = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // New state for delete modal
  const [deletingSupplier, setDeletingSupplier] = useState(null); // New state for supplier to delete
  const [error, setError] = useState(null);
  const [editId, setEditId] = useState(null); // Added for editing
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [notification, setNotification] = useState(null); // Notification state

  const [formData, setFormData] = useState({
    supplierName: "",
    companyName: "",
    gst: "",
    mobile: "",
  });

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Function to close notifications
  const closeNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/reelSupplier");
      if (response.status === 200) {
        setSuppliers(response.data.suppliers);
        setError(null);
      } else {
        setError("No suppliers found.");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.supplierName || !formData.companyName) {
      setError("Please fill in all required fields.");
      showNotification("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        supplier_name: formData.supplierName,
        company_name: formData.companyName,
        gst_number: formData.gst,
        mobile_number: formData.mobile,
      };

      let response;
      let successMessage;
      if (editId) {
        response = await axios.patch(
          `http://localhost:8000/api/reelSupplier/${editId}`,
          payload
        );
        successMessage = "Supplier updated successfully!";
      } else {
        response = await axios.post("http://localhost:8000/api/reelSupplier", payload);
        successMessage = "Supplier created successfully!";
      }

      if (response.status === 200 || response.status === 201) {
        fetchSuppliers();
        setShowModal(false);
        setError(null);
        resetForm();
        showNotification(successMessage, "success");
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      let errorMessage = "Failed to save supplier. Please try again.";
      if (error.response?.status === 409) {
        errorMessage = "A supplier with the same GST, company, or mobile number already exists.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: "supplier_name", label: "Supplier Name" },
    { key: "company_name", label: "Company Name" },
    { key: "gst_number", label: "GST" },
    { key: "mobile_number", label: "Mobile" },
  ];

  const handleEdit = (supplier) => {
    setError(null); // Clear any previous errors
    setFormData({
      supplierName: supplier.supplier_name,
      companyName: supplier.company_name,
      gst: supplier.gst_number || "",
      mobile: supplier.mobile_number || "",
    });
    setEditId(supplier.id);
    setShowModal(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (supplier) => {
    setDeletingSupplier(supplier);
    setShowDeleteModal(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingSupplier) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/reelSupplier/${deletingSupplier.id}`);
      fetchSuppliers();
      showNotification("Supplier deleted successfully!", "delete-success");
      setShowDeleteModal(false); // Close delete modal on success
      setDeletingSupplier(null); // Clear deleting supplier
    } catch (err) {
      console.error("Error deleting supplier:", err);
      const errorMessage = err.response?.data?.message || "Error deleting supplier.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      supplierName: "",
      companyName: "",
      gst: "",
      mobile: "",
    });
    setError(null); // Clear error on form reset
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingSupplier(null);
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

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-200 gap-4">
        <div className="flex items-center text-sm text-gray-500 font-medium space-x-1">
          <span className="flex items-center space-x-1">
            <PiFilmReelThin className="w-5 h-5" />
            <span>Reel Stock</span>
          </span>
          <ChevronRight className="w-4 h-4" />
          <FileText className="w-4 h-4 text-black" />
          <span className="text-black font-semibold ml-1">Supplier</span>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition"
        >
          Create
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border mt-3 border-gray-200">
        <div className="h-full">
          <ReusableTable
            columns={columns}
            data={suppliers}
            emptyMessage="No suppliers added yet."
            itemsPerPage={10}
            loading={loading}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            bordered={false}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 m-4">
            <h2 className="text-2xl font-bold mb-6">
              {editId ? "Edit Supplier" : "Create Supplier"}
            </h2>

            {/* Error message display within modal */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  placeholder="Enter supplier name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gst"
                  value={formData.gst}
                  onChange={handleInputChange}
                  placeholder="Enter GST number (optional)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number (optional)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                    setError(null);
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-400 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (editId ? "Updating..." : "Creating...") : (editId ? "Update" : "Create")}
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
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Supplier</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <strong>{deletingSupplier?.supplier_name}</strong>? This action cannot be undone.
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

export default ReelStockSupplierForm;