"use client";

import { 
  Radar, 
  RadarChart as RechartsRadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";

interface RadarChartProps {
  gaps: { area: string; score: number }[];
}

export default function RadarChart({ gaps }: RadarChartProps) {
  // 또래 평균 점수 대조군 생성 (75~85점 사이 난수 또는 고정)
  const data = gaps.map((item, idx) => {
    // 항목별 또래 평균 점수 다르게 설정
    const peerScores = [82, 78, 85, 76, 80];
    const peerScore = peerScores[idx % peerScores.length];
    
    return {
      subject: item.area,
      나: item.score,
      또래평균: peerScore,
      fullMark: 100,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-white mb-1.5">{payload[0].payload.subject}</p>
          <p className="text-indigo-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            내 점수: {payload[0].value}점
          </p>
          <p className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            또래 평균: {payload[1].value}점
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: '#475569', fontSize: 10 }}
          />
          
          <Radar
            name="내 포트폴리오"
            dataKey="나"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.3}
          />
          <Radar
            name="또래 평균"
            dataKey="또래평균"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.1}
          />
          
          <Tooltip content={customTooltip} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 10 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
