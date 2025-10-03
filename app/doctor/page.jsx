'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import QRScanner from '../components/QRScanner';
import {
    UserGroupIcon,
    AcademicCapIcon,
    ClipboardDocumentListIcon,
    QrCodeIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const DoctorDashboard = () => {
    const { user, isDoctor } = useAuth();
    const [stats, setStats] = useState({
        myGroups: 0,
        totalStudents: 0,
        todayAttendance: 0,
        weeklyAttendance: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [showScanner, setShowScanner] = useState(false);
    const [scanMessage, setScanMessage] = useState('');

    useEffect(() => {
        if (isDoctor) {
            fetchDashboardData();
        }
    }, [isDoctor]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch doctor's groups and related data
            const [groupsRes, attendanceRes] = await Promise.all([
                fetch('http://localhost:3001/api/groups/my-groups', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch('http://localhost:3001/api/attendance/my-groups', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            const groups = await groupsRes.json();
            const attendance = await attendanceRes.json();

            // Calculate stats
            const myGroups = groups.data || [];
            const totalStudents = myGroups.reduce((sum, group) => sum + (group.students?.length || 0), 0);
            const todayAttendance = attendance.data?.filter(record => {
                const today = new Date().toDateString();
                return new Date(record.timestamp).toDateString() === today;
            }).length || 0;

            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weeklyAttendance = attendance.data?.filter(record => {
                return new Date(record.timestamp) >= weekStart;
            }).length || 0;

            setStats({
                myGroups: myGroups.length,
                totalStudents,
                todayAttendance,
                weeklyAttendance
            });

            setRecentAttendance(attendance.data?.slice(0, 10) || []);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQRScan = async (qrData) => {
        try {
            setScanMessage('Processing attendance...');

            // Parse QR code data (should contain student ID)
            const studentId = qrData;

            // Submit attendance
            const response = await fetch('http://localhost:3001/api/attendance/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ studentId })
            });

            const result = await response.json();

            if (response.ok) {
                setScanMessage(`✅ Attendance recorded for ${result.data.student.name}`);
                // Refresh dashboard data
                fetchDashboardData();
            } else {
                setScanMessage(`❌ Error: ${result.message}`);
            }

            // Clear message after 3 seconds
            setTimeout(() => setScanMessage(''), 3000);

        } catch (error) {
            console.error('Error processing QR scan:', error);
            setScanMessage('❌ Error processing attendance');
            setTimeout(() => setScanMessage(''), 3000);
        }
    };

    const statCards = [
        {
            name: 'My Groups',
            value: stats.myGroups,
            icon: UserGroupIcon,
            color: 'bg-blue-500',
            href: '/doctor/groups'
        },
        {
            name: 'Total Students',
            value: stats.totalStudents,
            icon: AcademicCapIcon,
            color: 'bg-green-500',
            href: '/doctor/students'
        },
        {
            name: 'Today\'s Attendance',
            value: stats.todayAttendance,
            icon: ClipboardDocumentListIcon,
            color: 'bg-indigo-500',
            href: '/doctor/attendance'
        },
        {
            name: 'Weekly Attendance',
            value: stats.weeklyAttendance,
            icon: ChartBarIcon,
            color: 'bg-purple-500',
            href: '/doctor/reports'
        }
    ];

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
        <DashboardLayout title="Doctor Dashboard">
            <div className="space-y-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
                    </div>
                ) : (
                    <>
                        {/* Welcome Section */}
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Welcome back, Dr. {user?.name}!
                                </h3>
                                <div className="mt-2 max-w-xl text-sm text-gray-500">
                                    <p>Manage your classes and track student attendance.</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Scanner Section */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        Quick Attendance Scanner
                                    </h3>
                                    <button
                                        onClick={() => setShowScanner(!showScanner)}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <QrCodeIcon className="h-4 w-4 mr-2" />
                                        {showScanner ? 'Hide Scanner' : 'Open Scanner'}
                                    </button>
                                </div>

                                {scanMessage && (
                                    <div className={`mb-4 p-3 rounded-md ${scanMessage.includes('✅')
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                        }`}>
                                        {scanMessage}
                                    </div>
                                )}

                                {showScanner && (
                                    <QRScanner
                                        onScanSuccess={handleQRScan}
                                        onScanError={(error) => console.error('QR Scan Error:', error)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {statCards.map((card, index) => (
                                <div
                                    key={index}
                                    className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
                                >
                                    <dt>
                                        <div className={`absolute ${card.color} rounded-md p-3`}>
                                            <card.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <p className="ml-16 text-sm font-medium text-gray-500 truncate">
                                            {card.name}
                                        </p>
                                    </dt>
                                    <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {card.value.toLocaleString()}
                                        </p>
                                    </dd>
                                    <div className="absolute bottom-0 inset-x-0 bg-gray-50 px-4 py-4 sm:px-6">
                                        <div className="text-sm">
                                            <a
                                                href={card.href}
                                                className="font-medium text-indigo-600 hover:text-indigo-500"
                                            >
                                                View all<span className="sr-only"> {card.name}</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Attendance */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Recent Attendance Records
                                </h3>

                                {recentAttendance.length === 0 ? (
                                    <div className="text-center py-6">
                                        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No recent attendance</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Attendance records will appear here when students check in.
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
                                                {recentAttendance.map((record) => (
                                                    <tr key={record._id}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {record.student?.name || 'Unknown Student'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {record.group?.name || 'Unknown Group'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'present'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {record.status}
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
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    Quick Actions
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <a
                                        href="/doctor/scanner"
                                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                                                <QrCodeIcon className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                QR Scanner
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                Scan student QR codes for attendance
                                            </p>
                                        </div>
                                    </a>

                                    <a
                                        href="/doctor/groups"
                                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                                                <UserGroupIcon className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                My Groups
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                View and manage your assigned groups
                                            </p>
                                        </div>
                                    </a>

                                    <a
                                        href="/doctor/reports"
                                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                                                <ChartBarIcon className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                Reports
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                View attendance analytics and reports
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

export default DoctorDashboard;