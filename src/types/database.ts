export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          is_current: boolean
          name: string
          starts_on: string
          status: Database["public"]["Enums"]["term_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          is_current?: boolean
          name: string
          starts_on: string
          status?: Database["public"]["Enums"]["term_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          is_current?: boolean
          name?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["term_status"]
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience_roles: string[]
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_published: boolean
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          audience_roles?: string[]
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience_roles?: string[]
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_published?: boolean
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_components: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          maximum_score: number
          name: string
          sort_order: number
          weight_percentage: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          maximum_score: number
          name: string
          sort_order: number
          weight_percentage: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          maximum_score?: number
          name?: string
          sort_order?: number
          weight_percentage?: number
        }
        Relationships: []
      }
      assessment_sheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          class_subject_id: string
          created_at: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["result_status"]
          submitted_at: string | null
          teacher_id: string
          term_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          class_subject_id: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          submitted_at?: string | null
          teacher_id: string
          term_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          class_subject_id?: string
          created_at?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          submitted_at?: string | null
          teacher_id?: string
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sheets_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sheets_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sheets_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_sheets_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: number
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: never
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: never
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          academic_session_id: string
          class_id: string
          created_at: string
          id: string
          is_compulsory: boolean
          subject_id: string
        }
        Insert: {
          academic_session_id: string
          class_id: string
          created_at?: string
          id?: string
          is_compulsory?: boolean
          subject_id: string
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          created_at?: string
          id?: string
          is_compulsory?: boolean
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          admission_code: string
          created_at: string
          id: string
          name: string
          school_level_id: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          admission_code: string
          created_at?: string
          id?: string
          name: string
          school_level_id: string
          slug: string
          sort_order: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          admission_code?: string
          created_at?: string
          id?: string
          name?: string
          school_level_id?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_level_id_fkey"
            columns: ["school_level_id"]
            isOneToOne: false
            referencedRelation: "school_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_teaching_reports: {
        Row: {
          class_subject_id: string
          created_at: string
          ended_at: string | null
          id: string
          lesson_status: string
          notes: string | null
          report_date: string
          review_comment: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          started_at: string | null
          students_present: number | null
          submitted_by: string | null
          teacher_id: string
          topic_taught: string
          updated_at: string
        }
        Insert: {
          class_subject_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          lesson_status?: string
          notes?: string | null
          report_date?: string
          review_comment?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          students_present?: number | null
          submitted_by?: string | null
          teacher_id: string
          topic_taught: string
          updated_at?: string
        }
        Update: {
          class_subject_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          lesson_status?: string
          notes?: string | null
          report_date?: string
          review_comment?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          started_at?: string | null
          students_present?: number | null
          submitted_by?: string | null
          teacher_id?: string
          topic_taught?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_teaching_reports_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_teaching_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_teaching_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_teaching_reports_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      fee_structures: {
        Row: {
          academic_session_id: string
          amount: number
          class_id: string
          created_at: string
          due_date: string | null
          fee_category_id: string
          id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          amount: number
          class_id: string
          created_at?: string
          due_date?: string | null
          fee_category_id: string
          id?: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          amount?: number
          class_id?: string
          created_at?: string
          due_date?: string | null
          fee_category_id?: string
          id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      head_teacher_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string
          id: string
          school_level_id: string
          status: Database["public"]["Enums"]["record_status"]
          teacher_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          school_level_id: string
          status?: Database["public"]["Enums"]["record_status"]
          teacher_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          id?: string
          school_level_id?: string
          status?: Database["public"]["Enums"]["record_status"]
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "head_teacher_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "head_teacher_assignments_school_level_id_fkey"
            columns: ["school_level_id"]
            isOneToOne: true
            referencedRelation: "school_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "head_teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          accession_number: string
          author: string | null
          available_copies: number
          category: string | null
          created_at: string
          id: string
          isbn: string | null
          shelf_location: string | null
          status: Database["public"]["Enums"]["record_status"]
          title: string
          total_copies: number
          updated_at: string
        }
        Insert: {
          accession_number: string
          author?: string | null
          available_copies?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          shelf_location?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          title: string
          total_copies?: number
          updated_at?: string
        }
        Update: {
          accession_number?: string
          author?: string | null
          available_copies?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          shelf_location?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          title?: string
          total_copies?: number
          updated_at?: string
        }
        Relationships: []
      }
      library_loans: {
        Row: {
          book_id: string
          borrowed_at: string
          created_at: string
          due_at: string
          id: string
          issued_by: string | null
          received_by: string | null
          returned_at: string | null
          student_id: string | null
          teacher_id: string | null
        }
        Insert: {
          book_id: string
          borrowed_at?: string
          created_at?: string
          due_at: string
          id?: string
          issued_by?: string | null
          received_by?: string | null
          returned_at?: string | null
          student_id?: string | null
          teacher_id?: string | null
        }
        Update: {
          book_id?: string
          borrowed_at?: string
          created_at?: string
          due_at?: string
          id?: string
          issued_by?: string | null
          received_by?: string | null
          returned_at?: string | null
          student_id?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_loans_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          must_change_password: boolean
          occupation: string | null
          parent_portal_id: string | null
          phone: string
          profile_id: string | null
          relationship: Database["public"]["Enums"]["relationship_type"]
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          must_change_password?: boolean
          occupation?: string | null
          parent_portal_id?: string | null
          phone: string
          profile_id?: string | null
          relationship?: Database["public"]["Enums"]["relationship_type"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          must_change_password?: boolean
          occupation?: string | null
          parent_portal_id?: string | null
          phone?: string
          profile_id?: string | null
          relationship?: Database["public"]["Enums"]["relationship_type"]
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          fee_structure_id: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_at: string
          payment_reference: string | null
          receipt_number: string
          received_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee_structure_id?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string
          payment_reference?: string | null
          receipt_number: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_structure_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_at?: string
          payment_reference?: string | null
          receipt_number?: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          profile_id: string
          role_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          profile_id: string
          role_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          profile_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          last_login_at: string | null
          phone: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          last_login_at?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean
          name?: string
        }
        Relationships: []
      }
      school_levels: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      school_periods: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          is_break: boolean
          is_instructional: boolean
          name: string
          period_number: number
          starts_at: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          is_break?: boolean
          is_instructional?: boolean
          name: string
          period_number: number
          starts_at: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          is_break?: boolean
          is_instructional?: boolean
          name?: string
          period_number?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      school_profile: {
        Row: {
          address: string | null
          admission_prefix: string
          country_code: string
          created_at: string
          currency_code: string
          current_session_id: string | null
          current_term_id: string | null
          email: string | null
          id: string
          logo_url: string | null
          motto: string | null
          phone: string | null
          school_name: string
          short_name: string
          staff_prefix: string
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          admission_prefix?: string
          country_code?: string
          created_at?: string
          currency_code?: string
          current_session_id?: string | null
          current_term_id?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          motto?: string | null
          phone?: string | null
          school_name?: string
          short_name?: string
          staff_prefix?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          admission_prefix?: string
          country_code?: string
          created_at?: string
          currency_code?: string
          current_session_id?: string | null
          current_term_id?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          motto?: string | null
          phone?: string | null
          school_name?: string
          short_name?: string
          staff_prefix?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_profile_current_session_fk"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_profile_current_term_fk"
            columns: ["current_term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance: {
        Row: {
          attendance_date: string
          created_at: string
          enrollment_id: string
          id: string
          note: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          attendance_date?: string
          created_at?: string
          enrollment_id: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_session_id: string
          class_id: string
          created_at: string
          created_by: string | null
          enrolled_on: string
          id: string
          promoted_from_enrollment_id: string | null
          roll_number: string | null
          status: Database["public"]["Enums"]["record_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          class_id: string
          created_at?: string
          created_by?: string | null
          enrolled_on?: string
          id?: string
          promoted_from_enrollment_id?: string | null
          roll_number?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          created_at?: string
          created_by?: string | null
          enrolled_on?: string
          id?: string
          promoted_from_enrollment_id?: string | null
          roll_number?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_promoted_from_enrollment_id_fkey"
            columns: ["promoted_from_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_parents: {
        Row: {
          can_pick_up: boolean
          created_at: string
          is_primary_contact: boolean
          parent_id: string
          relationship: Database["public"]["Enums"]["relationship_type"]
          student_id: string
        }
        Insert: {
          can_pick_up?: boolean
          created_at?: string
          is_primary_contact?: boolean
          parent_id: string
          relationship?: Database["public"]["Enums"]["relationship_type"]
          student_id: string
        }
        Update: {
          can_pick_up?: boolean
          created_at?: string
          is_primary_contact?: boolean
          parent_id?: string
          relationship?: Database["public"]["Enums"]["relationship_type"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_scores: {
        Row: {
          assessment_sheet_id: string
          component_id: string
          created_at: string
          enrollment_id: string
          entered_by: string | null
          id: string
          raw_score: number
          updated_at: string
          weighted_score: number
        }
        Insert: {
          assessment_sheet_id: string
          component_id: string
          created_at?: string
          enrollment_id: string
          entered_by?: string | null
          id?: string
          raw_score: number
          updated_at?: string
          weighted_score?: number
        }
        Update: {
          assessment_sheet_id?: string
          component_id?: string
          created_at?: string
          enrollment_id?: string
          entered_by?: string | null
          id?: string
          raw_score?: number
          updated_at?: string
          weighted_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_scores_assessment_sheet_id_fkey"
            columns: ["assessment_sheet_id"]
            isOneToOne: false
            referencedRelation: "assessment_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_scores_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "assessment_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_scores_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_scores_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_date: string
          admission_number: string
          created_at: string
          created_by: string | null
          date_of_birth: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          medical_notes: string | null
          other_name: string | null
          passport_url: string | null
          residential_address: string | null
          status: Database["public"]["Enums"]["record_status"]
          surname: string
          updated_at: string
        }
        Insert: {
          admission_date: string
          admission_number: string
          created_at?: string
          created_by?: string | null
          date_of_birth: string
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          medical_notes?: string | null
          other_name?: string | null
          passport_url?: string | null
          residential_address?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          surname: string
          updated_at?: string
        }
        Update: {
          admission_date?: string
          admission_number?: string
          created_at?: string
          created_by?: string | null
          date_of_birth?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          medical_notes?: string | null
          other_name?: string | null
          passport_url?: string | null
          residential_address?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          surname?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_results: {
        Row: {
          assessment_sheet_id: string
          created_at: string
          enrollment_id: string
          grade: string | null
          id: string
          remark: string | null
          subject_position: number | null
          total_score: number
          updated_at: string
        }
        Insert: {
          assessment_sheet_id: string
          created_at?: string
          enrollment_id: string
          grade?: string | null
          id?: string
          remark?: string | null
          subject_position?: number | null
          total_score?: number
          updated_at?: string
        }
        Update: {
          assessment_sheet_id?: string
          created_at?: string
          enrollment_id?: string
          grade?: string | null
          id?: string
          remark?: string | null
          subject_position?: number | null
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_results_assessment_sheet_id_fkey"
            columns: ["assessment_sheet_id"]
            isOneToOne: false
            referencedRelation: "assessment_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_results_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_core: boolean
          name: string
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          name: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_core?: boolean
          name?: string
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: []
      }
      teacher_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          class_subject_id: string
          id: string
          is_class_teacher: boolean
          teacher_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          class_subject_id: string
          id?: string
          is_class_teacher?: boolean
          teacher_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          class_subject_id?: string
          id?: string
          is_class_teacher?: boolean
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_attendance: {
        Row: {
          attendance_date: string
          check_in_at: string | null
          check_out_at: string | null
          created_at: string
          id: string
          note: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          teacher_id: string
          updated_at: string
        }
        Insert: {
          attendance_date?: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          teacher_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_attendance_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          employee_id: string
          employment_date: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          must_change_password: boolean
          passport_url: string | null
          phone: string
          profile_id: string | null
          qualification: string | null
          specialization: string | null
          status: Database["public"]["Enums"]["record_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employee_id: string
          employment_date?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          must_change_password?: boolean
          passport_url?: string | null
          phone: string
          profile_id?: string | null
          qualification?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          employee_id?: string
          employment_date?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          must_change_password?: boolean
          passport_url?: string | null
          phone?: string
          profile_id?: string | null
          qualification?: string | null
          specialization?: string | null
          status?: Database["public"]["Enums"]["record_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      term_results: {
        Row: {
          attendance_absent: number
          attendance_late: number
          attendance_present: number
          average_score: number
          class_position: number | null
          created_at: string
          enrollment_id: string
          id: string
          principal_comment: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["result_status"]
          teacher_comment: string | null
          term_id: string
          total_score: number
          updated_at: string
        }
        Insert: {
          attendance_absent?: number
          attendance_late?: number
          attendance_present?: number
          average_score?: number
          class_position?: number | null
          created_at?: string
          enrollment_id: string
          id?: string
          principal_comment?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          teacher_comment?: string | null
          term_id: string
          total_score?: number
          updated_at?: string
        }
        Update: {
          attendance_absent?: number
          attendance_late?: number
          attendance_present?: number
          average_score?: number
          class_position?: number | null
          created_at?: string
          enrollment_id?: string
          id?: string
          principal_comment?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["result_status"]
          teacher_comment?: string | null
          term_id?: string
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "term_results_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "term_results_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_session_id: string
          created_at: string
          ends_on: string
          id: string
          is_current: boolean
          name: string
          starts_on: string
          status: Database["public"]["Enums"]["term_status"]
          term_number: number
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          created_at?: string
          ends_on: string
          id?: string
          is_current?: boolean
          name: string
          starts_on: string
          status?: Database["public"]["Enums"]["term_status"]
          term_number: number
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          created_at?: string
          ends_on?: string
          id?: string
          is_current?: boolean
          name?: string
          starts_on?: string
          status?: Database["public"]["Enums"]["term_status"]
          term_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_entries: {
        Row: {
          academic_session_id: string
          class_id: string
          class_subject_id: string | null
          created_at: string
          created_by: string | null
          id: string
          period_id: string
          room: string | null
          teacher_id: string | null
          term_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          academic_session_id: string
          class_id: string
          class_subject_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_id: string
          room?: string | null
          teacher_id?: string | null
          term_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          class_subject_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          period_id?: string
          room?: string | null
          teacher_id?: string | null
          term_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "timetable_entries_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_class_subject_id_fkey"
            columns: ["class_subject_id"]
            isOneToOne: false
            referencedRelation: "class_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "school_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_entries_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_parent_portal_id: { Args: never; Returns: string }
      has_any_role: { Args: { required_roles: string[] }; Returns: boolean }
      has_role: { Args: { required_role: string }; Returns: boolean }
      register_student: {
        Args: {
          p_academic_session_id: string
          p_admission_date: string
          p_class_id: string
          p_date_of_birth: string
          p_first_name: string
          p_gender: Database["public"]["Enums"]["gender_type"]
          p_guardian_address: string
          p_guardian_email: string
          p_guardian_name: string
          p_guardian_occupation: string
          p_guardian_phone: string
          p_guardian_relationship: Database["public"]["Enums"]["relationship_type"]
          p_other_name: string
          p_residential_address: string
          p_surname: string
        }
        Returns: string
      }
      register_teacher: {
        Args: {
          p_address: string
          p_date_of_birth: string
          p_email: string
          p_employment_date: string
          p_full_name: string
          p_gender: Database["public"]["Enums"]["gender_type"]
          p_phone: string
          p_qualification: string
          p_specialization: string
        }
        Returns: string
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late" | "excused"
      gender_type: "male" | "female"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "card"
        | "mobile_money"
        | "other"
      payment_status:
        | "pending"
        | "partial"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled"
      record_status:
        | "active"
        | "inactive"
        | "suspended"
        | "graduated"
        | "withdrawn"
        | "archived"
      relationship_type:
        | "father"
        | "mother"
        | "guardian"
        | "brother"
        | "sister"
        | "uncle"
        | "aunt"
        | "other"
      result_status:
        | "draft"
        | "submitted"
        | "approved"
        | "published"
        | "rejected"
      term_status: "draft" | "active" | "completed" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late", "excused"],
      gender_type: ["male", "female"],
      payment_method: [
        "cash",
        "bank_transfer",
        "card",
        "mobile_money",
        "other",
      ],
      payment_status: [
        "pending",
        "partial",
        "paid",
        "failed",
        "refunded",
        "cancelled",
      ],
      record_status: [
        "active",
        "inactive",
        "suspended",
        "graduated",
        "withdrawn",
        "archived",
      ],
      relationship_type: [
        "father",
        "mother",
        "guardian",
        "brother",
        "sister",
        "uncle",
        "aunt",
        "other",
      ],
      result_status: [
        "draft",
        "submitted",
        "approved",
        "published",
        "rejected",
      ],
      term_status: ["draft", "active", "completed", "archived"],
    },
  },
} as const
