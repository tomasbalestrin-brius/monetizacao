import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PlatformSidebar } from '@/components/PlatformSidebar';
import { PlatformHeader } from '@/components/PlatformHeader';
import { PlatformBottomNav } from '@/components/PlatformBottomNav';

export function PlatformLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PlatformSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:pl-64 min-h-screen flex flex-col">
        <PlatformHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      <PlatformBottomNav />
    </div>
  );
}
