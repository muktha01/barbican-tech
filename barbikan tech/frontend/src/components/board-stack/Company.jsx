import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Pencil,
  Trash,
  Factory,
  Search,
  X,
  PlusCircle,
  RotateCw,
  CheckCircle,
  Info, // Added for info notifications
  FileText // Added for the breadcrumb icon, similar to GumSupplier
} from "lucide-react";
import axios from "axios"; // Using axios for consistency with GumSupplier
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification";

const OffsetCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Changed to null to match GumSupplier's error state for modal
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);

  // New states for notification and delete modal
  const [notification, setNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    person: "",
    phone: "",
    gst: "",
    address: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Function to close notifications
  const closeNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    closeNotification(); // Clear any previous notification on new fetch
    try {
      const response = await axios.get("http://localhost:8000/api/boardstock");
      if (response.status === 200) {
        setCompanies(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } else {
        setError("No companies found.");
        showNotification("No companies found.", "info");
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      const errorMessage = err.response?.data?.message || "Error fetching companies.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

    // Filter companies based on search term
const filteredData = companies.filter((company) => {
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  return (
    company.company_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
    company.person_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
    company.phone_number?.toLowerCase().includes(lowerCaseSearchTerm) ||
    company.gst_number?.toLowerCase().includes(lowerCaseSearchTerm) ||
    company.address?.toLowerCase().includes(lowerCaseSearchTerm)
  );
});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: "" });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Company name is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({ name: "", person: "", phone: "", gst: "", address: "" });
    setFormErrors({});
    setError(null); // Clear modal error
    setIsEditMode(false);
    setEditingCompany(null);
  };

  const handleEdit = (company) => {
    setError(null); // Clear any previous modal errors
    setFormData({
      name: company.company_name || "",
      person: company.person_name || "",
      phone: company.phone_number || "",
      gst: company.gst_number || "",
      address: company.address || "",
    });
    setEditingCompany(company);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please correct the form errors.");
      showNotification("Please correct the form errors.", "error");
      return;
    }

    setSubmitLoading(true);
    setError(null); // Clear modal error before submission
    closeNotification(); // Clear previous notifications

    try {
      const payload = {
        company_name: formData.name.trim(),
        person_name: formData.person.trim() || null,
        phone_number: formData.phone.trim() || null,
        gst_number: formData.gst.trim() || null,
        address: formData.address.trim() || null,
      };

      let response;
      let successMessage;

      if (isEditMode) {
        response = await axios.post( // Use patch for updating, as typical for REST APIs
          `http://localhost:8000/api/boardstock/${editingCompany.id}`,
          payload
        );
        successMessage = "Company updated successfully!";
      } else {
        response = await axios.post(
          "http://localhost:8000/api/boardstock",
          payload
        );
        successMessage = "Company added successfully!";
      }

      if (response.status === 200 || response.status === 201) {
        fetchCompanies(); // Re-fetch to get the updated/new list
        handleCloseModal();
        showNotification(successMessage, "success");
      }
    } catch (err) {
      console.error("Submit error:", err);
      let errorMessage = "Failed to save company. Please try again.";
      if (err.response?.status === 409) {
        errorMessage = "A company with similar details already exists."; // Example conflict message
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage); // Set error for modal
      showNotification(errorMessage, "error"); // Show notification
    } finally {
      setSubmitLoading(false);
    }
  };

  // ReusableTable columns
  const columns = [
    { key: "company_name", label: "Company Name" },
    { key: "person_name", label: "Contact Person" },
    { key: "phone_number", label: "Mobile Number" },
    { key: "gst_number", label: "GST NO" },
    { key: "address", label: "Address" },
  ];

  // Open delete confirmation modal
  const handleDeleteClick = (company) => {
    setDeletingCompany(company);
    setShowDeleteModal(true);
    setError(null); // Clear any previous modal error
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;

    setLoading(true); // Set main loading for the delete operation
    setError(null); // Clear modal error
    closeNotification(); // Clear existing notifications

    try {
      await axios.delete(`http://localhost:8000/api/boardstock/${deletingCompany.id}`);
      fetchCompanies(); // Re-fetch the list after deletion
      showNotification("Company deleted successfully!", "delete-success"); // Use a specific type for delete success if needed for styling
      setShowDeleteModal(false);
      setDeletingCompany(null);
    } catch (err) {
      console.error("Error deleting company:", err);
      const errorMessage = err.response?.data?.message || "Error deleting company.";
      setError(errorMessage); // Set error for the delete modal
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    setError(null); // Clear error when closing the modal
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingCompany(null);
    setError(null); // Clear error when closing delete modal
  };

  const getEmptyStateMessage = () => {
    if (loading) return "Loading companies...";
    if (searchTerm) return "No companies match your current search.";
    return "No offset companies added yet. Click 'Add New' to get started!";
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl w-full h-full p-6 sm:p-10 border-md flex flex-col min-h-[80vh]">
      {/* Notification Component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Header */}
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row items-start lg:items-center justify-between px-2 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center text-xs sm:text-sm text-gray-500 font-medium space-x-1">
          <span className="flex items-center space-x-1">
            <Factory className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Company List</span>
          </span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
          <span className="text-black font-semibold ml-1">Offset Company</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border rounded-md w-full lg:w-64 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <Search className="absolute left-2 sm:left-3 top-2.5 text-gray-400" size={16} />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 sm:right-3 top-2.5 text-gray-500 hover:text-gray-700"
                title="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-red-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 transition whitespace-nowrap flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Reusable Table */}
      <div className="flex-grow mt-4 border border-gray-200 rounded-lg overflow-hidden min-h-0">
        <div className="h-full">
          <ReusableTable
            columns={columns}
            data={filteredData.length > 0 ? filteredData : []} // Ensure data is an array
            emptyMessage={getEmptyStateMessage()}
            itemsPerPage={10}
            loading={loading}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            bordered={false}
          />
        </div>
      </div>

        <div className="flex flex-col md:flex-row justify-between items-center px-4 py-2 text-gray-500 text-xs md:text-sm border-t mt-6 flex-shrink-0">
        <p>© All rights reserved by Krishna Packaging</p>
        <p className="mt-2 md:mt-0">Developed by Barbikan Technologies</p>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-semibold text-black">
                {isEditMode ? 'Edit Company' : 'Add New Company'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Error message display within modal */}
            {error && (
              <div className="p-4 mx-6 mt-4 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Form Body */}
            <form className="p-6 space-y-4 overflow-y-auto flex-grow" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="col-span-1">
                  <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter company name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={formErrors.name ? "true" : "false"}
                    aria-describedby={formErrors.name ? "name-error" : undefined}
                    disabled={submitLoading}
                  />
                  {formErrors.name && (
                    <p id="name-error" className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Contact Person */}
                <div className="col-span-1">
                  <label htmlFor="person" className="block text-sm font-medium text-black mb-1">
                    Contact Person
                  </label>
                  <input
                    id="person"
                    name="person"
                    type="text"
                    placeholder="Person name (optional)"
                    value={formData.person}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    disabled={submitLoading}
                  />
                </div>

                {/* Phone Number */}
                <div className="col-span-1">
                  <label htmlFor="phone" className="block text-sm font-medium text-black mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter phone number (optional)"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    disabled={submitLoading}
                  />
                </div>

                {/* GST Number */}
                <div className="col-span-1">
                  <label htmlFor="gst" className="block text-sm font-medium text-black mb-1">
                    GST Number
                  </label>
                  <input
                    id="gst"
                    name="gst"
                    type="text"
                    placeholder="Enter GST number (optional)"
                    value={formData.gst}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                    disabled={submitLoading}
                  />
                </div>

                {/* Address (full width) */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-black mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    placeholder="Enter address (optional)"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                    disabled={submitLoading}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitLoading}
                  className="text-gray-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || !formData.name.trim()}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitLoading ? (
                    <>
                      <RotateCw className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    isEditMode ? 'Update Company' : 'Save Company'
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
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Company</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <strong>{deletingCompany?.company_name}</strong>? This action cannot be undone.
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

export default OffsetCompany;