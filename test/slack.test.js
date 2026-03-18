const test = require('node:test');
const assert = require('node:assert/strict');

const { buildConceptBlocks, buildNewsBlocks } = require('../src/slack');

test('buildNewsBlocks creates fallback block when empty', () => {
  const blocks = buildNewsBlocks(null);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].type, 'section');
  assert.ok(blocks[0].text.text.includes('生成AI PMデイリーブリーフ'));
});

test('buildNewsBlocks includes PM summary sections', () => {
  const blocks = buildNewsBlocks({
    theme: '今日は「AI導入時のリスク管理」が中心論点です。',
    learnings: ['リスク評価を先に整理する'],
    actions: ['提案書に統制観点を入れる'],
    proposalInsights: ['安全に導入できる条件まで示す'],
    references: [
      {
        title: 'Test Title',
        link: 'https://example.com',
        source: 'Example',
        topic: 'セキュリティ'
      }
    ]
  });

  const sections = blocks.filter((b) => b.type === 'section');
  assert.ok(sections.some((b) => b.text.text.includes('AI導入時のリスク管理')));
  assert.ok(sections.some((b) => b.text.text.includes('今日学ぶこと')));
  assert.ok(sections.some((b) => b.text.text.includes('仕事での活用')));
  assert.ok(sections.some((b) => b.text.text.includes('提案観点')));
  assert.ok(sections.some((b) => b.text.text.includes('参考ニュース')));
  assert.ok(sections.some((b) => b.text.text.includes('https://example.com')));
});

test('buildConceptBlocks includes concept learning sections', () => {
  const blocks = buildConceptBlocks([
    {
      title: 'スクレイピング',
      domain: 'AI / Data',
      popularity: '高頻度',
      description: 'Webページから必要なテキストや構造化データを取得する処理。',
      importance: '重要性',
      workUse: '仕事での活用',
      related: '関連概念',
      clientTalk: '説明例'
    },
    {
      title: 'RAG',
      domain: 'AI / Retrieval',
      popularity: '最重要',
      description: '外部知識を検索してから大模型に渡す構成。',
      importance: '重要性',
      workUse: '仕事での活用',
      related: '関連概念',
      clientTalk: '説明例'
    }
  ]);

  const sections = blocks.filter((b) => b.type === 'section');
  assert.ok(sections.some((b) => b.text.text.includes('今日の狙い')));
  assert.ok(sections.some((b) => b.text.text.includes('概念 1')));
  assert.ok(sections.some((b) => b.text.text.includes('概念 2')));
  assert.ok(sections.some((b) => b.text.text.includes('スクレイピング')));
  assert.ok(sections.some((b) => b.text.text.includes('RAG')));
});
