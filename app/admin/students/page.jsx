'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import QRCodeDisplay from '../../components/QRCodeDisplay';
import API_CONFIG from '../../config/api';
import * as XLSX from 'xlsx';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    AcademicCapIcon,
    UserGroupIcon,
    EyeIcon,
    DocumentArrowDownIcon,
    QrCodeIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CalendarIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

const StudentsPage = () => {
    const { isAdmin } = useAuth();
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [profileStudent, setProfileStudent] = useState(null);
    const [profileData, setProfileData] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        year: 1,
        department: '',
        group: '',
        password: ''
    });

    useEffect(() => {
        if (isAdmin) {
            fetchStudents();
            fetchGroups();
            fetchDepartments();
        }
    }, [isAdmin, currentPage, pageSize, searchTerm, selectedGroup, selectedDepartment, selectedYear]);

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
            // Try to get the error message from the response
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        return await response.json();
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
            });

            if (searchTerm) params.append('search', searchTerm);
            if (selectedGroup) params.append('group', selectedGroup);
            if (selectedDepartment) params.append('department', selectedDepartment);
            if (selectedYear) params.append('year', selectedYear);

            const data = await apiCall(`${API_CONFIG.ENDPOINTS.STUDENTS}?${params}`);
            setStudents(data.data || []);
            setTotalPages(data.pagination?.pages || 1);
            setTotalStudents(data.pagination?.total || 0);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroups = async () => {
        try {
            const data = await apiCall(API_CONFIG.ENDPOINTS.GROUPS);
            setGroups(data.data || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const data = await apiCall(API_CONFIG.ENDPOINTS.DEPARTMENTS);
            setDepartments(data.data || []);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Prepare clean data for the API (only send fields the backend expects)
            const apiData = {
                name: formData.name,
                email: formData.email,
                year: formData.year,
                department: formData.department,
                group: formData.group,
                password: formData.password
            };

            // Remove empty fields for updates
            if (editingStudent && !apiData.password) {
                delete apiData.password;
            }

            if (editingStudent) {
                await apiCall(`${API_CONFIG.ENDPOINTS.STUDENTS}/${editingStudent._id}`, {
                    method: 'PUT',
                    body: JSON.stringify(apiData)
                });
            } else {
                await apiCall(API_CONFIG.ENDPOINTS.STUDENTS, {
                    method: 'POST',
                    body: JSON.stringify(apiData)
                });
            }

            setShowModal(false);
            setEditingStudent(null);
            setFormData({
                name: '',
                email: '',
                year: 1,
                department: '',
                group: '',
                password: ''
            });
            fetchStudents();
        } catch (error) {
            console.error('Error saving student:', error);
            alert(`Error saving student: ${error.message}`);
        }
    };

    const handleEdit = (student) => {
        setEditingStudent(student);
        setFormData({
            name: student.name,
            email: student.email,
            year: student.year || 1,
            department: student.department?._id || '',
            group: student.group?._id || '',
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (studentId) => {
        if (!confirm('Are you sure you want to delete this student?')) return;

        try {
            await apiCall(`${API_CONFIG.ENDPOINTS.STUDENTS}/${studentId}`, {
                method: 'DELETE'
            });
            fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Error deleting student. Please try again.');
        }
    };

    const handleViewProfile = async (student) => {
        try {
            setProfileStudent(student);
            setShowProfileModal(true);

            // Fetch detailed profile data
            const data = await apiCall(`${API_CONFIG.ENDPOINTS.STUDENTS}/${student._id}/profile`);
            setProfileData(data.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            alert('Error loading profile data.');
        }
    };

    const handleExportToExcel = () => {
        try {
            // Prepare data for export
            const exportData = students.map(student => ({
                'Student Number': student.studentNumber,
                'Name': student.name,
                'Email': student.email,
                'Year': `Year ${student.year}`,
                'Department': student.department?.name || 'N/A',
                'Group': student.group?.name || 'N/A',
                'Created Date': new Date(student.createdAt).toLocaleDateString()
            }));

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Auto-size columns
            const colWidths = [
                { wch: 15 }, // Student Number
                { wch: 25 }, // Name
                { wch: 30 }, // Email
                { wch: 10 }, // Year
                { wch: 20 }, // Department
                { wch: 20 }, // Group
                { wch: 15 }  // Created Date
            ];
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Students');

            // Generate filename with current date
            const filename = `students_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Error exporting data. Please try again.');
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedGroup('');
        setSelectedDepartment('');
        setSelectedYear('');
        setCurrentPage(1);
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
        <DashboardLayout title="ادارة الطلاب">
            <div className="min-h-screen">
                <div className="space-y-6 p-6">
                    {/* Header with Add Button */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">الطلاب</h2>
                            <p className="text-blue-200">إدارة حسابات الطلاب والمعلومات</p>
                            <p className="text-sm text-blue-300 mt-1">
                                الإجمالي: {totalStudents} طالب
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
                            <button
                                onClick={() => setShowModal(true)}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                إضافة طالب
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    البحث عن الطلاب
                                </label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                                    <input
                                        type="text"
                                        placeholder="البحث بالاسم أو البريد الإلكتروني أو رقم الطالب..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-slate-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    تصفية حسب القسم
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">جميع الأقسام</option>
                                    {departments.map(dept => (
                                        <option key={dept._id} value={dept._id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
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
                                    تصفية حسب السنة
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">جميع السنوات</option>
                                    <option value="1">السنة الأولى</option>
                                    <option value="2">السنة الثانية</option>
                                    <option value="3">السنة الثالثة</option>
                                    <option value="4">السنة الرابعة</option>
                                    <option value="5">السنة الخامسة</option>
                                    <option value="6">السنة السادسة</option>
                                </select>
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

                    {/* Students Table */}
                    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-slate-700">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-4 text-blue-200">جاري تحميل الطلاب...</p>
                            </div>
                        ) : students.length === 0 ? (
                            <div className="text-center py-12">
                                <AcademicCapIcon className="mx-auto h-12 w-12 text-blue-400" />
                                <h3 className="mt-2 text-sm font-medium text-white">لا توجد طلاب</h3>
                                <p className="mt-1 text-sm text-blue-300">
                                    {searchTerm || selectedGroup || selectedDepartment || selectedYear ? 'جرب تعديل مرشحات البحث.' : 'ابدأ بإضافة طالب جديد.'}
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
                                                    رقم الطالب
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    السنة
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    المجموعة
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    القسم
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    تاريخ الإنشاء
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    الإجراءات
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                                            {students.map((student) => (
                                                <tr key={student._id} className="hover:bg-slate-700/50 transition-colors duration-200">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                                    <AcademicCapIcon className="h-6 w-6 text-blue-400" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-white">
                                                                    {student.name}
                                                                </div>
                                                                <div className="text-sm text-blue-300">
                                                                    {student.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                        {student.studentNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                        السنة {student.year}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {student.group ? (
                                                            <div className="flex items-center">
                                                                <UserGroupIcon className="h-4 w-4 text-blue-400 mr-2" />
                                                                <span className="text-sm text-white">{student.group.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-blue-300">لا توجد مجموعة مُخصصة</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">
                                                        {student.department?.name || 'غير محدد'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">
                                                        {new Date(student.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleViewProfile(student)}
                                                                className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-green-500/20 transition-all duration-200"
                                                                title="عرض الملف الشخصي"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(student)}
                                                                className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/20 transition-all duration-200"
                                                                title="تعديل الطالب"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(student._id)}
                                                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all duration-200"
                                                                title="حذف الطالب"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className="bg-slate-700/30 px-6 py-4 border-t border-slate-600">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-blue-300">
                                            عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalStudents)} من {totalStudents} طالب
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                            >
                                                <ChevronLeftIcon className="h-5 w-5" />
                                            </button>

                                            {/* Page Numbers */}
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                                if (page > totalPages) return null;

                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => handlePageChange(page)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${page === currentPage
                                                            ? 'bg-blue-600 text-white'
                                                            : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/20'
                                                            }`}
                                                    >
                                                        {page}
                                                    </button>
                                                );
                                            })}

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                            >
                                                <ChevronRightIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Modal for Add/Edit Student */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                            <div className="relative bg-slate-800 border border-slate-600 shadow-2xl rounded-xl w-full max-w-2xl">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
                                    <h3 className="text-xl font-semibold text-white">
                                        {editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
                                    </h3>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Name Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                                    الاسم *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    placeholder="أدخل اسم الطالب"
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                />
                                            </div>

                                            {/* Email Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                                    البريد الإلكتروني *
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="أدخل البريد الإلكتروني"
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                />
                                            </div>

                                            {/* Year Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                                    السنة الدراسية *
                                                </label>
                                                <select
                                                    required
                                                    value={formData.year}
                                                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                >
                                                    <option value={1}>السنة الأولى</option>
                                                    <option value={2}>السنة الثانية</option>
                                                    <option value={3}>السنة الثالثة</option>
                                                    <option value={4}>السنة الرابعة</option>
                                                    <option value={5}>السنة الخامسة</option>
                                                    <option value={6}>السنة السادسة</option>
                                                </select>
                                            </div>

                                            {/* Department Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                                    القسم *
                                                </label>
                                                <select
                                                    required
                                                    value={formData.department}
                                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                >
                                                    <option value="">اختر القسم</option>
                                                    {departments.map((dept) => (
                                                        <option key={dept._id} value={dept._id}>
                                                            {dept.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Group Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                                    المجموعة
                                                </label>
                                                <select
                                                    value={formData.group}
                                                    onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                >
                                                    <option value="">اختر المجموعة</option>
                                                    {groups.map(group => (
                                                        <option key={group._id} value={group._id}>
                                                            {group.name} - {group.department?.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Password Field */}
                                            <div>
                                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                                    كلمة المرور {editingStudent && '(اتركها فارغة للاحتفاظ بالحالية)'}
                                                </label>
                                                <input
                                                    type="password"
                                                    required={!editingStudent}
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                    placeholder="أدخل كلمة المرور"
                                                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                />
                                            </div>
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    setEditingStudent(null);
                                                    setFormData({
                                                        name: '',
                                                        email: '',
                                                        year: 1,
                                                        department: '',
                                                        group: '',
                                                        password: ''
                                                    });
                                                }}
                                                className="px-6 py-3 border border-slate-600 rounded-lg text-sm font-medium text-blue-200 bg-slate-700 hover:bg-slate-600 transition-all duration-200"
                                            >
                                                إلغاء
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                            >
                                                {editingStudent ? 'تحديث' : 'حفظ'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Modal */}
                    {showProfileModal && profileStudent && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                            <div className="relative bg-slate-800 border border-slate-600 shadow-2xl rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 rounded-t-xl">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-semibold text-white">
                                            الملف الشخصي للطالب - {profileStudent.name}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setShowProfileModal(false);
                                                setProfileStudent(null);
                                                setProfileData(null);
                                            }}
                                            className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/10"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {!profileData ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                            <p className="mt-4 text-blue-200">جاري تحميل الملف الشخصي...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Student Info */}
                                            <div className="lg:col-span-2 space-y-6">
                                                {/* Basic Info */}
                                                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                        <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-400" />
                                                        معلومات الطالب
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-sm text-blue-300">الاسم الكامل</label>
                                                            <p className="text-white font-medium">{profileData.student.name}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">رقم الطالب</label>
                                                            <p className="text-white font-medium">{profileData.student.studentNumber}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">البريد الإلكتروني</label>
                                                            <p className="text-white font-medium">{profileData.student.email}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">السنة الأكاديمية</label>
                                                            <p className="text-white font-medium">السنة {profileData.student.year}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">القسم</label>
                                                            <p className="text-white font-medium">{profileData.student.department?.name || 'غير محدد'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">المجموعة</label>
                                                            <p className="text-white font-medium">{profileData.student.group?.name || 'لا توجد مجموعة مُخصصة'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">تاريخ التسجيل</label>
                                                            <p className="text-white font-medium">
                                                                {new Date(profileData.student.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Attendance Statistics */}
                                                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                        <ChartBarIcon className="h-5 w-5 mr-2 text-green-400" />
                                                        إحصائيات الحضور
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-400/30">
                                                            <div className="text-blue-300 text-sm">إجمالي الجلسات</div>
                                                            <div className="text-2xl font-bold text-white">{profileData.statistics.totalSessions}</div>
                                                        </div>
                                                        <div className="bg-green-500/20 p-4 rounded-lg border border-green-400/30">
                                                            <div className="text-green-300 text-sm">الحضور</div>
                                                            <div className="text-2xl font-bold text-white">{profileData.statistics.attendedSessions}</div>
                                                        </div>
                                                        <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-400/30">
                                                            <div className="text-purple-300 text-sm">معدل الحضور</div>
                                                            <div className="text-2xl font-bold text-white">{profileData.statistics.attendancePercentage}%</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Recent Attendance */}
                                                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                        <CalendarIcon className="h-5 w-5 mr-2 text-yellow-400" />
                                                        سجلات الحضور الأخيرة
                                                    </h4>
                                                    {profileData.attendance.length === 0 ? (
                                                        <p className="text-blue-300 text-center py-4">لا توجد سجلات حضور</p>
                                                    ) : (
                                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                                            {profileData.attendance.map((record, index) => (
                                                                <div key={index} className="bg-slate-600/50 p-3 rounded-lg border border-slate-500">
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <p className="text-white font-medium">
                                                                                {record.session?.subject || 'مادة غير معروفة'}
                                                                            </p>
                                                                            <p className="text-blue-300 text-sm">
                                                                                {new Date(record.session?.date).toLocaleDateString()}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'present'
                                                                                ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                                                                                : 'bg-red-500/20 text-red-400 border border-red-400/30'
                                                                                }`}>
                                                                                {record.status === 'present' ? 'حاضر' : 'غائب'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* QR Code */}
                                            <div className="space-y-6">
                                                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                        <QrCodeIcon className="h-5 w-5 mr-2 text-purple-400" />
                                                        QR Code
                                                    </h4>
                                                    {profileData.student.qrCode ? (
                                                        <div className="text-center">
                                                            <div className="bg-white p-4 rounded-lg inline-block">
                                                                {profileData.student.qrCode.startsWith('data:image/') ? (
                                                                    <img
                                                                        src={profileData.student.qrCode}
                                                                        alt="Student QR Code"
                                                                        className="w-48 h-48 mx-auto"
                                                                    />
                                                                ) : (
                                                                    <QRCodeDisplay
                                                                        data={profileData.student.qrCode}
                                                                        size={192}
                                                                        showCopyButton={false}
                                                                        title=""
                                                                        className="w-48 h-48"
                                                                    />
                                                                )}
                                                            </div>
                                                            <p className="text-blue-300 text-sm mt-2">
                                                                QR Code for attendance tracking
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <QrCodeIcon className="mx-auto h-12 w-12 text-slate-400" />
                                                            <p className="text-slate-400 mt-2">No QR code available</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default StudentsPage;