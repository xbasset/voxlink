export interface Call {
  id: string
  visitorName: string
  timestamp: string
  duration: number
  userId: string
  show_details_name: string
  show_details_reason: string
  show_details_email: string
  show_details_phone: string
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
    avatar: string;
    backgroundImage: string;
  } 
  
export interface DBSchema {
  users: User[]
  calls: Call[]
} 