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
        point: '権限制御が標準化され、AI連携の監査運用が実装可能になった。',
        marketLearning: '市場では導入検討が機能比較から統制設計込みへ移行している。',
        consultUse: '金融クライアントの提案資料に監査要件テンプレートとして組み込む。'
      }
    ]
  });

  const sections = blocks.filter((b) => b.type === 'section');
  assert.ok(sections.some((b) => b.text.text.includes('ニュース1： <https://example.com|Test Title>')));
  assert.ok(sections.some((b) => b.text.text.includes('*🛡️ 確度:* [高] | *📂 カテゴリ:* セキュリティ')));
  assert.ok(sections.some((b) => b.text.text.includes('*📌 要点:* 権限制御が標準化され、AI連携の監査運用が実装可能になった。')));
  assert.ok(sections.some((b) => b.text.text.includes('*🌍 市場の学び（トレンド）:* 市場では導入検討が機能比較から統制設計込みへ移行している。')));
  assert.ok(sections.some((b) => b.text.text.includes('*🚀 コンサル活用（具体策）:* 金融クライアントの提案資料に監査要件テンプレートとして組み込む。')));
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
