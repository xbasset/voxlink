import type { NextApiRequest, NextApiResponse } from "next"
import { getUserCalls, saveCall } from '../../lib/db'
import { Call } from '../../types/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Call[] | Call | { error: string }>,
) {
  if (req.method === 'GET') {
    try {
      const calls = await getUserCalls(req.query.userId as string)
      return res.status(200).json(calls)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch calls' })
    }
  }
  
  if (req.method === 'POST') {
    const { duration, userId, details, transcript } = req.body
    
    try {
      const call = await saveCall({
        duration,
        userId,
        timestamp: new Date().toISOString(),
        details,
        transcript,
      })
      return res.status(201).json(call as Call)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save call' })
    }
  }
  
  res.status(405).json({ error: 'Method not allowed' })
} 