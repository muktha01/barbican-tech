import React, { useEffect, useState } from 'react';
import { FiSearch, FiPrinter, FiPlusCircle, FiX, FiRotateCw } from 'react-icons/fi';
import { ChevronRight } from 'lucide-react';
import { PiFactoryLight } from 'react-icons/pi';
import axios from 'axios';
import ReusableTable from '../Dashboard/reusableTable'; // Assuming this path is correct
import Notification from '../Dashboard/notification'; // Assuming this path is correct

const OffsetJobCardList = () => {
  const [companies, setCompanies] = useState([]);
  const [matterData, setMatterData] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedFilterStockId, setSelectedFilterStockId] = useState("");
  const [selectedMatter, setSelectedMatter] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStock, setSelectedStock] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingJobCard, setEditingJobCard] = useState(null);
  const [jobCards, setJobCards] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingJobCardId, setDeletingJobCardId] = useState(null);

  const [formData, setFormData] = useState({
    press: '',
    matter: '',
    board: '',
    company: '',
    printingSize: '',
    quantity: '',
    unit: '',
    plate: '',
    color: '',
    extraColor: '',
    contactDetails: '',
    printingDetails: '',
  });

  const showNotification = (message, type) => {
    setNotification({ message, type });
  };

  const closeNotification = () => {
    setNotification(null);
  };

  useEffect(() => {
    fetchJobCards();
  }, []);

  const fetchJobCards = async () => {
    setLoading(true);
    setError(null);
    closeNotification();
    try {
      const response = await axios.get("http://localhost:8000/api/jobcard");
      console.log("Job cards fetched:", response.data);
      setJobCards(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching job cards:", err);
      const errorMessage = err.response?.data?.message || "Error fetching job cards.";
      showNotification(errorMessage, "error");
      setJobCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle company selection with state reset
  const handleCompanyChange = (e) => {
    const value = e.target.value;
    setSelectedCompany(value);

    // Reset dependent states when company changes
    if (value === "" || value !== selectedCompany) {
      setSelectedMatter("");
      setSelectedType("");
      setSelectedStock(null);
      setMatterData([]);
      setStockData([]);
      // Reset filter stock selection
      setSelectedFilterStockId("");

      // Update form data
      setFormData(prev => ({
        ...prev,
        press: value,
        matter: '',
        board: '',
        printingSize: '',
        unit: '',
        plate: '',
        color: '',
        extraColor: '',
        contactDetails: '',
        printingDetails: '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        press: value
      }));
    }
  };

  // Handle filter company change (separate from modal company change)
  const handleFilterCompanyChange = (e) => {
    const value = e.target.value;
    setSelectedCompany(value);

    // Reset board filter when company changes
    setSelectedFilterStockId("");
    setStockData([]);

    // If a company is selected, fetch its stock data for the board filter
    if (value) {
      handleFetchStockDataForFilter(value);
    }
  };

  // Handle matter selection
  const handleMatterChange = (e) => {
    const value = e.target.value;
    setSelectedMatter(value);

    // Reset stock selection when matter changes
    setSelectedType("");
    setSelectedStock(null);
    setStockData([]);

    const selectedMatterData = matterData.find(matter => matter.id.toString() === value);

    setFormData(prev => ({
      ...prev,
      matter: value,
      board: '',
      printingSize: selectedMatterData?.printingSize || '',
      plate: selectedMatterData?.plate || '',
      color: selectedMatterData?.color || '',
      extraColor: selectedMatterData?.extraColor || '',
      contactDetails: selectedMatterData?.contactDetails || '',
      printingDetails: selectedMatterData?.printingDetails || '',
    }));
  };

  // Handle stock selection (used in modal)
  const handleStockChange = (e) => {
    const selectedStockId = e.target.value;
    const selectedStockObject = stockData.find(stock => stock.id.toString() === selectedStockId);

    setSelectedType(selectedStockId);
    setSelectedStock(selectedStockObject);

    setFormData(prev => ({
      ...prev,
      board: selectedStockId,
      unit: selectedStockObject?.unit || ''
    }));

    console.log("Selected Stock:", selectedStockObject);
  };

  // Handle filter stock selection (separate from modal stock selection)
  const handleFilterStockChange = (e) => {
    setSelectedFilterStockId(e.target.value);
  };

  // Edit Job Card Function
  const handleEdit = (jobCard) => {
    setEditingJobCard(jobCard);

    // Populate form with existing data
    setSelectedCompany(jobCard.Company?.id?.toString() || "");
    setSelectedMatter(jobCard.DistributorCompany?.id?.toString() || "");
    setSelectedType(jobCard.Stock?.id?.toString() || "");
    setSelectedStock(jobCard.Stock);

    setFormData({
      press: jobCard.Company?.id?.toString() || '',
      matter: jobCard.DistributorCompany?.id?.toString() || '',
      board: jobCard.Stock?.id?.toString() || '',
      company: jobCard.company || '',
      printingSize: jobCard.printingSize || '',
      quantity: jobCard.quantity || '',
      unit: jobCard.unit || '',
      plate: jobCard.plate || '',
      color: jobCard.color || '',
      extraColor: jobCard.extraColor || '',
      contactDetails: jobCard.contactDetails || '',
      printingDetails: jobCard.printingDetails || '',
    });

    setShowModal(true);
  };

  // Delete Job Card Function (confirmation added with handleDeleteClick)
  const handleDelete = async (jobCardId) => {
    setLoading(true);
    setError(null);
    closeNotification();
    try {
      const response = await axios.delete(`http://localhost:8000/api/jobcard/${jobCardId}`);

      if (response.status === 200) {
        // Remove from local state
        setJobCards(prevJobCards => prevJobCards.filter(card => card.id !== jobCardId));
        showNotification("Job card deleted successfully and stock returned.", "success");
      } else {
        throw new Error(response.data?.message || 'Failed to delete job card');
      }
    } catch (err) {
      console.error('Error deleting job card:', err);
      const errorMessage = err.response?.data?.message || "Error deleting job card. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeletingJobCardId(null);
    }
  };

  const handleDeleteClick = (jobCardId) => {
    setDeletingJobCardId(jobCardId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletingJobCardId(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingJobCardId) {
      handleDelete(deletingJobCardId);
    }
  };

  // Print Single Job Card Function
  const handlePrintSingle = (jobCard) => {
    const printContent = `
      <html>
        <head>
          <title>Job Card - ${jobCard.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 14px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .job-card-title {
              font-size: 18px;
              color: #666;
              margin-bottom: 10px;
            }
            .job-details {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
            }
            .detail-row {
              display: flex;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 8px;
            }
            .detail-label {
              font-weight: bold;
              width: 150px;
              color: #333;
            }
            .detail-value {
              flex: 1;
              color: #666;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Krishna Packaging</div>
            <div class="job-card-title">Job Card #${jobCard.id}</div>
            <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div class="job-details">
            <div class="detail-row">
              <div class="detail-label">Press Name:</div>
              <div class="detail-value">${jobCard?.Company?.company_name || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Board Name:</div>
              <div class="detail-value">${jobCard?.Stock?.stock_name || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Matter:</div>
              <div class="detail-value">${jobCard?.DistributorCompany?.matter || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Company:</div>
              <div class="detail-value">${jobCard?.company || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Printing Size:</div>
              <div class="detail-value">${jobCard?.printingSize || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Previous Quantity:</div>
              <div class="detail-value">${jobCard?.currentStock || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Used Quantity:</div>
              <div class="detail-value">${jobCard?.quantity || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Balance Quantity:</div>
              <div class="detail-value">${jobCard?.Stock?.quantity || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Unit:</div>
              <div class="detail-value">${jobCard?.unit || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Plate:</div>
              <div class="detail-value">${jobCard?.plate || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Color:</div>
              <div class="detail-value">${jobCard?.color || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Extra Color:</div>
              <div class="detail-value">${jobCard?.extraColor || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Contact Details:</div>
              <div class="detail-value">${jobCard?.contactDetails || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Printing Details:</div>
              <div class="detail-value">${jobCard?.printingDetails || 'N/A'}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Created Date:</div>
              <div class="detail-value">${jobCard?.date || new Date(jobCard?.created_at).toLocaleDateString() || 'N/A'}</div>
            </div>
          </div>

          <div class="footer">
            <p>© All rights reserved by Krishna Packaging | Developed by Barbikan Technologies</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setSubmitLoading(true);
    setError(null);
    closeNotification();

    // Validate required fields
    if (!selectedCompany) {
      showNotification("Please select a company", "error");
      setSubmitLoading(false);
      return;
    }

    if (!selectedMatter) {
      showNotification("Please select a matter", "error");
      setSubmitLoading(false);
      return;
    }

    if (!selectedStock) {
      showNotification("Please select a stock item", "error");
      setSubmitLoading(false);
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      showNotification("Please enter a valid quantity", "error");
      setSubmitLoading(false);
      return;
    }

    if (!formData.company.trim()) {
      showNotification("Please enter company name", "error");
      setSubmitLoading(false);
      return;
    }

    const enteredQuantity = parseFloat(formData.quantity);
    const currentStockQuantity = parseFloat(selectedStock.quantity);

    // For edit mode, we need to consider the previous quantity
    let availableQuantity = currentStockQuantity;
    if (editingJobCard) {
      availableQuantity += parseFloat(editingJobCard.quantity);
    }

    // Check if sufficient stock is available
    if (enteredQuantity > availableQuantity) {
      showNotification(`Insufficient stock! Available quantity: ${availableQuantity} ${selectedStock.unit}`, "error");
      setSubmitLoading(false);
      return;
    }

    const submitData = {
      press: selectedCompany,
      matter: selectedMatter,
      stock_id: selectedType,
      company: formData.company,
      printingSize: formData.printingSize,
      quantity: formData.quantity,
      unit: formData.unit,
      plate: formData.plate,
      color: formData.color,
      extraColor: formData.extraColor,
      contactDetails: formData.contactDetails,
      printingDetails: formData.printingDetails,
      stockcurrent: selectedStock.quantity,
      stockName: selectedStock.stock_name
    };

    console.log("Submitting data:", submitData);

    try {
      let response;
      if (editingJobCard) {
        // Update existing job card
        response = await axios.put(`http://localhost:8000/api/jobcard/${editingJobCard.id}`, submitData);
      } else {
        // Create new job card
        response = await axios.post('http://localhost:8000/api/jobcard', submitData);
      }

      const result = response.data;

      // Calculate new stock quantity for local state update
      const newStockQuantity = editingJobCard
        ? availableQuantity - enteredQuantity
        : currentStockQuantity - enteredQuantity;

      // Create/Update the job card with proper structure to avoid N/A display
      const jobCardData = {
        ...result.jobCard || result,
        Company: {
          id: parseInt(selectedCompany),
          company_name: companies.find(c => c.id.toString() === selectedCompany)?.company_name || formData.company
        },
        Stock: {
          id: parseInt(selectedType),
          stock_name: selectedStock.stock_name,
          quantity: newStockQuantity
        },
        DistributorCompany: {
          matter: matterData.find(m => m.id.toString() === selectedMatter)?.matter || 'N/A'
        },
        currentStock: selectedStock.quantity,
        quantity: formData.quantity,
        date: new Date().toLocaleDateString()
      };

      // Update local state
      if (editingJobCard) {
        setJobCards(prevJobCards =>
          prevJobCards.map(card =>
            card.id === editingJobCard.id ? { ...jobCardData, id: editingJobCard.id } : card
          )
        );
      } else {
        setJobCards([...jobCards, jobCardData]);
      }

      // Update local stock data (for immediate reflection in modal dropdown)
      setStockData(prevStockData =>
        prevStockData.map(stock =>
          stock.id === selectedStock.id
            ? { ...stock, quantity: newStockQuantity }
            : stock
        )
      );

      // Reset all form data and selections
      resetForm();

      setShowModal(false);

      showNotification(editingJobCard
        ? `Job card updated successfully! Remaining stock: ${newStockQuantity} ${selectedStock.unit}`
        : `Job card created successfully! Remaining stock: ${newStockQuantity} ${selectedStock.unit}`,
        "success"
      );

    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMessage = err.response?.data?.message || (editingJobCard ? 'Error updating job card. Please try again.' : 'Error creating job card. Please try again.');
      showNotification(errorMessage, "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      press: '',
      matter: '',
      board: '',
      company: '',
      printingSize: '',
      quantity: '',
      unit: '',
      plate: '',
      color: '',
      extraColor: '',
      contactDetails: '',
      printingDetails: '',
    });

    // Reset all selections
    setSelectedCompany(""); // Reset company selection
    setSelectedMatter("");
    setSelectedType("");
    setSelectedStock(null);
    setMatterData([]);
    setStockData([]); // Clear stock data when resetting form for new entry
    setEditingJobCard(null);
  };

  const handleFocusToGetCompanies = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/boardstock");
      setCompanies(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching companies:", error);
      showNotification("Error fetching companies for selection.", "error");
      setCompanies([]);
    }
  };

  const handleFocusToGetMatter = async () => {
    if (!selectedCompany) {
      // No alert here, as it can be annoying if triggered by onFocus without explicit user intent
      // showNotification("Please select a company first", "warning");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/distributorCompany/${selectedCompany}`);
      const data = response.data?.data || response.data || [];
      console.log("Matter data:", data);
      setMatterData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching matter data:", error);
      showNotification("Error fetching matter data.", "error");
      setMatterData([]);
    }
  };

  const handleFetchStockData = async () => {
    if (!selectedCompany) {
      // No alert here for the same reason as above
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/boardstock_stock/${selectedCompany}`);
      const data = response.data.data || [];
      console.log("Stock data:", data);
      setStockData(data || []);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      showNotification("Error fetching stock data.", "error");
      setStockData([]);
    }
  };

  // Separate function to fetch stock data for filter
  const handleFetchStockDataForFilter = async (companyId = null) => {
    const targetCompanyId = companyId || selectedCompany;
    if (!targetCompanyId) {
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/boardstock_stock/${targetCompanyId}`);
      const data = response.data.data || [];
      console.log("Filter Stock data:", data);
      setStockData(data || []);
    } catch (error) {
      console.error("Error fetching filter stock data:", error);
      showNotification("Error fetching filter stock data.", "error");
      setStockData([]);
    }
  };

  // Print functionality
  const handlePrint = () => {
    const filteredCards = getFilteredJobCards();

    const printContent = `
      <html>
        <head>
          <title>Job Card Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 18px;
              color: #666;
            }
            div {
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Krishna Packaging</div>
            <div class="report-title">Job Card Report</div>
            <div>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Press Name</th>
                <th>Board Name</th>
                <th>Matter</th>
                <th>Previous Quantity</th>
                <th>Used Quantity</th>
                <th>Balance Quantity</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCards.map((card, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${card?.Company?.company_name || 'N/A'}</td>
                  <td>${card?.Stock?.stock_name || 'N/A'}</td>
                  <td>${card?.DistributorCompany?.matter || 'N/A'}</td>
                  <td>${card?.currentStock || 'N/A'}</td>
                  <td>${card?.quantity || 'N/A'}</td>
                  <td>${card?.Stock?.quantity || 'N/A'}</td>
                  <td>${card?.date || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>© All rights reserved by Krishna Packaging | Developed by Barbikan Technologies</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };



  const getFilteredJobCards = () => {
    return jobCards.filter(card => {
      const companyMatch = selectedCompany === "" ||
        card?.Company?.id?.toString() === selectedCompany.toString();

      const stockMatch = selectedFilterStockId === "" ||
        card?.Stock?.id?.toString() === selectedFilterStockId.toString();

      const searchMatch = searchTerm === "" ||
        card?.Company?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card?.Stock?.stock_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card?.DistributorCompany?.matter?.toLowerCase().includes(searchTerm.toLowerCase());

      return companyMatch && stockMatch && searchMatch;
    });
  };

  const transformedData = getFilteredJobCards().map((item, index) => ({
    id: item.id,
    sno: index + 1,
    pressName: item.Company?.company_name || 'N/A',
    boardName: item.Stock?.stock_name || 'N/A',
    matter: item.DistributorCompany?.matter || 'N/A',
    previousQuantity: item.currentStock || 'N/A',
    usedQuantity: item.quantity || 'N/A',
    balanceQuantity: item.Stock?.quantity || 'N/A',
    createdDate: item.date || new Date(item.created_at).toLocaleDateString(),
    originalItem: item, // Keep original item for edit/delete
  }));

  const columns = [
    { key: "pressName", label: "Press Name" },
    { key: "boardName", label: "Board Name" },
    { key: "matter", label: "Matter" },
    { key: "previousQuantity", label: "Previous Qty" },
    { key: "usedQuantity", label: "Used Qty" },
    { key: "balanceQuantity", label: "Balance Qty" },
    { key: "createdDate", label: "Created Date" },
  ];

  const getEmptyStateMessage = () => {
    if (loading) return "Loading job cards...";
    if (searchTerm || selectedCompany || selectedFilterStockId) return "No job cards match your current filters.";
    return "No job cards added yet. Click 'Add New' to get started!";
  };

  const handleClearFilters = () => {
    setSelectedCompany("");
    setSelectedFilterStockId("");
    setStockData([]);
    setSearchTerm("");
    fetchJobCards(); // Re-fetch all job cards to clear visual filters
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const isFormValid = () => {
    if (!selectedCompany || !selectedMatter || !selectedStock || !formData.company.trim() || !formData.quantity) {
      return false;
    }
    const enteredQuantity = parseFloat(formData.quantity);
    if (isNaN(enteredQuantity) || enteredQuantity <= 0) {
      return false;
    }
    const currentStockQuantity = parseFloat(selectedStock.quantity);
    let availableQuantity = currentStockQuantity;
    if (editingJobCard) {
      availableQuantity += parseFloat(editingJobCard.quantity);
    }
    return enteredQuantity <= availableQuantity;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl w-full h-full p-4 sm:p-6 lg:p-10 flex flex-col min-h-[80vh]">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      {/* Header and Add New Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-2 sm:px-4 lg:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 gap-4">
        <div className="flex items-center text-sm sm:text-base text-gray-500 font-medium space-x-1">
          <span className="flex items-center space-x-1">
            <PiFactoryLight className="w-5 h-5 text-gray-600" />
            <span>Job Card List</span>
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 font-semibold ml-1">Offset Job Cards</span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700 transition"
                title="Clear search"
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setEditingJobCard(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition duration-200 ease-in-out flex items-center justify-center gap-1 shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <FiPlusCircle className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 w-full mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
        <div className="flex-1 min-w-0 relative">
          <label htmlFor="company-filter" className="sr-only">Filter by Company</label>
          <select
            id="company-filter"
            value={selectedCompany}
            onChange={handleFilterCompanyChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm appearance-none pr-8"
            onFocus={handleFocusToGetCompanies}
          >
            <option value="">Choose Company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <div className="flex-1 min-w-0 relative">
          <label htmlFor="board-filter" className="sr-only">Filter by Board</label>
          <select
            id="board-filter"
            value={selectedFilterStockId}
            onChange={handleFilterStockChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm appearance-none pr-8"
            onFocus={() => handleFetchStockDataForFilter()}
            disabled={!selectedCompany}
          >
            <option value="">Choose Board</option>
            {(Array.isArray(stockData) ? stockData : []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.stock_name}
              </option>
            ))}
          </select>
           <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition duration-200 ease-in-out flex items-center justify-center gap-1 w-full sm:w-auto shadow-md hover:shadow-lg"
            title="Print Report"
          >
            <FiPrinter className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition duration-200 ease-in-out flex items-center justify-center gap-1 w-full sm:w-auto shadow-md hover:shadow-lg"
            title="Clear Filters"
          >
            <FiX className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {/* Reusable Table */}
      <div className="flex-grow flex flex-col mt-4 border border-gray-200 rounded-lg overflow-hidden min-h-0 shadow-md">
        <div className="h-full overflow-x-auto"> {/* Added overflow-x-auto for horizontal scrolling on small screens */}
          <ReusableTable
            columns={columns}
            data={transformedData}
            emptyMessage={getEmptyStateMessage()}
            itemsPerPage={10}
            loading={loading}
            showActions={true}
            customActionButtons={[
              {
                icon: <FiPrinter className="w-4 h-4 text-green-600" />,
                onClick: (item) => handlePrintSingle(item.originalItem),
                tooltip: "Print Job Card"
              }
            ]}
            onEdit={(item) => handleEdit(item.originalItem)}
            onDelete={(item) => handleDeleteClick(item.id)}

            bordered={false}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row justify-between items-center px-4 py-2 text-gray-500 text-xs md:text-sm border-t mt-6 flex-shrink-0 bg-gray-50 rounded-b-3xl">
        <p className="text-gray-600 text-center md:text-left">© All rights reserved by Krishna Packaging</p>
        <p className="mt-2 md:mt-0 text-gray-600 text-center md:text-right">Developed by Barbikan Technologies</p>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl p-6 sm:p-8 max-h-[95vh] flex flex-col border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {editingJobCard ? "Edit Job Card" : "Create New Job Card"}
              </h2>
              <button
                onClick={handleModalClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <form className="space-y-4 sm:space-y-5 overflow-y-auto pr-2 custom-scrollbar" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="relative">
                  <label htmlFor="press" className="block text-sm font-medium text-gray-700 mb-1">Press <span className="text-red-500">*</span></label>
                  <select
                    id="press"
                    name="press"
                    value={selectedCompany}
                    onChange={handleCompanyChange}
                    onFocus={handleFocusToGetCompanies}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none pr-8"
                    required
                    disabled={submitLoading}
                  >
                    <option value="">Select Press</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 top-[28px]">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="matter" className="block text-sm font-medium text-gray-700 mb-1">Matter <span className="text-red-500">*</span></label>
                  <select
                    id="matter"
                    name="matter"
                    value={selectedMatter}
                    onChange={handleMatterChange}
                    onFocus={handleFocusToGetMatter}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none pr-8"
                    disabled={!selectedCompany || submitLoading}
                    required
                  >
                    <option value="">Select Matter</option>
                    {matterData.map((matter) => (
                      <option key={matter.id} value={matter.id}>
                        {matter.matter}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 top-[28px]">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>

                <div className="col-span-1 sm:col-span-2 relative">
                  <label htmlFor="board" className="block text-sm font-medium text-gray-700 mb-1">Board/Paper <span className="text-red-500">*</span></label>
                  <select
                    id="board"
                    name="board"
                    value={selectedType}
                    onChange={handleStockChange}
                    onFocus={handleFetchStockData}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed appearance-none pr-8"
                    disabled={!selectedCompany || submitLoading}
                    required
                  >
                    <option value="">Select Board/Paper</option>
                    {(Array.isArray(stockData) ? stockData : []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.stock_name} - Available: {item.quantity} {item.unit}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 top-[28px]">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                  {selectedStock && (
                    <p className="text-xs text-gray-600 mt-1 pl-1">
                      Selected: <span className="font-semibold">{selectedStock.stock_name}</span> | Available: <span className="font-semibold">{selectedStock.quantity} {selectedStock.unit}</span>
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    placeholder="Enter Company Name"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={submitLoading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="printingSize" className="block text-sm font-medium text-gray-700 mb-1">Printing Size</label>
                  <input
                    type="text"
                    id="printingSize"
                    name="printingSize"
                    placeholder="Printing Size"
                    value={formData.printingSize}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled={submitLoading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    placeholder="Enter Quantity"
                    min="0"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-red-500 focus:border-red-500 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={submitLoading}
                  />
                  {selectedStock && formData.quantity && parseFloat(formData.quantity) > (selectedStock.quantity + (editingJobCard ? parseFloat(editingJobCard.quantity) : 0)) && (
                    <p className="text-red-600 text-xs mt-1 pl-1 font-medium">
                      Insufficient stock! Available: {selectedStock.quantity + (editingJobCard ? parseFloat(editingJobCard.quantity) : 0)} {selectedStock.unit}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    placeholder="Unit"
                    value={formData.unit}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled={submitLoading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="plate" className="block text-sm font-medium text-gray-700 mb-1">Plate</label>
                  <input
                    type="text"
                    id="plate"
                    name="plate"
                    placeholder="Plate"
                    value={formData.plate}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled={submitLoading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    placeholder="Color"
                    value={formData.color}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled={submitLoading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="extraColor" className="block text-sm font-medium text-gray-700 mb-1">Extra Color</label>
                  <input
                    type="text"
                    id="extraColor"
                    name="extraColor"
                    placeholder="Extra Color"
                    value={formData.extraColor}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled={submitLoading}
                  />
                </div>

                <div className="relative">
                  <label htmlFor="contactDetails" className="block text-sm font-medium text-gray-700 mb-1">Contact Details</label>
                  <input
                    type="text"
                    id="contactDetails"
                    name="contactDetails"
                    placeholder="Contact Details"
                    value={formData.contactDetails}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled={submitLoading}
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 relative">
                  <label htmlFor="printingDetails" className="block text-sm font-medium text-gray-700 mb-1">Printing Details</label>
                  <input
                    type="text"
                    id="printingDetails"
                    name="printingDetails"
                    placeholder="Printing Details"
                    value={formData.printingDetails}
                    readOnly
                    className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm bg-gray-100 text-gray-700 cursor-not-allowed"
                    disabled={submitLoading}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-400 transition duration-200 ease-in-out shadow-sm hover:shadow-md"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
                  disabled={submitLoading || !isFormValid()}
                >
                  {submitLoading ? (
                    <>
                      <FiRotateCw className="animate-spin h-4 w-4" />
                      Saving...
                    </>
                  ) : (
                    editingJobCard ? "Update" : "Submit"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md p-6 mx-auto border border-gray-200">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900">Delete Job Card</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Are you sure you want to delete this job card? This action cannot be undone. The stock will be returned.
            </p>

            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 mt-4">
              <button
                type="button"
                className="text-sm sm:text-base text-gray-500 px-4 py-2 rounded-md hover:bg-gray-100 transition duration-200 ease-in-out w-full sm:w-auto"
                onClick={closeDeleteModal}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm sm:text-base font-medium hover:bg-red-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg w-full sm:w-auto"
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

export default OffsetJobCardList;