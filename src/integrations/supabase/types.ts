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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      conversation_participants: {
        Row: {
          conversation_id: string
          last_read_at: string
          member_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          member_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      echo_room_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          question_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          question_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          question_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "echo_room_messages_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_room_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      echo_room_voices: {
        Row: {
          created_at: string
          member_id: string
          question_id: string
          voice: number
        }
        Insert: {
          created_at?: string
          member_id: string
          question_id: string
          voice: number
        }
        Update: {
          created_at?: string
          member_id?: string
          question_id?: string
          voice?: number
        }
        Relationships: [
          {
            foreignKeyName: "echo_room_voices_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "echo_room_voices_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      member_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ask_me_about: string[]
          avatar_path: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          discoverability: string
          display_name: string
          first_name: string
          id: string
          known_for: string[]
          languages: string[]
          last_name: string
          occupation: string | null
          updated_at: string
          woman_attested_at: string | null
        }
        Insert: {
          ask_me_about?: string[]
          avatar_path?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          discoverability?: string
          display_name?: string
          first_name?: string
          id: string
          known_for?: string[]
          languages?: string[]
          last_name?: string
          occupation?: string | null
          updated_at?: string
          woman_attested_at?: string | null
        }
        Update: {
          ask_me_about?: string[]
          avatar_path?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          discoverability?: string
          display_name?: string
          first_name?: string
          id?: string
          known_for?: string[]
          languages?: string[]
          last_name?: string
          occupation?: string | null
          updated_at?: string
          woman_attested_at?: string | null
        }
        Relationships: []
      }
      question_audience: {
        Row: {
          created_at: string
          question_id: string
          recipient_id: string
          trust_distance: number
        }
        Insert: {
          created_at?: string
          question_id: string
          recipient_id: string
          trust_distance: number
        }
        Update: {
          created_at?: string
          question_id?: string
          recipient_id?: string
          trust_distance?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_audience_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_audience_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_private_meta: {
        Row: {
          created_at: string
          initial_instinct: string | null
          instinct_note: string | null
          owner_id: string
          question_id: string
        }
        Insert: {
          created_at?: string
          initial_instinct?: string | null
          instinct_note?: string | null
          owner_id: string
          question_id: string
        }
        Update: {
          created_at?: string
          initial_instinct?: string | null
          instinct_note?: string | null
          owner_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_private_meta_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_private_meta_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          audience_scope: string
          body: string
          category: string
          created_at: string
          id: string
          reach: string
          status: string
          updated_at: string
        }
        Insert: {
          audience_scope?: string
          body: string
          category?: string
          created_at?: string
          id?: string
          reach?: string
          status?: string
          updated_at?: string
        }
        Update: {
          audience_scope?: string
          body?: string
          category?: string
          created_at?: string
          id?: string
          reach?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          perspective_tag: string | null
          question_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          perspective_tag?: string | null
          question_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          perspective_tag?: string | null
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          message_id: string | null
          question_id: string | null
          reason: string
          reply_id: string | null
          reporter_id: string
          room_message_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id?: string | null
          question_id?: string | null
          reason: string
          reply_id?: string | null
          reporter_id: string
          room_message_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string | null
          question_id?: string | null
          reason?: string
          reply_id?: string | null
          reporter_id?: string
          room_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_room_message_id_fkey"
            columns: ["room_message_id"]
            isOneToOne: false
            referencedRelation: "echo_room_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      ripple_echoes: {
        Row: {
          created_at: string
          member_id: string
          question_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          question_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ripple_echoes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ripple_echoes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ripple_outcomes: {
        Row: {
          created_at: string
          note: string | null
          question_id: string
          shared: boolean
          status: string | null
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          question_id: string
          shared?: boolean
          status?: string | null
          summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          note?: string | null
          question_id?: string
          shared?: boolean
          status?: string | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ripple_outcomes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_connections: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_connections_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          location: string | null
          search: unknown
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          location?: string | null
          search?: unknown
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          location?: string | null
          search?: unknown
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_picks: {
        Row: {
          category: string
          created_at: string
          id: string
          location: string | null
          note: string
          owner_id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          location?: string | null
          note: string
          owner_id: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          location?: string | null
          note?: string
          owner_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_picks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wingwoman_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          owner_id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          owner_id: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          owner_id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wingwoman_messages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wingwoman_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "wingwoman_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      wingwoman_sessions: {
        Row: {
          context: string | null
          created_at: string
          id: string
          instinct: string | null
          owner_id: string
          reflection: Json | null
          situation: string | null
          title: string
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          instinct?: string | null
          owner_id: string
          reflection?: Json | null
          situation?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          instinct?: string | null
          owner_id?: string
          reflection?: Json | null
          situation?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wingwoman_sessions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      tellher_block: { Args: { _member: string }; Returns: undefined }
      tellher_can_message: { Args: { _member: string }; Returns: boolean }
      tellher_can_view: { Args: { _q: string }; Returns: boolean }
      tellher_cancel_trust: { Args: { _id: string }; Returns: undefined }
      tellher_circle_picks: {
        Args: never
        Returns: {
          category: string
          created_at: string
          id: string
          location: string
          note: string
          recommender: string
          title: string
        }[]
      }
      tellher_constellation: {
        Args: never
        Returns: {
          category: string
          created_at: string
          echo_level: number
          excerpt: string
          has_outcome: boolean
          id: string
        }[]
      }
      tellher_conversation_partner: { Args: { _c: string }; Returns: string }
      tellher_delete_outcome: { Args: { _q: string }; Returns: undefined }
      tellher_delete_question: { Args: { _id: string }; Returns: undefined }
      tellher_delete_reply: { Args: { _id: string }; Returns: undefined }
      tellher_echo: { Args: { _id: string }; Returns: undefined }
      tellher_echo_room: {
        Args: { _q: string }
        Returns: {
          body: string
          created_at: string
          id: string
          mine: boolean
          voice: number
        }[]
      }
      tellher_echo_room_can_enter: { Args: { _q: string }; Returns: boolean }
      tellher_echo_room_post: {
        Args: { _body: string; _q: string }
        Returns: string
      }
      tellher_echo_room_status: {
        Args: { _q: string }
        Returns: {
          can_enter: boolean
          unlocked: boolean
        }[]
      }
      tellher_echo_signal: {
        Args: { _id: string }
        Returns: {
          below_threshold: boolean
          echo_count: number
          mine: boolean
        }[]
      }
      tellher_extended_circle: {
        Args: { _via?: string }
        Returns: {
          ask_me_about: string[]
          bridge_pending: boolean
          city: string
          country: string
          first_name: string
          has_avatar: boolean
          known_for: string[]
          last_initial: string
          member_id: string
          via: string
          via_id: string
        }[]
      }
      tellher_extended_reach_count: { Args: never; Returns: number }
      tellher_feed: {
        Args: never
        Returns: {
          audience_scope: string
          body: string
          category: string
          created_at: string
          id: string
          is_mine: boolean
          my_instinct: string
          my_note: string
          reply_count: number
        }[]
      }
      tellher_feed_map: {
        Args: never
        Returns: {
          n: number
          perspective_tag: string
          question_id: string
        }[]
      }
      tellher_find_member: {
        Args: { _email: string }
        Returns: {
          city: string
          first_name: string
          last_initial: string
          member_id: string
        }[]
      }
      tellher_inbox: {
        Args: never
        Returns: {
          blocked_by_me: boolean
          can_message: boolean
          conversation_id: string
          first_name: string
          has_avatar: boolean
          last_at: string
          last_body: string
          last_initial: string
          last_mine: boolean
          member_id: string
          unread: boolean
        }[]
      }
      tellher_is_blocked: { Args: { _a: string; _b: string }; Returns: boolean }
      tellher_is_direct: { Args: { _a: string; _b: string }; Returns: boolean }
      tellher_is_participant: { Args: { _c: string }; Returns: boolean }
      tellher_is_question_author: { Args: { _q: string }; Returns: boolean }
      tellher_mark_read: { Args: { _c: string }; Returns: undefined }
      tellher_member_profile: {
        Args: { _id: string }
        Returns: {
          ask_me_about: string[]
          bio: string
          city: string
          country: string
          first_name: string
          has_avatar: boolean
          known_for: string[]
          languages: string[]
          last_name: string
          occupation: string
          relation: string
          via: string
        }[]
      }
      tellher_member_ready: { Args: never; Returns: boolean }
      tellher_member_shelf: {
        Args: { _id: string }
        Returns: {
          body: string
          category: string
          created_at: string
          id: string
          kind: string
          location: string
          title: string
        }[]
      }
      tellher_my_circle: {
        Args: never
        Returns: {
          city: string
          connection_id: string
          created_at: string
          first_name: string
          kind: string
          last_initial: string
          member_id: string
        }[]
      }
      tellher_open_conversation: { Args: { _member: string }; Returns: string }
      tellher_outcome: {
        Args: { _q: string }
        Returns: {
          is_mine: boolean
          note: string
          shared: boolean
          status: string
          summary: string
          updated_at: string
        }[]
      }
      tellher_post_reply: {
        Args: { _body: string; _id: string; _tag: string }
        Returns: string
      }
      tellher_publish_question: {
        Args: {
          _body: string
          _category: string
          _instinct: string
          _note: string
          _scope: string
        }
        Returns: string
      }
      tellher_question: {
        Args: { _id: string }
        Returns: {
          audience_scope: string
          body: string
          category: string
          created_at: string
          id: string
          is_mine: boolean
          my_instinct: string
          my_note: string
          my_reply_id: string
        }[]
      }
      tellher_reach_preview: { Args: { _scope: string }; Returns: number }
      tellher_replies: {
        Args: { _id: string }
        Returns: {
          body: string
          created_at: string
          id: string
          is_mine: boolean
          perspective_tag: string
        }[]
      }
      tellher_report_message: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      tellher_report_question: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      tellher_report_room_message: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      tellher_respond_trust: {
        Args: { _accept: boolean; _id: string }
        Returns: undefined
      }
      tellher_ripple_audience: {
        Args: { _author: string; _scope: string }
        Returns: {
          recipient_id: string
          trust_distance: number
        }[]
      }
      tellher_search: {
        Args: { _q: string }
        Returns: {
          audience_scope: string
          body: string
          category: string
          created_at: string
          has_avatar: boolean
          id: string
          kind: string
          known_for: string[]
          location: string
          member_id: string
          member_name: string
          rank: number
          relation: string
          reply_count: number
          title: string
        }[]
      }
      tellher_send_message: {
        Args: { _body: string; _c: string }
        Returns: string
      }
      tellher_send_trust: { Args: { _recipient: string }; Returns: undefined }
      tellher_set_outcome: {
        Args: {
          _note: string
          _q: string
          _shared: boolean
          _status: string
          _summary: string
        }
        Returns: undefined
      }
      tellher_unblock: { Args: { _member: string }; Returns: undefined }
      tellher_unecho: { Args: { _id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
