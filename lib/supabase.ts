import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          location: string | null
          bio: string | null
          avatar_url: string | null
          skills_offered: string[]
          skills_wanted: string[]
          availability: string
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          location?: string | null
          bio?: string | null
          avatar_url?: string | null
          skills_offered?: string[]
          skills_wanted?: string[]
          availability?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          location?: string | null
          bio?: string | null
          avatar_url?: string | null
          skills_offered?: string[]
          skills_wanted?: string[]
          availability?: string
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      skill_requests: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          message: string
          skill_offered: string
          skill_wanted: string
          status: "pending" | "accepted" | "declined" | "completed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          message: string
          skill_offered: string
          skill_wanted: string
          status?: "pending" | "accepted" | "declined" | "completed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          message?: string
          skill_offered?: string
          skill_wanted?: string
          status?: "pending" | "accepted" | "declined" | "completed"
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
