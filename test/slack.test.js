const test = require('node:test');
const assert = require('node:assert/strict');

const { buildNewsBlocks } = require('../src/slack');

test('buildNewsBlocks creates fallback block when empty', () => {
  const blocks = buildNewsBlocks([]);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'section');
  assert.ok(blocks[0].text.text.includes('生成AI PMデイリーブリーフ'));
});

test('buildNewsBlocks includes PM summary sections', () => {
  const blocks = buildNewsBlocks([
    {
      title: 'Test Title',
      link: 'https://example.com',
      source: 'Example',
      pubDate: new Date('2026-02-20T00:00:00Z'),
      summary: 'Summary',
      topic: 'セキュリティ',
      insight: '提案観点: 導入時のリスク評価とガードレール設計に直結',
      learn: '学び: 生成AI導入時のリスクと対策パターンを把握',
      action: '活用: 監査対応・データ保護の提案資料に反映'
    }
  ]);

  const sections = blocks.filter((b) => b.type === 'section');
  assert.ok(sections.some((b) => b.text.text.includes('今日学ぶこと')));
  assert.ok(sections.some((b) => b.text.text.includes('仕事での活用')));
  assert.ok(sections.some((b) => b.text.text.includes('提案観点')));
  assert.ok(sections.some((b) => b.text.text.includes('参考ニュース')));
  assert.ok(sections.some((b) => b.text.text.includes('https://example.com')));
});
