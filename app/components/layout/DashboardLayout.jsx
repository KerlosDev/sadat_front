'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import {
    Home,
    Users,
    GraduationCap,
    ClipboardList,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    Building2,
    QrCode
} from 'lucide-react';

const DashboardLayout = ({ children, title }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout, isAdmin, isDoctor, isStudent } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    // Navigation items based on user role
    const getNavigationItems = () => {
        if (isAdmin) {
            return [
                { name: 'لوحة التحكم', href: '/admin', icon: Home },
                { name: 'الأقسام', href: '/admin/departments', icon: Building2 },
                { name: 'المجموعات', href: '/admin/groups', icon: Users },
                { name: 'الطلاب', href: '/admin/students', icon: GraduationCap },
                { name: 'المعلمين', href: '/admin/doctors', icon: User },
                { name: 'الحضور', href: '/admin/attendance', icon: ClipboardList },
                { name: 'التقارير', href: '/admin/reports', icon: BarChart3 },
                { name: 'الإعدادات العامة', href: '/admin/settings', icon: Settings },
            ];
        } else if (isDoctor) {
            return [
                { name: 'لوحة التحكم', href: '/doctor', icon: Home },
                { name: 'مجموعاتي', href: '/doctor/groups', icon: Users },
                { name: 'الطلاب', href: '/doctor/students', icon: GraduationCap },
                { name: 'الحضور', href: '/doctor/attendance', icon: ClipboardList },
                { name: 'مسح الرمز', href: '/doctor/scanner', icon: QrCode },
                { name: 'التقارير', href: '/doctor/reports', icon: BarChart3 },
                { name: 'الملف الشخصي', href: '/doctor/profile', icon: User },
            ];
        } else if (isStudent) {
            return [
                { name: 'لوحة التحكم', href: '/student', icon: Home },
                { name: 'ملفي الشخصي', href: '/student/profile', icon: User },
                { name: 'الحضور', href: '/student/attendance', icon: ClipboardList },
                { name: 'رمز الاستجابة', href: '/student/qr-code', icon: QrCode },
            ];
        }
        return [];
    };

    const navigation = getNavigationItems();

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Mobile sidebar */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
                <div
                    className={`fixed inset-0 bg-black bg-opacity-75 transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                    onClick={() => setSidebarOpen(false)}
                />
                <div
                    className={`relative flex-1 flex flex-col max-w-xs w-full bg-slate-800 transition ease-in-out duration-300 transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <div className="absolute top-0 left-0 -ml-12 pt-2">
                        <button
                            type="button"
                            className="mr-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <X className="h-6 w-6 text-white" />
                        </button>
                    </div>
                    <SidebarContent navigation={navigation} pathname={pathname} />
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:right-0">
                <div className="flex-1 flex flex-col min-h-0 bg-slate-800 border-l border-slate-700">
                    <SidebarContent navigation={navigation} pathname={pathname} />
                </div>
            </div>

            {/* Main content */}
            <div className="md:pr-64 flex flex-col flex-1">
                {/* Top header */}
                <div className="sticky top-0 z-10 md:hidden pr-1 pt-1 sm:pr-3 sm:pt-3 bg-slate-900">
                    <button
                        type="button"
                        className="-mr-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>

                {/* Page header */}
                <div className="bg-slate-800 shadow-lg border-b border-slate-700">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center py-6">
                            <div>
                                <h1 className="text-2xl font-bold text-white">{title}</h1>
                            </div>
                            <div className="flex items-center space-x-reverse space-x-4">
                                <div className="text-sm text-slate-300">
                                    أهلاً، {user?.name}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <LogOut className="h-4 w-4 ml-1" />
                                    خروج
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 bg-slate-900">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

// Sidebar content component
const SidebarContent = ({ navigation, pathname }) => {
    const { user } = useAuth();

    return (
        <>
            <div className="flex items-center flex-shrink-0 px-4 py-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="mr-3">
                        <p className="text-sm font-medium text-white">نظام إدارة السيستم</p>
                        <p className="text-xs text-slate-400">
                            {user?.role === 'admin' ? 'بوابة المدير' :
                                user?.role === 'doctor' ? 'بوابة المعلم' :
                                    user?.role === 'student' ? 'بوابة الطالب' : 'البوابة'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
                <nav className="flex-1 px-2 py-4 bg-slate-800 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
                            >
                                <item.icon
                                    className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                                        } ml-3 flex-shrink-0 h-6 w-6`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
};

export default DashboardLayout;