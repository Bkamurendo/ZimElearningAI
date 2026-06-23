export type UserRole = 'student' | 'teacher' | 'parent' | 'admin' | 'school_admin'
export type ZimsecLevel = 'primary' | 'olevel' | 'alevel'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  school_id?: string | null
  plan: string | null
  pro_expires_at: string | null
  trial_ends_at: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface School {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  address: string | null
  province: string | null
  phone: string | null
  email: string | null
  admin_user_id: string | null
  subscription_plan: 'basic' | 'pro'
  subscription_expires_at: string | null
  max_students: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StudentProfile {
  id: string
  user_id: string
  zimsec_level: ZimsecLevel
  grade: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  zimsec_level: ZimsecLevel
  description: string | null
  created_at: string
}

export interface StudentSubject {
  id: string
  student_id: string
  subject_id: string
  enrolled_at: string
  subject?: Subject
}

export interface TeacherProfile {
  id: string
  user_id: string
  qualification: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface ParentProfile {
  id: string
  user_id: string
  phone_number: string | null
  created_at: string
}

export interface TeacherSubject {
  id: string
  teacher_id: string
  subject_id: string
  assigned_at: string
}

// ── Supabase Database generic type ────────────────────────────────────────────
// Matches the shape expected by @supabase/supabase-js v2.

type Rel = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
        Relationships: Rel[]
      }
      student_profiles: {
        Row: StudentProfile
        Insert: Omit<StudentProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StudentProfile, 'id' | 'user_id' | 'created_at'>>
        Relationships: Rel[]
      }
      teacher_profiles: {
        Row: TeacherProfile
        Insert: Omit<TeacherProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TeacherProfile, 'id' | 'user_id' | 'created_at'>>
        Relationships: Rel[]
      }
      parent_profiles: {
        Row: ParentProfile
        Insert: Omit<ParentProfile, 'id' | 'created_at'>
        Update: Partial<Omit<ParentProfile, 'id' | 'user_id' | 'created_at'>>
        Relationships: Rel[]
      }
      subjects: {
        Row: Subject
        Insert: Omit<Subject, 'id' | 'created_at'>
        Update: Partial<Omit<Subject, 'id' | 'created_at'>>
        Relationships: Rel[]
      }
      student_subjects: {
        Row: StudentSubject
        Insert: Omit<StudentSubject, 'id' | 'enrolled_at' | 'subject'>
        Update: Partial<Omit<StudentSubject, 'id' | 'enrolled_at' | 'subject'>>
        Relationships: Rel[]
      }
      teacher_subjects: {
        Row: TeacherSubject
        Insert: Omit<TeacherSubject, 'id' | 'assigned_at'>
        Update: Partial<Omit<TeacherSubject, 'id' | 'assigned_at'>>
        Relationships: Rel[]
      }
      schools: {
        Row: School
        Insert: Omit<School, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<School, 'id' | 'created_at'>>
        Relationships: Rel[]
      }
    }
    Views: {
      school_stats: {
        Row: {
          school_id: string
          school_name: string
          total_students: number
          total_teachers: number
          total_ai_requests_today: number
        }
        Relationships: Rel[]
      }
    }
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      zimsec_level: ZimsecLevel
    }
    CompositeTypes: Record<string, never>
  }
}
