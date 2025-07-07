import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPIProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}

export function KPICard({ title, value, icon: Icon, className, iconClassName }: KPIProps) {
  return (
    <Card className={cn("glassmorphic-card", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
        <Icon className={cn("h-5 w-5 text-purple-500", iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold font-headline text-gray-50">{value}</div>
        {/* Additional description or trend can go here */}
      </CardContent>
    </Card>
  );
}
