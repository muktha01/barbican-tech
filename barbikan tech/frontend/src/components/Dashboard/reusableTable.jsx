import { Pencil, Trash, MoreVertical } from "lucide-react";
import React, { useState, useEffect } from "react";

// Sample Pagination Component (you can replace this with your actual component)
// const Pagination = ({ 
//   currentPage, 
//   totalPages, 
//   onPageChange, 
//   itemsPerPage, 
//   totalItems 
// }) => {
//   const startItem = (currentPage - 1) * itemsPerPage + 1;
//   const endItem = Math.min(currentPage * itemsPerPage, totalItems);

//   return (
//     <div className="pagination-wrapper">
//       <div className="pagination-info">
//         Showing {startItem}-{endItem} of {totalItems}
//       </div>
//       <div className="pagination-controls">
//         <button 
//           onClick={() => onPageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//           className="pagination-btn"
//         >
//           Previous
//         </button>
//         <span className="pagination-current">
//           {currentPage} of {totalPages}
//         </span>
//         <button 
//           onClick={() => onPageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className="pagination-btn"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// };

const ReusableTable = ({
  columns = [],
  data = [],
  emptyMessage = "No data available",
  itemsPerPage = 15,
  className = "",
  loading = false,
  showActions = false,
  onEdit,
  onDelete,
  editLabel = "Edit",
  deleteLabel = "Delete",
  showSerialNumber = true,
  serialNumberLabel = "S.NO",
  tableHeight = "auto",
  stickyHeader = true,
  hoverable = true,
  striped = false,
  bordered = true,
  compact = false,
  showPagination = true,
  paginationProps = {}
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileActions, setShowMobileActions] = useState({});

  // Calculate pagination
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Toggle mobile action menu
  const toggleMobileActions = (index) => {
    setShowMobileActions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Close mobile actions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMobileActions({});
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Calculate column span for empty states
  const getColSpan = () => {
    let span = columns.length;
    if (showSerialNumber) span += 1;
    if (showActions) span += 1;
    return span;
  };

  // Mobile Actions Component
  const MobileActionsMenu = ({ item, index, rowIndex }) => (
    <div className="mobile-actions-container">
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMobileActions(rowIndex);
        }}
        className="mobile-action-trigger"
        aria-label="More actions"
      >
        <MoreVertical className="mobile-action-icon" />
      </button>
      {showMobileActions[rowIndex] && (
        <div className="mobile-action-menu">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item, index);
                setShowMobileActions({});
              }}
              className="mobile-action-item edit-action"
            >
              <Pencil className="mobile-action-item-icon" />
              {editLabel}
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item, index);
                setShowMobileActions({});
              }}
              className="mobile-action-item delete-action"
            >
              <Trash className="mobile-action-item-icon" />
              {deleteLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );

  // Desktop Actions Component
  const DesktopActions = ({ item, index }) => (
    <div className="desktop-actions-container">
      {onEdit && (
        <button
          onClick={() => onEdit(item, index)}
          className="desktop-action-btn edit-btn"
          title={editLabel}
          aria-label={`${editLabel} ${item.name || 'item'}`}
        >
          <Pencil className="desktop-action-icon" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(item, index)}
          className="desktop-action-btn delete-btn"
          title={deleteLabel}
          aria-label={`${deleteLabel} ${item.name || 'item'}`}
        >
          <Trash className="desktop-action-icon" />
        </button>
      )}
    </div>
  );

  const containerClasses = `table-main-container ${bordered ? 'bordered' : ''} ${className}`;

  return (
    <div className={containerClasses}>
      <style>{`
        /* Main Container Styles */
        .table-main-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          background: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .table-main-container.bordered {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        /* Table Wrapper */
        .table-wrapper {
          flex: 1;
          overflow: auto;
          width: 100%;
          position: relative;
        }

        /* Custom Scrollbar */
        .table-wrapper::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .table-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .table-wrapper::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .table-wrapper::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Base Table Styles */
        .responsive-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 14px;
          line-height: 1.4;
          color: #374151;
        }

        /* Header Styles */
        .table-header {
          background: #f9fafb;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }

        .table-header.sticky {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .table-header th {
          padding: 12px 8px;
          font-weight: 600;
          text-align: left;
          font-size: 12px;
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Body Styles */
        .table-body {
          background: white;
        }

        .table-row {
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.15s ease;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row.hoverable:hover {
          background: #f9fafb;
        }

        .table-row.striped:nth-child(even) {
          background: #f9fafb;
        }

        .table-cell {
          padding: 10px 8px;
          vertical-align: middle;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .table-cell.compact {
          padding: 6px 4px;
        }

        .cell-content {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }

        .cell-content.wrap {
          white-space: normal;
          word-break: break-word;
        }

        /* Serial Number Column */
        .serial-cell {
          width: 50px;
          text-align: center;
          font-weight: 500;
          color: #374151;
          padding: 10px 4px;
        }

        /* Actions Column */
        .actions-cell {
          width: 60px;
          text-align: center;
          padding: 10px 4px;
        }

        /* Desktop Actions */
        .desktop-actions-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .desktop-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .desktop-action-btn:hover {
          background: #f3f4f6;
        }

        .desktop-action-btn.edit-btn:hover {
          background: #dbeafe;
        }

        .desktop-action-btn.delete-btn:hover {
          background: #fef2f2;
        }

        .desktop-action-icon {
          width: 14px;
          height: 14px;
          color: #6b7280;
        }

        .edit-btn .desktop-action-icon {
          color: #3b82f6;
        }

        .delete-btn .desktop-action-icon {
          color: #ef4444;
        }

        /* Mobile Actions */
        .mobile-actions-container {
          position: relative;
          display: none;
        }

        .mobile-action-trigger {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .mobile-action-trigger:hover {
          background: #f3f4f6;
        }

        .mobile-action-icon {
          width: 14px;
          height: 14px;
          color: #6b7280;
        }

        .mobile-action-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 4px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 20;
          min-width: 100px;
          overflow: hidden;
        }

        .mobile-action-item {
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: white;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          transition: background-color 0.15s ease;
        }

        .mobile-action-item:hover {
          background: #f9fafb;
        }

        .mobile-action-item.delete-action {
          color: #ef4444;
        }

        .mobile-action-item.delete-action:hover {
          background: #fef2f2;
        }

        .mobile-action-item-icon {
          width: 12px;
          height: 12px;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 32px;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 32px;
          color: #9ca3af;
          font-size: 14px;
        }

        /* Pagination */
        .pagination-container {
          border-top: 1px solid #e5e7eb;
          background: white;
          padding: 12px 16px;
        }

        .pagination-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .pagination-info {
          font-size: 12px;
          color: #6b7280;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-current {
          font-size: 12px;
          color: #374151;
          font-weight: 500;
        }

        /* Tablet Styles (671px - 1024px) */
        @media (max-width: 1024px) and (min-width: 671px) {
          .table-header th {
            padding: 10px 6px;
            font-size: 11px;
          }

          .table-cell {
            padding: 8px 6px;
            font-size: 11px;
          }

          .serial-cell {
            width: 45px;
            padding: 8px 3px;
          }

          .actions-cell {
            width: 55px;
            padding: 8px 3px;
          }

          .desktop-action-btn {
            width: 26px;
            height: 26px;
          }

          .desktop-action-icon {
            width: 13px;
            height: 13px;
          }
        }

        /* Mobile Styles (501px - 670px) */
        @media (max-width: 670px) and (min-width: 501px) {
          .responsive-table {
            font-size: 11px;
          }

          .table-header th {
            padding: 8px 4px;
            font-size: 10px;
            font-weight: 600;
          }

          .table-cell {
            padding: 6px 4px;
            font-size: 10px;
          }

          .serial-cell {
            width: 40px;
            padding: 6px 2px;
            font-size: 9px;
          }

          .actions-cell {
            width: 45px;
            padding: 6px 2px;
          }

          /* Switch to mobile actions */
          .desktop-actions-container {
            display: none;
          }

          .mobile-actions-container {
            display: block;
          }

          .mobile-action-trigger {
            width: 24px;
            height: 24px;
          }

          .mobile-action-icon {
            width: 12px;
            height: 12px;
          }

          .pagination-wrapper {
            flex-direction: column;
            gap: 8px;
            align-items: center;
          }

          .pagination-info {
            font-size: 11px;
          }

          .pagination-btn {
            padding: 4px 8px;
            font-size: 11px;
          }

          .pagination-current {
            font-size: 11px;
          }
        }

        /* Small Mobile (401px - 500px) */
        @media (max-width: 500px) and (min-width: 401px) {
          .responsive-table {
            font-size: 10px;
          }

          .table-header th {
            padding: 6px 3px;
            font-size: 9px;
            font-weight: 600;
          }

          .table-cell {
            padding: 5px 3px;
            font-size: 9px;
          }

          .serial-cell {
            width: 35px;
            padding: 5px 2px;
            font-size: 8px;
          }

          .actions-cell {
            width: 40px;
            padding: 5px 2px;
          }

          .desktop-actions-container {
            display: none;
          }

          .mobile-actions-container {
            display: block;
          }

          .mobile-action-trigger {
            width: 22px;
            height: 22px;
          }

          .mobile-action-icon {
            width: 11px;
            height: 11px;
          }

          .mobile-action-menu {
            min-width: 90px;
          }

          .mobile-action-item {
            padding: 6px 8px;
            font-size: 10px;
            gap: 4px;
          }

          .mobile-action-item-icon {
            width: 10px;
            height: 10px;
          }

          .pagination-container {
            padding: 8px 12px;
          }

          .pagination-info {
            font-size: 10px;
          }

          .pagination-btn {
            padding: 3px 6px;
            font-size: 10px;
          }

          .pagination-current {
            font-size: 10px;
          }
        }

        /* Extra Small Mobile (≤ 400px) */
        @media (max-width: 400px) {
          .responsive-table {
            font-size: 9px;
          }

          .table-header th {
            padding: 4px 2px;
            font-size: 8px;
            font-weight: 600;
          }

          .table-cell {
            padding: 4px 2px;
            font-size: 8px;
          }

          .serial-cell {
            width: 30px;
            padding: 4px 1px;
            font-size: 7px;
          }

          .actions-cell {
            width: 35px;
            padding: 4px 1px;
          }

          .desktop-actions-container {
            display: none;
          }

          .mobile-actions-container {
            display: block;
          }

          .mobile-action-trigger {
            width: 20px;
            height: 20px;
          }

          .mobile-action-icon {
            width: 10px;
            height: 10px;
          }

          .mobile-action-menu {
            min-width: 80px;
          }

          .mobile-action-item {
            padding: 5px 6px;
            font-size: 9px;
            gap: 3px;
          }

          .mobile-action-item-icon {
            width: 9px;
            height: 9px;
          }

          .pagination-container {
            padding: 6px 8px;
          }

          .pagination-wrapper {
            gap: 6px;
          }

          .pagination-info {
            font-size: 9px;
          }

          .pagination-btn {
            padding: 2px 4px;
            font-size: 9px;
          }

          .pagination-current {
            font-size: 9px;
          }

          .empty-state {
            padding: 20px;
            font-size: 12px;
          }

          .loading-container {
            padding: 20px;
          }
        }

        /* Desktop Styles (> 1024px) */
        @media (min-width: 1025px) {
          .mobile-actions-container {
            display: none;
          }

          .desktop-actions-container {
            display: flex;
          }

          .cell-content {
            max-width: none;
          }
        }
      `}</style>

      {/* Table wrapper */}
      <div
        className="table-wrapper"
        style={{
          height: tableHeight === "100%" ? "100%" : "auto",
          maxHeight: tableHeight === "100%" ? "100%" : "auto"
        }}
      >
        <table className="responsive-table">
          <thead className={`table-header ${stickyHeader ? 'sticky' : ''}`}>
            <tr>
              {showSerialNumber && (
                <th className="serial-cell">
                  {serialNumberLabel}
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.headerClassName || ''}
                  style={column.headerStyle}
                  title={column.label}
                >
                  {column.label}
                </th>
              ))}
              {showActions && (
                <th className="actions-cell">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="table-body">
            {loading ? (
              <tr>
                <td colSpan={getColSpan()} className="loading-container">
                  <div className="loading-spinner"></div>
                  <span>Loading...</span>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={getColSpan()} className="empty-state">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`table-row ${hoverable ? 'hoverable' : ''} ${striped ? 'striped' : ''}`}
                >
                  {showSerialNumber && (
                    <td className={`table-cell serial-cell ${compact ? 'compact' : ''}`}>
                      {startIndex + index + 1}
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`table-cell ${compact ? 'compact' : ''} ${column.cellClassName || ''}`}
                      style={column.cellStyle}
                      title={String(item[column.key] || 'N/A')}
                    >
                      <div className={`cell-content ${column.wrap ? 'wrap' : ''}`}>
                        {column.render
                          ? column.render(item[column.key], item, index)
                          : (item[column.key] ?? 'N/A')
                        }
                      </div>
                    </td>
                  ))}
                  {showActions && (
                    <td className={`table-cell actions-cell ${compact ? 'compact' : ''}`}>
                      <MobileActionsMenu
                        item={item}
                        index={index}
                        rowIndex={startIndex + index}
                      />
                      <DesktopActions item={item} index={index} />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="pagination-container">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            {...paginationProps}
          />
        </div>
      )}
    </div>
  );
};

