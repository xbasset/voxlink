import type { NextApiRequest, NextApiResponse } from "next"
import { getUsers } from '../../lib/db'
import { User } from '../../types/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User[] | { error: string }>,
) {
  if (req.method === 'GET') {
    try {
      const users = await getUsers()
      return res.status(200).json(users)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch users' })
    }
  }
  
  res.status(405).json({ error: 'Method not allowed' })
} 