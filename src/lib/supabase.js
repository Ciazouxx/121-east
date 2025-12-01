import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bruxmzcgchzbelzrzlql.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJydXhtemNnY2h6YmVsenJ6bHFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDg3MzAsImV4cCI6MjA4MDE4NDczMH0.sO335Ln0SjuUI1uwAFkiGZNjxB7LeOedOi3TW7tC5k0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

