import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createUser(email: string, password: string, name: string): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password)
    
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash: passwordHash, name }])
      .select('id, email, name')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, password_hash')
      .eq('email', email)
      .single()

    if (error || !data) {
      return null
    }

    const isValidPassword = await verifyPassword(password, data.password_hash)
    if (!isValidPassword) {
      return null
    }

    return {
      id: data.id,
      email: data.email,
      name: data.name
    }
  } catch (error) {
    console.error('Error authenticating user:', error)
    return null
  }
}
