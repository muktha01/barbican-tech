import React from "react";
import { Navigate } from "react-router-dom";

const Protect = ({ Component, blockRole }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === blockRole) {
    return (
    <div className="bg-white rounded-lg lg:rounded-3xl shadow-sm lg:shadow-xl max-w-7xl mx-auto p-3 sm:p-6 lg:p-10 border border-gray-200 min-h-[90vh] lg:min-h-[80vh] flex flex-col justify-center items-center">
        <div className="max-w-md w-full">
          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center transform transition-all duration-300 hover:scale-105">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg 
                className="w-10 h-10 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Access Denied
            </h1>
            
            {/* Description */}
            <p className="text-gray-600 mb-8 leading-relaxed">
              Sorry, you don't have the necessary permissions to access this page. 
              Please contact your administrator if you believe this is an error.
            </p>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              
              
              <button
                onClick={() => window.history.back()}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transform transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
            </div>
          </div>
          
          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Need help? <a href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return <Component />;
};

export default Protect;