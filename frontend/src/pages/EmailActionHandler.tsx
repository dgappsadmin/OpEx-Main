import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, Mail, FileEdit, Home } from 'lucide-react';

// Function to determine API base URL - same logic as api.ts
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:9090/opexhub';
  } else if (hostname === 'dgapps.godeepak.com') {
    return 'https://dgapps.godeepak.com/opexhub';
  } else if (hostname === 'dgpilotapps.godeepak.com') {
    return 'https://dgpilotapps.godeepak.com/opexhub';
  } else {
    return 'http://localhost:9090/opexhub';
  }
};

const EmailActionHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'edit'>('approve');

  useEffect(() => {
    const handleEmailAction = async () => {
      const token = searchParams.get('token');
      const action = window.location.pathname.includes('approve') ? 'approve' : 'request-edit';
      setActionType(action === 'approve' ? 'approve' : 'edit');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid link: No token provided');
        return;
      }

      try {
        const backendUrl = getApiBaseUrl();
        const endpoint = action === 'approve' 
          ? `${backendUrl}/api/monthly-monitoring/email-action/approve?token=${token}`
          : `${backendUrl}/api/monthly-monitoring/email-action/request-edit?token=${token}`;

        console.log('🔍 Email Action Handler Debug:');
        console.log('Hostname:', window.location.hostname);
        console.log('Backend URL:', backendUrl);
        console.log('Full endpoint:', endpoint);

        const response = await axios.get(endpoint, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          }
        });

        // Backend returns HTML response
        if (response.data && typeof response.data === 'string') {
          setHtmlContent(response.data);
          setStatus('success');
        } else {
          setStatus('success');
          setMessage('Action completed successfully');
        }
      } catch (error: any) {
        console.error('Email action error:', error);
        setStatus('error');
        
        if (error.response?.data && typeof error.response.data === 'string') {
          setHtmlContent(error.response.data);
        } else {
          setMessage(error.response?.data?.message || error.message || 'Failed to process your request');
        }
      }
    };

    handleEmailAction();
  }, [searchParams]);

  // If we have HTML content from backend, render it
  if (htmlContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">OpEx Hub</h1>
                  <p className="text-xs text-gray-500">Operational Excellence Platform</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </header>

        {/* Backend HTML Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div 
            className="bg-white rounded-xl shadow-lg p-8 prose prose-blue max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    );
  }

  // Otherwise show loading/error state with improved UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">OpEx Hub</h1>
          <p className="text-sm text-gray-500">Operational Excellence Platform</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {status === 'loading' && (
            <div className="text-center">
              {/* Animated Icon */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-4">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>

              {/* Loading Text */}
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Processing Your Request
              </h2>
              <p className="text-gray-600 mb-6">
                {actionType === 'approve' 
                  ? 'Processing approval for monthly monitoring entry...'
                  : 'Processing edit request for monthly monitoring entry...'
                }
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-progress"></div>
              </div>
            </div>
          )}
          
          {status === 'success' && !htmlContent && (
            <div className="text-center">
              {/* Success Animation */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-4 animate-scale-in">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Success Message */}
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                {actionType === 'approve' ? 'Approval Successful!' : 'Edit Request Sent!'}
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>

              {/* Success Details Box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-green-900 mb-1">Action Completed</p>
                    <p className="text-xs text-green-700">
                      {actionType === 'approve' 
                        ? 'The monthly monitoring entry has been approved. The initiative lead will be notified via email.'
                        : 'The entry has been reopened for editing. The initiative lead will be notified to make the necessary changes.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/monthly-monitoring')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] font-medium shadow-lg shadow-blue-500/30"
                >
                  View Monthly Monitoring
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>
          )}
          
          {status === 'error' && !htmlContent && (
            <div className="text-center">
              {/* Error Animation */}
              <div className="relative inline-flex items-center justify-center mb-6">
                <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-full p-4 animate-scale-in">
                  <XCircle className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Error Message */}
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Unable to Process Request
              </h2>
              <p className="text-gray-600 mb-6">{message}</p>

              {/* Error Details Box */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-red-900 mb-1">Common Reasons</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• Link has expired (valid for 7 days)</li>
                      <li>• Link has already been used</li>
                      <li>• Entry has already been processed</li>
                      <li>• Invalid or malformed link</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/monthly-monitoring')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] font-medium shadow-lg shadow-blue-500/30"
                >
                  View Monthly Monitoring
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Go to Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>

 {/* Footer */}
<div className="text-center mt-6">
  <p className="text-sm text-gray-500">
    Need help? Contact your system administrator at{' '}
    <a href="mailto:dnsharm@godeepak.com" className="text-blue-500">
      dnsharma@godeepak.com
    </a>
  </p>
  <p className="text-xs text-gray-400 mt-2">
    OpEx Hub © 2025 - All rights reserved
  </p>
</div>
      </div>
    </div>
  );
};

export default EmailActionHandler;
