import { describe, it, expect } from 'vitest';
import {
  analyzeMeshGeometry,
  convertDimensions,
  convertVolume,
} from '../geometry';

describe('3D CAD Geometry & Mesh Topology Engine', () => {
  // Helper to generate a watertight box mesh (12 triangles, 8 vertices)
  function createBoxGeometry(sizeX = 10, sizeY = 10, sizeZ = 10) {
    // 8 vertices
    const vertices = new Float32Array([
      0, 0, 0, // 0
      sizeX, 0, 0, // 1
      sizeX, sizeY, 0, // 2
      0, sizeY, 0, // 3
      0, 0, sizeZ, // 4
      sizeX, 0, sizeZ, // 5
      sizeX, sizeY, sizeZ, // 6
      0, sizeY, sizeZ, // 7
    ]);

    // 12 triangles (2 per face, 6 faces) with outward normals
    const indices = new Uint32Array([
      // Front (Z = sizeZ)
      4, 5, 6,  4, 6, 7,
      // Back (Z = 0)
      1, 0, 3,  1, 3, 2,
      // Left (X = 0)
      0, 4, 7,  0, 7, 3,
      // Right (X = sizeX)
      5, 1, 2,  5, 2, 6,
      // Top (Y = sizeY)
      7, 6, 2,  7, 2, 3,
      // Bottom (Y = 0)
      0, 1, 5,  0, 5, 4,
    ]);

    return { positions: vertices, indices };
  }

  it('correctly calculates dimensions, volume, and area for a closed 10x10x10 mm watertight cube', () => {
    const box = createBoxGeometry(10, 10, 10);
    const result = analyzeMeshGeometry(box, 'mm');

    expect(result.dimensions.x).toBe(10);
    expect(result.dimensions.y).toBe(10);
    expect(result.dimensions.z).toBe(10);
    expect(result.triangleCount).toBe(12);
    expect(result.isWatertight).toBe(true);
    expect(result.isManifold).toBe(true);
    expect(result.shellCount).toBe(1);
    expect(result.degenerateTriangles).toBe(0);
    expect(result.warnings.length).toBe(0);

    // Surface Area: 6 faces * (10 * 10) = 600 mm² = 6 cm²
    expect(result.surfaceAreaCm2).toBe(6);

    // Solid Volume: 10 * 10 * 10 = 1000 mm³ = 1 cm³
    expect(result.volumeCm3).toBe(1);
  });

  it('correctly scales dimensions and volume when unit is inches', () => {
    // 1 x 1 x 1 inch cube
    const box = createBoxGeometry(1, 1, 1);
    const result = analyzeMeshGeometry(box, 'inch');

    expect(result.dimensions.x).toBeCloseTo(25.4, 1);
    expect(result.dimensions.y).toBeCloseTo(25.4, 1);
    expect(result.dimensions.z).toBeCloseTo(25.4, 1);

    // 1 cubic inch = 16.387 cm³
    expect(result.volumeCm3).toBeCloseTo(16.39, 1);
  });

  it('strictly suppresses solid volume and raises warnings for an open non-watertight mesh', () => {
    const box = createBoxGeometry(10, 10, 10);
    // Remove the last 2 triangles (open bottom)
    const openIndices = box.indices.slice(0, 30); // 10 triangles instead of 12

    const result = analyzeMeshGeometry({ positions: box.positions, indices: openIndices }, 'mm');

    expect(result.isWatertight).toBe(false);
    expect(result.isManifold).toBe(false);
    // Volume MUST be null when open
    expect(result.volumeCm3).toBeNull();
    expect(result.warnings.some((w) => w.includes('Open mesh detected'))).toBe(true);
  });

  it('detects and counts degenerate zero-area triangles', () => {
    // Triangle with identical vertices
    const positions = new Float32Array([
      0, 0, 0,
      0, 0, 0,
      10, 10, 10,
    ]);
    const indices = new Uint32Array([0, 1, 2]);

    const result = analyzeMeshGeometry({ positions, indices }, 'mm');
    expect(result.degenerateTriangles).toBe(1);
    expect(result.warnings.some((w) => w.includes('degenerate triangles'))).toBe(true);
  });

  it('correctly handles raw unindexed meshes (standard STL format) via vertex welding', () => {
    const box = createBoxGeometry(10, 10, 10);
    // Expand indexed geometry into raw unindexed triangles (36 vertices)
    const unindexedPositions = new Float32Array(box.indices.length * 3);
    for (let i = 0; i < box.indices.length; i++) {
      const idx = box.indices[i];
      unindexedPositions[i * 3] = box.positions[idx * 3];
      unindexedPositions[i * 3 + 1] = box.positions[idx * 3 + 1];
      unindexedPositions[i * 3 + 2] = box.positions[idx * 3 + 2];
    }

    const result = analyzeMeshGeometry({ positions: unindexedPositions }, 'mm');

    expect(result.triangleCount).toBe(12);
    expect(result.isWatertight).toBe(true);
    expect(result.isManifold).toBe(true);
    expect(result.volumeCm3).toBe(1); // 1 cm³
    expect(result.surfaceAreaCm2).toBe(6); // 6 cm²
    expect(result.shellCount).toBe(1);
  });

  it('correctly converts dimensions between mm, cm, and inch without distorting underlying coordinates', () => {
    // Model from user test: 54.75 x 21.5 x 21.5 mm
    const baseDims = { x: 54.75, y: 21.5, z: 21.5 };

    // MM
    const mmDims = convertDimensions(baseDims, 'mm');
    expect(mmDims.x).toBe(54.75);
    expect(mmDims.y).toBe(21.5);
    expect(mmDims.z).toBe(21.5);
    expect(mmDims.unitLabel).toBe('mm');

    // CM (divides by 10)
    const cmDims = convertDimensions(baseDims, 'cm');
    expect(cmDims.x).toBe(5.48);
    expect(cmDims.y).toBe(2.15);
    expect(cmDims.z).toBe(2.15);
    expect(cmDims.unitLabel).toBe('cm');

    // INCH (divides by 25.4)
    const inDims = convertDimensions(baseDims, 'inch');
    expect(inDims.x).toBe(2.16);
    expect(inDims.y).toBe(0.85);
    expect(inDims.z).toBe(0.85);
    expect(inDims.unitLabel).toBe('in');
  });

  it('correctly converts volume between cm³ and in³ for display', () => {
    const volCm3 = 8.76;

    // MM and CM display as cm³
    expect(convertVolume(volCm3, 'mm').label).toBe('8.76 cm³');
    expect(convertVolume(volCm3, 'cm').label).toBe('8.76 cm³');

    // INCH displays with in³
    const inVol = convertVolume(volCm3, 'inch');
    expect(inVol.value).toBe(0.53);
    expect(inVol.label).toContain('0.53 in³');
    expect(inVol.label).toContain('8.76 cm³');

    // Non-solid returns Non-solid
    expect(convertVolume(null, 'mm').label).toBe('Non-solid');
  });
});

