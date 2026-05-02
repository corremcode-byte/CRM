import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: users, error: listError } = await admin.auth.admin.listUsers()
  if (listError) return NextResponse.json({ step: 'listUsers', error: listError.message })

  const user = users?.users?.find(u => u.email === 'admin@zenoglobal.in')
  if (!user) return NextResponse.json({ step: 'find', error: 'User not found', allEmails: users.users.map(u => u.email) })

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: 'Zeno@admin123',
  })

  if (updateError) return NextResponse.json({ step: 'update', error: updateError.message })

  return NextResponse.json({ success: true })
}
