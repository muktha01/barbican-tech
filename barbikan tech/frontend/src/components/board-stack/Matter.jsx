import React, { useState, useEffect } from "react";
import { ChevronRight, Pencil, Trash, FileText, PlusCircle, RotateCw, X } from "lucide-react";
import { PiBuildingsLight } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";
import axios from "axios";
import ReusableTable from "../Dashboard/reusableTable";
import Notification from "../Dashboard/notification";

const OffsetMatterList = () => {
  const [pressCompanies, setPressCompanies] = useState([]);
  const [offsetMatters, setOffsetMatters] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingMatter, setDeletingMatter] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentMatterId, setCurrentMatterId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    press: "", // This will hold the company_id selected from the dropdown
    matter: "",
    printingSize: "",
    plate: "",
    color: "",
    extraColor: "",
    contactDetails: "",
    printingDetails: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    fetchOffsetMatters();
  }, []);

  const fetchOffsetMatters = async () => {
    setLoading(true);
    setError(null);
    closeNotification();
    try {
      const response = await axios.get("http://localhost:8000/api/distributorCompany");
      if (response.status === 200) {
        console.log("Fetched data:", response.data.data); // Debug log
        setOffsetMatters(Array.isArray(response.data.data) ? response.data.data : response.data);
      } else {
        showNotification("No offset matters found.", "info");
      }
    } catch (err) {
      console.error("Error fetching offset matters:", err);
      const errorMessage = err.response?.data?.message || "Error fetching offset matters.";
      showNotification(errorMessage, "error");
      setOffsetMatters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error && (e.target.name === 'press' || e.target.name === 'matter' || e.target.name === 'printingSize' || e.target.name === 'plate' || e.target.name === 'color')) {
        setError(null);
    }
  };

  const resetFormData = () => {
    setFormData({
      press: "",
      matter: "",
      printingSize: "",
      plate: "",
      color: "",
      extraColor: "",
      contactDetails: "",
      printingDetails: "",
    });
    setIsEditMode(false);
    setCurrentMatterId(null);
    setError(null);
  };

  // When setting data for edit, ensure formData.press gets the company_id,
  // but also store the company_name for the PUT payload.
  const handleEdit = (item) => {
    setError(null);
    setFormData({
      press: item.Company?.id || "", // Store the ID for the dropdown value
      matter: item.matter || "",
      printingSize: item.printingSize || "",
      plate: item.plate || "",
      color: item.color || "",
      extraColor: item.extraColor || "",
      contactDetails: item.contactDetails || "",
      printingDetails: item.printingDetails || "",
    });
    setCurrentMatterId(item.id);
    setIsEditMode(true);
    setShowModal(true);
  };

