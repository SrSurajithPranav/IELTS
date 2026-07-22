import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTrainingBankData } from '../src/data/questionBankUtils.js';

test('normalizeTrainingBankData flattens object-based training bank payloads', () => {
  const payload = {
    reading: [{ id: 1, question: 'Q1' }],
    listening: [{ id: 2, question: 'Q2' }],
  };

  const result = normalizeTrainingBankData(payload);

  assert.equal(result.length, 2);
  assert.deepEqual(result.map((item) => item.id), [1, 2]);
});
