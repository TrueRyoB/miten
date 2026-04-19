import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Placeholder from '@/components/placeholder'

export default async function Page() {
  // const cookieStore = await cookies()
  // const supabase = createClient(cookieStore)

  // const { data: todos } = await supabase.from('todos').select()

  return (
    <Placeholder />
  )
}