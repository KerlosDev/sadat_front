'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import API_CONFIG from '../config/api';
import {
    UserGroupIcon,
    AcademicCapIcon,
    ClipboardDocumentListIcon,
    BuildingOfficeIcon,
    UserIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
    const { user, isAdmin } = useAuth();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalDoctors: 0,
        totalDepartments: 0,
        totalGroups: 0,
        todayAttendance: 0,
        weeklyAttendance: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        if (isAdmin) {
            fetchDashboardData();
        }
    }, [isAdmin]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch dashboard data from the system overview endpoint
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORTS}/overview`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                const { overview, todayAttendance, weeklyAttendance, recentActivity } = result.data;

                setStats({
                    totalStudents: overview.totalStudents || 0,
                    totalDoctors: overview.totalDoctors || 0,
                    totalDepartments: overview.totalDepartments || 0,
                    totalGroups: overview.totalGroups || 0,
                    todayAttendance: (todayAttendance.present || 0) + (todayAttendance.absent || 0),
                    weeklyAttendance: (weeklyAttendance.present || 0) + (weeklyAttendance.absent || 0)
                });

                setRecentActivities(recentActivity || []);
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            name: 'إجمالي الطلاب',
            value: stats.totalStudents,
            icon: AcademicCapIcon,
            color: 'bg-blue-500',
            href: '/admin/students'
        },
        {
            name: 'إجمالي الأطباء',
            value: stats.totalDoctors,
            icon: UserIcon,
            color: 'bg-green-500',
            href: '/admin/doctors'
        },
        {
            name: 'الأقسام',
            value: stats.totalDepartments,
            icon: BuildingOfficeIcon,
            color: 'bg-purple-500',
            href: '/admin/departments'
        },
        {
            name: 'المجموعات',
            value: stats.totalGroups,
            icon: UserGroupIcon,
            color: 'bg-yellow-500',
            href: '/admin/groups'
        },
        {
            name: 'حضور اليوم',
            value: stats.todayAttendance,
            icon: ClipboardDocumentListIcon,
            color: 'bg-indigo-500',
            href: '/admin/attendance'
        },
        {
            name: 'حضور الأسبوع',
            value: stats.weeklyAttendance,
            icon: ChartBarIcon,
            color: 'bg-red-500',
            href: '/admin/reports'
        }
    ];

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900" dir="rtl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">ممنوع الدخول</h1>
                    <p className="text-slate-400">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout title="لوحة تحكم الإدارة">
            <div className="min-h-screen bg-slate-900" dir="rtl">
                <div className="space-y-6 p-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-slate-300">جاري تحميل بيانات لوحة التحكم...</p>
                        </div>
                    ) : (
                        <>
                            {/* Welcome Section */}
                            <div className="bg-slate-800 overflow-hidden shadow-xl rounded-xl border border-slate-700">
                                <div className="px-6 py-8">
                                    <h3 className="text-2xl leading-6 font-bold text-white">
                                        أهلاً وسهلاً بك، {user?.name}!
                                    </h3>
                                    <div className="mt-3 max-w-xl text-slate-300">
                                        <p>إليك ملخص ما يحدث في جامعتك اليوم.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics Cards */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {statCards.map((card, index) => (
                                    <div
                                        key={index}
                                        className="relative bg-slate-800 pt-6 px-6 pb-16 shadow-xl rounded-xl overflow-hidden border border-slate-700 hover:bg-slate-700 transition-colors duration-200"
                                    >
                                        <dt>
                                            <div className={`absolute ${card.color} rounded-xl p-3 shadow-lg`}>
                                                <card.icon className="h-7 w-7 text-white" />
                                            </div>
                                            <p className="mr-20 text-sm font-medium text-slate-300 truncate">
                                                {card.name}
                                            </p>
                                        </dt>
                                        <dd className="mr-20 pb-6 flex items-baseline sm:pb-7">
                                            <p className="text-3xl font-bold text-white">
                                                {card.value.toLocaleString()}
                                            </p>
                                        </dd>
                                        <div className="absolute bottom-0 inset-x-0 bg-slate-700/50 px-6 py-4">
                                            <div className="text-sm">
                                                <a
                                                    href={card.href}
                                                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    عرض الكل<span className="sr-only"> {card.name}</span>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-slate-800 shadow-xl rounded-xl border border-slate-700">
                                <div className="px-6 py-6">
                                    <h3 className="text-xl leading-6 font-bold text-white mb-6">
                                        أنشطة الحضور الحديثة
                                    </h3>

                                    {recentActivities.length === 0 ? (
                                        <div className="text-center py-8">
                                            <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-slate-500" />
                                            <h3 className="mt-4 text-lg font-medium text-white">لا توجد أنشطة حديثة</h3>
                                            <p className="mt-2 text-slate-400">
                                                ستظهر أنشطة الحضور هنا عند تسجيل الطلاب حضورهم.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="flow-root">
                                            <ul className="-mb-8">
                                                {recentActivities.slice(0, 8).map((activity, index) => (
                                                    <li key={activity._id}>
                                                        <div className="relative pb-8">
                                                            {index !== recentActivities.slice(0, 8).length - 1 && (
                                                                <span
                                                                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-600"
                                                                    aria-hidden="true"
                                                                />
                                                            )}
                                                            <div className="relative flex space-x-3 space-x-reverse">
                                                                <div>
                                                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-800 ${activity.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                                                                        }`}>
                                                                        <ClipboardDocumentListIcon className="h-4 w-4 text-white" />
                                                                    </span>
                                                                </div>
                                                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4 space-x-reverse">
                                                                    <div>
                                                                        <p className="text-sm text-slate-300">
                                                                            <span className="font-medium text-white">
                                                                                {activity.student?.name || 'طالب غير معروف'}
                                                                            </span>{' '}
                                                                            سجل{' '}
                                                                            <span className={`font-medium ${activity.status === 'present' ? 'text-green-400' : 'text-red-400'
                                                                                }`}>
                                                                                {activity.status === 'present' ? 'حضور' : 'غياب'}
                                                                            </span>{' '}
                                                                            في{' '}
                                                                            <span className="font-medium text-white">
                                                                                {activity.group?.name || 'مجموعة غير معروفة'}
                                                                            </span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-left text-sm whitespace-nowrap text-slate-400">
                                                                        {new Date(activity.createdAt || activity.timestamp).toLocaleString('ar-EG')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {recentActivities.length > 8 && (
                                        <div className="mt-8">
                                            <a
                                                href="/admin/attendance"
                                                className="w-full flex justify-center items-center px-6 py-3 border border-slate-600 shadow-sm text-sm font-medium rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
                                            >
                                                عرض جميع الأنشطة
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-slate-800 shadow-xl rounded-xl border border-slate-700">
                                <div className="px-6 py-6">
                                    <h3 className="text-xl leading-6 font-bold text-white mb-6">
                                        إجراءات سريعة
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                        <a
                                            href="/admin/students"
                                            className="relative group bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-slate-600 rounded-xl hover:bg-slate-600 transition-colors duration-200"
                                        >
                                            <div>
                                                <span className="rounded-xl inline-flex p-3 bg-blue-500/20 text-blue-400 ring-4 ring-slate-700">
                                                    <AcademicCapIcon className="h-7 w-7" />
                                                </span>
                                            </div>
                                            <div className="mt-8">
                                                <h3 className="text-lg font-bold text-white">
                                                    <span className="absolute inset-0" aria-hidden="true" />
                                                    إدارة الطلاب
                                                </h3>
                                                <p className="mt-3 text-sm text-slate-300">
                                                    إضافة وتعديل وإدارة سجلات الطلاب
                                                </p>
                                            </div>
                                        </a>

                                        <a
                                            href="/admin/doctors"
                                            className="relative group bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-slate-600 rounded-xl hover:bg-slate-600 transition-colors duration-200"
                                        >
                                            <div>
                                                <span className="rounded-xl inline-flex p-3 bg-green-500/20 text-green-400 ring-4 ring-slate-700">
                                                    <UserIcon className="h-7 w-7" />
                                                </span>
                                            </div>
                                            <div className="mt-8">
                                                <h3 className="text-lg font-bold text-white">
                                                    <span className="absolute inset-0" aria-hidden="true" />
                                                    إدارة الأطباء
                                                </h3>
                                                <p className="mt-3 text-sm text-slate-300">
                                                    إضافة وتعديل وإدارة ملفات الأطباء
                                                </p>
                                            </div>
                                        </a>

                                        <a
                                            href="/admin/departments"
                                            className="relative group bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-slate-600 rounded-xl hover:bg-slate-600 transition-colors duration-200"
                                        >
                                            <div>
                                                <span className="rounded-xl inline-flex p-3 bg-purple-500/20 text-purple-400 ring-4 ring-slate-700">
                                                    <BuildingOfficeIcon className="h-7 w-7" />
                                                </span>
                                            </div>
                                            <div className="mt-8">
                                                <h3 className="text-lg font-bold text-white">
                                                    <span className="absolute inset-0" aria-hidden="true" />
                                                    إدارة الأقسام
                                                </h3>
                                                <p className="mt-3 text-sm text-slate-300">
                                                    تنظيم أقسام الجامعة
                                                </p>
                                            </div>
                                        </a>

                                        <a
                                            href="/admin/reports"
                                            className="relative group bg-slate-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-slate-600 rounded-xl hover:bg-slate-600 transition-colors duration-200"
                                        >
                                            <div>
                                                <span className="rounded-xl inline-flex p-3 bg-indigo-500/20 text-indigo-400 ring-4 ring-slate-700">
                                                    <ChartBarIcon className="h-7 w-7" />
                                                </span>
                                            </div>
                                            <div className="mt-8">
                                                <h3 className="text-lg font-bold text-white">
                                                    <span className="absolute inset-0" aria-hidden="true" />
                                                    عرض التقارير
                                                </h3>
                                                <p className="mt-3 text-sm text-slate-300">
                                                    تحليلات وتقارير الحضور
                                                </p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;