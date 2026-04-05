'use client'

import { useState } from 'react'
import { 
  MessageSquare, Send, Users, History, CheckCircle2, 
  AlertCircle, Loader2, Sparkles, Smartphone, Mail,
  ArrowLeft, Search, Filter, Trash2, Calendar
} from 'lucide-react'
import Link from 'next/link'

export default function BulkCommunicationCenter() {
  const [method, setMethod] = useState<'sms' | 'email'>('sms')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState<number | null>(null)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    
    // Simulate bulk sending logic (Africa's Talking / Resend)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    setSentCount(482) // Total school parents
    setSending(false)
    setMessage('')
  }

  const HISTORY = [
    { date: '2026-04-01', subject: 'School Fees Reminder', type: 'SMS', status: 'delivered', count: 482 },
    { date: '2026-03-25', subject: 'Mock Exam Schedule', type: 'Email', status: 'delivered', count: 482 },
    { date: '2026-03-15', subject: 'Sports Day Cancellation', type: 'SMS', status: 'delivered', count: 482 },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-20 px-6 sm:px-8">
      
      {/* Header */}
      <div className="max-w-5xl mx-auto pt-8 pb-10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Link href="/school-admin/dashboard" className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-slate-400 hover:text-indigo-600 transition shadow-sm">
               <ArrowLeft size={18} />
            </Link>
            <div>
               <h1 className="text-2xl font-black italic tracking-tight italic">Communication Center</h1>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">School-wide Bulk Portal</p>
            </div>
         </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Compose Section */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                  <Send size={150} fill="currentColor" className="text-indigo-600" />
               </div>
               
               <h2 className="text-lg font-black mb-6 uppercase tracking-tight flex items-center gap-2">
                  <MessageSquare size={20} className="text-indigo-500" /> New Broadcast
               </h2>

               <div className="flex gap-4 mb-8">
                  <button 
                    onClick={() => setMethod('sms')}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'sms' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'}`}
                  >
                     <Smartphone size={24} />
                     <span className="text-xs font-bold uppercase">SMS Alert</span>
                  </button>
                  <button 
                    onClick={() => setMethod('email')}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === 'email' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg' : 'border-slate-50 bg-slate-50/50 text-slate-400 hover:border-slate-200'}`}
                  >
                     <Mail size={24} />
                     <span className="text-xs font-bold uppercase">Email Newsletter</span>
                  </button>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Recipients</label>
                     <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md">
                              <Users size={16} />
                           </div>
                           <span className="text-sm font-bold text-slate-700">All Registered Parents (482)</span>
                        </div>
                        <button className="text-[10px] font-black text-indigo-600 hover:underline">Change</button>
                     </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Message Content</label>
                     <textarea 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={method === 'sms' ? "ZimLearn: Dear Parent, school fees are now overdue..." : "Start writing your email newsletter..."}
                        rows={6}
                        className="w-full bg-slate-50 border-none rounded-[1.5rem] p-6 text-sm focus:ring-2 focus:ring-indigo-500 transition outline-none resize-none shadow-inner"
                     />
                     <div className="flex items-center justify-between mt-2 px-2">
                        <p className="text-[10px] text-slate-400 italic">Remaining credits: <span className="text-indigo-600 font-bold">1,240</span></p>
                        <p className="text-[10px] text-slate-300 font-bold">{message.length} Characters</p>
                     </div>
                  </div>
               </div>

               <button 
                 onClick={handleSend}
                 disabled={!message.trim() || sending}
                 className="w-full mt-8 py-4 bg-indigo-600 hover:bg-black disabled:opacity-50 text-white font-black rounded-2xl shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 transition group"
               >
                  {sending ? (
                    <> <Loader2 size={18} className="animate-spin" /> Distributing Broadcast... </>
                  ) : (
                    <> <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" /> Send School Broadcast </>
                  )}
               </button>
            </div>

            {sentCount && (
               <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-4 animate-scale-in">
                  <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                     <CheckCircle2 size={24} />
                  </div>
                  <div>
                     <p className="text-sm font-black text-emerald-900">Broadcast Successful</p>
                     <p className="text-xs text-emerald-600 font-medium italic">Message delivered to {sentCount} parents via {method.toUpperCase()}.</p>
                  </div>
               </div>
            )}
         </div>

         {/* History Sidebar */}
         <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col h-full">
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <History size={14} /> Recently Sent
               </h2>
               <div className="space-y-3">
                  {HISTORY.map((h, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition hover:bg-slate-100">
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-black text-slate-300">{h.date}</span>
                          <span className="text-[9px] font-black uppercase text-indigo-500 bg-white px-1.5 py-0.5 rounded shadow-sm">
                             {h.type}
                          </span>
                       </div>
                       <p className="text-xs font-bold text-slate-800 line-clamp-1">{h.subject}</p>
                       <div className="flex items-center justify-between mt-3">
                          <p className="text-[10px] text-slate-400 font-medium italic">{h.count} Recipients</p>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                       </div>
                    </div>
                  ))}
               </div>
               
               <button className="mt-8 py-3 border-2 border-dashed border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition">
                  View All History
               </button>
            </div>

            {/* AI Insight Box */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  <Sparkles size={100} fill="currentColor" />
               </div>
               <h3 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-3">AI Comm Schedulder</h3>
               <p className="text-sm font-bold leading-relaxed mb-6 italic opacity-90">
                 "Our AI suggests sending fee reminders on Friday mornings for a 22% higher engagement rate."
               </p>
               <button className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition border border-white/10">
                 Apply AI Recommendation
               </button>
            </div>
         </div>

      </div>
    </div>
  )
}
