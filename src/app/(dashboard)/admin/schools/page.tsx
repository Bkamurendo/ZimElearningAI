import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Building2, Users, CreditCard, ArrowLeft, Plus, Search, CheckCircle, AlertTriangle, Activity, MapPin, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata = { title: 'School Management — Admin' }

export default async function AdminSchoolsPage() {
  const supabase = createClient()
  
  // Safely check for user without crashing on null data
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const user = authData?.user
  
  if (authError || !user) redirect('/login')

  try {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    
    if (profile?.role?.toLowerCase() !== 'admin') {
      const safeRole = profile?.role?.toLowerCase() || 'student'
      redirect(`/${safeRole === 'school_admin' ? 'school-admin' : safeRole}/dashboard`)
    }

    // Fetch schools (school_licenses and school_statistics tables may not exist yet)
    const { data: schools } = await supabase
      .from('schools')
      .select('*, admin:profiles(full_name, email)')
      .order('created_at', { ascending: false })

    const licenses: any[] = []

    const totalSchools = schools?.length || 0
    const activeLicenses = licenses?.filter(l => l.status === 'active')?.length || 0
    const expiredLicenses = licenses?.filter(l => l.status === 'expired')?.length || 0
    const totalStudents = schools?.reduce((sum, school) => sum + (school.student_count || 0), 0) || 0

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-8">
          <div className="max-w-6xl mx-auto">
            <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-indigo-200 hover:text-white text-[10px] mb-4 transition uppercase font-bold">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/10 shadow-sm">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Institution Management</h1>
                <p className="text-indigo-200 text-xs uppercase font-medium">Manage school licenses and institutional accounts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Building2 size={20} className="text-indigo-600" />
                </div>
                <span className="text-[10px] text-gray-600 bg-gray-100 px-2 py-1 rounded-full uppercase font-bold">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 uppercase">{totalSchools}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium">Registered Schools</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <span className="text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase font-bold">Active</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 uppercase">{activeLicenses}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium">Active Licenses</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <span className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase font-bold">Expired</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 uppercase">{expiredLicenses}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium">Expired Licenses</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 uppercase">{totalStudents.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase font-medium">Total Students</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 uppercase text-sm">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition text-left group">
                <Plus size={20} className="text-indigo-600 group-hover:scale-110 transition" />
                <div>
                  <p className="font-bold text-indigo-900 uppercase text-xs">Add New School</p>
                  <p className="text-[10px] text-indigo-600 uppercase font-medium">Register institution</p>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition text-left group">
                <CreditCard size={20} className="text-green-600 group-hover:scale-110 transition" />
                <div>
                  <p className="font-bold text-green-900 uppercase text-xs">Issue License</p>
                  <p className="text-[10px] text-green-600 uppercase font-medium">Create new license</p>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition text-left group">
                <Download size={20} className="text-purple-600 group-hover:scale-110 transition" />
                <div>
                  <p className="font-bold text-purple-900 uppercase text-xs">Export Data</p>
                  <p className="text-[10px] text-purple-600 uppercase font-medium">Download csv data</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6 uppercase">
              <h2 className="font-bold text-gray-900 text-sm">Registered Institutions</h2>
              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition uppercase">
                  <Plus size={16} /> Add School
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 uppercase">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-700">School</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-700">Admin</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-700">Students</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-700">License</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-gray-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {schools?.map((school) => {
                    const license = licenses?.find(l => l.school_id === school.id)
                    const admin = Array.isArray(school.admin) ? school.admin[0] : school.admin
                    return (
                      <tr key={school.id} className="hover:bg-gray-50 transition uppercase">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{school.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin size={12} className="text-gray-400" />
                              <span className="text-[10px] text-gray-500 font-medium">{school.province}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-xs text-gray-900 font-bold">{admin?.full_name || 'Not assigned'}</p>
                            <p className="text-[10px] text-gray-500 font-medium">{admin?.email || '-'}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs text-gray-600 font-bold">{school.student_count || 0}</span>
                        </td>
                        <td className="py-4 px-4">
                          {license ? (
                            <div>
                              <p className="text-[10px] text-gray-900 font-bold">{license.license_type}</p>
                              <p className="text-[10px] text-gray-500 font-medium">
                                Exp: {new Date(license.expires_at).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold">No license</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                            license?.status === 'active' ? 'bg-green-100 text-green-600' :
                            license?.status === 'expired' ? 'bg-red-100 text-red-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {license?.status || 'inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="View Stats">
                              <Activity size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Manage License">
                              <CreditCard size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {(!schools || schools.length === 0) && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400 uppercase">
                        <Building2 size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="font-bold text-sm">No schools registered</p>
                        <p className="text-[10px] mt-1 font-medium">Add institutional accounts to begin</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (err) {
    console.error('[AdminSchools] Runtime error:', err)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center bg-gray-50">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
          <Building2 size={32} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Institution Access Error</h2>
        <p className="text-slate-500 max-w-xs uppercase">We encountered an error while loading the institution management portal. Please try again.</p>
        <Link href="/login">
          <Button variant="outline">Back to Login</Button>
        </Link>
      </div>
    )
  }
}
