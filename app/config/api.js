// API Configuration
const API_CONFIG = {
    BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    ENDPOINTS: {
        AUTH: '/api/auth',
        STUDENTS: '/api/students',
        DOCTORS: '/api/doctors',
        DEPARTMENTS: '/api/departments',
        GROUPS: '/api/groups',
        ATTENDANCE: '/api/attendance',
        REPORTS: '/api/reports'
    }
};

export default API_CONFIG;