const handleSubmit = async () => {
    // ... (client-side validation remains the same)

    setSubmitLoading(true);
    setError(null);
    closeNotification();

    try {
      let payload = {};
      let response;
      let successMessage;

      if (isEditMode) {
        // For UPDATE (PUT) operation, backend expects `company_name` not `company_id`
        // Find the company name corresponding to the selected ID
        const selectedCompany = pressCompanies.find(
          (company) => company.id === formData.press
        );

        if (!selectedCompany) {
          setError("Selected Press Company not found.");
          showNotification("Selected Press Company not found.", "error");
          setSubmitLoading(false);
          return;
        }

        payload = {
          // Send company_name for update, as per your backend's updateDistributorCompanyById
          company_name: selectedCompany.company_name, // This is for the backend's PUT route
          matter: formData.matter,
          printingSize: formData.printingSize,
          plate: formData.plate,
          color: formData.color,
          extraColor: formData.extraColor || null,
          contactDetails: formData.contactDetails || null,
          printingDetails: formData.printingDetails || null,
        };

        response = await axios.put(
          `http://localhost:8000/api/distributorCompany/${currentMatterId}`,
          payload
        );
        successMessage = "Offset matter updated successfully!";

      } else {
        // For CREATE (POST) operation, backend's createDistributorCompany expects `press`
        payload = {
          press: formData.press, // <--- CHANGE THIS FROM `company_id` TO `press`
          matter: formData.matter,
          printingSize: formData.printingSize,
          plate: formData.plate,
          color: formData.color,
          extraColor: formData.extraColor || null,
          contactDetails: formData.contactDetails || null,
          printingDetails: formData.printingDetails || null,
        };

        response = await axios.post("http://localhost:8000/api/distributorCompany", payload);
        successMessage = "Offset matter created successfully!";
      }

      if (response.status === 200 || response.status === 201) {
        fetchOffsetMatters();
        setShowModal(false);
        resetFormData();
        showNotification(successMessage, "success");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      let errorMessage = "Failed to save offset matter. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
         errorMessage = error.message;
      }
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (matter) => {
    setDeletingMatter(matter);
    setShowDeleteModal(true);
    setError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMatter) return;

    setLoading(true);
    setError(null);
    closeNotification();

    try {
      await axios.delete(`http://localhost:8000/api/distributorCompany/${deletingMatter.id}`);
      fetchOffsetMatters();
      showNotification("Offset matter deleted successfully!", "delete-success");
      setShowDeleteModal(false);
      setDeletingMatter(null);
    } catch (err) {
      console.error("Error deleting matter:", err);
      const errorMessage = err.response?.data?.message || "Error deleting offset matter.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingMatter(null);
    setError(null);
  };

  const handleFocusToGetPressCompanies = async () => {
    if (pressCompanies.length > 0) {
      return;
    }
    try {
      const response = await axios.get("http://localhost:8000/api/boardstock");
      if (response.status === 200) {
        setPressCompanies(response.data);
      }
    } catch (error) {
      console.error("Error fetching press companies:", error);
      showNotification("Failed to load press companies.", "error");
    }
  };

  // Transform and filter the data
  const transformedData = offsetMatters.map((item) => ({
    ...item,
    companyName: item.Company?.company_name || 'N/A',
    formattedCreatedAt: new Date(item.createdAt || item.updatedAt).toLocaleDateString()
  }));

  const filteredData = transformedData.filter((item) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const companyName = item.companyName?.toLowerCase() || '';
    const matter = item.matter?.toLowerCase() || '';
    const printingSize = item.printingSize?.toLowerCase() || '';
    const plate = item.plate?.toLowerCase() || '';
    const color = item.color?.toLowerCase() || '';
    const extraColor = item.extraColor?.toLowerCase() || '';
    const contactDetails = item.contactDetails?.toLowerCase() || '';
    const printingDetails = item.printingDetails?.toLowerCase() || '';

    return (
      companyName.includes(lowerCaseSearchTerm) ||
      matter.includes(lowerCaseSearchTerm) ||
      printingSize.includes(lowerCaseSearchTerm) ||
      plate.includes(lowerCaseSearchTerm) ||
      color.includes(lowerCaseSearchTerm) ||
      extraColor.includes(lowerCaseSearchTerm) ||
      contactDetails.includes(lowerCaseSearchTerm) ||
      printingDetails.includes(lowerCaseSearchTerm)
    );
  });

  // Simple columns configuration without render functions
  const columns = [
    {
      key: "companyName",
      label: "Company Name"
    },
    { key: "matter", label: "Matter" },
    { 
      key: "formattedCreatedAt", 
      label: "Created At"
    },
  ];

  const getEmptyStateMessage = () => {
    if (loading) return "Loading offset matters...";
    if (searchTerm) return "No offset matters match your current search.";
    return "No offset matters added yet. Click 'Add New' to get started!";
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

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 bg-gray-50 border-b border-gray-200 gap-4">
        <div className="flex items-center text-sm text-gray-500 font-medium space-x-1">
          <span className="flex items-center space-x-1">
            <PiBuildingsLight className="w-5 h-5" />
            <span>Matter List</span>
          </span>
          <ChevronRight className="w-4 h-4" />
          <FileText className="w-4 h-4 text-black" />
          <span className="text-black font-semibold ml-1">Offset Matter</span>
        </div>
        <div className="flex items-center gap-4">
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
            onClick={() => { setShowModal(true); resetFormData(); }}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col mt-4 border border-gray-200 rounded-lg overflow-hidden min-h-0">
        <div className="h-full">
          <ReusableTable
            columns={columns}
            data={filteredData}
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

      {showModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
                <h2 className="text-2xl font-bold">
                    {isEditMode ? "Edit Offset Matter" : "Create New Offset Matter"}
                </h2>
                <button
                    onClick={() => { setShowModal(false); resetFormData(); }}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Press", name: "press", type: "select", required: true },
                  { label: "Matter", name: "matter", type: "text", required: true },
                  { label: "Printing Size", name: "printingSize", type: "text", required: true },
                  { label: "Plate", name: "plate", type: "text", required: true },
                  { label: "Color", name: "color", type: "text", required: true },
                  { label: "Extra Color", name: "extraColor", type: "text", required: false },
                  { label: "Contact Details", name: "contactDetails", type: "text", required: false },
                  { label: "Printing Details", name: "printingDetails", type: "text", required: false },
                ].map((field) => (
                  <div className="relative" key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === "select" ? (
                      <select
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        onFocus={handleFocusToGetPressCompanies}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required={field.required}
                        disabled={submitLoading}
                      >
                        <option value="">Select Company</option>
                        {pressCompanies.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.company_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                        disabled={submitLoading}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetFormData(); }}
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
                      Saving...
                    </>
                  ) : (
                    isEditMode ? "Update" : "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Offset Matter</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the matter:{" "}
              <strong>{deletingMatter?.matter}</strong>? This action cannot be undone.
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

export default OffsetMatterList;