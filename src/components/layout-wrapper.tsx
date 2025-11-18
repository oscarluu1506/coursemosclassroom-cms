// src/components/layout-wrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import { Footer } from "@/components/blocks/footer";
import { Navbar } from "@/components/blocks/navbar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/dashboard');

    return (
        <>
            {!isDashboard && <Navbar />}
            <main>{children}</main>
            {!isDashboard && <Footer />}
        </>
    );
}
