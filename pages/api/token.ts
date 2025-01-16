import dotenv from 'dotenv';
dotenv.config({ path: '.env.local', override: true });

import type { NextApiRequest, NextApiResponse } from 'next';
import { TokenResponse } from '../../types/api';

type ApiResponse = {
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse | ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'verse',
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    // display the json data in the console
    console.log("data:" + JSON.stringify(data, null, 2));
    return res.status(200).json(data);
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
} 