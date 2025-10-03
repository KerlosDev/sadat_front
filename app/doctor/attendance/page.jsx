'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserGroupIcon,
    AcademicCapIcon,
    ArrowDownTrayIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

const AttendancePage = () => {
    const { user, isDoctor } = useAuth();
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [showAddAttendance, setShowAddAttendance] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        present: 0,
        absent: 0,
        today: 0
    });

    useEffect(() => {
        if (isDoctor) {
            fetchData();
        }
    }, [isDoctor]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [groupsRes, attendanceRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/my-groups`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/my-groups`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            const groupsData = await groupsRes.json();
            const attendanceData = await attendanceRes.json();

            if (groupsRes.ok) {
                setGroups(groupsData.data || []);
            }

            if (attendanceRes.ok) {
                const records = attendanceData.data || [];
                setAttendanceRecords(records);

                // Calculate stats
                const today = new Date().toDateString();
                const todayRecords = records.filter(record =>
                    new Date(record.timestamp).toDateString() === today
                );

                setStats({
                    total: records.length,
                    present: records.filter(r => r.status === 'present').length,
                    absent: records.filter(r => r.status === 'absent').length,
                    today: todayRecords.length
                });
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (studentId, status) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ studentId, status })
            });

            if (response.ok) {
                fetchData(); // Refresh data
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
        }
    };

    const handleExportAttendance = () => {
        // This would typically generate a CSV or Excel file
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Student,Group,Date,Time,Status\n"
            + filteredRecords.map(record =>
                `${record.student?.name || 'Unknown'},${record.group?.name || 'Unknown'},${new Date(record.timestamp).toLocaleDateString()},${new Date(record.timestamp).toLocaleTimeString()},${record.status}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filter records based on search criteria
    const filteredRecords = attendanceRecords.filter(record => {
        const matchesSearch = !searchTerm ||
            record.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.group?.name.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGroup = selectedGroup === 'all' || record.group?._id === selectedGroup;

        const matchesDate = !selectedDate ||
            new Date(record.timestamp).toDateString() === new Date(selectedDate).toDateString();

        const matchesStatus = selectedStatus === 'all' || record.status === selectedStatus;

        return matchesSearch && matchesGroup && matchesDate && matchesStatus;
    });

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
        <DashboardLayout title="الحضور">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">سجل الحضور</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    متابعة وإدارة حضور الطلاب في مجموعاتك
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                    onClick={handleExportAttendance}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <ArrowDownTrayIcon className="h-4 w-4 ml-2" />
                                    تصدير
                                </button>
                                <button
                                    onClick={() => setShowAddAttendance(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <PlusIcon className="h-4 w-4 ml-2" />
                                    تسجيل حضور
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ClipboardDocumentListIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="mr-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            إجمالي السجلات
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.total.toLocaleString()}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircleIcon className="h-8 w-8 text-green-400" />
                                </div>
                                <div className="mr-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            الحضور
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.present.toLocaleString()}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <XCircleIcon className="h-8 w-8 text-red-400" />
                                </div>
                                <div className="mr-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            الغياب
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.absent.toLocaleString()}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CalendarDaysIcon className="h-8 w-8 text-blue-400" />
                                </div>
                                <div className="mr-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            اليوم
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {stats.today.toLocaleString()}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    البحث
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="اسم الطالب أو المجموعة..."
                                        className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Group Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    المجموعة
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="all">جميع المجموعات</option>
                                    {groups.map((group) => (
                                        <option key={group._id} value={group._id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    التاريخ
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الحالة
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                >
                                    <option value="all">جميع الحالات</option>
                                    <option value="present">حاضر</option>
                                    <option value="absent">غائب</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">جاري تحميل سجلات الحضور...</p>
                    </div>
                ) : filteredRecords.length === 0 ? (
                    <div className="text-center py-12 bg-white shadow rounded-lg">
                        <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد سجلات حضور</h3>
                        <p className="mt-2 text-gray-600">
                            لا توجد سجلات حضور تطابق معايير البحث المحددة.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        الطالب
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        المجموعة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        التاريخ والوقت
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        الحالة
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        الطريقة
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRecords.map((record) => (
                                    <tr key={record._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-indigo-600">
                                                            {record.student?.name?.charAt(0) || '?'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {record.student?.name || 'طالب غير معروف'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {record.student?.studentNumber || 'رقم غير محدد'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <UserGroupIcon className="h-4 w-4 text-gray-400 ml-1" />
                                                <span className="text-sm text-gray-900">
                                                    {record.group?.name || 'مجموعة غير محددة'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(record.timestamp).toLocaleDateString('ar-EG')}
                                            </div>
                                            <div className="text-sm text-gray-500 flex items-center">
                                                <ClockIcon className="h-3 w-3 ml-1" />
                                                {new Date(record.timestamp).toLocaleTimeString('ar-EG', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${record.status === 'present'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {record.status === 'present' ? (
                                                    <>
                                                        <CheckCircleIcon className="h-3 w-3 ml-1" />
                                                        حاضر
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircleIcon className="h-3 w-3 ml-1" />
                                                        غائب
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.scanMethod || 'مسح يدوي'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AttendancePage;