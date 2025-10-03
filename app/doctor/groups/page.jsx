'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    UserGroupIcon,
    AcademicCapIcon,
    ClockIcon,
    EyeIcon,
    ChevronRightIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';

const MyGroupsPage = () => {
    const { user, isDoctor } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showGroupDetails, setShowGroupDetails] = useState(false);

    useEffect(() => {
        if (isDoctor) {
            fetchGroups();
        }
    }, [isDoctor]);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://sadat-backend-og1p.onrender.com/api/groups/my-groups', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setGroups(data.data || []);
            } else {
                console.error('Error fetching groups:', data.message);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewGroup = (group) => {
        setSelectedGroup(group);
        setShowGroupDetails(true);
    };

    const formatSchedule = (schedule) => {
        if (!schedule || schedule.length === 0) return 'غير محدد';
        return schedule.map(item =>
            `${item.day} (${item.startTime} - ${item.endTime})`
        ).join(', ');
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
        <DashboardLayout title="مجموعاتي">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h1 className="text-2xl font-bold text-gray-900">مجموعاتي</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            إدارة ومتابعة المجموعات المسندة إليك
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">جاري تحميل المجموعات...</p>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-12 bg-white shadow rounded-lg">
                        <UserGroupIcon className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد مجموعات</h3>
                        <p className="mt-2 text-gray-600">
                            لم يتم تعيين أي مجموعات لك بعد. تواصل مع الإدارة لتعيين المجموعات.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Groups Grid */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {groups.map((group) => (
                                <div
                                    key={group._id}
                                    className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200"
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                        <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                                                    </div>
                                                </div>
                                                <div className="mr-4">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        {group.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        {group.department?.name || 'غير محدد'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleViewGroup(group)}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            >
                                                <EyeIcon className="h-4 w-4 mr-1" />
                                                عرض
                                            </button>
                                        </div>

                                        <div className="mt-6 grid grid-cols-3 gap-4">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <p className="mt-1 text-sm font-medium text-gray-900">
                                                    {group.students?.length || 0}
                                                </p>
                                                <p className="text-xs text-gray-500">طالب</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <p className="mt-1 text-sm font-medium text-gray-900">
                                                    {group.schedule?.length || 0}
                                                </p>
                                                <p className="text-xs text-gray-500">جلسة</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <ClockIcon className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <p className="mt-1 text-sm font-medium text-gray-900">
                                                    {group.year || 'غير محدد'}
                                                </p>
                                                <p className="text-xs text-gray-500">السنة</p>
                                            </div>
                                        </div>

                                        {group.schedule && group.schedule.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <p className="text-xs text-gray-500 mb-1">مواعيد المحاضرات:</p>
                                                <p className="text-sm text-gray-700 truncate">
                                                    {formatSchedule(group.schedule)}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 px-6 py-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">آخر تحديث:</span>
                                            <span className="text-gray-900">
                                                {new Date(group.updatedAt).toLocaleDateString('ar-EG')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Group Details Modal */}
                {showGroupDetails && selectedGroup && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                onClick={() => setShowGroupDetails(false)}
                            ></div>

                            <div className="relative inline-block bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all max-w-4xl w-full mx-auto z-10">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
                                    <div className="w-full">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                تفاصيل المجموعة: {selectedGroup.name}
                                            </h3>
                                            <button
                                                onClick={() => setShowGroupDetails(false)}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <span className="sr-only">إغلاق</span>
                                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Group Info */}
                                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">اسم المجموعة</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedGroup.name}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">كود المجموعة</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedGroup.code || 'غير محدد'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">القسم</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedGroup.department?.name || 'غير محدد'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">السنة الدراسية</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedGroup.year || 'غير محدد'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">الفصل الدراسي</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedGroup.semester || 'غير محدد'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">السعة القصوى</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedGroup.capacity || 'غير محدد'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">عدد الطلاب المسجلين</label>
                                                    <p className="mt-1 text-sm text-gray-900">{selectedGroup.students?.length || 0}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">المقاعد المتاحة</label>
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        {selectedGroup.capacity ? selectedGroup.capacity - (selectedGroup.students?.length || 0) : 'غير محدد'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">تاريخ الإنشاء</label>
                                                    <p className="mt-1 text-sm text-gray-900">
                                                        {selectedGroup.createdAt ? new Date(selectedGroup.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Students List */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-medium text-gray-900">قائمة الطلاب</h4>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    {selectedGroup.students?.length || 0} طالب
                                                </span>
                                            </div>
                                            {selectedGroup.students && selectedGroup.students.length > 0 ? (
                                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                                    <table className="min-w-full divide-y divide-gray-300">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    #
                                                                </th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    الاسم
                                                                </th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    البريد الإلكتروني
                                                                </th>
                                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    رقم الطالب
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {selectedGroup.students.map((student, index) => (
                                                                <tr key={student._id || student.id} className="hover:bg-gray-50">
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {index + 1}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                        {student.name || 'غير محدد'}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {student.email || 'غير محدد'}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                        {student.studentNumber || 'غير محدد'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="text-center py-8">
                                                    <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد طلاب</h3>
                                                    <p className="mt-1 text-sm text-gray-500">لم يتم تسجيل أي طلاب في هذه المجموعة.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyGroupsPage;