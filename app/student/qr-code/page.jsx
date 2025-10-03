'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import API_CONFIG from '../../config/api';
import {
  ViewfinderCircleIcon,
  InformationCircleIcon,
  ClipboardIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline';

const StudentQRCodePage = () => {
  const { user, isStudent } = useAuth();
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isStudent && user) {
      fetchQRCode();
    }
  }, [isStudent, user]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch student's QR code data
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/students/my-qr-code`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        const result = await response.json();
        setQrCodeData(result.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch QR code');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setError('Error fetching QR code');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share && qrCodeData) {
      try {
        await navigator.share({
          title: 'My Student QR Code',
          text: `Student: ${qrCodeData.studentName} - ${qrCodeData.studentNumber}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(qrCodeData?.qrCodeData || '');
        alert('QR code data copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  if (!isStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-center bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-blue-200">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="My QR Code">
      <div className="min-h-screen ">
        <div className="space-y-6 p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-blue-200">Loading your QR code...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-900/30 border border-red-700 rounded-xl backdrop-blur-sm p-6">
                <h3 className="text-lg font-medium text-red-200 mb-2">Error Loading QR Code</h3>
                <p className="text-red-300">{error}</p>
                <button
                  onClick={fetchQRCode}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-slate-800/50 backdrop-blur-sm overflow-hidden shadow-xl rounded-xl border border-slate-700">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Your Attendance QR Code
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-blue-200">
                    <p>Use this QR code for attendance marking in your classes.</p>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl border border-slate-700">
                <div className="px-4 py-5 sm:p-6">
                  <h4 className="text-md font-medium text-white mb-4">Student Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-300">Full Name</label>
                        <div className="mt-1 text-sm text-white">{qrCodeData?.studentName || user?.name || 'N/A'}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-300">Student Number</label>
                        <div className="mt-1 text-sm text-white font-mono">{qrCodeData?.studentNumber || 'N/A'}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-300">Email</label>
                        <div className="mt-1 text-sm text-white">{user?.email || 'N/A'}</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-300">Group</label>
                        <div className="mt-1 text-sm text-white">{user?.group?.name || 'Not assigned'}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-300">Department</label>
                        <div className="mt-1 text-sm text-white">{user?.department?.name || 'N/A'}</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-300">Year</label>
                        <div className="mt-1 text-sm text-white">{user?.year || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>            {/* QR Code Display */}
              <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl border border-slate-700">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-md font-medium text-white">QR Code</h4>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleShare}
                        className="inline-flex items-center px-3 py-2 border border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ShareIcon className="h-4 w-4 mr-2" />
                        Share
                      </button>

                      <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-3 py-2 border border-slate-600 shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PrinterIcon className="h-4 w-4 mr-2" />
                        Print
                      </button>
                    </div>
                  </div>

                  {qrCodeData?.qrCodeImage ? (
                    <div className="max-w-md mx-auto print-qr-code">
                      <div className="text-center">
                        <img
                          src={qrCodeData.qrCodeImage}
                          alt="Student QR Code"
                          className="mx-auto border border-slate-600 rounded-lg bg-white p-4"
                          style={{ width: '250px', height: '250px' }}
                        />
                        <div className="mt-4 p-3 bg-blue-900/50 rounded-md border border-blue-800">
                          <p className="text-sm text-white font-medium">
                            {qrCodeData.studentName} - {qrCodeData.studentNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ViewfinderCircleIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">QR Code Not Available</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Your QR code is being generated. Please contact your administrator if this persists.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-900/30 border border-blue-700 rounded-xl backdrop-blur-sm">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-200">
                        How to use your QR Code
                      </h3>
                      <div className="mt-2 text-sm text-blue-300">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Show this QR code to your doctor when they are taking attendance</li>
                          <li>Make sure the QR code is clearly visible and well-lit</li>
                          <li>The doctor will scan it with their device to mark you as present</li>
                          <li>You can print this page or save the QR code image for offline use</li>
                          <li>Keep your student ID handy as a backup identification method</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl backdrop-blur-sm">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-200">
                        Security Notice
                      </h3>
                      <div className="mt-2 text-sm text-yellow-300">
                        <p>
                          This QR code is unique to you and should not be shared with other students.
                          Using someone else's QR code or allowing others to use yours is considered
                          academic misconduct and may result in disciplinary action.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-qr-code, .print-qr-code * {
            visibility: visible;
          }
          .print-qr-code {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </DashboardLayout>
  );
};

export default StudentQRCodePage;