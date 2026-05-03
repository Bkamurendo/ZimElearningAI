'use client'

import { useState } from 'react'
import { Map, AlertTriangle, TrendingUp, Info } from 'lucide-react'

type RegionData = {
  province: string
  readiness: number
  studentCount: number
  status: 'critical' | 'stable' | 'excel'
}

const ZIM_PROVINCES: RegionData[] = [
  { province: 'Harare', readiness: 78, studentCount: 12400, status: 'excel' },
  { province: 'Bulawayo', readiness: 74, studentCount: 8900, status: 'excel' },
  { province: 'Manicaland', readiness: 52, studentCount: 15600, status: 'stable' },
  { province: 'Mashonaland Central', readiness: 38, studentCount: 11200, status: 'critical' },
  { province: 'Mashonaland East', readiness: 45, studentCount: 13400, status: 'stable' },
  { province: 'Mashonaland West', readiness: 42, studentCount: 14500, status: 'stable' },
  { province: 'Masvingo', readiness: 55, studentCount: 12100, status: 'stable' },
  { province: 'Matabeleland North', readiness: 31, studentCount: 9800, status: 'critical' },
  { province: 'Matabeleland South', readiness: 34, studentCount: 8500, status: 'critical' },
  { province: 'Midlands', readiness: 49, studentCount: 14200, status: 'stable' },
]

export function MinistryHeatmap() {
  const [selected, setSelected] = useState<RegionData | null>(null)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-gray-50 bg-slate-900 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <Map size={20} className="text-teal-400" />
              National ZIMSEC Readiness Heatmap
            </h2>
            <p className="text-slate-400 text-xs mt-1">Real-time pedagogical health across 10 provinces</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">
              High: 70%+
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full border border-amber-500/30">
              Mid: 40-69%
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded-full border border-red-500/30">
              Low: <40%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Heatmap List (Simulating a Map Visual) */}
        <div className="p-4 bg-gray-50/50 border-r border-gray-100 max-h-[500px] overflow-y-auto">
          <div className="space-y-2">
            {ZIM_PROVINCES.sort((a,b) => b.readiness - a.readiness).map((region) => (
              <button
                key={region.province}
                onClick={() => setSelected(region)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  selected?.province === region.province 
                    ? 'bg-white border-slate-900 shadow-lg scale-[1.02] z-10' 
                    : 'bg-white border-gray-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase">{region.province}</p>
                    <p className="text-xs text-slate-500">{region.studentCount.toLocaleString()} active students</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${
                      region.readiness >= 70 ? 'text-emerald-600' : region.readiness >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {region.readiness}%
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Readiness</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      region.readiness >= 70 ? 'bg-emerald-500' : region.readiness >= 40 ? 'bg-amber-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${region.readiness}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Region Detail Sidebar */}
        <div className="p-8 flex flex-col justify-center bg-white">
          {selected ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-slate-900">{selected.province}</h3>
                <p className="text-slate-500 font-medium">District Performance Audit</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Pulse</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black text-slate-900">{selected.readiness}%</p>
                    <TrendingUp size={16} className="text-emerald-500 mb-1" />
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Share</p>
                  <p className="text-2xl font-black text-slate-900">12.4%</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" /> Critical Subjects (District Avg)
                </h4>
                <div className="space-y-2">
                  {[
                    { sub: 'Mathematics P2', gap: '32% mastery', trend: 'down' },
                    { sub: 'Physics (Advanced)', gap: '28% mastery', trend: 'stable' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                      <span className="text-xs font-bold text-red-900">{s.sub}</span>
                      <span className="text-xs font-black text-red-600 uppercase">{s.gap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
                <Info size={20} className="text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-indigo-900">Ministry Recommendation</p>
                  <p className="text-[11px] text-indigo-700 mt-1 leading-relaxed">
                    Deploy targeted MaFundi "Exam Sprints" for Mathematics in this province to improve 2026 ZIMSEC readiness by 15% within 3 months.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Map size={32} />
              </div>
              <div>
                <p className="font-bold text-slate-900">Select a province</p>
                <p className="text-xs text-slate-400 max-w-[200px] mx-auto">to view detailed ZIMSEC readiness metrics and critical subject gaps.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
