import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    const user = await createUser(email, password, name)

    if (!user) {
      return NextResponse.json(
        { error: 'User could not be created. Email may already exist.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
