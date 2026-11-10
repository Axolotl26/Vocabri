/**
 * Tests for Cloud Merge Pure Logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  cloudParse,
  sanitizeCloudObject,
  cloudNum,
  dayKeyNum,
  mergeCardRecord,
  mergeStageMaps,
  mergeExamResult,
  mergeCustomWords,
  mergeCustomCats,
  mergeCooldownState,
  mergeProgressData,
  cloudDataEqual
} from '../src/core/merge.js';

describe('Cloud Merge Core Functions', () => {
  describe('cloudParse', () => {
    it('parses valid JSON', () => {
      expect(cloudParse('{"a":1}', null)).toEqual({ a: 1 });
    });

    it('returns object as-is', () => {
      expect(cloudParse({ a: 1 }, null)).toEqual({ a: 1 });
    });

    it('returns fallback for invalid JSON', () => {
      expect(cloudParse('invalid', { b: 2 })).toEqual({ b: 2 });
    });

    it('returns fallback for null/undefined', () => {
      expect(cloudParse(null, { c: 3 })).toEqual({ c: 3 });
      expect(cloudParse(undefined, { c: 3 })).toEqual({ c: 3 });
    });
  });

  describe('sanitizeCloudObject', () => {
    it('removes undefined and functions', () => {
      const input = { a: 1, b: undefined, c: () => {}, d: 'hello' };
      expect(sanitizeCloudObject(input)).toEqual({ a: 1, d: 'hello' });
    });

    it('returns empty for null/undefined', () => {
      expect(sanitizeCloudObject(null)).toEqual({});
      expect(sanitizeCloudObject(undefined)).toEqual({});
    });

    it('returns empty for non-object', () => {
      expect(sanitizeCloudObject('string')).toEqual({});
      expect(sanitizeCloudObject(123)).toEqual({});
    });
  });

  describe('cloudNum', () => {
    it('parses string numbers', () => {
      expect(cloudNum('42')).toBe(42);
      expect(cloudNum('0')).toBe(0);
    });

    it('returns number as-is', () => {
      expect(cloudNum(42)).toBe(42);
    });

    it('returns 0 for invalid', () => {
      expect(cloudNum('abc')).toBe(0);
      expect(cloudNum(null)).toBe(0);
      expect(cloudNum(undefined)).toBe(0);
    });
  });

  describe('dayKeyNum', () => {
    it('converts YYYY-MM-DD to number', () => {
      expect(dayKeyNum('2024-01-15')).toBe(20240115);
      expect(dayKeyNum('2024-12-31')).toBe(20241231);
    });

    it('returns -1 for null/undefined', () => {
      expect(dayKeyNum(null)).toBe(-1);
      expect(dayKeyNum(undefined)).toBe(-1);
    });
  });

  describe('mergeCardRecord', () => {
    it('keeps more recent timestamp', () => {
      const older = JSON.stringify({ t: 1000, lvl: 2 });
      const newer = JSON.stringify({ t: 2000, lvl: 3 });
      expect(mergeCardRecord(older, newer)).toBe(newer);
      expect(mergeCardRecord(newer, older)).toBe(newer);
    });

    it('returns b if a is invalid', () => {
      expect(mergeCardRecord('invalid', '{"t":1000}')).toBe('{"t":1000}');
    });

    it('returns a if b is invalid', () => {
      expect(mergeCardRecord('{"t":1000}', 'invalid')).toBe('{"t":1000}');
    });
  });

  describe('mergeStageMaps', () => {
    it('takes max for each category', () => {
      const a = JSON.stringify({ general: 5, travel: 3 });
      const b = JSON.stringify({ general: 2, travel: 7, business: 1 });
      const result = JSON.parse(mergeStageMaps(a, b));
      expect(result.general).toBe(5);
      expect(result.travel).toBe(7);
      expect(result.business).toBe(1);
    });

    it('handles invalid JSON', () => {
      expect(JSON.parse(mergeStageMaps('invalid', '{"a":1}'))).toEqual({ a: 1 });
    });
  });

  describe('mergeExamResult', () => {
    it('keeps higher stars', () => {
      const a = JSON.stringify({ stars: 2, score: 80 });
      const b = JSON.stringify({ stars: 3, score: 90 });
      expect(mergeExamResult(a, b)).toBe(b);
      expect(mergeExamResult(b, a)).toBe(b);
    });

    it('handles invalid JSON', () => {
      expect(mergeExamResult('invalid', '{"stars":1}')).toBe('{"stars":1}');
    });
  });

  describe('mergeCustomWords', () => {
    it('unions arrays by en|es key', () => {
      const a = JSON.stringify([{ en: 'hello', es: 'hola' }, { en: 'bye', es: 'adios' }]);
      const b = JSON.stringify([{ en: 'hello', es: 'hola' }, { en: 'thanks', es: 'gracias' }]);
      const result = JSON.parse(mergeCustomWords(a, b));
      expect(result.length).toBe(3);
      const keys = new Set(result.map(w => w.en + '|' + w.es));
      expect(keys.size).toBe(3);
    });

    it('handles invalid JSON', () => {
      expect(JSON.parse(mergeCustomWords('invalid', '[]'))).toEqual([]);
    });
  });

  describe('mergeCustomCats', () => {
    it('unions arrays case-insensitively', () => {
      const a = JSON.stringify(['General', 'Travel']);
      const b = JSON.stringify(['general', 'Business']);
      const result = JSON.parse(mergeCustomCats(a, b));
      expect(result.length).toBe(3);
      const lower = result.map(c => c.toLowerCase());
      expect(lower).toContain('general');
      expect(lower).toContain('travel');
      expect(lower).toContain('business');
    });
  });

  describe('mergeCooldownState', () => {
    it('keeps more recent timestamp', () => {
      const a = JSON.stringify({ ultimoTimestamp: 1000 });
      const b = JSON.stringify({ ultimoTimestamp: 2000 });
      expect(mergeCooldownState(a, b)).toBe(b);
    });
  });

  describe('mergeProgressData', () => {
    it('takes max for xp and time keys', () => {
      const local = { ci_xp_total: '100', ci_time_study: '50' };
      const cloud = { ci_xp_total: '200', ci_time_study: '30' };
      const result = mergeProgressData(local, cloud);
      expect(result.ci_xp_total).toBe('200');
      expect(result.ci_time_study).toBe('50');
    });

    it('merges card records', () => {
      const local = { ci_master_card1: '{"t":1000}' };
      const cloud = { ci_master_card1: '{"t":2000}' };
      const result = mergeProgressData(local, cloud);
      expect(result.ci_master_card1).toBe('{"t":2000}');
    });

    it('merges stage maps', () => {
      const local = { vocabri_unlocked_stage: '{"general":3}' };
      const cloud = { vocabri_unlocked_stage: '{"general":5}' };
      const result = mergeProgressData(local, cloud);
      expect(result.vocabri_unlocked_stage).toContain('5');
    });

    it('merges exam results', () => {
      const local = { vocabri_exam_1: '{"stars":2}' };
      const cloud = { vocabri_exam_1: '{"stars":3}' };
      const result = mergeProgressData(local, cloud);
      expect(result.vocabri_exam_1).toContain('3');
    });

    it('merges custom words', () => {
      const local = { ci_custom_words: '[{"en":"a","es":"b"}]' };
      const cloud = { ci_custom_words: '[{"en":"c","es":"d"}]' };
      const result = mergeProgressData(local, cloud);
      const parsed = JSON.parse(result.ci_custom_words);
      expect(parsed.length).toBe(2);
    });

    it('merges custom cats', () => {
      const local = { ci_custom_cats: '["Cat1"]' };
      const cloud = { ci_custom_cats: '["Cat2"]' };
      const result = mergeProgressData(local, cloud);
      const parsed = JSON.parse(result.ci_custom_cats);
      expect(parsed.length).toBe(2);
    });

    it('merges cooldown state', () => {
      const local = { vocabriProgress: '{"ultimoTimestamp":1000}' };
      const cloud = { vocabriProgress: '{"ultimoTimestamp":2000}' };
      const result = mergeProgressData(local, cloud);
      expect(result.vocabriProgress).toContain('2000');
    });

    it('keeps local for flip coach if either is 1', () => {
      expect(mergeProgressData({ vocabri_flip_coach_done: '1' }, { vocabri_flip_coach_done: '0' }).vocabri_flip_coach_done).toBe('1');
      expect(mergeProgressData({ vocabri_flip_coach_done: '0' }, { vocabri_flip_coach_done: '1' }).vocabri_flip_coach_done).toBe('1');
    });

    it('keeps local for other keys (preferences)', () => {
      const local = { ci_theme: 'dark' };
      const cloud = { ci_theme: 'light' };
      const result = mergeProgressData(local, cloud);
      expect(result.ci_theme).toBe('dark');
    });

    it('handles daily goal counters from most recent study day', () => {
      const local = {
        vocabri_last_study_date: '2024-01-15',
        vocabri_xp_today: '100',
        vocabri_goal_celebrated_date: '2024-01-15'
      };
      const cloud = {
        vocabri_last_study_date: '2024-01-14',
        vocabri_xp_today: '200',
        vocabri_goal_celebrated_date: '2024-01-14'
      };
      const result = mergeProgressData(local, cloud);
      expect(result.vocabri_last_study_date).toBe('2024-01-15');
      expect(result.vocabri_xp_today).toBe('100');
    });

    it('takes max xp_today if same study date', () => {
      const local = {
        vocabri_last_study_date: '2024-01-15',
        vocabri_xp_today: '100'
      };
      const cloud = {
        vocabri_last_study_date: '2024-01-15',
        vocabri_xp_today: '200'
      };
      const result = mergeProgressData(local, cloud);
      expect(result.vocabri_xp_today).toBe('200');
    });
  });

  describe('cloudDataEqual', () => {
    it('returns true for identical objects', () => {
      expect(cloudDataEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns false for different values', () => {
      expect(cloudDataEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false for different keys', () => {
      expect(cloudDataEqual({ a: 1 }, { b: 1 })).toBe(false);
    });
  });
});