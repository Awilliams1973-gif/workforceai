import { describe, it, expect } from 'vitest';
import { 
  LeadSchema, 
  CreateLeadSchema,
  LoginSchema,
  SignupSchema,
  validateSync,
} from '@/lib/validation';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('LeadSchema', () => {
    it('should validate a valid lead', () => {
      const validLead = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        service: 'Consulting',
        source: 'Website',
        status: 'new' as const,
        value: 5000,
        notes: 'Interested in services',
      };

      const result = LeadSchema.safeParse(validLead);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidLead = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+1-555-123-4567',
        service: 'Consulting',
        source: 'Website',
        status: 'new' as const,
        value: 5000,
      };

      const result = LeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const invalidLead = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123',
        service: 'Consulting',
        source: 'Website',
        status: 'new' as const,
        value: 5000,
      };

      const result = LeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });

    it('should reject negative value', () => {
      const invalidLead = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        service: 'Consulting',
        source: 'Website',
        status: 'new' as const,
        value: -1000,
      };

      const result = LeadSchema.safeParse(invalidLead);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateLeadSchema', () => {
    it('should not require id or createdAt', () => {
      const newLead = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+1-555-987-6543',
        service: 'Design',
        source: 'Referral',
        status: 'contacted' as const,
        value: 3000,
      };

      const result = CreateLeadSchema.safeParse(newLead);
      expect(result.success).toBe(true);
    });
  });

  describe('LoginSchema', () => {
    it('should validate correct login credentials', () => {
      const login = {
        email: 'user@example.com',
        password: 'SecurePassword123',
      };

      const result = LoginSchema.safeParse(login);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const login = {
        email: 'not-an-email',
        password: 'SecurePassword123',
      };

      const result = LoginSchema.safeParse(login);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const login = {
        email: 'user@example.com',
        password: '',
      };

      const result = LoginSchema.safeParse(login);
      expect(result.success).toBe(false);
    });
  });

  describe('SignupSchema', () => {
    it('should validate correct signup data', () => {
      const signup = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        businessName: 'My Business',
      };

      const result = SignupSchema.safeParse(signup);
      expect(result.success).toBe(true);
    });

    it('should reject weak password (no uppercase)', () => {
      const signup = {
        email: 'newuser@example.com',
        password: 'securepass123',
        confirmPassword: 'securepass123',
        businessName: 'My Business',
      };

      const result = SignupSchema.safeParse(signup);
      expect(result.success).toBe(false);
    });

    it('should reject weak password (no number)', () => {
      const signup = {
        email: 'newuser@example.com',
        password: 'SecurePassword',
        confirmPassword: 'SecurePassword',
        businessName: 'My Business',
      };

      const result = SignupSchema.safeParse(signup);
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const signup = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        confirmPassword: 'DifferentPass456',
        businessName: 'My Business',
      };

      const result = SignupSchema.safeParse(signup);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const signup = {
        email: 'newuser@example.com',
        password: 'Pass12',
        confirmPassword: 'Pass12',
        businessName: 'My Business',
      };

      const result = SignupSchema.safeParse(signup);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSync helper', () => {
    it('should return valid data on success', () => {
      const result = validateSync(LoginSchema, {
        email: 'test@example.com',
        password: 'ValidPass123',
      });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should return error message on failure', () => {
      const result = validateSync(LoginSchema, {
        email: 'invalid',
        password: '',
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('Invalid email');
      }
    });
  });
});
