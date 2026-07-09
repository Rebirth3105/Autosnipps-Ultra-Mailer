export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: 'draft' | 'sent' | 'scheduled';
  recipients: number;
  sentAt?: string;
}

export interface Recipient {
  id: string;
  email: string;
  name: string;
  tags: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
