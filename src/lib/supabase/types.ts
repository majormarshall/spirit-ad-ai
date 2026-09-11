export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          logo_url: string | null
          website: string | null
          email: string | null
          phone: string | null
          phone2: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          opening_hours: Json
          brand_voice: string | null
          target_audience: string | null
          currency: string
          currency_symbol: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          phone2?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          opening_hours?: Json
          brand_voice?: string | null
          target_audience?: string | null
          currency?: string
          currency_symbol?: string
        }
        Update: {
          name?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          email?: string | null
          phone?: string | null
          phone2?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          opening_hours?: Json
          brand_voice?: string | null
          target_audience?: string | null
          currency?: string
          currency_symbol?: string
        }
      }
      business_members: {
        Row: {
          id: string
          business_id: string
          user_id: string
          role: 'owner' | 'admin' | 'staff'
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'staff'
          created_at?: string
        }
        Update: {
          role?: 'owner' | 'admin' | 'staff'
        }
      }
      products: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          category: string | null
          price: number | null
          currency: string
          unit: string
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          category?: string | null
          price?: number | null
          currency?: string
          unit?: string
          image_url?: string | null
          is_active?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          category?: string | null
          price?: number | null
          currency?: string
          unit?: string
          image_url?: string | null
          is_active?: boolean
        }
      }
      product_inventory: {
        Row: {
          id: string
          product_id: string
          quantity: number
          availability_status: 'available' | 'low_stock' | 'out_of_stock'
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          availability_status?: 'available' | 'low_stock' | 'out_of_stock'
        }
        Update: {
          quantity?: number
          availability_status?: 'available' | 'low_stock' | 'out_of_stock'
        }
      }
      faqs: {
        Row: {
          id: string
          business_id: string
          question: string
          answer: string
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          question: string
          answer: string
          category?: string
          is_active?: boolean
        }
        Update: {
          question?: string
          answer?: string
          category?: string
          is_active?: boolean
        }
      }
      knowledge_documents: {
        Row: {
          id: string
          business_id: string
          title: string
          content: string | null
          file_url: string | null
          document_type: 'text' | 'pdf' | 'image' | 'other'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          content?: string | null
          file_url?: string | null
          document_type?: 'text' | 'pdf' | 'image' | 'other'
        }
        Update: {
          title?: string
          content?: string | null
          file_url?: string | null
          document_type?: 'text' | 'pdf' | 'image' | 'other'
        }
      }
      campaigns: {
        Row: {
          id: string
          business_id: string
          title: string
          content_type: string
          platform: 'facebook' | 'instagram' | 'whatsapp' | 'all'
          status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'cancelled'
          headline: string | null
          caption: string | null
          call_to_action: string | null
          hashtags: string[] | null
          image_url: string | null
          image_prompt: string | null
          scheduled_time: string | null
          published_time: string | null
          product_id: string | null
          ai_generated: boolean
          approved_by: string | null
          approved_at: string | null
          rejection_note: string | null
          meta_post_id: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          content_type?: string
          platform?: 'facebook' | 'instagram' | 'whatsapp' | 'all'
          status?: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'cancelled'
          headline?: string | null
          caption?: string | null
          call_to_action?: string | null
          hashtags?: string[] | null
          image_url?: string | null
          image_prompt?: string | null
          scheduled_time?: string | null
          product_id?: string | null
          ai_generated?: boolean
        }
        Update: {
          title?: string
          content_type?: string
          platform?: 'facebook' | 'instagram' | 'whatsapp' | 'all'
          status?: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'cancelled'
          headline?: string | null
          caption?: string | null
          call_to_action?: string | null
          hashtags?: string[] | null
          image_url?: string | null
          image_prompt?: string | null
          scheduled_time?: string | null
          published_time?: string | null
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          meta_post_id?: string | null
          error_message?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          business_id: string
          name: string | null
          phone: string | null
          email: string | null
          platform: string
          platform_user_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name?: string | null
          phone?: string | null
          email?: string | null
          platform?: string
          platform_user_id?: string | null
          notes?: string | null
        }
        Update: {
          name?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
        }
      }
      conversations: {
        Row: {
          id: string
          business_id: string
          customer_id: string | null
          platform: string
          status: 'open' | 'needs_human' | 'assigned' | 'resolved' | 'closed'
          assigned_to: string | null
          ai_enabled: boolean
          last_message: string | null
          last_message_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id?: string | null
          platform?: string
          status?: 'open' | 'needs_human' | 'assigned' | 'resolved' | 'closed'
          assigned_to?: string | null
          ai_enabled?: boolean
        }
        Update: {
          status?: 'open' | 'needs_human' | 'assigned' | 'resolved' | 'closed'
          assigned_to?: string | null
          ai_enabled?: boolean
          last_message?: string | null
          last_message_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_type: 'customer' | 'ai' | 'human' | 'system'
          sender_id: string | null
          message: string | null
          message_type: 'text' | 'image' | 'audio' | 'document' | 'template'
          ai_generated: boolean
          ai_confidence: number | null
          meta_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_type: 'customer' | 'ai' | 'human' | 'system'
          sender_id?: string | null
          message?: string | null
          message_type?: 'text' | 'image' | 'audio' | 'document' | 'template'
          ai_generated?: boolean
          ai_confidence?: number | null
          meta_message_id?: string | null
        }
        Update: {
          message?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          business_id: string
          customer_id: string | null
          conversation_id: string | null
          status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled'
          total_amount: number | null
          delivery_address: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id?: string | null
          conversation_id?: string | null
          status?: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled'
          total_amount?: number | null
          delivery_address?: string | null
          notes?: string | null
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled'
          total_amount?: number | null
          delivery_address?: string | null
          notes?: string | null
        }
      }
      leads: {
        Row: {
          id: string
          business_id: string
          customer_id: string | null
          conversation_id: string | null
          product_id: string | null
          quantity: number | null
          lead_type: 'standard' | 'high_value' | 'bulk' | 'recurring'
          lead_score: number
          status: 'new' | 'contacted' | 'negotiating' | 'won' | 'lost'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id?: string | null
          conversation_id?: string | null
          product_id?: string | null
          quantity?: number | null
          lead_type?: 'standard' | 'high_value' | 'bulk' | 'recurring'
          lead_score?: number
          status?: 'new' | 'contacted' | 'negotiating' | 'won' | 'lost'
          notes?: string | null
        }
        Update: {
          lead_type?: 'standard' | 'high_value' | 'bulk' | 'recurring'
          lead_score?: number
          status?: 'new' | 'contacted' | 'negotiating' | 'won' | 'lost'
          notes?: string | null
        }
      }
      ai_permissions: {
        Row: {
          id: string
          business_id: string
          permissions: Json
          autopilot_enabled: boolean
          approval_mode: 'approval' | 'auto'
          confidence_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          permissions?: Json
          autopilot_enabled?: boolean
          approval_mode?: 'approval' | 'auto'
          confidence_threshold?: number
        }
        Update: {
          permissions?: Json
          autopilot_enabled?: boolean
          approval_mode?: 'approval' | 'auto'
          confidence_threshold?: number
        }
      }
      ai_actions: {
        Row: {
          id: string
          business_id: string
          user_id: string | null
          action_type: string
          platform: 'facebook' | 'instagram' | 'whatsapp' | 'all' | null
          description: string | null
          payload: Json
          permission_required: string | null
          status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'cancelled'
          approved_by: string | null
          approved_at: string | null
          rejection_note: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          action_type: string
          platform?: 'facebook' | 'instagram' | 'whatsapp' | 'all' | null
          description?: string | null
          payload?: Json
          permission_required?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'cancelled'
        }
        Update: {
          status?: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'cancelled'
          approved_by?: string | null
          approved_at?: string | null
          rejection_note?: string | null
          completed_at?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          business_id: string | null
          user_id: string | null
          actor: 'user' | 'ai' | 'system'
          action: string
          platform: string | null
          description: string | null
          metadata: Json
          ip_address: string | null
          result: 'success' | 'failure' | 'pending'
          created_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          user_id?: string | null
          actor?: 'user' | 'ai' | 'system'
          action: string
          platform?: string | null
          description?: string | null
          metadata?: Json
          ip_address?: string | null
          result?: 'success' | 'failure' | 'pending'
        }
        Update: Record<string, never>
      }
      integrations: {
        Row: {
          id: string
          business_id: string
          platform: 'facebook' | 'instagram' | 'whatsapp'
          status: 'connected' | 'disconnected' | 'error' | 'expired'
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          page_id: string | null
          page_name: string | null
          account_id: string | null
          account_name: string | null
          metadata: Json
          last_synced_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          platform: 'facebook' | 'instagram' | 'whatsapp'
          status?: 'connected' | 'disconnected' | 'error' | 'expired'
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          page_id?: string | null
          page_name?: string | null
          account_id?: string | null
          account_name?: string | null
          metadata?: Json
        }
        Update: {
          status?: 'connected' | 'disconnected' | 'error' | 'expired'
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          page_id?: string | null
          page_name?: string | null
          account_id?: string | null
          account_name?: string | null
          metadata?: Json
          last_synced_at?: string | null
          error_message?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          business_id: string
          user_id: string | null
          type: string
          title: string
          message: string | null
          link: string | null
          is_read: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          user_id?: string | null
          type: string
          title: string
          message?: string | null
          link?: string | null
          is_read?: boolean
          metadata?: Json
        }
        Update: {
          is_read?: boolean
        }
      }
      analytics_snapshots: {
        Row: {
          id: string
          business_id: string
          platform: string | null
          metric_date: string
          campaigns_total: number
          posts_published: number
          posts_scheduled: number
          conversations: number
          ai_responses: number
          human_handoffs: number
          leads_detected: number
          orders_created: number
          post_reach: number
          post_impressions: number
          post_engagements: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          platform?: string | null
          metric_date: string
          campaigns_total?: number
          posts_published?: number
          posts_scheduled?: number
          conversations?: number
          ai_responses?: number
          human_handoffs?: number
          leads_detected?: number
          orders_created?: number
          post_reach?: number
          post_impressions?: number
          post_engagements?: number
        }
        Update: {
          campaigns_total?: number
          posts_published?: number
          posts_scheduled?: number
          conversations?: number
          ai_responses?: number
          human_handoffs?: number
          leads_detected?: number
          orders_created?: number
          post_reach?: number
          post_impressions?: number
          post_engagements?: number
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      is_business_member: {
        Args: { bid: string }
        Returns: boolean
      }
      my_business_ids: {
        Args: Record<string, never>
        Returns: string[]
      }
    }
    Enums: {
      member_role: 'owner' | 'admin' | 'staff'
      campaign_status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'failed' | 'cancelled'
      social_platform: 'facebook' | 'instagram' | 'whatsapp' | 'all'
      conversation_status: 'open' | 'needs_human' | 'assigned' | 'resolved' | 'closed'
      sender_type: 'customer' | 'ai' | 'human' | 'system'
      message_type: 'text' | 'image' | 'audio' | 'document' | 'template'
      order_status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled'
      lead_status: 'new' | 'contacted' | 'negotiating' | 'won' | 'lost'
      lead_type: 'standard' | 'high_value' | 'bulk' | 'recurring'
      action_status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed' | 'cancelled'
      notification_type: 'human_needed' | 'new_lead' | 'new_order' | 'approval_needed' | 'publish_failed' | 'account_disconnected' | 'token_expired' | 'new_message'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Convenience type aliases
export type Profile = Tables<'profiles'>
export type Business = Tables<'businesses'>
export type BusinessMember = Tables<'business_members'>
export type Product = Tables<'products'>
export type ProductInventory = Tables<'product_inventory'>
export type FAQ = Tables<'faqs'>
export type KnowledgeDocument = Tables<'knowledge_documents'>
export type Campaign = Tables<'campaigns'>
export type Customer = Tables<'customers'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type Order = Tables<'orders'>
export type Lead = Tables<'leads'>
export type AIPermissions = Tables<'ai_permissions'>
export type AIAction = Tables<'ai_actions'>
export type AuditLog = Tables<'audit_logs'>
export type Integration = Tables<'integrations'>
export type Notification = Tables<'notifications'>
