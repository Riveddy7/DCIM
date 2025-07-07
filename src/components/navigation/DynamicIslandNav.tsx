'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Archive, 
  HardDrive, 
  Map, 
  Settings,
  Zap,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Dashboard'
  },
  {
    href: '/racks',
    icon: Archive,
    label: 'Racks'
  },
  {
    href: '/assets',
    icon: HardDrive,
    label: 'Activos'
  },
  {
    href: '/floor-plan',
    icon: Map,
    label: 'Planos'
  },
  {
    href: '/endpoints',
    icon: Zap,
    label: 'Endpoints'
  },
];

export function DynamicIslandNav() {
  const pathname = usePathname();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <nav className="dynamic-island-nav">
        <div className="flex items-center space-x-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-item group relative",
                  isActive && "nav-item-active"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="nav-tooltip">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}