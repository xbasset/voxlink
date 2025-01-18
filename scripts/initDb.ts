import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { DBSchema, User } from '../types/db.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const johnDoe: Omit<User, 'id'> = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "1234567890",
  address: "123 Main St, Anytown, USA",
  city: "Anytown",
  state: "CA",
  zip: "12345",
  bio: "John Doe is a software engineer specializing in AI and machine learning. He offers services to help people with their AI and machine learning needs.",
  avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=1024&h=1024&q=80",
  backgroundImage: "https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
}

async function initDb() {
  const dbPath = path.join(path.dirname(__dirname), 'db.json')
  const adapter = new JSONFile<DBSchema>(dbPath)
  const db = new Low<DBSchema>(adapter, { users: [], calls: [] })

  await db.read()

  // Reset database
  db.data = { users: [], calls: [] }

  // Add John Doe with ID 1
  db.data.users.push({
    ...johnDoe,
    id: "1"
  })

  await db.write()
  console.log('Database initialized with John Doe data')
}

initDb().catch(console.error) 