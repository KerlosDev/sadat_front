'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    ChartBarIcon,
    CalendarDaysIcon,
    AcademicCapIcon,
    UserGroupIcon,
    ArrowDownTrayIcon,
    FunnelIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

const ReportsPage = () => {
    const { user, isDoctor } = useAuth();
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [reportData, setReportData] = useState({
        overview: {
            totalStudents: 0,
            totalSessions: 0,
            averageAttendance: 0,
            presentCount: 0,
            absentCount: 0
        },
        groupStats: [],
        attendanceTrend: [],
        topStudents: [],
        lowAttendanceStudents: []
    });

    useEffect(() => {
        if (isDoctor) {
            fetchData();
        }
    }, [isDoctor, selectedGroup, selectedPeriod]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [groupsRes, reportsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/my-groups`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/doctor?group=${selectedGroup}&period=${selectedPeriod}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            const groupsData = await groupsRes.json();
            const reportsData = await reportsRes.json();

            if (groupsRes.ok) {
                setGroups(groupsData.data || []);
            }

            if (reportsRes.ok) {
                setReportData(reportsData.data || reportData);
            }

        } catch (error) {
            console.error('Error fetching reports data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = () => {
        // Generate CSV report
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Group,Total Students,Sessions,Attendance Rate,Present,Absent\n"
            + reportData.groupStats.map(group =>
                `${group.name},${group.totalStudents},${group.totalSessions},${group.attendanceRate}%,${group.presentCount},${group.absentCount}`
            ).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getPeriodLabel = (period) => {
        switch (period) {
            case 'week': return 'الأسبوع الحالي';
            case 'month': return 'الشهر الحالي';
            case 'semester': return 'الفصل الدراسي';
            default: return 'الكل';
        }
    };

    if (!isDoctor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">غير مسموح بالوصول</h1>
                    <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout title="التقارير">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">تقارير الحضور</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    تحليلات وإحصائيات مفصلة لحضور الطلاب
                                </p>
                            </div>
                            <button
                                onClick={handleExportReport}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4 ml-2" />
                                تصدير التقرير
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">المجموعة:</span>
                                    <select
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup(e.target.value)}
                                        className="border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    >
                                        <option value="all">جميع المجموعات</option>
                                        {groups.map((group) => (
                                            <option key={group._id} value={group._id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2 space-x-reverse">
                                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">الفترة:</span>
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) => setSelectedPeriod(e.target.value)}
                                        className="border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    >
                                        <option value="week">الأسبوع الحالي</option>
                                        <option value="month">الشهر الحالي</option>
                                        <option value="semester">الفصل الدراسي</option>
                                        <option value="all">الكل</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">جاري تحميل التقارير...</p>
                    </div>
                ) : (
                    <>
                        {/* Overview Stats */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <AcademicCapIcon className="h-8 w-8 text-blue-400" />
                                        </div>
                                        <div className="mr-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    إجمالي الطلاب
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {reportData.overview.totalStudents}
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
                                            <CalendarDaysIcon className="h-8 w-8 text-purple-400" />
                                        </div>
                                        <div className="mr-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    الجلسات
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {reportData.overview.totalSessions}
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
                                            <ChartBarIcon className="h-8 w-8 text-indigo-400" />
                                        </div>
                                        <div className="mr-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    معدل الحضور
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-900">
                                                    {reportData.overview.averageAttendance}%
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
                                                    {reportData.overview.presentCount}
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
                                                    {reportData.overview.absentCount}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Group Statistics */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    إحصائيات المجموعات
                                </h3>

                                {reportData.groupStats.length === 0 ? (
                                    <div className="text-center py-8">
                                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد بيانات</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            لا توجد إحصائيات متاحة للفترة المحددة.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        المجموعة
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        عدد الطلاب
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        الجلسات
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        معدل الحضور
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        الحضور
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        الغياب
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {reportData.groupStats.map((group, index) => (
                                                    <tr key={index} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <UserGroupIcon className="h-5 w-5 text-gray-400 ml-2" />
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {group.name || `مجموعة ${index + 1}`}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {group.totalStudents || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {group.totalSessions || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="flex-shrink-0 h-2 w-16 bg-gray-200 rounded-full ml-2">
                                                                    <div
                                                                        className="h-2 bg-green-500 rounded-full"
                                                                        style={{ width: `${Math.min(100, Math.max(0, group.attendanceRate || 0))}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm text-gray-900">
                                                                    {group.attendanceRate || 0}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                            {group.presentCount || 0}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                                            {group.absentCount || 0}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top and Low Attendance Students */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Students */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        أفضل طلاب في الحضور
                                    </h3>

                                    {reportData.topStudents.length === 0 ? (
                                        <div className="text-center py-6">
                                            <AcademicCapIcon className="mx-auto h-8 w-8 text-gray-400" />
                                            <p className="mt-2 text-sm text-gray-500">لا توجد بيانات متاحة</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {reportData.topStudents.slice(0, 5).map((student, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-medium text-green-600">
                                                                #{index + 1}
                                                            </span>
                                                        </div>
                                                        <div className="mr-3">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {student.name || `طالب ${index + 1}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {student.group || 'مجموعة غير محددة'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-green-600">
                                                            {student.attendanceRate || 0}%
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {student.attendedSessions || 0} جلسة
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Low Attendance Students */}
                            <div className="bg-white shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                        طلاب بحاجة لمتابعة
                                    </h3>

                                    {reportData.lowAttendanceStudents.length === 0 ? (
                                        <div className="text-center py-6">
                                            <CheckCircleIcon className="mx-auto h-8 w-8 text-green-400" />
                                            <p className="mt-2 text-sm text-gray-500">جميع الطلاب يحضرون بانتظام</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {reportData.lowAttendanceStudents.slice(0, 5).map((student, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                                            <XCircleIcon className="h-4 w-4 text-red-600" />
                                                        </div>
                                                        <div className="mr-3">
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {student.name || `طالب ${index + 1}`}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {student.group || 'مجموعة غير محددة'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-red-600">
                                                            {student.attendanceRate || 0}%
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {student.missedSessions || 0} غياب
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                    إجراءات سريعة
                                </h3>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    <a
                                        href="/doctor/attendance"
                                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                                                <ClockIcon className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                سجل الحضور
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                عرض سجل تفصيلي لحضور جميع الطلاب
                                            </p>
                                        </div>
                                    </a>

                                    <a
                                        href="/doctor/students"
                                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-700 ring-4 ring-white">
                                                <AcademicCapIcon className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                إدارة الطلاب
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                عرض وإدارة قائمة الطلاب ومعلوماتهم
                                            </p>
                                        </div>
                                    </a>

                                    <a
                                        href="/doctor/scanner"
                                        className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 border border-gray-200 rounded-lg hover:bg-gray-50"
                                    >
                                        <div>
                                            <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                                                <EyeIcon className="h-6 w-6" />
                                            </span>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-lg font-medium">
                                                <span className="absolute inset-0" aria-hidden="true" />
                                                ماسح الرمز
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-500">
                                                مسح رموز الطلاب لتسجيل الحضور
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

export default ReportsPage;