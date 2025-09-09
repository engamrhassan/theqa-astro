import { describe, it, expect, beforeEach } from 'vitest';
import { BrokerSchema, CountrySortingSchema } from '../schemas/broker';
import {
  safeValidate,
  validateCountryCode,
  sanitizeString,
} from '../utils/validation/validator';

describe('Broker Schema Validation', () => {
  it('should validate valid broker data', () => {
    const validBroker = {
      id: 1,
      name: 'Exness',
      slug: 'exness',
      rating: 4.5,
      min_deposit: 10,
      license: 'FCA',
      country_codes: ['EG', 'SA'],
      is_restricted: false,
    };

    const result = safeValidate(BrokerSchema, validBroker);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Exness');
      expect(result.data.rating).toBe(4.5);
    }
  });

  it('should reject invalid broker data', () => {
    const invalidBroker = {
      id: -1, // Invalid: negative ID
      name: '', // Invalid: empty name
      slug: 'invalid slug!', // Invalid: contains spaces and special chars
      rating: 6, // Invalid: rating > 5
      min_deposit: -10, // Invalid: negative deposit
    };

    const result = safeValidate(BrokerSchema, invalidBroker);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.field).toBe('id');
    }
  });

  it('should validate country sorting data', () => {
    const validSorting = {
      country_code: 'EG',
      broker_id: 1,
      sort_order: 0,
      is_restricted: false,
    };

    const result = safeValidate(CountrySortingSchema, validSorting);
    expect(result.success).toBe(true);
  });
});

describe('Validation Utilities', () => {
  it('should validate country codes', () => {
    expect(validateCountryCode('EG')).toBe('EG');
    expect(validateCountryCode('eg')).toBe('EG');
    expect(() => validateCountryCode('INVALID')).toThrow();
    expect(() => validateCountryCode('E')).toThrow();
  });

  it('should sanitize strings', () => {
    expect(sanitizeString('  hello world  ')).toBe('hello world');
    expect(sanitizeString('<script>alert("xss")</script>')).toBe(
      'scriptalert("xss")/script'
    );
    expect(sanitizeString('a'.repeat(2000))).toHaveLength(1000);
  });
});
