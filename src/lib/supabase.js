import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dzmqjkdjebixbtvbglqc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bXFqa2RqZWJpeGJ0dmJnbHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjI0OTIsImV4cCI6MjA4MDE5ODQ5Mn0.8ktuzfcj5vAdAhmPFIaXappApc2WDJ729ZXr2YDqzBQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

