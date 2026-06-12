import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'green', trend = null, gradient = null, sparklineData = null, className = '' }) => {
  
  // Standard Solid Color Themes
  const colorSchemes = {
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/20',
      iconBg: 'bg-emerald-100/60 dark:bg-emerald-900/30',
      stroke: '#10B981',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/20',
      iconBg: 'bg-blue-100/60 dark:bg-blue-900/30',
      stroke: '#2563EB',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/20',
      iconBg: 'bg-indigo-100/60 dark:bg-indigo-900/30',
      stroke: '#4F46E5',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/20',
      iconBg: 'bg-amber-100/60 dark:bg-amber-900/30',
      stroke: '#F59E0B',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-950/10',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-100 dark:border-red-900/20',
      iconBg: 'bg-red-100/60 dark:bg-red-900/30',
      stroke: '#EF4444',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/10',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900/20',
      iconBg: 'bg-purple-100/60 dark:bg-purple-900/30',
      stroke: '#7C3AED',
    },
    slate: {
      bg: 'bg-slate-50 dark:bg-slate-950/10',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-100 dark:border-slate-900/20',
      iconBg: 'bg-slate-100/60 dark:bg-slate-900/30',
      stroke: '#64748B',
    }
  };

  // Gradient Color Themes for SaaS Banner look
  const gradientSchemes = {
    'blue-grad': {
      card: 'bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-700 text-white border-blue-500/20 shadow-lg shadow-blue-500/10',
      title: 'text-blue-100',
      value: 'text-white',
      iconBg: 'bg-white/10',
      iconText: 'text-white',
      stroke: '#FFFFFF',
    },
    'emerald-grad': {
      card: 'bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-500/20 shadow-lg shadow-emerald-500/10',
      title: 'text-emerald-100',
      value: 'text-white',
      iconBg: 'bg-white/10',
      iconText: 'text-white',
      stroke: '#FFFFFF',
    },
    'amber-grad': {
      card: 'bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-600 text-white border-amber-500/20 shadow-lg shadow-amber-500/10',
      title: 'text-amber-100',
      value: 'text-white',
      iconBg: 'bg-white/10',
      iconText: 'text-white',
      stroke: '#FFFFFF',
    },
    'indigo-grad': {
      card: 'bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-700 text-white border-indigo-500/20 shadow-lg shadow-indigo-500/10',
      title: 'text-indigo-100',
      value: 'text-white',
      iconBg: 'bg-white/10',
      iconText: 'text-white',
      stroke: '#FFFFFF',
    }
  };

  // Sparkline SVG path generator
  const renderSparkline = (data, strokeColor) => {
    if (!data || data.length < 2) return null;
    const width = 100;
    const height = 30;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;
    
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
    const gradId = `sparkline-grad-${strokeColor.replace('#', '')}`;

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible shrink-0 select-none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  if (gradient && gradientSchemes[gradient]) {
    const scheme = gradientSchemes[gradient];
    return (
      <div className={`p-6 border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-36 ${scheme.card} ${className}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${scheme.title}`}>{title}</p>
            <h3 className={`text-2xl font-extrabold tracking-tight ${scheme.value}`}>{value}</h3>
          </div>
          <div className={`p-2 rounded-xl shrink-0 ${scheme.iconBg} ${scheme.iconText}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Lower Row: Sparkline + Growth tag */}
        <div className="flex items-center justify-between mt-auto">
          {trend && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
              {trend.text}
            </span>
          )}
          {sparklineData && renderSparkline(sparklineData, scheme.stroke)}
        </div>
      </div>
    );
  }

  const scheme = colorSchemes[color] || colorSchemes.green;

  return (
    <div className={`p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-36 ${scheme.border} ${className}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl shrink-0 ${scheme.iconBg} ${scheme.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Lower Row: Sparkline + Growth tag */}
      <div className="flex items-center justify-between mt-auto">
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            trend.positive 
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
              : 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400'
          }`}>
            {trend.text}
          </span>
        )}
        {sparklineData && renderSparkline(sparklineData, scheme.stroke)}
      </div>
    </div>
  );
};

export default StatCard;
