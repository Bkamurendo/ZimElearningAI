import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Brain, TrendingUp, AlertTriangle, Target, ArrowLeft, Zap, BarChart3, Users, DollarSign, Award, Calendar } from 'lucide-react'

export const metadata = { title: 'AI Insights — Admin' }

export default async function AdminInsightsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Mock AI insights data - replace with actual AI predictions
  const aiInsights = {
    predictions: [
      {
        id: 1,
        type: 'churn_risk',
        title: 'Student Churn Prediction',
        description: '15 students at high risk of dropping out in the next 30 days',
        confidence: 87,
        impact: 'high',
        recommendations: [
          'Send personalized engagement emails',
          'Offer free tutoring sessions',
          'Provide additional study resources'
        ],
        affectedUsers: 15,
        timeframe: '30 days'
      },
      {
        id: 2,
        type: 'revenue_forecast',
        title: 'Revenue Forecast',
        description: 'Projected 23% revenue increase in Q2 2024',
        confidence: 92,
        impact: 'high',
        recommendations: [
          'Prepare for increased server load',
          'Hire additional support staff',
          'Expand marketing efforts'
        ],
        affectedUsers: 0,
        timeframe: '3 months'
      },
      {
        id: 3,
        type: 'content_performance',
        title: 'Content Performance Analysis',
        description: 'Mathematics content showing 40% lower engagement rates',
        confidence: 78,
        impact: 'medium',
        recommendations: [
          'Review and update math content',
          'Add interactive elements',
          'Provide video tutorials'
        ],
        affectedUsers: 120,
        timeframe: '2 weeks'
      }
    ],
    trends: [
      {
        metric: 'User Engagement',
        current: 78,
        previous: 72,
        trend: 'up',
        prediction: 'Expected to reach 85% by end of month'
      },
      {
        metric: 'Learning Progress',
        current: 65,
        previous: 68,
        trend: 'down',
        prediction: 'May drop to 60% without intervention'
      },
      {
        metric: 'Revenue Growth',
        current: 23,
        previous: 18,
        trend: 'up',
        prediction: 'On track for 30% growth this quarter'
      }
    ],
    opportunities: [
      {
        title: 'Premium Upgrade Opportunity',
        description: '45 free trial users showing high engagement',
        potentialRevenue: '$2,250/month',
        confidence: 89,
        action: 'Send targeted upgrade offers'
      },
      {
        title: 'School Partnership Potential',
        description: '3 schools showing high trial usage',
        potentialRevenue: '$15,000/year',
        confidence: 76,
        action: 'Contact school administrators'
      },
      {
        title: 'Content Gap Identified',
        description: 'High demand for science content not met',
        potentialRevenue: '$8,000/month',
        confidence: 82,
        action: 'Develop science curriculum'
      }
    ]
  }

  const InsightCard = ({ insight }: { insight: typeof aiInsights.predictions[0] }) => {
    const getImpactColor = () => {
      if (insight.impact === 'high') return 'border-red-200 bg-red-50'
      if (insight.impact === 'medium') return 'border-amber-200 bg-amber-50'
      return 'border-gray-200 bg-gray-50'
    }

    const getConfidenceColor = () => {
      if (insight.confidence >= 85) return 'text-green-600 bg-green-100'
      if (insight.confidence >= 70) return 'text-amber-600 bg-amber-100'
      return 'text-red-600 bg-red-100'
    }

    return (
      <div className={`rounded-xl border-2 p-6 ${getImpactColor()}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor()}`}>
            {insight.confidence}% confidence
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">Impact:</span>
            <span className={`font-medium ${
              insight.impact === 'high' ? 'text-red-600' :
              insight.impact === 'medium' ? 'text-amber-600' :
              'text-gray-600'
            }`}>
              {insight.impact}
            </span>
            {insight.affectedUsers > 0 && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">{insight.affectedUsers} users affected</span>
              </>
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</p>
            <ul className="space-y-1">
              {insight.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-indigo-600 mt-1">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-purple-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI-Powered Insights</h1>
              <p className="text-purple-200 text-sm">Predictive analytics and intelligent recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* AI Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain size={24} className="text-purple-600" />
            <h2 className="font-bold text-purple-900">AI Analysis Summary</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-sm font-medium text-red-900">3 Risks Identified</span>
              </div>
              <p className="text-xs text-gray-600">Immediate attention required</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-900">3 Opportunities</span>
              </div>
              <p className="text-xs text-gray-600">Potential for growth</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Trend Analysis</span>
              </div>
              <p className="text-xs text-gray-600">Performance metrics</p>
            </div>
          </div>
        </div>

        {/* Predictive Insights */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Predictive Insights</h2>
          <div className="space-y-4">
            {aiInsights.predictions.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Trend Analysis & Predictions
          </h2>
          <div className="space-y-4">
            {aiInsights.trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">{trend.metric}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      trend.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      {trend.trend === 'up' ? '↑' : '↓'} {Math.abs(trend.current - trend.previous)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{trend.prediction}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{trend.current}%</p>
                  <p className="text-xs text-gray-500">Current</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Opportunities */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Target size={18} className="text-green-600" />
              Growth Opportunities
            </h2>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              AI Identified
            </span>
          </div>
          <div className="space-y-4">
            {aiInsights.opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1">
                  <h3 className="font-medium text-green-900 mb-1">{opportunity.title}</h3>
                  <p className="text-sm text-green-700 mb-2">{opportunity.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600 font-medium">{opportunity.potentialRevenue}</span>
                    <span className="text-green-600">{opportunity.confidence}% confidence</span>
                  </div>
                </div>
                <button className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
                  {opportunity.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI Model Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-purple-600" />
            AI Model Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-700">94.2%</p>
              <p className="text-sm text-purple-600 mt-1">Prediction Accuracy</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">1.2s</p>
              <p className="text-sm text-blue-600 mt-1">Avg Response Time</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">24/7</p>
              <p className="text-sm text-green-600 mt-1">Monitoring Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
