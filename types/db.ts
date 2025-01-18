export interface Call {
  id: string
  visitorName: string
  timestamp: string
  duration: number
  userId: string
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
    bio: string;
    instructions: string;
    avatar: string;
    backgroundImage: string;
  } 
  
export interface DBSchema {
  users: User[]
  calls: Call[]
} 