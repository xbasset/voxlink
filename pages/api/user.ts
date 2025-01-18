// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { User } from '../../types/db';
import { db, initDB } from '../../lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<User | { error: string }>,
) {
  await initDB();
  
  if (req.method === 'GET') {
    const users = db.data?.users;
    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }
    // For now, return the first user
    return res.status(200).json(users[0]);
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}

