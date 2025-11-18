// src/app/(frontend)/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardPanel from '@/components/dashboard/DashboardPanel';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Chuyển hướng về login nếu chưa đăng nhập
    useEffect(() => {
        if (!user?.token) {
            router.push('/login');
        }
    }, [user, router]);

    if (!user?.token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return <DashboardPanel user={user} onLogout={logout} />;
};

export default Dashboard;
