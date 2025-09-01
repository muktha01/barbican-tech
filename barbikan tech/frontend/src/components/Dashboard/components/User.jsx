import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { User, Phone, Shield, ChevronRight, FileText, X } from "lucide-react";
import { PiFilmReelThin } from "react-icons/pi";
import ReusableTable from "../reusableTable";
import Notification from "../notification";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    username: "",
    mobile_number: "",
    password: "",
    role: "staff",
  });

  // Function to show notifications
  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  // Function to close notifications
  const closeNotification = () => {
    setNotification(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.mobile_number || !formData.password) {
      setError("Please fill in all required fields.");
      showNotification("Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        mobile_number: formData.mobile_number,
        password: formData.password,
        role: formData.role,
      };

      let response;
      let successMessage;
      
      if (editId) {
        console.log(editId)
        response = await axios.put(`http://localhost:8000/api/auth/users/${editId}`, payload);
        successMessage = "User updated successfully!";
      } else {
        response = await axios.post("http://localhost:8000/api/auth/register", payload);
        successMessage = "User created successfully!";
      }

      if (response.data.message === "User registered successfully." || response.status === 200) {
        fetchUsers();
        setShowUserModal(false);
        resetForm();
        showNotification(successMessage, "success");
      }
    } catch (error) {
      console.error("Error saving user:", error);
      const errorMessage = error.response?.data?.message || "Failed to save user. Please try again.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate('/login');
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/auth/users");
      const fetchedUsers = response.data.users || [];
      setUsers(fetchedUsers);

      const adminUser = fetchedUsers.find((u) => u.role.toLowerCase() === "admin");
      setSelectedUser(adminUser || (fetchedUsers.length > 0 ? fetchedUsers[0] : null));
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Error fetching users");
      showNotification("Error fetching users.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
  };

  const getUsersCountByRole = () => {
    const counts = { admin: 0, staff: 0, total: users.length };
    users.forEach(user => {
      if (user.role.toLowerCase() === 'admin') counts.admin++;
      if (user.role.toLowerCase() === 'staff') counts.staff++;
    });
    return counts;
  };

  const userCounts = getUsersCountByRole();

  // Table columns configuration
  const columns = [
    { key: "username", label: "Username" },
    { key: "mobile_number", label: "Mobile Number" },
    { 
      key: "role", 
      label: "Role",
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value.toLowerCase() === "admin"
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800"
        }`}>
          {value}
        </span>
      )
    },
    { 
      key: "createdAt", 
      label: "Created",
      render: (value) => new Date(value).toLocaleDateString()
    },
  ];

  const handleEdit = (userData) => {
    setError(null);
    setFormData({
      username: userData.username,
      mobile_number: userData.mobile_number,
      password: "", // Don't pre-fill password for security
      role: userData.role,
    });
    setEditId(userData.id);
    setShowUserModal(true);
  };

  const handleDeleteClick = (userData) => {
    setDeletingUser(userData);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setLoading(true);
    try {
      await axios.delete(`http://localhost:8000/api/auth/users/${deletingUser.id}`);
      fetchUsers();
      showNotification("User deleted successfully!", "delete-success");
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      const errorMessage = err.response?.data?.message || "Error deleting user.";
      setError(errorMessage);
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({
      username: "",
      mobile_number: "",
      password: "",
      role: "staff",
    });
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingUser(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl flex flex-col backdrop-blur-md w-full h-full border-md p-4 sm:p-6">
      {/* Notification Component */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Header with Breadcrumb */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-2 md:px-4 py-4 bg-gray-50 border-b border-gray-200 gap-4 rounded-t-xl">
        <div className="flex items-center text-sm text-gray-500 font-medium space-x-1">
          <span className="flex items-center space-x-1">
            <PiFilmReelThin className="w-5 h-5" />
            <span>Management</span>
          </span>
          <ChevronRight className="w-4 h-4" />
          <FileText className="w-4 h-4 text-black" />
          <span className="text-black font-semibold ml-1">Users</span>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowUserModal(true);
          }}
          className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition"
        >
          Create User
        </button>
      </div>

      {/* Current User Section */}
      <div className="p-4 rounded-xl mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Current User</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Username */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-red-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Username</p>
              <p className="text-lg font-semibold text-gray-900 truncate">{user.username}</p>
            </div>
          </div>

          {/* Mobile Number */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Mobile</p>
              <p className="text-lg font-semibold text-gray-900 truncate">{user.mobile_number}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors sm:col-span-2 lg:col-span-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              user.role.toLowerCase() === 'admin' 
                ? 'bg-red-100' 
                : 'bg-purple-100'
            }`}>
              <Shield className={`w-5 h-5 ${
                user.role.toLowerCase() === 'admin' 
                  ? 'text-red-600' 
                  : 'text-purple-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Role</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-semibold text-gray-900">{user.role}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  user.role.toLowerCase() === 'admin' 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                }`}>
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
       
      {/* Users Statistics */}
      <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{userCounts.total}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-red-600">{userCounts.admin}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Staff Members</p>
              <p className="text-2xl font-bold text-green-600">{userCounts.staff}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-2xl font-bold text-purple-600">1</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-200">
        <div className="h-full">
          <ReusableTable
            columns={columns}
            data={users}
            emptyMessage="No users found."
            itemsPerPage={10}
            loading={loading}
            showActions={true}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            bordered={false}
          />
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0  bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200">
              <h2 className="text-2xl font-bold">
                {editId ? "Edit User" : "Create User"}
              </h2>
              <button
                onClick={() => { setShowUserModal(false); resetForm(); }}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form className="space-y-4 pt-4 overflow-y-auto" onSubmit={handleAddUser}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  placeholder="Enter mobile number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editId ? "Enter new password (leave blank to keep current)" : "Enter password"}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required={!editId}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  disabled={loading}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && (
                <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-400 transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
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
        <div className="fixed inset-0  bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Delete User</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <strong>{deletingUser?.username}</strong>? This action cannot be undone.
            </p>

            {error && (
              <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 rounded-md border border-red-200">{error}</div>
            )}

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 transition px-4 py-2"
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
}