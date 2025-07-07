import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/dateUtils';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  title: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'pie';
  height?: number;
}

export const SimpleChart = ({ title, data, type, height = 200 }: SimpleChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  const getBarHeight = (value: number) => {
    return (value / maxValue) * 100;
  };

  const renderBarChart = () => (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((item, index) => (
        <div key={index} className="flex flex-col items-center flex-1 gap-2">
          <div 
            className={`w-full rounded-t-md bg-gradient-to-t ${item.color || 'from-blue-500 to-purple-500'} transition-all duration-300 hover:opacity-80`}
            style={{ height: `${getBarHeight(item.value)}%` }}
          />
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 mb-1">{item.name}</p>
            <p className="text-xs text-gray-500">{formatCurrency(item.value)}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-center gap-4">
          {data.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className={`w-4 h-4 rounded-full ${item.color || 'bg-blue-500'}`}
                />
                <div className="text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-500 ml-1">({percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span>{formatCurrency(item.value)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full bg-gradient-to-r ${item.color || 'from-blue-500 to-purple-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = () => (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
          <span className="font-medium text-gray-700">{item.name}</span>
          <span className="text-lg font-bold text-blue-600">{formatCurrency(item.value)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-lg border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {type === 'bar' && renderBarChart()}
        {type === 'pie' && renderPieChart()}
        {type === 'line' && renderLineChart()}
      </CardContent>
    </Card>
  );
};