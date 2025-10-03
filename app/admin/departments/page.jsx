'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import API_CONFIG from '../../config/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const DepartmentsPage = () => {
  const { isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    if (isAdmin) {
      fetchDepartments();
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Response is not JSON');
    }

    return await response.json();
  };

  const fetchDepartments = async () => {
    try {
      const data = await apiCall(API_CONFIG.ENDPOINTS.DEPARTMENTS);
      setDepartments(data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingDepartment
        ? `/api/departments/${editingDepartment._id}`
        : '/api/departments';

      const method = editingDepartment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowModal(false);
        setEditingDepartment(null);
        setFormData({
          name: '',
          code: '',
          description: ''
        });
        fetchDepartments();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error saving department');
      }
    } catch (error) {
      console.error('Error saving department:', error);
      alert('Error saving department');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (departmentId) => {
    if (!confirm('Are you sure you want to delete this department? This will also affect all associated groups and students.')) return;

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        fetchDepartments();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error deleting department');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Error deleting department');
    }
  };

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (department.description && department.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e293b]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Departments Management">
      <div className="space-y-6 bg-[#1e293b] min-h-screen p-6">
        {/* Header with Add Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">الأقسام</h2>
            <p className="text-gray-300">إدارة أقسام الجامعة والهيكل التنظيمي</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            إضافة قسم
          </button>
        </div>

        {/* Search */}
        <div className="bg-[#334155] shadow rounded-lg p-6 border border-gray-600">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-200 mb-2">
              البحث في الأقسام
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث بالاسم أو الكود أو الوصف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md bg-[#475569] border-gray-500 text-white placeholder-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-300">جاري تحميل الأقسام...</p>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="bg-[#334155] shadow rounded-lg border border-gray-600">
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">لم يتم العثور على أقسام</h3>
              <p className="mt-1 text-sm text-gray-300">
                {searchTerm ? 'حاول تعديل مصطلحات البحث.' : 'ابدأ بإنشاء قسم جديد.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((department) => (
              <div key={department._id} className="bg-[#334155] overflow-hidden shadow-lg rounded-lg border border-gray-600 hover:border-blue-500 transition-colors">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-medium text-white truncate">
                        {department.name}
                      </h3>
                      <p className="text-sm text-gray-300 font-mono">
                        {department.code}
                      </p>
                    </div>
                  </div>

                  {department.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {department.description}
                      </p>
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {department.groups?.length || 0}
                        </div>
                        <div className="text-xs text-gray-400">Groups</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {department.studentCount || 0}
                        </div>
                        <div className="text-xs text-gray-400">Students</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(department)}
                      className="inline-flex items-center p-2 border border-gray-500 rounded-md text-sm font-medium text-gray-200 bg-[#475569] hover:bg-[#64748b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Edit department"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(department._id)}
                      className="inline-flex items-center p-2 border border-red-500 rounded-md text-sm font-medium text-red-300 bg-red-900/20 hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Delete department"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-[#475569] px-6 py-3 border-t border-gray-600">
                  <div className="text-xs text-gray-300">
                    Created: {new Date(department.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Add/Edit Department */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto border border-gray-600 w-96 shadow-lg rounded-lg bg-[#334155] overflow-hidden" dir="rtl">
              {/* Modal Header */}
              <div className="bg-blue-600 px-6 py-4">
                <h3 className="text-lg font-medium text-white text-center">
                  {editingDepartment ? 'تحديث قسم' : 'إضافة قسم جديد'}
                </h3>
              </div>
              
              {/* Modal Body */}
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2 text-right">
                        الاسم *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-md bg-[#475569] border-gray-500 text-white placeholder-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
                        placeholder="ادخل اسم القسم"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2 text-right">
                        كود القسم *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full rounded-md bg-[#475569] border-gray-500 text-white placeholder-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
                        placeholder="ادخل كود القسم"
                        maxLength="10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2 text-right">
                      الوصف
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-md bg-[#475569] border-gray-500 text-white placeholder-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
                      placeholder="ادخل وصف القسم..."
                    />
                  </div>

                  <div className="flex justify-center space-x-3 mt-6 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingDepartment(null);
                        setFormData({
                          name: '',
                          code: '',
                          description: ''
                        });
                      }}
                      className="px-6 py-2 border border-gray-500 rounded-md text-sm font-medium text-gray-200 bg-[#475569] hover:bg-[#64748b] ml-3"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editingDepartment ? 'تحديث' : 'حفظ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DepartmentsPage;