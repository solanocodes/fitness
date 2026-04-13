import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import PageTransition from '../components/PageTransition';
import { api } from '../lib/api';
import { useApi } from '../hooks/useApi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#161616',
      borderColor: '#2a2a2a',
      borderWidth: 1,
      titleFont: { family: 'DM Sans', size: 12 },
      bodyFont: { family: 'Bebas Neue', size: 16 },
      titleColor: '#666666',
      bodyColor: '#f0f0f0',
      padding: 12,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(42,42,42,0.5)', drawBorder: false },
      ticks: { color: '#666666', font: { family: 'DM Sans', size: 10 } },
    },
    y: {
      grid: { color: 'rgba(42,42,42,0.3)', drawBorder: false },
      ticks: { color: '#666666', font: { family: 'DM Sans', size: 10 } },
    },
  },
  elements: {
    point: { radius: 3, hoverRadius: 5, backgroundColor: '#c8f135', borderColor: '#c8f135' },
    line: { tension: 0.3 },
  },
};

function ChartCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <span className="label-caps-lg block mb-4">{title}</span>
      <div style={{ height: 200 }}>{children}</div>
    </motion.div>
  );
}

export default function Stats() {
  const { data: bodyStats } = useApi(() => api.getBodyStats(), []);
  const { data: scoreHistory } = useApi(() => api.getForgeScoreHistory(), []);
  const { data: inbody } = useApi(() => api.getInBody(), []);

  const stats = Array.isArray(bodyStats) ? [...bodyStats].reverse() : [];
  const scoresList = Array.isArray(scoreHistory) ? [...scoreHistory].reverse() : [];
  const inbodyList = Array.isArray(inbody) ? inbody : [];

  const weightData = useMemo(() => ({
    labels: stats.map((s: any) =>
      new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      data: stats.map((s: any) => parseFloat(s.weight)),
      borderColor: '#c8f135',
      backgroundColor: 'rgba(200,241,53,0.1)',
      fill: true,
      borderWidth: 2,
    }],
  }), [stats]);

  const bfData = useMemo(() => ({
    labels: stats.filter((s: any) => s.bf_percent).map((s: any) =>
      new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      data: stats.filter((s: any) => s.bf_percent).map((s: any) => parseFloat(s.bf_percent)),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245,158,11,0.1)',
      fill: true,
      borderWidth: 2,
    }],
  }), [stats]);

  const forgeScoreData = useMemo(() => ({
    labels: scoresList.map((s: any) =>
      new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      data: scoresList.map((s: any) => parseFloat(s.score)),
      borderColor: '#c8f135',
      backgroundColor: 'rgba(200,241,53,0.15)',
      fill: true,
      borderWidth: 2,
    }],
  }), [scoresList]);

  return (
    <PageTransition>
      <div className="px-4 pt-12 pb-8 space-y-4">
        <motion.h1
          className="font-bebas text-5xl text-text-primary mb-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          STATS
        </motion.h1>
        <motion.p
          className="text-text-muted font-body text-sm mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Your performance data
        </motion.p>

        <ChartCard title="WEIGHT OVER TIME" delay={0.15}>
          {stats.length > 0 ? (
            <Line data={weightData} options={chartOptions as any} />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted text-sm font-body">
              No weight data yet
            </div>
          )}
        </ChartCard>

        <ChartCard title="BODY FAT % OVER TIME" delay={0.25}>
          {stats.filter((s: any) => s.bf_percent).length > 0 ? (
            <Line data={bfData} options={chartOptions as any} />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted text-sm font-body">
              No body fat data yet
            </div>
          )}
        </ChartCard>

        <ChartCard title="FORGE SCORE HISTORY" delay={0.45}>
          {scoresList.length > 0 ? (
            <Line data={forgeScoreData} options={chartOptions as any} />
          ) : (
            <div className="flex items-center justify-center h-full text-text-muted text-sm font-body">
              No score history yet
            </div>
          )}
        </ChartCard>

        {/* InBody Results Table */}
        <motion.div
          className="bg-card border border-border rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <span className="label-caps-lg block mb-4">INBODY RESULTS</span>
          {inbodyList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-text-muted">
                    <th className="text-left py-2 label-caps">DATE</th>
                    <th className="text-right py-2 label-caps">WEIGHT</th>
                    <th className="text-right py-2 label-caps">BF%</th>
                    <th className="text-right py-2 label-caps">MUSCLE</th>
                    <th className="text-right py-2 label-caps">BMI</th>
                  </tr>
                </thead>
                <tbody>
                  {inbodyList.map((r: any) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-2 text-text-muted">
                        {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-2 text-right font-bebas text-text-primary">{r.weight}</td>
                      <td className="py-2 text-right font-bebas text-text-primary">{r.bf_percent}%</td>
                      <td className="py-2 text-right font-bebas text-text-primary">{r.muscle_mass}</td>
                      <td className="py-2 text-right font-bebas text-text-primary">{r.bmi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-text-muted text-sm font-body">
              No InBody results yet
            </div>
          )}
        </motion.div>

        <div className="h-4" />
      </div>
    </PageTransition>
  );
}
