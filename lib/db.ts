import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { DBSchema, Call, User } from '../types/db'

// Configure lowdb to write data to JSON file
const adapter = new JSONFile<DBSchema>('db.json')
const defaultData: DBSchema = { users: [], calls: [] }
export const db = new Low<DBSchema>(adapter, defaultData)

// Initialize database with default data
export async function initDB() {
  await db.read()
  
  // If db.data is null, initialize with default data
  if (!db.data) {
    db.data = defaultData
    await db.write()
  }
}

// Helper functions for database operations
export async function saveCall(call: Omit<Call, 'id'>) {
  await db.read()
  const newCall = {
    ...call,
    id: crypto.randomUUID()
  }
  db.data.calls.push(newCall)
  await db.write()
  return newCall
}

export async function saveUser(user: Omit<User, 'id'>) {
  await db.read()
  const newUser = {
    ...user,
    id: crypto.randomUUID()
  }
  db.data.users.push(newUser)
  await db.write()
  return newUser
}

export async function getUser(userId: string) {
  await db.read()
  return db.data.users.find(user => user.id === userId)
}

export async function getUserCalls(userId: string) {
  await db.read()
  return db.data.calls.filter(call => call.userId === userId)
}

export async function getUsers() {
  await db.read()
  return db.data.users
} 