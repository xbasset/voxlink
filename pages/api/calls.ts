import type { NextApiRequest, NextApiResponse } from "next"
import { saveCall } from '../../lib/db'
import { Call } from '../../types/db'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Call | { error: string }>,
) {
  if (req.method === 'POST') {
    const { visitorName, duration, userId, show_details_name, show_details_reason, show_details_email, show_details_phone } = req.body
    
    try {
      const call = await saveCall({
        visitorName,
        duration,
        userId,
        timestamp: new Date().toISOString(),
        show_details_name,
        show_details_reason,
        show_details_email,
        show_details_phone
      })
      return res.status(201).json(call as Call)
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save call' })
    }
  }
  
  res.status(405).json({ error: 'Method not allowed' })
} 