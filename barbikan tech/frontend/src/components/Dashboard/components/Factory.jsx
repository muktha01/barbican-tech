import React, { useState, useEffect } from "react";
import { CheckCircle, ChevronRight, FileText, X, XCircle } from "lucide-react";
import { PiFactoryLight } from "react-icons/pi";
import ReusableTable from "../reusableTable";
import Notification from "../notification";

const FactoryTable = () => {
  const [factories, setFactories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFactory, setEditingFactory] = useState(null);
  const [deletingFactory, setDeletingFactory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    contactPerson: "",
    mobile: "",
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Show notification function
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Close notification function
  const closeNotification = () => {
    setNotification(null);
  };

  // Define table columns
  const columns = [
    {
      key: "factory_name",
      label: "Factory Name",
    },
    {
      key: "contact_person_name",
      label: "Contact Person",
    },
    {
      key: "contact_person_mobile",
      label: "Mobile Number",
    },
    {
      key: "location",
      label: "Location",
    }
  ];

  // Fetch factories on component mount
  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/factories');
        if (response.ok) {
          const data = await response.json();
          setFactories(data.factories);
        } else {
          setError('No factories found');
          showNotification('No factories found', 'info'); // Using 'info' for no factories
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching factories');
        showNotification('Error fetching factories', 'error');
      }
    };

    fetchFactories();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Reset form data
  const resetForm = () => {
    setFormData({ name: "", location: "", contactPerson: "", mobile: "" });
    setEditingFactory(null);
    setError('');
  };

  // Open create modal
  const handleCreateClick = () => {
    resetForm();
    setShowModal(true);
  };

  // Open edit modal
  const handleEditClick = (factory) => {
    setEditingFactory(factory);
    setFormData({
      name: factory.factory_name,
      location: factory.location,
      contactPerson: factory.contact_person_name,
      mobile: factory.contact_person_mobile,
    });
    setShowModal(true);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (factory) => {
    setDeletingFactory(factory);
    setShowDeleteModal(true);
  };

  // Handle form submission (create or update)
  const handleSubmit = async () => {
    if (!formData.name || !formData.contactPerson) {
      setError('Factory Name and Contact Person are required.');
      showNotification('Factory Name and Contact Person are required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        factory_name: formData.name,
        location: formData.location,
        contact_person_name: formData.contactPerson,
        contact_person_mobile: formData.mobile,
      };

      if (editingFactory) {
        // Update existing factory
        const response = await fetch(`http://localhost:8000/api/factories/${editingFactory.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          setFactories(factories.map(f =>
            f.id === editingFactory.id ? data.factory : f
          ));
          setShowModal(false);
          resetForm();
          showNotification('Factory updated successfully!', 'success');
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to update factory');
          showNotification(errorData.message || 'Failed to update factory', 'error');
        }
      } else {
        // Create new factory
        const response = await fetch('http://localhost:8000/api/factories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.message === "Factory created successfully") {
            setFactories([...factories, data.factory]);
            setShowModal(false);
            resetForm();
            showNotification('Factory created successfully!', 'success');
          }
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to create factory');
          showNotification(errorData.message || 'Failed to create factory', 'error');
        }
      }
    } catch (error) {
      console.error('Error saving factory:', error);
      setError(`Failed to ${editingFactory ? 'update' : 'create'} factory`);
      showNotification(`Failed to ${editingFactory ? 'update' : 'create'} factory`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingFactory) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/factories/${deletingFactory.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFactories(factories.filter(f => f.id !== deletingFactory.id));
        setShowDeleteModal(false);
        setDeletingFactory(null);
        // Use the new 'delete-success' type here
        showNotification('Factory deleted successfully!', 'delete-success');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete factory');
        showNotification(errorData.message || 'Failed to delete factory', 'error');
      }
    } catch (error) {
      console.error('Error deleting factory:', error);
      setError('Failed to delete factory');
      showNotification('Failed to delete factory', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Close modals
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingFactory(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl flex p-6 flex-col backdrop-blur-md w-full h-full border-md">
      {/* Notification */}
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
            <PiFactoryLight className="w-5 h-5" />
            <span>Factory</span>
          </span>
          <ChevronRight className="w-4 h-4" />
          <FileText className="w-4 h-4 text-black" />
          <span className="text-black font-semibold ml-1">List</span>
        </div>
        <button
          onClick={handleCreateClick}
          className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition"
        >
          Create
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border mt-3 border-gray-200">
        <div className="h-full">
          <ReusableTable
            columns={columns}
            data={factories}
            emptyMessage="No factories added yet."
            itemsPerPage={10}
            loading={loading}
            showActions={true}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 mx-4">
            <h2 className="text-2xl font-bold mb-6">
              {editingFactory ? 'Edit Factory' : 'Create New Factory'}
            </h2>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-sm font-medium">Factory Name</label>
                <div className="flex items-center border rounded-md px-3 py-2 mt-1">
                  <i data-lucide="building-2" className="w-5 h-5 text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Enter factory name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium">Contact Person</label>
                <div className="flex items-center border rounded-md px-3 py-2 mt-1">
                  <i data-lucide="user" className="w-5 h-5 text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Enter contact person name"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="flex items-center border rounded-md px-3 py-2 mt-1">
                  <i data-lucide="phone" className="w-5 h-5 text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Enter phone number"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="relative">
                <label className="text-sm font-medium">Location</label>
                <div className="flex items-center border rounded-md px-3 py-2 mt-1">
                  <i data-lucide="home" className="w-5 h-5 text-gray-500 mr-2" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="flex-1 outline-none bg-transparent"
                    placeholder="Enter location"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm mt-2">{error}</div>
              )}

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingFactory ? 'Update' : 'Save')}
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
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete Factory</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingFactory?.factory_name}</strong>?
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

export default FactoryTable;