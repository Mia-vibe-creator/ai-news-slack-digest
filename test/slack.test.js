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
    items: [
      {
        title: 'Test Title',
        link: 'https://example.com',
        source: 'Example',
        topic: 'セキュリティ',
        confidenceLevel: '高',
        confidenceReason: '一次情報で確認可能',
        summary: 'これは要約です。',
        learning: 'ここから学ぶべきことです。',
        pmUse: '提案や要件定義にこう使います。'
      }
    ]
  });

  const sections = blocks.filter((b) => b.type === 'section');
  assert.ok(sections.some((b) => b.text.text.includes('ニュース 1')));
  assert.ok(sections.some((b) => b.text.text.includes('情報確度: 高（一次情報で確認可能）')));
  assert.ok(sections.some((b) => b.text.text.includes('要約: これは要約です。')));
  assert.ok(sections.some((b) => b.text.text.includes('学び: ここから学ぶべきことです。')));
  assert.ok(sections.some((b) => b.text.text.includes('PM活用観点: 提案や要件定義にこう使います。')));
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
