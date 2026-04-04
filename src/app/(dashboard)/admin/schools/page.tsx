import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Building2, Users, CreditCard, Calendar, ArrowLeft, Plus, Search, Filter, Download, CheckCircle, AlertTriangle, Activity, MapPin, Phone, Mail } from 'lucide-react'

<<<<<<< HEAD
export const metadata = { title: 'School Management — Admin' }
=======
import { useState, useEffect } from 'react'
import {
  Building2, Plus, CheckCircle2, XCircle, Loader2,
  Users, Calendar, MapPin, Phone, X,
} from 'lucide-react'
>>>>>>> f4ce9480f3f65bb8d4b586f333b68ef6b9571e05

export default async function AdminSchoolsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  // Fetch schools and licensing data
  const [
    { data: schools },
    { data: licenses },
    { data: schoolStats },
  ] = await Promise.all([
    supabase.from('schools').select('*, admin:profiles(full_name, email)').order('created_at', { ascending: false }),
    supabase.from('school_licenses').select('*, schools(name)').order('created_at', { ascending: false }),
    supabase.from('school_statistics').select('*').order('date', { ascending: false }).limit(30),
  ])

  const totalSchools = schools?.length || 0
  const activeLicenses = licenses?.filter(l => l.status === 'active')?.length || 0
  const expiredLicenses = licenses?.filter(l => l.status === 'expired')?.length || 0
  const totalStudents = schools?.reduce((sum, school) => sum + (school.student_count || 0), 0) || 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-sm mb-4 transition">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">School & Institution Management</h1>
              <p className="text-indigo-200 text-sm">Manage school licenses and institutional accounts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* School Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 size={20} className="text-indigo-600" />
              </div>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                Total
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSchools}</p>
            <p className="text-sm text-gray-500 mt-1">Registered Schools</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Active
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeLicenses}</p>
            <p className="text-sm text-gray-500 mt-1">Active Licenses</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                Expired
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{expiredLicenses}</p>
            <p className="text-sm text-gray-500 mt-1">Expired Licenses</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-purple-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalStudents.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Total Students</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition">
              <Plus size={20} className="text-indigo-600" />
              <div className="text-left">
                <p className="font-medium text-indigo-900">Add New School</p>
                <p className="text-sm text-indigo-600">Register new institution</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition">
              <CreditCard size={20} className="text-green-600" />
              <div className="text-left">
                <p className="font-medium text-green-900">Issue License</p>
                <p className="text-sm text-green-600">Create new license</p>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition">
              <Download size={20} className="text-purple-600" />
              <div className="text-left">
                <p className="font-medium text-purple-900">Export Data</p>
                <p className="text-sm text-purple-600">Download school data</p>
              </div>
            </button>
          </div>
        </div>

        {/* Schools List */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900">Registered Schools</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search schools..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                <Plus size={16} />
                Add School
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">School</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Admin</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Students</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">License</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools?.map((school) => {
                  const license = licenses?.find(l => l.school_id === school.id)
                  return (
                    <tr key={school.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{school.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">{school.province}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-900">{school.admin?.full_name || 'Not assigned'}</p>
                          <p className="text-xs text-gray-500">{school.admin?.email || '-'}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{school.student_count || 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        {license ? (
                          <div>
                            <p className="text-sm text-gray-900">{license.license_type}</p>
                            <p className="text-xs text-gray-500">
                              Expires: {new Date(license.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No license</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          license?.status === 'active' ? 'bg-green-100 text-green-600' :
                          license?.status === 'expired' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {license?.status || 'inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                            <Activity size={16} />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-gray-600 transition">
                            <CreditCard size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {(!schools || schools.length === 0) && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      <Building2 size={40} className="mx-auto mb-3" />
                      <p className="font-medium">No schools registered</p>
                      <p className="text-sm mt-1">Add your first school to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* License Management */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-gray-900">License Management</h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition">
              <CreditCard size={16} />
              Issue New License
            </button>
          </div>

          <div className="space-y-4">
            {licenses?.slice(0, 5).map((license) => (
              <div key={license.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">{license.schools?.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      license.status === 'active' ? 'bg-green-100 text-green-600' :
                      license.status === 'expired' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {license.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Type: {license.license_type}</span>
                    <span>Students: {license.student_limit}</span>
                    <span>Expires: {new Date(license.expires_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
                    Renew
                  </button>
                  <button className="px-3 py-1 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition">
                    Details
                  </button>
                </div>
              </div>
            ))}
            {(!licenses || licenses.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <CreditCard size={40} className="mx-auto mb-3" />
                <p className="font-medium">No licenses issued</p>
                <p className="text-sm mt-1">Issue your first license to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
