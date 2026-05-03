'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, ShieldCheck, ArrowRight, Lock } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import Link from 'next/link'

export default function SquadsWidget() {
  const [squads, setSquads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/student/squads')
      .then(r => r.json())
      .then(data => {
        setSquads(data.mySquads || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-3xl" />)}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Users size={14} /> My Study Squads
        </h3>
        <Link href="/student/squads/create">
          <Button variant="ghost" size="xs" className="text-emerald-600 font-black uppercase text-[10px] tracking-widest">
            <Plus size={12} className="mr-1" /> New Squad
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {squads.length > 0 ? (
          squads.map((squad) => (
            <Link key={squad.id} href={`/student/squads/${squad.id}`}>
              <Card hover className="p-5 border-l-4 border-l-indigo-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Users size={64} className="text-indigo-900" />
                </div>
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800 uppercase tracking-tight truncate pr-8">{squad.name}</h4>
                    {squad.is_private && <Lock size={12} className="text-slate-400" />}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="indigo" size="xs" className="bg-indigo-50 text-indigo-600 border-indigo-100">
                      {squad.study_squad_members?.[0]?.count || 1} Members
                    </Badge>
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Now</span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <div className="sm:col-span-2">
            <Card className="p-8 border-dashed flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-tight italic">No Active Squads</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Join a squad to compete & share notes with peers.</p>
              </div>
              <Link href="/student/squads/discover">
                <Button variant="outline" size="sm" className="font-black uppercase text-[10px] tracking-widest">
                  Discover Squads
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
