import { generateGameCode, isValidGameCode, normalizeGameCode } from '@/lib/gameCode';

describe('Game Code Utilities', () => {
  describe('generateGameCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateGameCode();
      expect(code).toHaveLength(6);
    });

    it('should only use alphanumeric characters', () => {
      const code = generateGameCode();
      expect(/^[0-9A-Z]{6}$/.test(code)).toBe(true);
    });

    it('should generate different codes on each call', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateGameCode());
      }
      // Should have high uniqueness (unlikely to get duplicates in 100 calls)
      expect(codes.size).toBeGreaterThan(95);
    });

    it('should have ~2 million possible combinations', () => {
      // 36^6 = 2,176,782,336
      // Just verify the generator uses the right alphabet
      const code = generateGameCode();
      const chars = code.split('');
      const validChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      chars.forEach(char => {
        expect(validChars).toContain(char);
      });
    });
  });

  describe('isValidGameCode', () => {
    it('should accept valid 6-char codes', () => {
      expect(isValidGameCode('ABC123')).toBe(true);
      expect(isValidGameCode('000000')).toBe(true);
      expect(isValidGameCode('ZZZZZZ')).toBe(true);
    });

    it('should reject codes that are too short', () => {
      expect(isValidGameCode('ABC12')).toBe(false);
    });

    it('should reject codes that are too long', () => {
      expect(isValidGameCode('ABC1234')).toBe(false);
    });

    it('should reject codes with invalid characters', () => {
      expect(isValidGameCode('abc123')).toBe(false); // lowercase should fail without normalization
      expect(isValidGameCode('ABC-23')).toBe(false);
      expect(isValidGameCode('ABC@23')).toBe(false);
      expect(isValidGameCode('ABC 23')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidGameCode('')).toBe(false);
    });

    it('should reject null-like values', () => {
      expect(isValidGameCode(null as any)).toBe(false);
      expect(isValidGameCode(undefined as any)).toBe(false);
    });
  });

  describe('normalizeGameCode', () => {
    it('should convert lowercase to uppercase', () => {
      expect(normalizeGameCode('abc123')).toBe('ABC123');
    });

    it('should trim whitespace', () => {
      expect(normalizeGameCode('  ABC123  ')).toBe('ABC123');
      expect(normalizeGameCode('\nABC123\t')).toBe('ABC123');
    });

    it('should handle mixed case', () => {
      expect(normalizeGameCode('AbC123')).toBe('ABC123');
    });

    it('should preserve valid codes', () => {
      expect(normalizeGameCode('ABC123')).toBe('ABC123');
    });

    it('should not validate, only normalize', () => {
      // normalization doesn't validate
      expect(normalizeGameCode('invalid!')).toBe('INVALID!');
    });
  });

  describe('Security: Input Validation', () => {
    it('should reject SQL injection attempts', () => {
      expect(isValidGameCode("ABC123'; DROP TABLE games;--")).toBe(false);
    });

    it('should reject XSS attempts', () => {
      expect(isValidGameCode('<script>alert("xss")</script>')).toBe(false);
    });

    it('should reject very long strings', () => {
      const longCode = 'A'.repeat(10000);
      expect(isValidGameCode(longCode)).toBe(false);
    });

    it('should normalize but not validate injection attempts', () => {
      const code = "'; DROP TABLE--";
      const normalized = normalizeGameCode(code);
      expect(isValidGameCode(normalized)).toBe(false);
    });
  });
});
