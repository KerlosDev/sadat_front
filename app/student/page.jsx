'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import QRCodeDisplay from '../components/QRCodeDisplay';
import API_CONFIG from '../config/api';
import {
    User,
    ClipboardList,
    BarChart3,
    Calendar,
    ScanLine
} from 'lucide-react';

const StudentDashboard = () => {
    const { user, isStudent } = useAuth();
    const [stats, setStats] = useState({
        totalClasses: 0,
        attendedClasses: 0,
        missedClasses: 0,
        attendanceRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [showQRCode, setShowQRCode] = useState(false);
    const [qrCodeData, setQrCodeData] = useState(null);
    const [qrCodeLoading, setQrCodeLoading] = useState(false);

    useEffect(() => {
        if (isStudent) {
            fetchDashboardData();
        }
    }, [isStudent]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch student's attendance data
            const attendanceRes = await fetch(`${API_CONFIG.BASE_URL}/api/attendance/my-attendance`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            const attendance = await attendanceRes.json();
            const attendanceRecords = attendance.data || [];

            // Calculate stats
            const attendedClasses = attendanceRecords.filter(record => record.status === 'present').length;
            const missedClasses = attendanceRecords.filter(record => record.status === 'absent').length;
            const totalClasses = attendanceRecords.length;
            const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

            setStats({
                totalClasses,
                attendedClasses,
                missedClasses,
                attendanceRate
            });

            setRecentAttendance(attendanceRecords.slice(0, 10));

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQRCode = async () => {
        try {
            setQrCodeLoading(true);

            const response = await fetch(`${API_CONFIG.BASE_URL}/api/students/my-qr-code`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (response.ok) {
                const result = await response.json();
                setQrCodeData(result.data);
            } else {
                console.error('Failed to fetch QR code');
            }
        } catch (error) {
            console.error('Error fetching QR code:', error);
        } finally {
            setQrCodeLoading(false);
        }
    };

    const handleShowQRCode = () => {
        if (!showQRCode && !qrCodeData) {
            fetchQRCode();
        }
        setShowQRCode(!showQRCode);
    };

    const statCards = [
        {
            name: 'Total Classes',
            value: stats.totalClasses,
            icon: Calendar,
            color: 'bg-blue-500'
        },
        {
            name: 'Attended',
            value: stats.attendedClasses,
            icon: ClipboardList,
            color: 'bg-green-500'
        },
        {
            name: 'Missed',
            value: stats.missedClasses,
            icon: ClipboardList,
            color: 'bg-red-500'
        },
        {
            name: 'Attendance Rate',
            value: `${stats.attendanceRate}%`,
            icon: BarChart3,
            color: 'bg-purple-500'
        }
    ];

    if (!isStudent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-slate-400">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout title="Student Dashboard">
            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-slate-400">Loading dashboard data...</p>
                    </div>
                ) : (
                    <>
                        {/* Welcome Section */}
                        <div className="bg-slate-800 overflow-hidden shadow-lg rounded-lg border border-slate-700">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-white">
                                    Welcome back, {user?.name}!
                                </h3>
                                <div className="mt-2 max-w-xl text-sm text-slate-400">
                                    <p>Track your attendance and academic progress.</p>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="bg-slate-800 shadow-lg rounded-lg border border-slate-700">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-white">
                                        My QR Code
                                    </h3>
                                    <button
                                        onClick={handleShowQRCode}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <ScanLine className="h-4 w-4 mr-2" />
                                        {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
                                    </button>
                                </div>

                                {showQRCode && (
                                    <div className="max-w-md mx-auto">
                                        {qrCodeLoading ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                                <p className="mt-2 text-sm text-slate-400">Loading QR code...</p>
                                            </div>
                                        ) : qrCodeData ? (
                                            <>
                                                <div className="text-center">
                                                    <img
                                                        src={qrCodeData.qrCodeImage}
                                                        alt="Student QR Code"
                                                        className="mx-auto border border-slate-600 rounded-lg"
                                                        style={{ width: '200px', height: '200px' }}
                                                    />
                                                    <p className="mt-2 text-sm text-slate-300">
                                                        {qrCodeData.studentName} - {qrCodeData.studentNumber}
                                                    </p>
                                                </div>
                                                <div className="mt-4 p-3 bg-blue-900/50 rounded-md border border-blue-800">
                                                    <p className="text-sm text-blue-300">
                                                        <strong>Instructions:</strong> Show this QR code to your doctor for attendance marking.
                                                        Make sure the code is clearly visible and well-lit.
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-sm text-red-400">Failed to load QR code. Please try again.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((card, index) => (
                                <div
                                    key={index}
                                    className="relative bg-slate-800 pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-lg rounded-lg overflow-hidden border border-slate-700"
                                >
                                    <dt>
                                        <div className={`absolute ${card.color} rounded-md p-3`}>
                                            <card.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <p className="ml-16 text-sm font-medium text-slate-400 truncate">
                                            {card.name}
                                        </p>
                                    </dt>
                                    <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                                        <p className="text-2xl font-semibold text-white">
                                            {card.value}
                                        </p>
                                    </dd>
                                </div>
                            ))}
                        </div>

                        {/* Attendance Rate Visualization */}
                        <div className="bg-slate-800 shadow-lg rounded-lg border border-slate-700">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-white mb-4">
                                    Attendance Overview
                                </h3>

                                <div className="space-y-4">
                                    {/* Attendance Rate Progress Bar */}
                                    <div>
                                        <div className="flex justify-between text-sm font-medium text-white mb-2">
                                            <span>Attendance Rate</span>
                                            <span>{stats.attendanceRate}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${stats.attendanceRate >= 80 ? 'bg-green-500' :
                                                    stats.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${stats.attendanceRate}%` }}
                                            ></div>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-400">
                                            {stats.attendanceRate >= 80 ? 'Excellent attendance!' :
                                                stats.attendanceRate >= 60 ? 'Good attendance, keep it up!' :
                                                    'Your attendance needs improvement.'}
                                        </p>
                                    </div>

                                    {/* Attendance Breakdown */}
                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-400">{stats.totalClasses}</div>
                                            <div className="text-sm text-slate-400">Total Classes</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-400">{stats.attendedClasses}</div>
                                            <div className="text-sm text-slate-400">Present</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-red-400">{stats.missedClasses}</div>
                                            <div className="text-sm text-slate-400">Absent</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Attendance */}
                        <div className="bg-slate-800 shadow-lg rounded-lg border border-slate-700">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-white mb-4">
                                    Recent Attendance
                                </h3>

                                {recentAttendance.length === 0 ? (
                                    <div className="text-center py-6">
                                        <ClipboardList className="mx-auto h-12 w-12 text-slate-500" />
                                        <h3 className="mt-2 text-sm font-medium text-white">No attendance records</h3>
                                        <p className="mt-1 text-sm text-slate-400">
                                            Your attendance records will appear here once classes begin.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden">
                                        <table className="min-w-full divide-y divide-slate-700">
                                            <thead className="bg-slate-700">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                        Subject/Group
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                        Date & Time
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                                        Doctor
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-slate-800 divide-y divide-slate-700">
                                                {recentAttendance.map((record) => (
                                                    <tr key={record._id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
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
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                            {new Date(record.timestamp).toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                            {record.doctor?.name || 'Unknown Doctor'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-slate-800 shadow-lg rounded-lg border border-slate-700">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-white mb-4">
                                    Quick Actions
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <a
                                        href="/student/qr-code"
                                        className="relative group bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors duration-200"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-blue-600 text-white ring-4 ring-slate-700">
                                                <ScanLine className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium text-white">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                My QR Code
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-400">
                                                View and manage your attendance QR code
                                            </p>
                                        </div>
                                    </a>

                                    <a
                                        href="/student/attendance"
                                        className="relative group bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors duration-200"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-green-600 text-white ring-4 ring-slate-700">
                                                <ClipboardList className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium text-white">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                Attendance History
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-400">
                                                View your complete attendance records
                                            </p>
                                        </div>
                                    </a>

                                    <a
                                        href="/student/profile"
                                        className="relative group bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-slate-600 rounded-lg hover:bg-slate-600 transition-colors duration-200"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-blue-600 text-white ring-4 ring-slate-700">
                                                <User className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium text-white">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                My Profile
                                            </h3>
                                            <p className="mt-2 text-sm text-slate-400">
                                                View and update your profile information
                                            </p>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default StudentDashboard;