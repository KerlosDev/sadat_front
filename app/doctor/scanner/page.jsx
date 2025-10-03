'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import QRScanner from '../../components/QRScanner';
import toast, { Toaster } from 'react-hot-toast';
import {
    QrCodeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserGroupIcon,
    PlayIcon,
    StopIcon,
    AcademicCapIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

const QRScannerPage = () => {
    const { user, isDoctor } = useAuth();
    const [scanHistory, setScanHistory] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [groups, setGroups] = useState([]);
    const [scanMessage, setScanMessage] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanCount, setScanCount] = useState(0);
    const [sessionActive, setSessionActive] = useState(false);

    useEffect(() => {
        if (isDoctor) {
            fetchGroups();
            fetchScanHistory();
        }
    }, [isDoctor]);

    const fetchGroups = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/my-groups`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setGroups(data.data || []);
                if (data.data && data.data.length > 0) {
                    setSelectedGroup(data.data[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchScanHistory = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/my-groups?limit=20`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setScanHistory(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching scan history:', error);
        }
    };

    const handleQRScan = async (qrData) => {
        if (!selectedGroup) {
            setScanMessage('❌ Please select a group first');
            toast.error('Please select a group first');
            setTimeout(() => setScanMessage(''), 3000);
            return;
        }

        setIsScanning(true);
        setScanMessage('🔄 Processing attendance...');
        toast.loading('Processing attendance...');

        try {
            // Parse QR code data (should contain student ID)
            const studentId = qrData.trim();

            // Submit attendance
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    studentId,
                    groupId: selectedGroup,
                    status: 'present'
                })
            });

            const result = await response.json();

            if (response.ok) {
                const successMessage = `✅ Attendance recorded for ${result.data.student.name}`;
                setScanMessage(successMessage);
                toast.dismiss();
                toast.success(`Attendance recorded for ${result.data.student.name}`);
                // Refresh scan history
                fetchScanHistory();
            } else {
                const errorMessage = `❌ Error: ${result.message}`;
                setScanMessage(errorMessage);
                toast.dismiss();
                toast.error(result.message || 'Failed to record attendance');
            }

        } catch (error) {
            console.error('Error processing QR scan:', error);
            setScanMessage('❌ Error processing attendance');
            toast.dismiss();
            toast.error('Error processing attendance');
        } finally {
            setIsScanning(false);
            // Clear message after 3 seconds
            setTimeout(() => setScanMessage(''), 3000);
        }
    };

    const handleScanError = (error) => {
        console.error('QR Scanner Error:', error);
        // Only show user-visible errors, not scanner initialization messages
        if (!error.includes('NotFoundException') && !error.includes('NotAllowedError')) {
            setScanMessage('❌ Scanner error occurred');
            toast.error('Scanner error occurred');
            setTimeout(() => setScanMessage(''), 3000);
        }
    };

    if (!isDoctor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                    <p className="text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout title="QR Code Scanner">
            <Toaster position="top-right" />
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Attendance QR Scanner
                        </h3>
                        <div className="mt-2 max-w-xl text-sm text-gray-500">
                            <p>Scan student QR codes to mark attendance quickly and accurately.</p>
                        </div>
                    </div>
                </div>

                {/* Group Selection */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Select Group</h4>

                        {groups.length === 0 ? (
                            <div className="text-center py-6">
                                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No groups assigned</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    You need to be assigned to groups to use the QR scanner.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {groups.map((group) => (
                                    <div
                                        key={group._id}
                                        className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${selectedGroup === group._id
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        onClick={() => setSelectedGroup(group._id)}
                                    >
                                        <div className="flex items-center">
                                            <input
                                                type="radio"
                                                name="group"
                                                value={group._id}
                                                checked={selectedGroup === group._id}
                                                onChange={() => setSelectedGroup(group._id)}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                            />
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {group.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {group.department?.name} • {group.students?.length || 0} students
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* QR Scanner */}
                {selectedGroup && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-medium text-gray-900">Scanner</h4>
                                <div className="flex items-center space-x-2">
                                    <QrCodeIcon className="h-5 w-5 text-indigo-600" />
                                    <span className="text-sm text-gray-600">
                                        Ready to scan for: {groups.find(g => g._id === selectedGroup)?.name}
                                    </span>
                                </div>
                            </div>

                            {/* Scan Status Message */}
                            {scanMessage && (
                                <div className={`mb-4 p-3 rounded-md ${scanMessage.includes('✅')
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : scanMessage.includes('🔄')
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    <div className="flex items-center">
                                        {scanMessage.includes('✅') && <CheckCircleIcon className="h-5 w-5 mr-2" />}
                                        {scanMessage.includes('🔄') && <ClockIcon className="h-5 w-5 mr-2 animate-spin" />}
                                        {scanMessage.includes('❌') && <XCircleIcon className="h-5 w-5 mr-2" />}
                                        {scanMessage}
                                    </div>
                                </div>
                            )}

                            {/* QR Scanner Component */}
                            <QRScanner
                                onScanSuccess={handleQRScan}
                                onScanError={handleScanError}
                                className="mb-4"
                            />

                            {/* Scanner Instructions */}
                            <div className="bg-gray-50 rounded-md p-4">
                                <h5 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h5>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Ask students to display their QR codes clearly</li>
                                    <li>• Hold the scanner steady and ensure good lighting</li>
                                    <li>• The scanner will automatically detect and process QR codes</li>
                                    <li>• Each successful scan will be recorded with a timestamp</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Scan History */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">Recent Scans</h4>

                        {scanHistory.length === 0 ? (
                            <div className="text-center py-6">
                                <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No scans yet</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Start scanning student QR codes to see attendance records here.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Group
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {scanHistory.slice(0, 10).map((record) => (
                                            <tr key={record._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8">
                                                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${record.status === 'present' ? 'bg-green-100' : 'bg-red-100'
                                                                }`}>
                                                                {record.status === 'present' ? (
                                                                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <XCircleIcon className="h-4 w-4 text-red-600" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {record.student?.name || 'Unknown Student'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {record.student?.studentId || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {record.group?.name || 'Unknown Group'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'present'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {record.status === 'present' ? 'Present' : 'Absent'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(record.timestamp).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {scanHistory.length > 10 && (
                            <div className="mt-4">
                                <a
                                    href="/doctor/attendance"
                                    className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    View all attendance records
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default QRScannerPage;