import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type LocationWithPlanStatus = Pick<Database['public']['Tables']['locations']['Row'], 'id' | 'name' | 'floor_plan_image_url'>;

interface LocationCardProps {
  location: LocationWithPlanStatus;
}

export function LocationCard({ location }: LocationCardProps) {
  const hasPlan = !!location.floor_plan_image_url;

  return (
    <Link href={`/floor-plan/${location.id}`} className="block group">
      <Card className="glassmorphic-card h-full hover:border-primary/60 transition-all duration-300 ease-in-out transform hover:-translate-y-1">
        <CardHeader>
          <div className="flex justify-between items-start">
            <MapPin className="h-8 w-8 text-primary" />
            {hasPlan ? (
              <Badge variant="default" className="bg-green-600/80 text-green-50">Configurado</Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-600/80 text-amber-50">Sin Configurar</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="font-headline text-xl text-gray-50 group-hover:text-primary transition-colors">
            {location.name}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}
