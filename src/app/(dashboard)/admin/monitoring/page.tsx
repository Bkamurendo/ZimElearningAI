'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { Monitor, Activity, Users, Server, Cpu, HardDrive, Wifi, AlertTriangle, ArrowLeft, RefreshCw, Clock } from 'lucide-react'

export default function AdminMonitoringPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [realTimeData, setRealTimeData] = useState({
    activeUsers: 0,
    serverLoad: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkTraffic: 0,
    apiRequests: 0,
    responseTime: 0,
    errorRate: 0,
    recentActivity: [],
    systemAlerts: []
  })
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/login')
        return
      }
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') {
        redirect('/admin/dashboard')
        return
      }
      
      setUser(user)
      setProfile(profile)
      setLoading(false)
    }

    checkAuth()
  }, [supabase])

  useEffect(() => {
    if (!user || !profile) return

    const fetchRealTimeData = async () => {
      try {
        // Mock real-time data - replace with actual monitoring endpoints
        const mockData = {
          activeUsers: Math.floor(Math.random() * 50) + 100,
          serverLoad: Math.floor(Math.random() * 30) + 20,
          memoryUsage: Math.floor(Math.random() * 20) + 40,
          diskUsage: 65,
          networkTraffic: Math.floor(Math.random() * 100) + 50,
          apiRequests: Math.floor(Math.random() * 500) + 1000,
          responseTime: Math.floor(Math.random() * 100) + 50,
          errorRate: Math.random() * 2,
          recentActivity: [
            { id: 1, type: 'login', user: 'John Doe', time: '2 min ago', status: 'success' },
            { id: 2, type: 'quiz_attempt', user: 'Jane Smith', time: '5 min ago', status: 'success' },
            { id: 3, type: 'upload', user: 'Mike Johnson', time: '8 min ago', status: 'success' },
            { id: 4, type: 'payment', user: 'Sarah Wilson', time: '12 min ago', status: 'success' },
            { id: 5, type: 'error', user: 'System', time: '15 min ago', status: 'error' },
          ],
          systemAlerts: [
            { id: 1, level: 'warning', message: 'High memory usage detected', time: '10 min ago' },
            { id: 2, level: 'info', message: 'Database backup completed', time: '1 hour ago' },
          ]
        }
        
        setRealTimeData(mockData)
        setLastUpdate(new Date())
      } catch (error) {
        console.error('Error fetching real-time data:', error)
      }
    }

    fetchRealTimeData()
    const interval = setInterval(fetchRealTimeData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [user, profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-gray-600">Loading monitoring dashboard...</p>
        </div>
      </div>
    )
  }

  const MetricCard = ({ title, value, icon: Icon, color, unit, trend, status }: {
    title: string
    value: number
    icon: any
    color: string
    unit?: string
    trend?: number
    status?: 'normal' | 'warning' | 'critical'
  }) => {
    const getStatusColor = () => {
      if (status === 'critical') return 'border-red-500 bg-red-50'
      if (status === 'warning') return 'border-amber-500 bg-amber-50'
      return 'border-gray-200 bg-white'
    }

    return (
      <div className={`rounded-xl border-2 p-6 ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
          {trend !== undefined && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()}{unit || ''}
        </p>
        <p className="text-sm text-gray-500 mt-1">{title}</p>
      </div>
    )
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <Users size={16} className="text-blue-600" />
      case 'quiz_attempt': return <Activity size={16} className="text-purple-600" />
      case 'upload': return <HardDrive size={16} className="text-green-600" />
      case 'payment': return <Server size={16} className="text-emerald-600" />
      default: return <AlertTriangle size={16} className="text-red-600" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-cyan-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Monitor size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Real-Time Monitoring</h1>
              <p className="text-cyan-200 text-sm">Live system performance and activity monitoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-cyan-200 text-sm">
              <Clock size={14} />
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-cyan-200 text-sm">Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* System Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Users"
              value={realTimeData.activeUsers}
              icon={Users}
              color="bg-blue-500"
              trend={5}
              status="normal"
            />
            <MetricCard
              title="Server Load"
              value={realTimeData.serverLoad}
              icon={Cpu}
              color="bg-purple-500"
              unit="%"
              trend={-2}
              status={realTimeData.serverLoad > 70 ? 'warning' : 'normal'}
            />
            <MetricCard
              title="Memory Usage"
              value={realTimeData.memoryUsage}
              icon={HardDrive}
              color="bg-green-500"
              unit="%"
              trend={3}
              status={realTimeData.memoryUsage > 80 ? 'critical' : 'normal'}
            />
            <MetricCard
              title="Disk Usage"
              value={realTimeData.diskUsage}
              icon={HardDrive}
              color="bg-amber-500"
              unit="%"
              status={realTimeData.diskUsage > 85 ? 'warning' : 'normal'}
            />
          </div>
        </div>

        {/* API Metrics */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="API Requests/min"
              value={realTimeData.apiRequests}
              icon={Activity}
              color="bg-indigo-500"
              trend={8}
            />
            <MetricCard
              title="Avg Response Time"
              value={realTimeData.responseTime}
              icon={Clock}
              color="bg-emerald-500"
              unit="ms"
              trend={-5}
            />
            <MetricCard
              title="Error Rate"
              value={realTimeData.errorRate}
              icon={AlertTriangle}
              color="bg-red-500"
              unit="%"
              status={realTimeData.errorRate > 1 ? 'warning' : 'normal'}
            />
          </div>
        </div>

        {/* Network Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wifi size={18} className="text-cyan-600" />
            Network Traffic
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Bandwidth</span>
              <span className="text-lg font-semibold text-gray-900">{realTimeData.networkTraffic} Mbps</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((realTimeData.networkTraffic / 200) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {realTimeData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getActivityIcon(activity.type)}
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{activity.type.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-500">{activity.user}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{activity.time}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        {realTimeData.systemAlerts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4">System Alerts</h2>
            <div className="space-y-3">
              {realTimeData.systemAlerts.map((alert) => (
                <div key={alert.id} className={`flex items-center justify-between p-4 rounded-lg ${
                  alert.level === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className={alert.level === 'warning' ? 'text-amber-600' : 'text-blue-600'} />
                    <p className={`font-medium ${alert.level === 'warning' ? 'text-amber-900' : 'text-blue-900'}`}>
                      {alert.message}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">{alert.time}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
