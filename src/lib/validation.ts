import { z } from 'zod';
import type { Lead, Appointment, Conversation, ConversationMessage, KnowledgeItem } from './types';

// ============ LEAD SCHEMAS ============

export const LeadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  phone: z.string().min(1, 'Phone is required').regex(/^\+?[\d\s\-()]{7,}$/, 'Invalid phone format'),
  email: z.string().email('Invalid email address'),
  service: z.string().min(1, 'Service is required').max(255),
  source: z.string().min(1, 'Source is required').max(255),
  status: z.enum(['new', 'contacted', 'qualified', 'won', 'lost']),
  value: z.number().int().nonnegative('Value must be non-negative'),
  notes: z.string().max(2000, 'Notes too long').optional().default(''),
  nextFollowUp: z.string().datetime().optional(),
  createdAt: z.string().datetime().optional(),
});

export const CreateLeadSchema = LeadSchema.omit({ id: true, createdAt: true });
export const UpdateLeadSchema = LeadSchema.partial();

// ============ APPOINTMENT SCHEMAS ============

export const AppointmentSchema = z.object({
  id: z.string().uuid().optional(),
  customerName: z.string().min(1, 'Name required').max(255),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,}$/, 'Invalid phone'),
  service: z.string().min(1, 'Service required').max(255),
  date: z.string().date('Invalid date format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM format'),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'rescheduled', 'cancelled', 'no-show']),
  notes: z.string().max(2000).optional().default(''),
});

export const CreateAppointmentSchema = AppointmentSchema.omit({ id: true });
export const UpdateAppointmentSchema = AppointmentSchema.partial();

// ============ CONVERSATION SCHEMAS ============

export const ConversationMessageSchema = z.object({
  id: z.string().uuid().optional(),
  sender: z.enum(['customer', 'ai', 'human']),
  text: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  time: z.string().datetime().optional(),
});

export const ConversationSchema = z.object({
  id: z.string().uuid().optional(),
  customerName: z.string().min(1).max(255),
  channel: z.enum(['web', 'phone', 'sms', 'email']),
  lastMessage: z.string().max(5000),
  time: z.string().datetime(),
  status: z.enum(['active', 'awaiting-human', 'resolved']),
  messages: z.array(ConversationMessageSchema).optional().default([]),
  leadStatus: z.enum(['new', 'contacted', 'qualified', 'won', 'lost']),
  appointment: z.object({ date: z.string().date(), time: z.string() }).optional(),
});

export const CreateConversationSchema = ConversationSchema.omit({ id: true });
export const AddMessageSchema = ConversationMessageSchema.pick({ sender: true, text: true });

// ============ KNOWLEDGE SCHEMAS ============

export const KnowledgeItemSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(['service', 'pricing', 'faq', 'policy', 'hours', 'area', 'offer']),
  title: z.string().min(1, 'Title required').max(255),
  content: z.string().min(1, 'Content required').max(10000),
});

export const CreateKnowledgeSchema = KnowledgeItemSchema.omit({ id: true });
export const UpdateKnowledgeSchema = KnowledgeItemSchema.partial();

// ============ AUTH SCHEMAS ============

export const SignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be 8+ characters').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  confirmPassword: z.string(),
  businessName: z.string().min(1, 'Business name required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

// ============ TYPE EXPORTS ============

export type CreateLead = z.infer<typeof CreateLeadSchema>;
export type UpdateLead = z.infer<typeof UpdateLeadSchema>;
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;
export type CreateConversation = z.infer<typeof CreateConversationSchema>;
export type AddMessage = z.infer<typeof AddMessageSchema>;
export type CreateKnowledge = z.infer<typeof CreateKnowledgeSchema>;
export type SignupData = z.infer<typeof SignupSchema>;
export type LoginData = z.infer<typeof LoginSchema>;

// ============ VALIDATION HELPERS ============

export const validateInput = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<{ valid: true; data: T } | { valid: false; error: string }> => {
  try {
    const validated = await schema.parseAsync(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { valid: false, error: errorMessages };
    }
    return { valid: false, error: 'Validation failed' };
  }
};

export const validateSync = <T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; error: string } => {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { valid: false, error: errorMessages };
    }
    return { valid: false, error: 'Validation failed' };
  }
};
