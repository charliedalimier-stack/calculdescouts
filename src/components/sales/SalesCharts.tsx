import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MonthlyDistribution, ChannelDistribution } from "@/hooks/useAnnualSalesEntry";

interface SalesChartsProps {
  monthly: MonthlyDistribution[];
  byChannel: ChannelDistribution[];
}

const CHANNEL_COLORS = {
  BTC: 'hsl(var(--primary))',
  BTB: 'hsl(var(--chart-2))',
  Distributeur: 'hsl(var(--chart-3))',
};

const formatCurrency = (value: number) => {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k €`;
  }
  return `${value.toFixed(0)} €`;
};

export function SalesCharts({ monthly, byChannel }: SalesChartsProps) {
  // Prepare line chart data
  const lineChartData = monthly.map(m => ({
    name: m.month_label.slice(0, 3),
    budget: m.budget_ca,
    reel: m.reel_ca,
  }));

  // Prepare bar chart data for quantities by channel
  const barChartData = byChannel.map(ch => ({
    name: ch.channel,
    budget: ch.budget_qty,
    reel: ch.reel_qty,
  }));

  // Prepare pie chart data
  const totalBudgetCa = byChannel.reduce((sum, ch) => sum + ch.budget_ca, 0);
  const pieChartData = byChannel.map(ch => ({
    name: ch.channel,
    value: ch.budget_ca,
    percent: totalBudgetCa > 0 ? (ch.budget_ca / totalBudgetCa) * 100 : 0,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Line Chart - Budget vs Réel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Évolution CA mensuel : Budget vs Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={formatCurrency} className="text-xs" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="budget"
                name="CA Budget"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="reel"
                name="CA Réel"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar Chart - Quantities by Channel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quantités par canal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar
                dataKey="budget"
                name="Budget"
                fill="hsl(var(--muted-foreground))"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="reel"
                name="Réel"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart - Channel Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Répartition CA par canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHANNEL_COLORS[entry.name as keyof typeof CHANNEL_COLORS]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3">
              {pieChartData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHANNEL_COLORS[entry.name as keyof typeof CHANNEL_COLORS] }}
                  />
                  <span className="text-sm">{entry.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {entry.percent.toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
