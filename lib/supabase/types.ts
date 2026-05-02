export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type LeadTemperature = 'hot' | 'warm' | 'cold'
export type UserRole = 'admin' | 'sales' | 'operations'

export type SalesStatus =
  | 'New Lead'
  | 'Attempted Contact'
  | 'Connected'
  | 'Interested'
  | 'Not Interested'
  | 'Follow-up'
  | 'Qualified'
  | 'Payment Pending'
  | 'Paid'

export type OpsStatus =
  | 'Docs Pending'
  | 'Docs Received'
  | 'Docs Verified'
  | 'Application Filed'
  | 'Embassy Processing'
  | 'Approved'
  | 'Rejected'
  | 'Closed'

export type PaymentStatus = 'Pending' | 'Partial' | 'Paid'
export type Urgency = 'High' | 'Medium' | 'Low'
export type BudgetRange = 'Low' | 'Medium' | 'High'
export type VisaType = 'Tourist' | 'Student' | 'PR' | 'Business' | 'Medical' | 'Other'
export type LeadSource = 'Instagram' | 'Website' | 'Referral' | 'Walk-in' | 'Other'

export interface Document {
  name: string
  required: boolean
  uploaded: boolean
  file_url?: string | null
}

export interface Enquiry {
  id: string
  full_name?: string | null
  name?: string | null
  phone?: string | null
  email?: string | null
  city?: string | null
  source?: LeadSource | string | null
  country?: string | null
  destination?: string | null
  visa_type?: VisaType | string | null
  travel_date?: string | null
  num_travelers?: number | null
  budget_range?: BudgetRange | string | null
  travel_history_notes?: string | null
  has_travel_history?: boolean | null
  previous_rejection?: boolean | null
  rejection_notes?: string | null
  urgency?: Urgency | string | null
  lead_score?: number | null
  sales_status?: SalesStatus | string | null
  lead_temperature?: LeadTemperature | string | null
  lead?: string | null
  last_contacted_at?: string | null
  next_followup_at?: string | null
  assigned_sales_agent?: string | null
  call_notes?: string | null
  payment_status?: PaymentStatus | string | null
  package_selected?: string | null
  amount?: number | null
  ops_status?: OpsStatus | string | null
  assigned_case_manager?: string | null
  document_status?: string | null
  missing_documents?: string | null
  application_id?: string | null
  embassy_name?: string | null
  submission_date?: string | null
  expected_decision_date?: string | null
  documents?: Document[] | null
  submitted_at?: string | null
  created_at?: string | null
}

export interface Profile {
  id: string
  full_name?: string | null
  role: UserRole
  email?: string | null
  created_at?: string | null
}

export interface Notification {
  id: string
  user_id?: string | null
  role?: string | null
  title: string
  message: string
  type: 'new_lead' | 'followup' | 'paid' | 'document' | 'status_change'
  lead_id?: number | string | null
  read: boolean
  created_at?: string | null
}

export type Database = {
  public: {
    Tables: {
      enquiries: {
        Row: Enquiry
        Insert: Partial<Enquiry>
        Update: Partial<Enquiry>
        Relationships: []
      }
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Partial<Notification>
        Update: Partial<Notification>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