export default  ReusableTable;

// Demo Component to show the table in action
// const TableDemo = () => {
//   const [suppliers] = useState([
//     { id: 1, name: 'Supplier One', company: 'ABC Corp', email: 'supplier1@abc.com', phone: '+1234567890' },
//     { id: 2, name: 'Supplier Two', company: 'XYZ Ltd', email: 'supplier2@xyz.com', phone: '+1234567891' },
//     { id: 3, name: 'Supplier Three', company: 'Tech Solutions', email: 'supplier3@tech.com', phone: '+1234567892' },
//     { id: 4, name: 'Supplier Four', company: 'Global Systems', email: 'supplier4@global.com', phone: '+1234567893' },
//     { id: 5, name: 'Supplier Five', company: 'Innovation Hub', email: 'supplier5@innovation.com', phone: '+1234567894' }
//   ]);

//   const columns = [
//     {
//       key: 'name',
//       label: 'Supplier Name',
//       render: (value) => <strong>{value}</strong>
//     },
//     {
//       key: 'company',
//       label: 'Company Name'
//     },
//     {
//       key: 'email',
//       label: 'Email'
//     },
//     {
//       key: 'phone',
//       label: 'Phone'
//     }
//   ];

//   const handleEdit = (item, index) => {
//     alert(`Edit ${item.name} at index ${index}`);
//   };

