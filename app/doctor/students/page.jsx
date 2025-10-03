'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    AcademicCapIcon,
    MagnifyingGlassIcon,
    UserGroupIcon,
    EyeIcon,
    FunnelIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

const StudentsPage = () => {
    const { user, isDoctor } = useAuth();
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('all');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showStudentDetails, setShowStudentDetails] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState([]);

    useEffect(() => {
        if (isDoctor) {
            fetchData();
        }
    }, [isDoctor]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch groups and students
            const [groupsRes, studentsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/my-groups`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/students/my-students`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
            ]);

            const groupsData = await groupsRes.json();
            const studentsData = await studentsRes.json();

            if (groupsRes.ok) {
                setGroups(groupsData.data || []);
            }

            if (studentsRes.ok) {
                setStudents(studentsData.data || []);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudentAttendance = async (studentId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/student/${studentId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setAttendanceRecords(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching student attendance:', error);
        }
    };

    const handleViewStudent = async (student) => {
        setSelectedStudent(student);
        setShowStudentDetails(true);
        await fetchStudentAttendance(student._id);
    };

    // Filter students based on search term and selected group
    const filteredStudents = students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.studentNumber.includes(searchTerm);

        const matchesGroup = selectedGroup === 'all' || student.group?._id === selectedGroup;

        return matchesSearch && matchesGroup;
    });

    const getAttendanceRate = (studentId) => {
        const studentAttendance = attendanceRecords.filter(record => record.student === studentId);
        const totalSessions = 30; // This should be calculated based on actual sessions
        const attendedSessions = studentAttendance.filter(record => record.status === 'present').length;
        return totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;
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
        <DashboardLayout title="الطلاب">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">الطلاب</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    إدارة ومتابعة الطلاب في مجموعاتك
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <div className="flex items-center px-3 py-2 bg-blue-50 rounded-lg">
                                    <AcademicCapIcon className="h-5 w-5 text-blue-600 ml-2" />
                                    <span className="text-sm font-medium text-blue-600">
                                        {filteredStudents.length} طالب
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الطالب..."
                                        className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Group Filter */}
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <FunnelIcon className="h-5 w-5 text-gray-400" />
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
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">جاري تحميل بيانات الطلاب...</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 bg-white shadow rounded-lg">
                        <AcademicCapIcon className="mx-auto h-16 w-16 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">لا يوجد طلاب</h3>
                        <p className="mt-2 text-gray-600">
                            {searchTerm || selectedGroup !== 'all'
                                ? 'لا يوجد طلاب يطابقون معايير البحث المحددة.'
                                : 'لا يوجد طلاب مسجلين في مجموعاتك بعد.'
                            }
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
                                        رقم الطالب
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        معدل الحضور
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        الإجراءات
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-indigo-600">
                                                            {student.name.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mr-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {student.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <UserGroupIcon className="h-4 w-4 text-gray-400 ml-1" />
                                                <span className="text-sm text-gray-900">
                                                    {student.group?.name || 'غير محدد'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {student.studentNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-2 w-16 bg-gray-200 rounded-full">
                                                    <div
                                                        className="h-2 bg-green-500 rounded-full"
                                                        style={{ width: `${Math.min(100, Math.max(0, 85))}%` }}
                                                    ></div>
                                                </div>
                                                <span className="mr-2 text-sm text-gray-900">85%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleViewStudent(student)}
                                                className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                            >
                                                <EyeIcon className="h-4 w-4 ml-1" />
                                                عرض
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Student Details Modal */}
                {showStudentDetails && selectedStudent && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div
                                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                onClick={() => setShowStudentDetails(false)}
                            ></div>

                            <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            تفاصيل الطالب: {selectedStudent.name}
                                        </h3>
                                        <button
                                            onClick={() => setShowStudentDetails(false)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <span className="sr-only">إغلاق</span>
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Student Info */}
                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">الاسم الكامل</label>
                                                <p className="mt-1 text-sm text-gray-900">{selectedStudent.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                                                <p className="mt-1 text-sm text-gray-900">{selectedStudent.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">رقم الطالب</label>
                                                <p className="mt-1 text-sm text-gray-900">{selectedStudent.studentNumber}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">المجموعة</label>
                                                <p className="mt-1 text-sm text-gray-900">{selectedStudent.group?.name || 'غير محدد'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attendance Records */}
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 mb-4">سجل الحضور</h4>
                                        {attendanceRecords.length > 0 ? (
                                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                                <table className="min-w-full divide-y divide-gray-300">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                التاريخ
                                                            </th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                الوقت
                                                            </th>
                                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                الحالة
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {attendanceRecords.slice(0, 10).map((record) => (
                                                            <tr key={record._id} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {new Date(record.timestamp).toLocaleDateString('ar-EG')}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {new Date(record.timestamp).toLocaleTimeString('ar-EG', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
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
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <h3 className="mt-2 text-sm font-medium text-gray-900">لا يوجد سجل حضور</h3>
                                                <p className="mt-1 text-sm text-gray-500">لم يتم تسجيل أي حضور لهذا الطالب بعد.</p>
                                            </div>
                                        )}
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

export default StudentsPage;