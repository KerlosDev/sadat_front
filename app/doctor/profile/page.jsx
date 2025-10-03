'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    AcademicCapIcon,
    KeyIcon,
    PencilIcon,
    CheckIcon,
    XMarkIcon,
    EyeIcon,
    EyeSlashIcon,
    UserGroupIcon,
    CalendarDaysIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
    const { user, isDoctor, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [doctorStats, setDoctorStats] = useState({
        totalGroups: 0,
        totalStudents: 0,
        totalSessions: 0
    });

    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        department: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (isDoctor && user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                specialization: user.specialization || '',
                department: user.department?.name || ''
            });
            fetchDoctorStats();
        }
    }, [isDoctor, user]);

    const fetchDoctorStats = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/doctors/stats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            if (response.ok) {
                setDoctorStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching doctor stats:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://sadat-backend-og1p.onrender.com/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(profileData)
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' });
                setIsEditing(false);
                // Update user context
                updateUser(result.data);
            } else {
                setMessage({ type: 'error', text: result.message || 'حدث خطأ أثناء التحديث' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' });
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
                setShowPasswordForm(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage({ type: 'error', text: result.message || 'حدث خطأ أثناء تغيير كلمة المرور' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
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
        <DashboardLayout title="الملف الشخصي">
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 h-16 w-16">
                                    <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <UserIcon className="h-8 w-8 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="mr-4">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {user?.name || 'المستخدم'}
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        دكتور - {user?.department?.name || 'قسم غير محدد'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <PencilIcon className="h-4 w-4 ml-2" />
                                        تعديل الملف
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={loading}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        >
                                            <CheckIcon className="h-4 w-4 ml-2" />
                                            حفظ
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setProfileData({
                                                    name: user.name || '',
                                                    email: user.email || '',
                                                    phone: user.phone || '',
                                                    specialization: user.specialization || '',
                                                    department: user.department?.name || ''
                                                });
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            <XMarkIcon className="h-4 w-4 ml-2" />
                                            إلغاء
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message Alert */}
                {message.text && (
                    <div className={`rounded-md p-4 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        <div className="flex">
                            <div className="flex-shrink-0">
                                {message.type === 'success' ? (
                                    <CheckIcon className="h-5 w-5" />
                                ) : (
                                    <XMarkIcon className="h-5 w-5" />
                                )}
                            </div>
                            <div className="mr-3">
                                <p className="text-sm">{message.text}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <UserGroupIcon className="h-8 w-8 text-blue-400" />
                                </div>
                                <div className="mr-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            مجموعاتي
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {doctorStats.totalGroups}
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
                                    <AcademicCapIcon className="h-8 w-8 text-green-400" />
                                </div>
                                <div className="mr-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            طلابي
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {doctorStats.totalStudents}
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
                                            جلسات الحضور
                                        </dt>
                                        <dd className="text-lg font-medium text-gray-900">
                                            {doctorStats.totalSessions}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Information */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                            المعلومات الشخصية
                        </h3>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    الاسم الكامل
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={profileData.name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    البريد الإلكتروني
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    رقم الهاتف
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={profileData.phone}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    التخصص
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="specialization"
                                        value={profileData.specialization}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    القسم
                                </label>
                                <input
                                    type="text"
                                    name="department"
                                    value={profileData.department}
                                    disabled={true}
                                    className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    لا يمكن تغيير القسم. تواصل مع الإدارة لإجراء تغييرات.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                إعدادات الأمان
                            </h3>
                            {!showPasswordForm && (
                                <button
                                    onClick={() => setShowPasswordForm(true)}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <KeyIcon className="h-4 w-4 ml-2" />
                                    تغيير كلمة المرور
                                </button>
                            )}
                        </div>

                        {showPasswordForm && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            كلمة المرور الحالية
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? (
                                                        <EyeSlashIcon className="h-5 w-5" />
                                                    ) : (
                                                        <EyeIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            كلمة المرور الجديدة
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? "text" : "password"}
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="block w-full pr-10 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    {showNewPassword ? (
                                                        <EyeSlashIcon className="h-5 w-5" />
                                                    ) : (
                                                        <EyeIcon className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            تأكيد كلمة المرور الجديدة
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            className="block w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={loading}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                        >
                                            <CheckIcon className="h-4 w-4 ml-2" />
                                            حفظ كلمة المرور
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowPasswordForm(false);
                                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                            }}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            <XMarkIcon className="h-4 w-4 ml-2" />
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!showPasswordForm && (
                            <div className="text-sm text-gray-600">
                                <p>• استخدم كلمة مرور قوية تحتوي على أحرف وأرقام</p>
                                <p>• قم بتغيير كلمة المرور بانتظام للحفاظ على أمان حسابك</p>
                                <p>• لا تشارك كلمة المرور مع أي شخص آخر</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ProfilePage;