//   const handleDelete = (item, index) => {
//     alert(`Delete ${item.name} at index ${index}`);
//   };

//   return (
//     <div style={{ padding: '20px', height: '100vh', background: '#f5f5f5' }}>
//       <div style={{ 
//         background: '#1f2937', 
//         color: 'white', 
//         padding: '16px', 
//         borderRadius: '8px 8px 0 0',
//         display: 'flex',
//         alignItems: 'center',
//         gap: '12px'
//       }}>
//         <div style={{
//           width: '32px',
//           height: '32px',
//           background: '#374151',
//           borderRadius: '50%',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center'
//         }}>
//           📋
//         </div>
//         <h1 style={{ margin: 0, fontSize: '18px' }}>Venkat</h1>
//       </div>
      
//       <div style={{ 
//         background: 'white', 
//         padding: '20px',
//         borderRadius: '0 0 8px 8px',
//         height: 'calc(100vh - 140px)'
//       }}>
//         <div style={{ marginBottom: '20px' }}>
//           <nav style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
//             🎯 Reel Stock {'>'} 📄 Supplier
//           </nav>
//           <button style={{
//             background: '#ef4444',
//             color: 'white',
//             border: 'none',
//             padding: '10px 20px',
//             borderRadius: '6px',
//             fontSize: '14px',
//             fontWeight: '500',
//             cursor: 'pointer'
//           }}>
//             Create
//           </button>
//         </div>

//         <ReusableTable
//           columns={columns}
//           data={suppliers}
//           showActions={true}
//           onEdit={handleEdit}
//           onDelete={handleDelete}
//           emptyMessage="No suppliers added yet."
//           itemsPerPage={10}
//           bordered={true}
//           hoverable={true}
//           showPagination={true}
//         />
//       </div>
//     </div>
//   );
// };

// export default TableDemo;