'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import API_CONFIG from '../../config/api';
import * as XLSX from 'xlsx';
import {
    MagnifyingGlassIcon,
    ClipboardDocumentListIcon,
    UserGroupIcon,
    EyeIcon,
    DocumentArrowDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    ChartBarIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    AcademicCapIcon,
    ClockIcon,
    XMarkIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

const AttendancePage = () => {
    const { isAdmin } = useAuth();
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [groups, setGroups] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [editFormData, setEditFormData] = useState({
        status: '',
        notes: ''
    });

    useEffect(() => {
        if (isAdmin) {
            fetchAttendanceRecords();
            fetchGroups();
            fetchDoctors();
        }
    }, [isAdmin, currentPage, pageSize, searchTerm, selectedGroup, selectedDoctor, selectedStatus, startDate, endDate]);

    const apiCall = async (endpoint, options = {}) => {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        return await response.json();
    };

    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
            });

            if (selectedGroup) params.append('groupId', selectedGroup);
            if (selectedDoctor) params.append('doctorId', selectedDoctor);
            if (selectedStatus) params.append('status', selectedStatus);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const result = await apiCall(`${API_CONFIG.ENDPOINTS.ATTENDANCE}?${params.toString()}`);

            if (result.success) {
                // Filter by search term on frontend if provided
                let filteredRecords = result.data;
                if (searchTerm) {
                    filteredRecords = result.data.filter(record =>
                        record.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        record.student?.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        record.group?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        record.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }

                setAttendanceRecords(filteredRecords);
                setTotalRecords(result.pagination?.total || filteredRecords.length);
                setTotalPages(result.pagination?.pages || Math.ceil(filteredRecords.length / pageSize));
            }
        } catch (error) {
            console.error('Error fetching attendance records:', error);
            alert('خطأ في تحميل سجلات الحضور. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const result = await apiCall(API_CONFIG.ENDPOINTS.GROUPS);
            if (result.success) {
                setGroups(result.data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const result = await apiCall(API_CONFIG.ENDPOINTS.DOCTORS);
            if (result.success) {
                setDoctors(result.data);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const handleEdit = (record) => {
        setEditingRecord(record);
        setEditFormData({
            status: record.status,
            notes: record.notes || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await apiCall(`${API_CONFIG.ENDPOINTS.ATTENDANCE}/${editingRecord._id}`, {
                method: 'PUT',
                body: JSON.stringify(editFormData)
            });

            if (result.success) {
                alert('تم تحديث سجل الحضور بنجاح');
                setShowEditModal(false);
                fetchAttendanceRecords();
            }
        } catch (error) {
            console.error('Error updating attendance:', error);
            alert('خطأ في تحديث سجل الحضور. حاول مرة أخرى.');
        }
    };

    const handleDelete = async (recordId) => {
        if (!confirm('هل أنت متأكد من حذف سجل الحضور هذا؟')) {
            return;
        }

        try {
            const result = await apiCall(`${API_CONFIG.ENDPOINTS.ATTENDANCE}/${recordId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                alert('تم حذف سجل الحضور بنجاح');
                fetchAttendanceRecords();
            }
        } catch (error) {
            console.error('Error deleting attendance:', error);
            alert('خطأ في حذف سجل الحضور. حاول مرة أخرى.');
        }
    };

    const handleExportToExcel = () => {
        try {
            const exportData = attendanceRecords.map(record => ({
                'اسم الطالب': record.student?.name || 'غير محدد',
                'رقم الطالب': record.student?.studentNumber || 'غير محدد',
                'المجموعة': record.group?.name || 'غير محدد',
                'الطبيب': record.doctor?.name || 'غير محدد',
                'حالة الحضور': getStatusInArabic(record.status),
                'تاريخ المحاضرة': new Date(record.lectureDate).toLocaleDateString('ar-EG'),
                'وقت التسجيل': new Date(record.createdAt).toLocaleString('ar-EG'),
                'طريقة التسجيل': record.recordedBy === 'qr_scan' ? 'مسح QR' : 'يدوي',
                'ملاحظات': record.notes || ''
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            const colWidths = [
                { wch: 20 }, // اسم الطالب
                { wch: 15 }, // رقم الطالب
                { wch: 20 }, // المجموعة
                { wch: 20 }, // الطبيب
                { wch: 15 }, // حالة الحضور
                { wch: 15 }, // تاريخ المحاضرة
                { wch: 20 }, // وقت التسجيل
                { wch: 15 }, // طريقة التسجيل
                { wch: 30 }  // ملاحظات
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

            const filename = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('خطأ في تصدير البيانات. حاول مرة أخرى.');
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedGroup('');
        setSelectedDoctor('');
        setSelectedStatus('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present':
                return 'text-green-400 bg-green-400/10';
            case 'absent':
                return 'text-red-400 bg-red-400/10';
            case 'late':
                return 'text-yellow-400 bg-yellow-400/10';
            case 'excused':
                return 'text-blue-400 bg-blue-400/10';
            default:
                return 'text-gray-400 bg-gray-400/10';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <CheckIcon className="h-4 w-4" />;
            case 'absent':
                return <XMarkIcon className="h-4 w-4" />;
            case 'late':
                return <ClockIcon className="h-4 w-4" />;
            case 'excused':
                return <ClipboardDocumentListIcon className="h-4 w-4" />;
            default:
                return <ClipboardDocumentListIcon className="h-4 w-4" />;
        }
    };

    const getStatusInArabic = (status) => {
        switch (status) {
            case 'present':
                return 'حاضر';
            case 'absent':
                return 'غائب';
            case 'late':
                return 'متأخر';
            case 'excused':
                return 'معذور';
            default:
                return status;
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
                <div className="text-center bg-slate-800/50 backdrop-blur-sm p-8 rounded-xl border border-slate-700">
                    <h1 className="text-2xl font-bold text-white mb-4">الوصول مرفوض</h1>
                    <p className="text-blue-200">ليس لديك صلاحية للوصول إلى هذه الصفحة.</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout title="سجلات الحضور">
            <div className="min-h-screen">
                <div className="space-y-6 p-6">
                    {/* Header with Export Button */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">سجلات الحضور</h2>
                            <p className="text-blue-200">إدارة ومراقبة حضور الطلاب</p>
                            <p className="text-sm text-blue-300 mt-1">
                                الإجمالي: {totalRecords} سجل
                            </p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleExportToExcel}
                                className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg text-green-400 bg-green-600/10 hover:bg-green-600/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transition-all duration-200"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                تصدير Excel
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    البحث
                                </label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                                    <input
                                        type="text"
                                        placeholder="البحث بالاسم أو رقم الطالب أو المجموعة..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-slate-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    تصفية حسب المجموعة
                                </label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">جميع المجموعات</option>
                                    {groups.map(group => (
                                        <option key={group._id} value={group._id}>
                                            {group.name} - {group.department?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    تصفية حسب الطبيب
                                </label>
                                <select
                                    value={selectedDoctor}
                                    onChange={(e) => setSelectedDoctor(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">جميع الأطباء</option>
                                    {doctors.map(doctor => (
                                        <option key={doctor._id} value={doctor._id}>
                                            {doctor.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    حالة الحضور
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">جميع الحالات</option>
                                    <option value="present">حاضر</option>
                                    <option value="absent">غائب</option>
                                    <option value="late">متأخر</option>
                                    <option value="excused">معذور</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    من تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    إلى تاريخ
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-blue-400 hover:text-blue-300 underline"
                            >
                                مسح جميع المرشحات
                            </button>
                            <div className="flex items-center space-x-4">
                                <label className="text-sm text-blue-200">
                                    عرض:
                                </label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                                    className="rounded border-slate-600 bg-slate-700/50 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-blue-200">في كل صفحة</span>
                            </div>
                        </div>
                    </div>

                    {/* Attendance Records Table */}
                    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-slate-700">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-4 text-blue-200">جاري تحميل سجلات الحضور...</p>
                            </div>
                        ) : attendanceRecords.length === 0 ? (
                            <div className="text-center py-12">
                                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-blue-400" />
                                <h3 className="mt-2 text-sm font-medium text-white">لا توجد سجلات حضور</h3>
                                <p className="mt-1 text-sm text-blue-300">
                                    {searchTerm || selectedGroup || selectedDoctor || selectedStatus || startDate || endDate ?
                                        'جرب تعديل مرشحات البحث.' :
                                        'ستظهر سجلات الحضور هنا عند تسجيل الطلاب.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-700">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    الطالب
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    المجموعة
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    الطبيب
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    حالة الحضور
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    تاريخ المحاضرة
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    طريقة التسجيل
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    الإجراءات
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                                            {attendanceRecords.map((record) => (
                                                <tr key={record._id} className="hover:bg-slate-700/50 transition-colors duration-200">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                                    <AcademicCapIcon className="h-6 w-6 text-blue-400" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-white">
                                                                    {record.student?.name || 'غير محدد'}
                                                                </div>
                                                                <div className="text-sm text-blue-300">
                                                                    {record.student?.studentNumber || 'غير محدد'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <UserGroupIcon className="h-4 w-4 text-blue-400 mr-2" />
                                                            <span className="text-sm text-white">{record.group?.name || 'غير محدد'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <UserIcon className="h-4 w-4 text-blue-400 mr-2" />
                                                            <span className="text-sm text-white">{record.doctor?.name || 'غير محدد'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                                            {getStatusIcon(record.status)}
                                                            <span className="mr-1">{getStatusInArabic(record.status)}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <CalendarIcon className="h-4 w-4 text-blue-400 mr-2" />
                                                            <span className="text-sm text-white">
                                                                {new Date(record.lectureDate).toLocaleDateString('ar-EG')}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-blue-300">
                                                            {new Date(record.lectureDate).toLocaleTimeString('ar-EG')}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                        {record.recordedBy === 'qr_scan' ? 'مسح QR' : 'يدوي'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleEdit(record)}
                                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                                                title="تعديل"
                                                            >
                                                                <PencilIcon className="h-5 w-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(record._id)}
                                                                className="text-red-400 hover:text-red-300 transition-colors"
                                                                title="حذف"
                                                            >
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="bg-slate-800/30 px-6 py-3 flex items-center justify-between border-t border-slate-700">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-blue-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                السابق
                                            </button>
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600 text-sm font-medium rounded-md text-blue-300 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                التالي
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-blue-300">
                                                    عرض{' '}
                                                    <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                                                    {' '}إلى{' '}
                                                    <span className="font-medium">
                                                        {Math.min(currentPage * pageSize, totalRecords)}
                                                    </span>
                                                    {' '}من{' '}
                                                    <span className="font-medium">{totalRecords}</span>
                                                    {' '}نتيجة
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                    <button
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600 bg-slate-700 text-sm font-medium text-blue-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                                                    </button>
                                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                        const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                                                        if (pageNum > totalPages) return null;
                                                        return (
                                                            <button
                                                                key={pageNum}
                                                                onClick={() => handlePageChange(pageNum)}
                                                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                                                        ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                                                        : 'bg-slate-700 border-slate-600 text-blue-300 hover:bg-slate-600'
                                                                    }`}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600 bg-slate-700 text-sm font-medium text-blue-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-slate-800 border-slate-700">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-white text-center">
                                تعديل سجل الحضور
                            </h3>
                            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        حالة الحضور
                                    </label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full rounded-lg border-slate-600 bg-slate-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="present">حاضر</option>
                                        <option value="absent">غائب</option>
                                        <option value="late">متأخر</option>
                                        <option value="excused">معذور</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        ملاحظات
                                    </label>
                                    <textarea
                                        value={editFormData.notes}
                                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-lg border-slate-600 bg-slate-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="ملاحظات اختيارية..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        حفظ التغييرات
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default AttendancePage;