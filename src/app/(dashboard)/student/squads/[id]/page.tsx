'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, MessageSquare, Library, Trophy, 
  Send, Plus, FileText, ChevronLeft, 
  Trophy as TrophyIcon, Zap, Target
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface Squad {
  id: string
  name: string
  description: string
  subject_id: string | null
  created_at: string
}

interface Message {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
}

interface Resource {
  id: string
  title: string
  user_id: string
  created_at: string
  profiles: { full_name: string }
}

export default function SquadIdPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [squad, setSquad] = useState<Squad | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'chat' | 'library' | 'mastery'>('chat')

  useEffect(() => {
    if (!id) return
    loadSquadData()
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`squad_${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'squad_messages', filter: `squad_id=eq.${id}` }, 
        (payload) => {
          fetchMessageDetail(payload.new.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  async function loadSquadData() {
    const { data: squadData } = await supabase.from('study_squads').select('*').eq('id', id).single()
    if (!squadData) return router.push('/student/squads')
    setSquad(squadData)

    const { data: msgData } = await supabase
      .from('squad_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('squad_id', id)
      .order('created_at', { ascending: true })
      .limit(50)
    
    setMessages(msgData || [])

    const { data: resData } = await supabase
      .from('squad_shared_resources')
      .select('*, profiles(full_name)')
      .eq('squad_id', id)
      .order('created_at', { ascending: false })
    
    setResources(resData || [])
    setLoading(true)
  }

  async function fetchMessageDetail(msgId: string) {
    const { data } = await supabase
      .from('squad_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', msgId)
      .single()
    if (data) setMessages(prev => [...prev, data])
  }

  async function sendMessage() {
    if (!input.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('squad_messages').insert({
      squad_id: id,
      user_id: user.id,
      content: input.trim()
    })

    if (!error) setInput('')
  }

  if (!squad) return <div className="p-8 text-center text-slate-400">Loading squad...</div>

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Squad Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-12 z-40 backdrop-blur-md bg-white/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/student/squads" className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <ChevronLeft size={20} />
            </Link>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
               <Users size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 tracking-tight text-lg leading-tight">{squad.name}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active War Room</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm">U</div>
            ))}
            <span className="text-xs font-bold text-slate-400 ml-1">+5 more</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'chat', label: 'Squad Chat', icon: MessageSquare, color: 'text-indigo-600' },
            { id: 'library', label: 'Shared Library', icon: Library, color: 'text-emerald-600' },
            { id: 'mastery', label: 'Mastery Ledger', icon: Target, color: 'text-rose-600' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all font-bold text-sm ${
                activeTab === tab.id ? 'bg-white shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? tab.color : 'text-slate-300'} />
              {tab.label}
            </button>
          ))}
          
          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-4 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <h4 className="text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Zap size={12} className="text-amber-400" /> Goal of the Week
                </h4>
                <p className="text-[10px] text-indigo-100 font-medium mb-3">Reach 80% Mastery in "Calculus - Derivatives" together.</p>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 w-2/3" />
                </div>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 h-[70vh] flex flex-col">
          <AnimatePresence mode="wait">
             {activeTab === 'chat' && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                 className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden"
               >
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                   {messages.map((msg) => (
                     <div key={msg.id} className="flex items-start gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-100 flex-shrink-0 flex items-center justify-center text-[10px] font-bold uppercase">
                         {msg.profiles.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full rounded-lg object-cover" /> : msg.profiles.full_name?.[0] || 'U'}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <span className="text-[11px] font-black text-slate-800">{msg.profiles.full_name}</span>
                           <span className="text-[9px] text-slate-400 font-medium">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         </div>
                         <div className="bg-slate-50 rounded-2xl rounded-tl-none p-3 text-sm text-slate-700 leading-relaxed inline-block max-w-[90%]">
                           {msg.content}
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
                 <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                    <div className="bg-white rounded-2xl border border-slate-200 p-2 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                       <input 
                         type="text" 
                         value={input}
                         onChange={(e) => setInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                         placeholder="Synthesize a thought..."
                         className="flex-1 bg-transparent outline-none px-3 text-sm"
                       />
                       <button onClick={sendMessage} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-transform active:scale-95">
                         <Send size={16} />
                       </button>
                    </div>
                 </div>
               </motion.div>
             )}

             {activeTab === 'library' && (
               <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 space-y-4 overflow-y-auto"
               >
                 <div className="flex items-center justify-between px-2">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Shared Artifacts</h3>
                   <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition shadow-lg shadow-emerald-100">
                     <Plus size={14} /> Share Resource
                   </button>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {resources.length === 0 ? (
                     <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                        <Library size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm font-bold tracking-tight">The Squad Vault is empty.</p>
                        <p className="text-slate-300 text-[10px] mt-1 uppercase tracking-widest font-black">Share a past paper or notes to begin.</p>
                     </div>
                   ) : (
                     resources.map(res => (
                       <div key={res.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm group hover:border-emerald-300 transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                               <FileText size={20} className="text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-bold text-slate-800 truncate">{res.title}</h4>
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Shared by {res.profiles.full_name}</p>
                            </div>
                          </div>
                          <button className="w-full py-2 bg-slate-50 group-hover:bg-emerald-50 text-slate-500 group-hover:text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">
                             Explore in MaFundi
                          </button>
                       </div>
                     ))
                   )}
                 </div>
               </motion.div>
             )}

             {activeTab === 'mastery' && (
                <motion.div 
                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                 className="flex-1 bg-white rounded-3xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center relative">
                     <Target size={48} className="text-rose-600" />
                     <div className="absolute inset-0 border-4 border-rose-200 rounded-full border-t-rose-600 animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Squad Mastery Ledger</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 font-medium">Collective performance data is being synthesized from all squad members.</p>
                  </div>
                  <div className="w-full max-w-sm space-y-4 pt-4">
                     <div className="flex items-center justify-between">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregate Strength</span>
                       <span className="text-xs font-black text-rose-600">62%</span>
                     </div>
                     <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-rose-500 w-[62%]" />
                     </div>
                  </div>
                </motion.div>
             )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
