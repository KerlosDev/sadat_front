'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    UserIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DocumentArrowDownIcon,
    UserGroupIcon,
    AcademicCapIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const DoctorsPage = () => {
    const { user, isAdmin } = useAuth();

    // State management
    const [doctors, setDoctors] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [profileDoctor, setProfileDoctor] = useState(null);
    const [profileData, setProfileData] = useState(null);

    // Pagination and filtering
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalDoctors, setTotalDoctors] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        department: '',
        assignedGroups: [],
        profile: {
            title: '',
            specialization: '',
            phone: '',
            officeHours: '',
            bio: ''
        }
    });

    useEffect(() => {
        if (isAdmin) {
            fetchDoctors();
            fetchDepartments();
            fetchGroups();
        }
    }, [isAdmin, currentPage, pageSize, searchTerm, selectedDepartment]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: pageSize,
                ...(searchTerm && { search: searchTerm }),
                ...(selectedDepartment && { department: selectedDepartment })
            };

            const response = await axios.get('/api/doctors', { params });

            if (response.data.success) {
                setDoctors(response.data.data);
                setTotalDoctors(response.data.pagination.total);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            toast.error('Failed to fetch doctors');
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get('/api/departments');
            if (response.data.success) {
                setDepartments(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await axios.get('/api/groups');
            if (response.data.success) {
                setGroups(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const fetchDoctorProfile = async (doctorId) => {
        try {
            const response = await axios.get(`/api/doctors/${doctorId}`);
            if (response.data.success) {
                setProfileData({
                    doctor: response.data.data,
                    statistics: {
                        totalGroups: response.data.data.assignedGroups?.length || 0,
                        totalStudents: 0, // This would need to be calculated
                        attendancePercentage: 85 // This would come from attendance data
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
            toast.error('Failed to load doctor profile');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                assignedGroups: formData.assignedGroups.filter(id => id !== '')
            };

            if (editingDoctor) {
                const response = await axios.put(`/api/doctors/${editingDoctor._id}`, submitData);
                if (response.data.success) {
                    toast.success('Doctor updated successfully');
                    setShowModal(false);
                    fetchDoctors();
                    resetForm();
                }
            } else {
                const response = await axios.post('/api/doctors', submitData);
                if (response.data.success) {
                    toast.success('Doctor created successfully');
                    setShowModal(false);
                    fetchDoctors();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving doctor:', error);
            const message = error.response?.data?.message || 'Error saving doctor';
            toast.error(message);
        }
    };

    const handleEdit = (doctor) => {
        setEditingDoctor(doctor);
        setFormData({
            name: doctor.name,
            email: doctor.email,
            password: '',
            department: doctor.department?._id || '',
            assignedGroups: doctor.assignedGroups?.map(group => group._id) || [],
            profile: {
                title: doctor.profile?.title || '',
                specialization: doctor.profile?.specialization || '',
                phone: doctor.profile?.phone || '',
                officeHours: doctor.profile?.officeHours || '',
                bio: doctor.profile?.bio || ''
            }
        });
        setShowModal(true);
    };

    const handleDelete = async (doctorId) => {
        if (window.confirm('Are you sure you want to delete this doctor?')) {
            try {
                const response = await axios.delete(`/api/doctors/${doctorId}`);
                if (response.data.success) {
                    toast.success('Doctor deleted successfully');
                    fetchDoctors();
                }
            } catch (error) {
                console.error('Error deleting doctor:', error);
                const message = error.response?.data?.message || 'Error deleting doctor';
                toast.error(message);
            }
        }
    };

    const handleViewProfile = async (doctor) => {
        setProfileDoctor(doctor);
        setProfileData(null);
        setShowProfileModal(true);
        await fetchDoctorProfile(doctor._id);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            department: '',
            assignedGroups: [],
            profile: {
                title: '',
                specialization: '',
                phone: '',
                officeHours: '',
                bio: ''
            }
        });
        setEditingDoctor(null);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handlePageSizeChange = (newPageSize) => {
        setPageSize(newPageSize);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedDepartment('');
        setCurrentPage(1);
    };

    const handleExportToExcel = () => {
        const exportData = doctors.map(doctor => ({
            'Name': doctor.name,
            'Email': doctor.email,
            'Department': doctor.department?.name || 'N/A',
            'Title': doctor.profile?.title || 'N/A',
            'Specialization': doctor.profile?.specialization || 'N/A',
            'Phone': doctor.profile?.phone || 'N/A',
            'Assigned Groups': doctor.assignedGroups?.map(g => g.name).join(', ') || 'None',
            'Created Date': new Date(doctor.createdAt).toLocaleDateString(),
            'Status': doctor.isActive ? 'Active' : 'Inactive'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
        XLSX.writeFile(wb, `doctors_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel file exported successfully');
    };

    const handleGroupSelection = (groupId) => {
        const newGroups = formData.assignedGroups.includes(groupId)
            ? formData.assignedGroups.filter(id => id !== groupId)
            : [...formData.assignedGroups, groupId];

        setFormData({ ...formData, assignedGroups: newGroups });
    };

    if (!isAdmin) {
        return (
            <DashboardLayout title="Access Denied">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
                        <p className="text-blue-200">You don't have permission to access this page.</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Doctors Management">
            <div className="min-h-screen">
                <div className="space-y-6 p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Doctors</h2>
                            <p className="text-blue-200">Manage doctor accounts and information</p>
                            <p className="text-sm text-blue-300 mt-1">
                                Total: {totalDoctors} doctors
                            </p>
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleExportToExcel}
                                className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg text-green-400 bg-green-600/10 hover:bg-green-600/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg transition-all duration-200"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                                Export Excel
                            </button>
                            <button
                                onClick={() => setShowModal(true)}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg transition-all duration-200"
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Add Doctor
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl p-6 border border-slate-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Search Doctors
                                </label>
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-12 w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-slate-700"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Filter by Department
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full rounded-lg border-slate-600 bg-slate-700/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept._id} value={dept._id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 text-sm text-blue-400 hover:text-blue-300 underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end items-center">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm text-blue-200">
                                    Show:
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
                                <span className="text-sm text-blue-200">per page</span>
                            </div>
                        </div>
                    </div>

                    {/* Doctors Table */}
                    <div className="bg-slate-800/50 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-slate-700">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                <p className="mt-4 text-blue-200">Loading doctors...</p>
                            </div>
                        ) : doctors.length === 0 ? (
                            <div className="text-center py-12">
                                <UserIcon className="mx-auto h-12 w-12 text-blue-400" />
                                <h3 className="mt-2 text-sm font-medium text-white">No doctors found</h3>
                                <p className="mt-1 text-sm text-blue-300">
                                    {searchTerm || selectedDepartment ? 'Try adjusting your search filters.' : 'Get started by adding a new doctor.'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-700">
                                        <thead className="bg-slate-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    Doctor
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    Title
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    Department
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    Assigned Groups
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    Created
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-blue-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-slate-800/30 divide-y divide-slate-700">
                                            {doctors.map((doctor) => (
                                                <tr key={doctor._id} className="hover:bg-slate-700/50 transition-colors duration-200">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                                    <UserIcon className="h-6 w-6 text-blue-400" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-white">
                                                                    {doctor.name}
                                                                </div>
                                                                <div className="text-sm text-blue-300">
                                                                    {doctor.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                        {doctor.profile?.title || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {doctor.department ? (
                                                            <div className="flex items-center">
                                                                <BuildingOfficeIcon className="h-4 w-4 text-blue-400 mr-2" />
                                                                <span className="text-sm text-white">{doctor.department.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-blue-300">No department</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {doctor.assignedGroups && doctor.assignedGroups.length > 0 ? (
                                                            <div className="flex items-center">
                                                                <UserGroupIcon className="h-4 w-4 text-green-400 mr-2" />
                                                                <span className="text-sm text-white">
                                                                    {doctor.assignedGroups.length} group{doctor.assignedGroups.length !== 1 ? 's' : ''}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-blue-300">No groups assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${doctor.isActive
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {doctor.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">
                                                        {new Date(doctor.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleViewProfile(doctor)}
                                                                className="text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-green-500/20 transition-all duration-200"
                                                                title="View profile"
                                                            >
                                                                <EyeIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(doctor)}
                                                                className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/20 transition-all duration-200"
                                                                title="Edit doctor"
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(doctor._id)}
                                                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/20 transition-all duration-200"
                                                                title="Delete doctor"
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

                                {/* Pagination */}
                                <div className="bg-slate-700/30 px-6 py-4 border-t border-slate-600">
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-blue-300">
                                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalDoctors)} of {totalDoctors} doctors
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                            >
                                                <ChevronLeftIcon className="h-5 w-5" />
                                            </button>

                                            {/* Page numbers */}
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                const pageNumber = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                                if (pageNumber <= totalPages) {
                                                    return (
                                                        <button
                                                            key={pageNumber}
                                                            onClick={() => handlePageChange(pageNumber)}
                                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === pageNumber
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/20'
                                                                }`}
                                                        >
                                                            {pageNumber}
                                                        </button>
                                                    );
                                                }
                                                return null;
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

                    {/* Add/Edit Doctor Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                            <div className="relative bg-slate-800 border border-slate-600 shadow-2xl rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
                                    <h3 className="text-xl font-semibold text-white">
                                        {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                                    </h3>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Basic Information */}
                                            <div className="col-span-2">
                                                <h4 className="text-lg font-medium text-white mb-4">Basic Information</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Full Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={formData.name}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            placeholder="Enter doctor's full name"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Email Address *
                                                        </label>
                                                        <input
                                                            type="email"
                                                            required
                                                            value={formData.email}
                                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                            placeholder="Enter email address"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Department *
                                                        </label>
                                                        <select
                                                            required
                                                            value={formData.department}
                                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                        >
                                                            <option value="">Select Department</option>
                                                            {departments.map((dept) => (
                                                                <option key={dept._id} value={dept._id}>
                                                                    {dept.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Password {editingDoctor && '(leave empty to keep current)'}
                                                        </label>
                                                        <input
                                                            type="password"
                                                            required={!editingDoctor}
                                                            value={formData.password}
                                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                            placeholder="Enter password"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Profile Information */}
                                            <div className="col-span-2">
                                                <h4 className="text-lg font-medium text-white mb-4">Profile Information</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Title
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.profile.title}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                profile: { ...formData.profile, title: e.target.value }
                                                            })}
                                                            placeholder="e.g., Dr., Professor"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Specialization
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.profile.specialization}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                profile: { ...formData.profile, specialization: e.target.value }
                                                            })}
                                                            placeholder="Area of expertise"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Phone Number
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={formData.profile.phone}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                profile: { ...formData.profile, phone: e.target.value }
                                                            })}
                                                            placeholder="Contact phone number"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Office Hours
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={formData.profile.officeHours}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                profile: { ...formData.profile, officeHours: e.target.value }
                                                            })}
                                                            placeholder="e.g., Mon-Wed 10:00-12:00"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>

                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-blue-200 mb-2">
                                                            Bio
                                                        </label>
                                                        <textarea
                                                            rows={3}
                                                            value={formData.profile.bio}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                profile: { ...formData.profile, bio: e.target.value }
                                                            })}
                                                            placeholder="Brief biography or description"
                                                            className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700/50 text-white placeholder-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:bg-slate-700 transition-all duration-200"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Assigned Groups */}
                                            <div className="col-span-2">
                                                <h4 className="text-lg font-medium text-white mb-4">Assigned Groups</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                                                    {groups.map(group => (
                                                        <label key={group._id} className="flex items-center space-x-3 p-3 rounded-lg border border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-all duration-200">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.assignedGroups.includes(group._id)}
                                                                onChange={() => handleGroupSelection(group._id)}
                                                                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-white truncate">
                                                                    {group.name}
                                                                </p>
                                                                <p className="text-xs text-blue-300 truncate">
                                                                    {group.department?.name} - Year {group.year}
                                                                </p>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowModal(false);
                                                    resetForm();
                                                }}
                                                className="px-6 py-3 border border-slate-600 rounded-lg text-sm font-medium text-blue-200 bg-slate-700 hover:bg-slate-600 transition-all duration-200"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                                            >
                                                {editingDoctor ? 'Update' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Doctor Profile Modal */}
                    {showProfileModal && profileDoctor && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                            <div className="relative bg-slate-800 border border-slate-600 shadow-2xl rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 rounded-t-xl">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xl font-semibold text-white">
                                            Doctor Profile - {profileDoctor.name}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setShowProfileModal(false);
                                                setProfileDoctor(null);
                                                setProfileData(null);
                                            }}
                                            className="text-white hover:text-gray-200 p-2 rounded-lg hover:bg-white/10"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                                    {!profileData ? (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                                            <p className="mt-4 text-blue-200">Loading profile...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Doctor Information */}
                                            <div className="space-y-6">
                                                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                        <UserIcon className="h-5 w-5 mr-2 text-blue-400" />
                                                        Doctor Information
                                                    </h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-sm text-blue-300">Full Name</label>
                                                            <p className="text-white font-medium">{profileData.doctor.name}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">Email</label>
                                                            <p className="text-white font-medium">{profileData.doctor.email}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">Title</label>
                                                            <p className="text-white font-medium">{profileData.doctor.profile?.title || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">Specialization</label>
                                                            <p className="text-white font-medium">{profileData.doctor.profile?.specialization || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">Department</label>
                                                            <p className="text-white font-medium">{profileData.doctor.department?.name || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">Phone</label>
                                                            <p className="text-white font-medium">{profileData.doctor.profile?.phone || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">Office Hours</label>
                                                            <p className="text-white font-medium">{profileData.doctor.profile?.officeHours || 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <label className="text-sm text-blue-300">Registration Date</label>
                                                            <p className="text-white font-medium">
                                                                {new Date(profileData.doctor.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        {profileData.doctor.profile?.bio && (
                                                            <div>
                                                                <label className="text-sm text-blue-300">Bio</label>
                                                                <p className="text-white">{profileData.doctor.profile.bio}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Statistics and Groups */}
                                            <div className="space-y-6">
                                                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                        <ChartBarIcon className="h-5 w-5 mr-2 text-green-400" />
                                                        Statistics
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-400/30">
                                                            <div className="text-blue-300 text-sm">Assigned Groups</div>
                                                            <div className="text-2xl font-bold text-white">{profileData.statistics.totalGroups}</div>
                                                        </div>
                                                        <div className="bg-green-500/20 p-4 rounded-lg border border-green-400/30">
                                                            <div className="text-green-300 text-sm">Total Students</div>
                                                            <div className="text-2xl font-bold text-white">{profileData.statistics.totalStudents}</div>
                                                        </div>
                                                        <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-400/30">
                                                            <div className="text-purple-300 text-sm">Attendance Rate</div>
                                                            <div className="text-2xl font-bold text-white">{profileData.statistics.attendancePercentage}%</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-700/50 p-6 rounded-xl border border-slate-600">
                                                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                                                        <UserGroupIcon className="h-5 w-5 mr-2 text-yellow-400" />
                                                        Assigned Groups
                                                    </h4>
                                                    {profileData.doctor.assignedGroups && profileData.doctor.assignedGroups.length > 0 ? (
                                                        <div className="space-y-3">
                                                            {profileData.doctor.assignedGroups.map((group) => (
                                                                <div key={group._id} className="bg-slate-600/50 p-3 rounded-lg border border-slate-500">
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <p className="text-white font-medium">{group.name}</p>
                                                                            <p className="text-blue-300 text-sm">Code: {group.code}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-400/30">
                                                                                Year {group.year}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-blue-300 text-center py-4">No groups assigned</p>
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

export default DoctorsPage;