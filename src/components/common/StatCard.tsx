import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/dateUtils';

interface StatCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  color?: 'green' | 'red' | 'blue' | 'purple' | 'yellow';
  format?: 'currency' | 'number' | 'percentage';
}

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  subtitle, 
  color = 'blue',
  format = 'currency'
}: StatCardProps) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return val.toLocaleString();
      default:
        return val.toString();
    }
  };

  const getColorClasses = () => {
    const colors = {
      green: 'from-green-500 to-emerald-500',
      red: 'from-red-500 to-pink-500',
      blue: 'from-blue-500 to-indigo-500',
      purple: 'from-purple-500 to-violet-500',
      yellow: 'from-yellow-500 to-orange-500'
    };
    return colors[color];
  };

  const getTrendColor = () => {
    return trend?.isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-lg border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && (
          <div className={`p-2 rounded-full bg-gradient-to-r ${getColorClasses()}`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className={`text-2xl font-bold bg-gradient-to-r ${getColorClasses()} bg-clip-text text-transparent`}>
            {formatValue(value)}
          </div>
          
          {subtitle && (
            <p className="text-sm text-gray-500">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className="flex items-center gap-2">
              <Badge 
                variant={trend.isPositive ? 'default' : 'destructive'}
                className="text-xs"
              >
                {trend.isPositive ? '+' : ''}{trend.value.toFixed(2)}%
              </Badge>
              {trend.label && (
                <span className="text-xs text-gray-500">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};