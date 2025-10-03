'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import API_CONFIG from '../../config/api';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    EyeIcon,
    UserIcon
} from '@heroicons/react/24/outline';

const GroupsPage = () => {
    const { isAdmin } = useAuth();
    const [groups, setGroups] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        code: '',
        department: '',
        doctor: '',
        schedule: '',
        capacity: 30,
        year: 1,
        semester: 1,
        selectedStudents: []
    });

    useEffect(() => {
        if (isAdmin) {
            fetchGroups();
            fetchDepartments();
            fetchDoctors();
            fetchStudents();
        }
    }, [isAdmin]);

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
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                if (errorData.errors && Array.isArray(errorData.errors)) {
                    // Handle validation errors
                    const errorMessages = errorData.errors.map(err => err.msg).join(', ');
                    throw new Error(`Validation failed: ${errorMessages}`);
                } else if (errorData.message) {
                    throw new Error(errorData.message);
                }
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        return await response.json();
    };

    const fetchGroups = async () => {
        try {
            const data = await apiCall(API_CONFIG.ENDPOINTS.GROUPS);
            setGroups(data.data || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
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

    const fetchDoctors = async () => {
        try {
            const data = await apiCall(API_CONFIG.ENDPOINTS.DOCTORS);
            setDoctors(data.data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            const data = await apiCall(API_CONFIG.ENDPOINTS.STUDENTS);
            setStudents(data.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const submitPromise = async () => {
            // Create payload with proper field names
            const payload = {
                name: formData.name,
                code: formData.code,
                department: formData.department,
                year: formData.year,
                semester: formData.semester,
                capacity: formData.capacity,
                description: formData.description,
                schedule: formData.schedule,
                doctor: formData.doctor,
                selectedStudents: formData.selectedStudents
            };

            if (editingGroup) {
                await apiCall(`${API_CONFIG.ENDPOINTS.GROUPS}/${editingGroup._id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                return 'Group updated successfully!';
            } else {
                await apiCall(API_CONFIG.ENDPOINTS.GROUPS, {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
                return 'Group created successfully!';
            }
        };

        try {
            await toast.promise(
                submitPromise(),
                {
                    loading: editingGroup ? 'Updating group...' : 'Creating group...',
                    success: (message) => message,
                    error: (error) => {
                        console.error('Error saving group:', error);
                        return error.message || 'Error saving group. Please try again.';
                    }
                }
            );

            setShowModal(false);
            setEditingGroup(null);
            setFormData({
                name: '',
                description: '',
                code: '',
                department: '',
                doctor: '',
                schedule: '',
                capacity: 30,
                year: 1,
                semester: 1,
                selectedStudents: []
            });
            fetchGroups();
        } catch (error) {
            // Error is already handled by toast.promise
        }
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setFormData({
            name: group.name || '',
            description: group.description || '',
            code: group.code || '',
            department: group.department?._id || group.department || '',
            doctor: group.assignedDoctors && group.assignedDoctors.length > 0
                ? group.assignedDoctors[0]._id || group.assignedDoctors[0]
                : '',
            schedule: group.schedule || '',
            capacity: group.capacity || 30,
            year: group.year || 1,
            semester: group.semester || 1,
            selectedStudents: (group.students || []).map(student =>
                typeof student === 'string' ? student : student._id
            )
        });
        setShowModal(true);
    };

    const handleDelete = async (groupId) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            try {
                await toast.promise(
                    apiCall(`${API_CONFIG.ENDPOINTS.GROUPS}/${groupId}`, {
                        method: 'DELETE'
                    }),
                    {
                        loading: 'Deleting group...',
                        success: 'Group deleted successfully!',
                        error: (error) => {
                            console.error('Error deleting group:', error);
                            return error.message || 'Error deleting group. Please try again.';
                        }
                    }
                );
                fetchGroups();
            } catch (error) {
                // Error is already handled by toast.promise
            }
        }
    };

    const filteredGroups = groups.filter(group => {
        const matchesSearch = group.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDepartment = !selectedDepartment ||
            group.department?._id === selectedDepartment ||
            group.department === selectedDepartment;
        return matchesSearch && matchesDepartment;
    });

    if (!isAdmin) {
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
        <DashboardLayout title="Manage Groups">
            <div className="space-y-6">
                {/* Header */}
                <div className="sm:flex sm:items-center">
                    <div className="sm:flex-auto">
                        <h1 className="text-2xl font-semibold text-white">Groups</h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Manage student groups and their assignments to departments and doctors.
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                        >
                            <PlusIcon className="-ml-1 mr-2 h-4 w-4" />
                            Add Group
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-800 shadow-lg rounded-lg p-6 border border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="search" className="block text-sm font-medium text-white">
                                Search Groups
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    id="search"
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md leading-5 bg-slate-700 placeholder-slate-400 text-white focus:outline-none focus:placeholder-slate-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Search by name, code, or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="department-filter" className="block text-sm font-medium text-white">
                                Filter by Department
                            </label>
                            <select
                                id="department-filter"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept._id} value={dept._id}>
                                        {dept.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Groups Table */}
                <div className="bg-slate-800 shadow-lg rounded-lg overflow-hidden border border-slate-700">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-slate-400">Loading groups...</p>
                        </div>
                    ) : filteredGroups.length === 0 ? (
                        <div className="text-center py-12">
                            <UserGroupIcon className="mx-auto h-12 w-12 text-slate-500" />
                            <h3 className="mt-2 text-sm font-medium text-white">No groups found</h3>
                            <p className="mt-1 text-sm text-slate-400">
                                {searchTerm || selectedDepartment
                                    ? 'Try adjusting your search criteria.'
                                    : 'Get started by creating a new group.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-700">
                                <thead className="bg-slate-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Group Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Code
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Year/Semester
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Department
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Doctor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Schedule
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Capacity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Students
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-800 divide-y divide-slate-700">
                                    {filteredGroups.map((group) => (
                                        <tr key={group._id} className="hover:bg-slate-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                            <UserGroupIcon className="h-5 w-5 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-white">
                                                            {group.name}
                                                        </div>
                                                        <div className="text-sm text-slate-400">
                                                            {group.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {group.code || 'No code'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                <div className="text-sm text-white">Year {group.year || 'N/A'}</div>
                                                <div className="text-sm text-slate-400">Semester {group.semester || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                <div className="flex items-center">
                                                    <BuildingOfficeIcon className="h-4 w-4 text-slate-400 mr-2" />
                                                    {group.department?.name || 'Not assigned'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                <div className="flex items-center">
                                                    <UserIcon className="h-4 w-4 text-slate-400 mr-2" />
                                                    {group.assignedDoctors && group.assignedDoctors.length > 0
                                                        ? group.assignedDoctors[0].name
                                                        : 'Not assigned'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {group.schedule || 'Not set'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {group.capacity || 'No limit'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {group.studentCount || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(group)}
                                                        className="text-blue-400 hover:text-blue-300 p-1 rounded"
                                                        title="Edit group"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(group._id)}
                                                        className="text-red-400 hover:text-red-300 p-1 rounded"
                                                        title="Delete group"
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
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-2xl bg-slate-800 rounded-lg shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-semibold text-white">
                                    {editingGroup ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingGroup(null);
                                        setFormData({
                                            name: '',
                                            description: '',
                                            code: '',
                                            department: '',
                                            doctor: '',
                                            schedule: '',
                                            capacity: 30,
                                            year: 1,
                                            semester: 1,
                                            selectedStudents: []
                                        });
                                    }}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            اسم المجموعة *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="أدخل اسم المجموعة"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            كود المجموعة *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="مثال: CS101-G1"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            السنة الدراسية *
                                        </label>
                                        <select
                                            required
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        >
                                            <option value={1}>السنة الأولى</option>
                                            <option value={2}>السنة الثانية</option>
                                            <option value={3}>السنة الثالثة</option>
                                            <option value={4}>السنة الرابعة</option>
                                            <option value={5}>السنة الخامسة</option>
                                            <option value={6}>السنة السادسة</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            الفصل الدراسي *
                                        </label>
                                        <select
                                            required
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.semester}
                                            onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                                        >
                                            <option value={1}>الفصل الأول</option>
                                            <option value={2}>الفصل الثاني</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            السعة القصوى
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        الوصف
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="3"
                                        placeholder="أدخل وصف المجموعة"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Department and Doctor */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            القسم *
                                        </label>
                                        <select
                                            required
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            <option value="">اختر القسم</option>
                                            {departments.map((dept) => (
                                                <option key={dept._id} value={dept._id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-white mb-2">
                                            الدكتور
                                        </label>
                                        <select
                                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.doctor}
                                            onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                        >
                                            <option value="">اختر الدكتور (اختياري)</option>
                                            {doctors.map((doctor) => (
                                                <option key={doctor._id} value={doctor._id}>
                                                    {doctor.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        الجدول الزمني
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="مثال: الإثنين 10:00-12:00"
                                        value={formData.schedule}
                                        onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                    />
                                </div>

                                {/* Students Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        الطلاب
                                    </label>
                                    <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 max-h-48 overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {students.map((student) => (
                                                <label key={student._id} className="flex items-center space-x-3 space-x-reverse p-2 rounded hover:bg-slate-600 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="form-checkbox h-4 w-4 text-blue-500 focus:ring-blue-500 border-slate-500 rounded"
                                                        checked={formData.selectedStudents.includes(student._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    selectedStudents: [...formData.selectedStudents, student._id]
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    selectedStudents: formData.selectedStudents.filter(id => id !== student._id)
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-white text-sm font-medium">{student.name}</div>
                                                        <div className="text-slate-400 text-xs">{student.studentNumber}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {students.length === 0 && (
                                            <p className="text-slate-400 text-center py-4">لا توجد طلاب متاحون</p>
                                        )}
                                    </div>
                                    <div className="mt-2 text-sm text-slate-400">
                                        تم اختيار {formData.selectedStudents.length} طالب
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end space-x-3 space-x-reverse pt-6 border-t border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingGroup(null);
                                            setFormData({
                                                name: '',
                                                description: '',
                                                code: '',
                                                department: '',
                                                doctor: '',
                                                schedule: '',
                                                capacity: 30,
                                                year: 1,
                                                semester: 1,
                                                selectedStudents: []
                                            });
                                        }}
                                        className="px-6 py-3 text-sm font-medium text-slate-300 bg-slate-700 border border-slate-600 rounded-lg hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                    >
                                        {editingGroup ? 'تحديث' : 'حفظ'}
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

export default GroupsPage;