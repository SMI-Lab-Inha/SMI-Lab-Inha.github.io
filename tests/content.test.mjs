import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { citationAuthors, citationKey, pageRange } from '../src/lib/citations.js';
import { isRecruitmentOpen } from '../src/lib/recruitment.js';

const papers = JSON.parse(fs.readFileSync(new URL('../src/data/publications.json', import.meta.url)));

test('citation names preserve surnames, initials, hyphens and all authors', () => {
  assert.deepEqual(citationAuthors('Seo JH, Cerik BC, Cho S-R'), [
    { family: 'Seo', given: 'J. H.' },
    { family: 'Cerik', given: 'B. C.' },
    { family: 'Cho', given: 'S.-R.' },
  ]);
  for (const paper of papers) assert.equal(citationAuthors(paper.authors).length, paper.authors.split(', ').length);
});

test('citation keys distinguish the previously colliding papers', () => {
  const keys = papers.map(citationKey);
  assert.equal(new Set(keys).size, papers.length);
  assert.equal(citationKey(papers[0]), citationKey({ ...papers[0], title: 'Edited display title' }));
});

test('page ranges remain distinct from article numbers', () => {
  assert.deepEqual(pageRange('558–566'), { start: '558', end: '566' });
  assert.deepEqual(pageRange('128332'), { start: '128332', end: '' });
});

test('recruitment respects closed state and the inclusive UTC deadline', () => {
  const record = { active: true, openUntil: '2026-09-27' };
  assert.equal(isRecruitmentOpen(record, new Date('2026-09-27T23:59:59Z')), true);
  assert.equal(isRecruitmentOpen(record, new Date('2026-09-28T00:00:00Z')), false);
  assert.equal(isRecruitmentOpen({ ...record, active: false }), false);
  assert.equal(isRecruitmentOpen({ active: true, openUntil: '' }), true);
});
