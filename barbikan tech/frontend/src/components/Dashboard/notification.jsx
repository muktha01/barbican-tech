import { CheckCircle, X, XCircle, Info, AlertTriangle, Trash2 } from "lucide-react";
import { useEffect } from "react";
import ReactDOM from 'react-dom';

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Improved color schemes for better visual hierarchy and meaning
  let bgColor, textColor, borderColor, iconColor, IconComponent;
  
  switch (type) {
  case 'success':
    bgColor = 'bg-emerald-100';
    textColor = 'text-emerald-700';
    borderColor = 'border-emerald-300';
    iconColor = 'text-emerald-500';
    IconComponent = CheckCircle;
    break;

  case 'error':
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    borderColor = 'border-red-300';
    iconColor = 'text-red-500';
    IconComponent = XCircle;
    break;

  case 'delete-success':
    bgColor = 'bg-rose-100';
    textColor = 'text-rose-700';
    borderColor = 'border-rose-300';
    iconColor = 'text-rose-500';
    IconComponent = Trash2; // Good icon choice for deletion
    break;

  case 'info':
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-700';
    borderColor = 'border-blue-300';
    iconColor = 'text-blue-500';
    IconComponent = Info;
    break;

  case 'warning':
    bgColor = 'bg-amber-100';
    textColor = 'text-amber-700';
    borderColor = 'border-amber-300';
    iconColor = 'text-amber-500';
    IconComponent = AlertTriangle;
    break;

  default:
    bgColor = 'bg-gray-100';
    textColor = 'text-gray-700';
    borderColor = 'border-gray-300';
    iconColor = 'text-gray-500';
    IconComponent = Info;
}


  return ReactDOM.createPortal(
    <div className={`fixed bottom-4 left-4 max-w-sm w-full ${bgColor} ${borderColor} border rounded-lg shadow-xl z-50 p-4 transition-all duration-300 ease-in-out backdrop-blur-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`inline-flex ${textColor} hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 rounded-full p-1`}
            onClick={onClose}
          >
            <span className="sr-only">Dismiss</span>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Notification;