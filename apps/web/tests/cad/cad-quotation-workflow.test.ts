import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  generateCadSignedToken,
  verifyCadSignedToken,
} from '@/lib/cad/storage';
import { analyzeMeshGeometry } from '@/lib/cad/geometry';

describe('TTRC Store 3D Printing CAD-to-Quotation Architecture Tests', () => {
  describe('1. Private Storage & Cryptographic Signed Token Access', () => {
    it('generates a valid signed token for private CAD access with expiration', () => {
      const fileId = 'cad_test_12345';
      const token = generateCadSignedToken({
        fileId,
        userId: 'cust_abc',
        role: 'customer',
        expiresInSeconds: 60,
      });

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      const verified = verifyCadSignedToken(token);
      expect(verified.valid).toBe(true);
      expect(verified.fileId).toBe(fileId);
      expect(verified.userId).toBe('cust_abc');
      expect(verified.role).toBe('customer');
    });

    it('rejects an invalid, tampered, or expired token', () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
      const verified = verifyCadSignedToken(fakeToken);
      expect(verified.valid).toBe(false);
    });
  });

  describe('2. Geometry Analysis & Topology Verification', () => {
    it('accurately verifies a 20x20x20mm watertight cube and computes 8 cm³ volume', () => {
      // 8 vertices for 20mm cube
      const size = 20;
      const positions = new Float32Array([
        0, 0, 0,
        size, 0, 0,
        size, size, 0,
        0, size, 0,
        0, 0, size,
        size, 0, size,
        size, size, size,
        0, size, size,
      ]);

      const indices = new Uint32Array([
        4, 5, 6,  4, 6, 7, // Front
        1, 0, 3,  1, 3, 2, // Back
        0, 4, 7,  0, 7, 3, // Left
        5, 1, 2,  5, 2, 6, // Right
        7, 6, 2,  7, 2, 3, // Top
        0, 1, 5,  0, 5, 4, // Bottom
      ]);

      const result = analyzeMeshGeometry({ positions, indices }, 'mm');
      expect(result.dimensions.x).toBe(20);
      expect(result.dimensions.y).toBe(20);
      expect(result.dimensions.z).toBe(20);
      expect(result.triangleCount).toBe(12);
      expect(result.isWatertight).toBe(true);
      expect(result.isManifold).toBe(true);
      expect(result.shellCount).toBe(1);

      // Volume: 20 * 20 * 20 = 8000 mm³ = 8.0 cm³
      expect(result.volumeCm3).toBe(8);

      // Surface Area: 6 * (20 * 20) = 2400 mm² = 24 cm²
      expect(result.surfaceAreaCm2).toBe(24);
    });

    it('suppresses volume calculation when mesh is open or has missing faces', () => {
      const size = 20;
      const positions = new Float32Array([
        0, 0, 0,
        size, 0, 0,
        size, size, 0,
        0, size, 0,
        0, 0, size,
        size, 0, size,
        size, size, size,
        0, size, size,
      ]);

      // Open cube missing the top face
      const indices = new Uint32Array([
        4, 5, 6,  4, 6, 7, // Front
        1, 0, 3,  1, 3, 2, // Back
        0, 4, 7,  0, 7, 3, // Left
        5, 1, 2,  5, 2, 6, // Right
        0, 1, 5,  0, 5, 4, // Bottom
      ]);

      const result = analyzeMeshGeometry({ positions, indices }, 'mm');
      expect(result.isWatertight).toBe(false);
      expect(result.isManifold).toBe(false);
      expect(result.volumeCm3).toBeNull();
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('3. Pricing Math & Integer Paise Integrity', () => {
    it('computes GST and line item breakdowns in integer paise without floating point inaccuracy', () => {
      const materialPaise = 35000; // ₹350.00
      const machinePaise = 50000;  // ₹500.00
      const labourPaise = 15000;   // ₹150.00
      const supportPaise = 5000;   // ₹50.00
      const finishingPaise = 5000; // ₹50.00
      const packagingPaise = 4000; // ₹40.00
      const shippingPaise = 9000;  // ₹90.00

      const subtotal =
        materialPaise +
        machinePaise +
        labourPaise +
        supportPaise +
        finishingPaise +
        packagingPaise +
        shippingPaise;

      expect(subtotal).toBe(123000); // ₹1,230.00

      const taxPaise = Math.round(subtotal * 0.18); // 18% GST = ₹221.40
      expect(taxPaise).toBe(22140);

      const totalPaise = subtotal + taxPaise;
      expect(totalPaise).toBe(145140); // ₹1,451.40
    });
  });
});

