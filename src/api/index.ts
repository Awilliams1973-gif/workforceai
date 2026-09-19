import { supabase } from './supabase';
import { 
  validateInput, 
  CreateLeadSchema, 
  UpdateLeadSchema,
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  AddMessageSchema,
} from './validation';
import type { Lead, Appointment, Conversation } from './types';
import * as Sentry from '@sentry/react';

// ============ ERROR HANDLING ============

class APIError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Retry logic for transient failures
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Only retry on network/timeout errors, not validation errors
      if (error instanceof Error && (error.message.includes('network') || error.message.includes('timeout'))) {
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

// ============ LEADS API ============

export const leadsAPI = {
  async fetchLeads(page = 1, pageSize = 20) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('createdAt', { ascending: false });

      if (error) {
        const apiError = new APIError(400, 'Failed to fetch leads', error);
        Sentry.captureException(apiError);
        throw apiError;
      }
      
      return data as Lead[];
    });
  },

  async fetchLeadById(id: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new APIError(404, `Lead not found: ${id}`, error);
      }
      
      return data as Lead;
    });
  },

  async createLead(leadData: unknown) {
    // Validate input
    const validation = await validateInput(CreateLeadSchema, leadData);
    if (!validation.valid) {
      throw new APIError(400, `Validation failed: ${validation.error}`);
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('leads')
        .insert([validation.data])
        .select()
        .single();

      if (error) {
        const apiError = new APIError(400, 'Failed to create lead', error);
        Sentry.captureException(apiError, { extra: { data: validation.data } });
        throw apiError;
      }

      return data as Lead;
    });
  },

  async updateLead(id: string, updates: unknown) {
    // Validate input
    const validation = await validateInput(UpdateLeadSchema, updates);
    if (!validation.valid) {
      throw new APIError(400, `Validation failed: ${validation.error}`);
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('leads')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new APIError(400, `Failed to update lead: ${id}`, error);
      }

      return data as Lead;
    });
  },

  async deleteLead(id: string) {
    return withRetry(async () => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        throw new APIError(400, `Failed to delete lead: ${id}`, error);
      }

      return { success: true };
    });
  },
};

// ============ APPOINTMENTS API ============

export const appointmentsAPI = {
  async fetchAppointments(page = 1, pageSize = 20) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('date', { ascending: true });

      if (error) {
        throw new APIError(400, 'Failed to fetch appointments', error);
      }

      return data as Appointment[];
    });
  },

  async createAppointment(appointmentData: unknown) {
    const validation = await validateInput(CreateAppointmentSchema, appointmentData);
    if (!validation.valid) {
      throw new APIError(400, `Validation failed: ${validation.error}`);
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('appointments')
        .insert([validation.data])
        .select()
        .single();

      if (error) {
        throw new APIError(400, 'Failed to create appointment', error);
      }

      return data as Appointment;
    });
  },

  async updateAppointment(id: string, updates: unknown) {
    const validation = await validateInput(UpdateAppointmentSchema, updates);
    if (!validation.valid) {
      throw new APIError(400, `Validation failed: ${validation.error}`);
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('appointments')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new APIError(400, `Failed to update appointment: ${id}`, error);
      }

      return data as Appointment;
    });
  },
};

// ============ CONVERSATIONS API ============

export const conversationsAPI = {
  async fetchConversations(page = 1, pageSize = 20) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('time', { ascending: false });

      if (error) {
        throw new APIError(400, 'Failed to fetch conversations', error);
      }

      return data as Conversation[];
    });
  },

  async addMessage(conversationId: string, messageData: unknown) {
    const validation = await validateInput(AddMessageSchema, messageData);
    if (!validation.valid) {
      throw new APIError(400, `Validation failed: ${validation.error}`);
    }

    return withRetry(async () => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert([{
          conversation_id: conversationId,
          ...validation.data,
          time: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        throw new APIError(400, 'Failed to add message', error);
      }

      return data;
    });
  },
};

// ============ ERROR CLASS EXPORT ============

export { APIError };
