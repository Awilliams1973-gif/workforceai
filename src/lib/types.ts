export type View =
  | 'home'
  | 'audit'
  | 'auth'
  | 'dashboard'
  | 'leads'
  | 'appointments'
  | 'receptionist'
  | 'conversations'
  | 'knowledge'
  | 'sales'
  | 'appointments-assistant'
  | 'marketing'
  | 'reviews'
  | 'pricing'
  | 'settings'
  | 'audit-leads';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  source: string;
  status: LeadStatus;
  value: number;
  notes: string;
  nextFollowUp: string;
  createdAt: string;
};

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'rescheduled'
  | 'cancelled'
  | 'no-show';

export type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes: string;
};

export type Conversation = {
  id: string;
  customerName: string;
  channel: 'web' | 'phone' | 'sms' | 'email';
  lastMessage: string;
  time: string;
  status: 'active' | 'awaiting-human' | 'resolved';
  messages: ConversationMessage[];
  leadStatus: LeadStatus;
  appointment?: { date: string; time: string } | null;
};

export type ConversationMessage = {
  id: string;
  sender: 'customer' | 'ai' | 'human';
  text: string;
  time: string;
};

export type KnowledgeItem = {
  id: string;
  category: 'service' | 'pricing' | 'faq' | 'policy' | 'hours' | 'area' | 'offer';
  title: string;
  content: string;
};

export type AIEmployeeStatus = 'active' | 'paused' | 'setup';

export type AIEmployee = {
  id: string;
  name: string;
  role: string;
  description: string;
  status: AIEmployeeStatus;
  icon: string;
  conversations: number;
  actions: number;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  tagline: string;
  features: string[];
  highlight?: boolean;
  cta: string;
};
