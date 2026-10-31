'use client';

import { motion } from 'framer-motion';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { tk } from '@/lib/utils';
import { TrendingUp, Users, PieChart as PieIcon, Activity } from 'lucide-react';

export type ChartData = {
  revenue: { month: string; revenue: number; collected: number }[];
  popularity: { name: string; students: number }[];
  retention: { month: string; active: number; completed: number; retention: number }[];
  statusMix: { name: string; value: number }[];
};

const RED = '#E51A24';
const DARK = '#1A1A1A';
const PIE_COLORS = [RED, DARK, '#6C757D', '#ADB5BD', '#CED4DA'];
const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function Card({ title, subtitle, icon: Icon, children, delay = 0, className }: {
  title: string; subtitle: string; icon: React.ElementType; children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay, ease }}
      className={`glass rounded-[26px] p-6 ${className ?? ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#1A1A1A] text-white"><Icon size={15} /></span>
        <div>
          <p className="text-[14.5px] font-[800] tracking-tight text-[#1A1A1A]">{title}</p>
          <p className="text-[11px] font-[600] text-[#ADB5BD]">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 h-64 w-full">{children}</div>
    </motion.div>
  );
}

const tooltipStyle = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.6)',
  background: 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 12px 32px rgba(26,26,26,0.12)',
  fontSize: 12,
  fontWeight: 600,
};

export default function DashboardCharts({ data }: { data: ChartData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Monthly revenue" subtitle="Payments collected over the last 6 months" icon={TrendingUp} delay={0.05} className="lg:col-span-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.revenue} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={RED} stopOpacity={0.35} />
                <stop offset="100%" stopColor={RED} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(26,26,26,0.07)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#ADB5BD', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#ADB5BD', fontWeight: 600 }} axisLine={false} tickLine={false} width={64} tickFormatter={(v) => tk(Number(v))} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [tk(Number(v)), 'Collected'] as [string, string]} cursor={{ stroke: RED, strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="collected" stroke={RED} strokeWidth={2.5} fill="url(#revFill)" dot={{ r: 3, fill: RED, strokeWidth: 0 }} activeDot={{ r: 5 }} animationDuration={1100} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Course popularity" subtitle="Confirmed students per course" icon={Users} delay={0.12}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.popularity} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(26,26,26,0.07)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#ADB5BD', fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={48} />
            <YAxis tick={{ fontSize: 11, fill: '#ADB5BD', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(229,26,36,0.06)' }} />
            <Bar dataKey="students" radius={[10, 10, 4, 4]} animationDuration={1000}>
              {data.popularity.map((_, i) => <Cell key={i} fill={i === 0 ? RED : DARK} fillOpacity={i === 0 ? 1 : 0.82 - i * 0.1} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Student retention" subtitle="Active vs. completed learners" icon={Activity} delay={0.18}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.retention} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(26,26,26,0.07)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#ADB5BD', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#ADB5BD', fontWeight: 600 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, fontWeight: 650 }} iconType="circle" />
            <Line type="monotone" dataKey="active" name="Active" stroke={RED} strokeWidth={2.5} dot={{ r: 3, fill: RED, strokeWidth: 0 }} animationDuration={1100} />
            <Line type="monotone" dataKey="completed" name="Completed" stroke={DARK} strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3, fill: DARK, strokeWidth: 0 }} animationDuration={1300} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Enrollment status mix" subtitle="Where requests currently stand" icon={PieIcon} delay={0.24} className="lg:col-span-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.statusMix} dataKey="value" nameKey="name" cx="50%" cy="50%"
              innerRadius={58} outerRadius={92} paddingAngle={3} animationDuration={1000}
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={false}
              style={{ fontSize: 11, fontWeight: 700 }}
            >
              {data.statusMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
