'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DonutChartWidgetProps {
  data: { name: string; value: number; fill: string }[];
  title: string;
  description?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-800/80 backdrop-blur-sm border border-purple-500/30 rounded-md shadow-lg text-gray-50">
        <p className="label font-semibold">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export function DonutChartWidget({ data, title, description }: DonutChartWidgetProps) {
  return (
    <Card className="glassmorphic-card h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-gray-50">{title}</CardTitle>
        {description && <CardDescription className="text-gray-400">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} className="focus:outline-none ring-0" stroke="hsl(var(--background))" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--primary)/0.1)' }}/>
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}
              formatter={(value, entry) => <span className="text-gray-300">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
