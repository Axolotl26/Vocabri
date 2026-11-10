/**
 * Tests for XP/Level Pure Logic
 */

import { describe, it, expect } from 'vitest';
import {
  xpForLevel,
  levelFromXp,
  xpIntoLevel,
  cumulativeXpForLevel,
  levelProgressRatio,
  formatNumber
} from '../src/core/xp.js';

describe('XP/Level Core Functions', () => {
  describe('xpForLevel', () => {
    it('level 1 = 100 XP', () => {
      expect(xpForLevel(1)).toBe(100);
    });

    it('level 2 ≈ 246 XP', () => {
      expect(xpForLevel(2)).toBe(246);
    });

    it('level 3 ≈ 417 XP', () => {
      expect(xpForLevel(3)).toBe(417);
    });

    it('level 4 ≈ 606 XP', () => {
      expect(xpForLevel(4)).toBe(606);
    });

    it('level 5 ≈ 810 XP', () => {
      expect(xpForLevel(5)).toBe(810);
    });

    it('level 10 ≈ 1995 XP', () => {
      expect(xpForLevel(10)).toBe(1995);
    });

    it('level 20 ≈ 4913 XP', () => {
      expect(xpForLevel(20)).toBe(4913);
    });

    it('increases monotonically', () => {
      let prev = 0;
      for (let i = 1; i <= 50; i++) {
        const curr = xpForLevel(i);
        expect(curr).toBeGreaterThan(prev);
        prev = curr;
      }
    });
  });

  describe('levelFromXp', () => {
    it('0 XP = level 1', () => {
      expect(levelFromXp(0)).toBe(1);
    });

    it('99 XP = level 1', () => {
      expect(levelFromXp(99)).toBe(1);
    });

    it('100 XP = level 2', () => {
      expect(levelFromXp(100)).toBe(2);
    });

    it('100 + 246 = 346 XP = level 3', () => {
      expect(levelFromXp(346)).toBe(3);
    });

    it('346 + 417 = 763 XP = level 4', () => {
      expect(levelFromXp(763)).toBe(4);
    });

    it('cumulative to level 5 ≈ 1369 XP', () => {
      const cumulative = 100 + 246 + 417 + 606; // = 1369
      expect(levelFromXp(cumulative)).toBe(5);
      expect(levelFromXp(cumulative - 1)).toBe(4);
    });

    it('high XP returns correct level', () => {
      expect(levelFromXp(10000)).toBeGreaterThan(10);
    });
  });

  describe('xpIntoLevel', () => {
    it('0 XP = 0 into level', () => {
      expect(xpIntoLevel(0)).toBe(0);
    });

    it('99 XP = 99 into level 1', () => {
      expect(xpIntoLevel(99)).toBe(99);
    });

    it('100 XP = 0 into level 2', () => {
      expect(xpIntoLevel(100)).toBe(0);
    });

    it('150 XP = 50 into level 2', () => {
      expect(xpIntoLevel(150)).toBe(50);
    });

    it('346 XP = 0 into level 3', () => {
      expect(xpIntoLevel(346)).toBe(0);
    });

    it('400 XP = 54 into level 3', () => {
      expect(xpIntoLevel(400)).toBe(54);
    });
  });

  describe('cumulativeXpForLevel', () => {
    it('level 1 = 0 cumulative', () => {
      expect(cumulativeXpForLevel(1)).toBe(0);
    });

    it('level 2 = 100 cumulative', () => {
      expect(cumulativeXpForLevel(2)).toBe(100);
    });

    it('level 3 = 346 cumulative', () => {
      expect(cumulativeXpForLevel(3)).toBe(346);
    });

    it('level 4 = 763 cumulative', () => {
      expect(cumulativeXpForLevel(4)).toBe(763);
    });

    it('level 5 = 1369 cumulative', () => {
      expect(cumulativeXpForLevel(5)).toBe(1369);
    });
  });

  describe('levelProgressRatio', () => {
    it('0 XP = 0 progress', () => {
      expect(levelProgressRatio(0)).toBe(0);
    });

    it('50 XP in level 1 = 0.5 progress', () => {
      expect(levelProgressRatio(50)).toBeCloseTo(0.5, 2);
    });

    it('100 XP = 0 progress (start of level 2)', () => {
      expect(levelProgressRatio(100)).toBe(0);
    });

    it('middle of level = ~0.5', () => {
      const level2Start = 100;
      const level2Xp = xpForLevel(2); // 246
      const mid = level2Start + level2Xp / 2;
      expect(levelProgressRatio(mid)).toBeCloseTo(0.5, 1);
    });
  });

  describe('formatNumber', () => {
    it('formats small numbers as-is', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });

    it('formats thousands with k', () => {
      expect(formatNumber(1000)).toBe('1.0k');
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(9999)).toBe('10.0k');
      expect(formatNumber(12345)).toBe('12.3k');
    });

    it('formats millions with M', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(12345678)).toBe('12.3M');
    });
  });
});