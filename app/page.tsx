// import { createClient } from '@/utils/supabase/server'
// import { cookies } from 'next/headers'
import Placeholder from '@/components/shared/placeholder'
import Background from '@/components/main/background'
import TopBar from '@/components/shared/top-bar'
import Board from '@/components/main/board'
import ShelfPlank from '@/components/main/shelf-plank'

export default async function Page() {
  // const cookieStore = await cookies()
  // const supabase = createClient(cookieStore)

  // const { data: todos } = await supabase.from('todos').select()

  return (
    <>
      <Background />
      <TopBar />
      <Board />
      <ShelfPlank />  
      <Placeholder />
    </>
  )
}