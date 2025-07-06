import { cn } from '@/lib/utils';

export const DashboardLayout = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 grid-auto-rows-[1fr]", className)}>
      {children}
    </div>
  );
};
