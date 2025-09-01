import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, CheckCircle, X, Info } from "lucide-react";

// Message Component for Success/Error/Info messages
const MessageAlert = ({ type, message, onClose, autoClose = true }) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getMessageConfig = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-600" />
        };
      case 'info':
        return {
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600" />
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: <Info className="w-5 h-5 text-gray-600" />
        };
    }
  };

  const config = getMessageConfig();

  return (
    <div className={`${config.bgColor} ${config.borderColor} ${config.textColor} border rounded-lg p-4 mb-4 flex items-start gap-3`}>
      {config.icon}
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`${config.textColor} hover:opacity-70 transition-opacity`}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default MessageAlert;

