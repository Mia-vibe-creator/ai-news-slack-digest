const test = require('node:test');
const assert = require('node:assert/strict');

const { buildNewsBlocks } = require('../src/slack');

test('buildNewsBlocks creates fallback block when empty', () => {
  const blocks = buildNewsBlocks([]);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'section');
});

test('buildNewsBlocks includes title and link', () => {
  const blocks = buildNewsBlocks([
    {
      title: 'Test Title',
      link: 'https://example.com',
      source: 'Example',
      pubDate: new Date('2026-02-20T00:00:00Z'),
      summary: 'Summary'
    }
  ]);

  const section = blocks.find((b) => b.type === 'section' && b.text && b.text.text.includes('Test Title'));
  assert.ok(section);
  assert.ok(section.text.text.includes('https://example.com'));
  assert.ok(section.text.text.includes('1.'));
  assert.ok(section.text.text.includes('出典: Example'));
  assert.ok(section.text.text.includes('要約: Summary'));
});
