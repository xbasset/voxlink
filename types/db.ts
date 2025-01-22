export interface Call {
  id: string
  timestamp: string
  duration: number
  userId: string
  details: {
    name: string
    reason: string
    email: string
    phone: string
  }
  transcript: CallTranscriptEntry[]
}


export interface CallTranscriptEntry {
  itemId: string
  from: string
  content: string
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    shortBio: string;
    bio: string;
    avatar: string;
    backgroundImage: string;
  } 
  
export interface DBSchema {
  users: User[]
  calls: Call[]
} 