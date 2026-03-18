const CONCEPTS = [
  {
    key: 'scraping',
    title: 'スクレイピング',
    domain: 'AI / Data',
    popularity: '高頻度',
    description: 'Webページから必要なテキストや構造化データを取得する処理。',
    importance: 'RAG用の外部情報収集や競合調査で、データ取得方法を判断する基礎になる。',
    workUse: '提案時に「どのデータを、どこから、どこまで自動取得できるか」を整理する時に使う。',
    related: 'クローリングは巡回、スクレイピングは取得。',
    clientTalk: 'AI活用の前段には、必要データを安定して取れる設計が必要です。'
  },
  {
    key: 'crawling',
    title: 'クローリング',
    domain: 'AI / Data',
    popularity: '高頻度',
    description: 'Web上のページを順番に巡回し、URLやコンテンツを収集する処理。',
    importance: '情報収集基盤や更新監視の設計に関わるため、RAGや競合調査で頻出する。',
    workUse: '対象範囲、更新頻度、取得ルールを要件化する時に使う。',
    related: 'クローリングで見つけて、スクレイピングで抜き出す。',
    clientTalk: '継続的に情報を取りに行く仕組みがないと、AIの知識は古くなります。'
  },
  {
    key: 'embedding',
    title: 'エンベディング',
    domain: 'AI / Retrieval',
    popularity: '最重要',
    description: '文章や単語を意味ベースで比較できる数値ベクトルに変換する技術。',
    importance: 'RAGや意味検索の土台で、回答精度に直結する。',
    workUse: 'FAQ検索、社内ナレッジ検索、類似事例探索の説明で使う。',
    related: 'キーワード検索は文字一致、エンベディングは意味の近さ。',
    clientTalk: '言い方が違っても、意味で近い情報を探せるようにする技術です。'
  },
  {
    key: 'vector-search',
    title: 'ベクトル検索',
    domain: 'AI / Retrieval',
    popularity: '最重要',
    description: 'エンベディング化したデータ同士の近さを使って関連情報を探す検索方式。',
    importance: 'RAGの検索品質を決める中核で、最近のAI検索で最も多用される。',
    workUse: 'キーワード検索では拾えない社内資料探索の仕組みを説明する時に使う。',
    related: 'エンベディングは表現、ベクトル検索はその表現を使った探索。',
    clientTalk: '単語一致ではなく意味の近さで資料を探す検索方式です。'
  },
  {
    key: 'rag',
    title: 'RAG',
    domain: 'AI / Retrieval',
    popularity: '最重要',
    description: '外部知識を検索してから大模型に渡し、回答精度を上げる構成。',
    importance: '企業の生成AI導入では最も一般的な実装パターン。',
    workUse: '社内文書QA、規程検索、ナレッジ活用の提案で中心概念になる。',
    related: 'Fine-tuningはモデル調整、RAGは外部知識の参照。',
    clientTalk: 'AIに社内資料を読ませるのではなく、必要な時に探して渡す構成です。'
  },
  {
    key: 'rerank',
    title: 'Rerank',
    domain: 'AI / Retrieval',
    popularity: '高頻度',
    description: '一度取得した候補を、関連性に基づいて再評価し並べ直す処理。',
    importance: 'RAGで「見つかるがズレる」問題の改善に有効。',
    workUse: '検索品質改善策として説明しやすく、PoC改善でよく登場する。',
    related: 'ベクトル検索は候補取得、Rerankは順位最適化。',
    clientTalk: 'まず広く拾い、その後本当に関連性の高い順に整え直します。'
  },
  {
    key: 'hybrid-search',
    title: 'ハイブリッド検索',
    domain: 'AI / Retrieval',
    popularity: '高頻度',
    description: 'キーワード検索とベクトル検索を組み合わせる検索方式。',
    importance: '企業データでは完全に意味検索だけに寄せると外すので、実務で採用されやすい。',
    workUse: '検索精度改善の設計比較や、本番化時の性能調整で使う。',
    related: 'ベクトル検索だけより、厳密語句と意味検索のバランスを取る。',
    clientTalk: '固有名詞は文字で、曖昧な意味はベクトルで拾う現実的な方式です。'
  },
  {
    key: 'grounding',
    title: 'Grounding',
    domain: 'AI / Retrieval',
    popularity: '高頻度',
    description: 'AIの回答を信頼できる根拠データに結び付ける考え方。',
    importance: '幻覚対策や説明可能性の観点で、企業導入の必須要件になりやすい。',
    workUse: '根拠表示や出典付き回答の設計を説明する時に使う。',
    related: 'RAGは構成、Groundingはその目的と品質要件。',
    clientTalk: 'AIに推測させるのではなく、根拠ある情報に基づいて答えさせる設計です。'
  },
  {
    key: 'prompt-injection',
    title: 'Prompt Injection',
    domain: 'AI / Security',
    popularity: '最重要',
    description: '入力の中に悪意ある指示を埋め込み、AIの振る舞いを不正に変える攻撃。',
    importance: '公開型AIやRAGで最も議論される安全リスクの一つ。',
    workUse: '外部入力、Web参照、添付ファイル処理のリスク説明に使う。',
    related: 'インジェクション検知は、この攻撃を見つける対策の一部。',
    clientTalk: 'AIに悪い指示を紛れ込ませて、本来のルールを破らせる攻撃です。'
  },
  {
    key: 'guardrails',
    title: 'AIガードレール',
    domain: 'AI / Governance',
    popularity: '最重要',
    description: '危険回答や不適切出力を防ぐための制御ルールと技術的仕組み。',
    importance: '企業の生成AI導入では、精度以上に安全運用の議論で頻出する。',
    workUse: '禁止出力、承認フロー、監査ログを含めた制御設計で使う。',
    related: 'プロンプト制御だけでなく、入力・出力・運用ルールまで含む。',
    clientTalk: '安全に使うためのルールと自動制御をまとめて設計する考え方です。'
  },
  {
    key: 'masking',
    title: 'マスキング処理',
    domain: 'AI / Security',
    popularity: '高頻度',
    description: '個人情報や機密情報を伏せ字・置換して扱う処理。',
    importance: 'データ保護や外部LLM利用の説明責任に直結する。',
    workUse: 'ログ保存や外部送信前の前処理設計で使う。',
    related: '匿名化よりも、可視制御や送信制御の文脈で使われやすい。',
    clientTalk: 'AIに渡す前に機密情報を隠すことで、安全に活用範囲を広げられます。'
  },
  {
    key: 'safety-eval',
    title: 'Safety Evaluation',
    domain: 'AI / Security',
    popularity: '高頻度',
    description: 'AIが安全基準を満たしているかを、攻撃や危険出力の観点で評価すること。',
    importance: '本番化前の安全確認で、最近の大手ベンダー資料でも頻出する。',
    workUse: 'PoCから本番へ移る際の評価観点や受け入れ基準の策定で使う。',
    related: 'Guardrailsを作った後、それが機能しているか検証するのがEvaluation。',
    clientTalk: '作って終わりではなく、安全に運用できるかを試験で確認する必要があります。'
  },
  {
    key: 'latency',
    title: 'レイテンシ',
    domain: 'AI / Performance',
    popularity: '最重要',
    description: 'リクエスト送信から結果返却までの遅延時間。',
    importance: 'AI機能のUXを大きく左右し、利用定着を阻害する主要因になりやすい。',
    workUse: '回答品質だけでなく待ち時間も要件化する時に使う。',
    related: '精度が高くても、遅すぎると業務では使われない。',
    clientTalk: '現場で使われるかどうかは、精度だけでなく待ち時間にも左右されます。'
  },
  {
    key: 'context-window',
    title: 'コンテキストウィンドウ',
    domain: 'AI / Model',
    popularity: '高頻度',
    description: 'モデルが一度に読み込める入力と履歴の上限。',
    importance: '長文資料処理や対話継続性の設計でよく問題になる。',
    workUse: '長文要約、議事録解析、RAG chunk設計の説明に使う。',
    related: '大量投入できても、必要情報が埋もれると精度は上がらない。',
    clientTalk: '一度に見られる情報量には上限があるので、入れ方の設計が必要です。'
  },
  {
    key: 'chunking',
    title: 'Chunking',
    domain: 'AI / Retrieval',
    popularity: '高頻度',
    description: '長文を検索や参照に適した単位に分割する処理。',
    importance: 'RAG品質に大きく影響し、実務でかなり頻繁に議論される。',
    workUse: '資料の分割粒度、見出し単位、表の扱いなどを決める時に使う。',
    related: '分割が荒すぎると精度低下、細かすぎると文脈が失われる。',
    clientTalk: '資料をちょうど良い大きさに切り分けることが、検索精度を左右します。'
  },
  {
    key: 'lora',
    title: 'LoRA',
    domain: 'AI / Model Tuning',
    popularity: '高頻度',
    description: '少量の追加パラメータで効率的にモデルを調整する手法。',
    importance: 'モデル調整コストを抑えつつ、業務向けに振る舞いを寄せたい時に使われる。',
    workUse: 'Fine-tuningが必要か、RAGで十分かの判断材料として使う。',
    related: 'RAGは知識追加、LoRAはモデル挙動の調整。',
    clientTalk: '全部作り替えず、必要な部分だけ効率よく学習させる方法です。'
  },
  {
    key: 'fine-tuning',
    title: 'Fine-tuning',
    domain: 'AI / Model Tuning',
    popularity: '高頻度',
    description: '既存モデルを追加データで再学習させ、特定業務向けに最適化すること。',
    importance: '最近はRAG優先が多いが、出力スタイル固定や専門タスクでは依然重要。',
    workUse: '独自スタイル生成、分類精度改善、社内専門文体対応の議論で使う。',
    related: 'LoRAはFine-tuningの効率化手法の一つ。',
    clientTalk: '特定業務に合わせてモデルの振る舞いそのものを調整する方法です。'
  },
  {
    key: 'agent',
    title: 'AI Agent',
    domain: 'AI / Application',
    popularity: '最重要',
    description: '目標達成のために複数ステップで判断し、ツールを使って行動するAIアプリ。',
    importance: '2026年時点で最も話題性が高く、提案でも頻繁に聞かれるテーマ。',
    workUse: '問い合わせ自動化、業務代行、データ取得・更新処理の提案で使う。',
    related: '単発チャットではなく、ツール利用と手順実行を伴う。',
    clientTalk: '答えるだけでなく、必要な操作まで進めるAIの形です。'
  },
  {
    key: 'tool-calling',
    title: 'Tool Calling',
    domain: 'AI / Application',
    popularity: '最重要',
    description: 'AIが外部APIや社内システムを呼び出して処理を実行する仕組み。',
    importance: 'Agent実装の中心で、最近のAIアプリ設計で非常に一般的。',
    workUse: '社内DB検索、CRM更新、承認申請など、業務実行型AIの説明に使う。',
    related: 'Agentは全体像、Tool Callingはその実行手段の一つ。',
    clientTalk: 'AIが答えるだけでなく、必要な社内操作までつなぐ仕組みです。'
  },
  {
    key: 'multimodal',
    title: 'マルチモーダル',
    domain: 'AI / Model',
    popularity: '高頻度',
    description: 'テキストだけでなく画像、音声、動画など複数形式を扱えるAI。',
    importance: '現場利用ではPDF、画面キャプチャ、音声議事録などを扱う需要が高い。',
    workUse: '画像付き報告書解析、コールセンター音声分析、UIレビュー支援などで使う。',
    related: '単一モーダルより入力の幅が広く、設計と評価観点も増える。',
    clientTalk: '文章だけでなく画像や音声も理解できるので、現場データを扱いやすくなります。'
  },
  {
    key: 'proxy',
    title: 'プロキシ',
    domain: 'IT / Network',
    popularity: '高頻度',
    description: 'クライアントとサーバの間に立ち、通信を中継・制御する仕組み。',
    importance: '企業環境では外部AI接続の制御、監査、IP制限対応でよく出る。',
    workUse: '社内ネットワーク制約のあるクライアント向け接続方式の説明に使う。',
    related: 'API GatewayやFirewallと役割が近いが、通信の代理・中継が中心。',
    clientTalk: 'AI接続を直接開けず、管理された経路を通すための仕組みです。'
  },
  {
    key: 'clustering',
    title: 'クラスタリング',
    domain: 'IT / Analytics',
    popularity: '高頻度',
    description: '似た特徴を持つデータを自動的にグループ分けする手法。',
    importance: '問い合わせ分析や課題整理で、AI導入テーマの発見に役立つ。',
    workUse: 'VOC分析、ユースケース棚卸し、課題マップ作成で使う。',
    related: '分類は正解ラベルあり、クラスタリングはラベルなし。',
    clientTalk: '似た課題をまとめることで、優先テーマを見つけやすくします。'
  },
  {
    key: 'vitals',
    title: 'バイタル',
    domain: 'IT / Operations',
    popularity: '高頻度',
    description: 'システムの健康状態を示す重要指標。応答速度、エラー率、利用率などを含む。',
    importance: 'AIは導入後の監視設計が必要で、運用の会話で頻出する。',
    workUse: '本番運用のKPI、SLA、アラート設計を決める時に使う。',
    related: '単なるアクセス数ではなく、安定性と品質の健康指標。',
    clientTalk: '導入後に安定して使えているかを見る健康診断のような指標です。'
  },
  {
    key: 'sorting',
    title: 'ソート',
    domain: 'IT / Retrieval',
    popularity: '中頻度',
    description: 'データを一定のルールに従って並び替える処理。',
    importance: '検索結果や案件一覧の見せ方で、意思決定のしやすさが変わる。',
    workUse: 'FAQ表示順、案件優先度、検索結果の並び替えルールの設計で使う。',
    related: 'Rerankは関連性で再評価、ソートはルールに基づく並び替え。',
    clientTalk: '情報は同じでも、並び順を変えるだけで使いやすさは大きく変わります。'
  },
  {
    key: 'information-architecture',
    title: 'Information Architecture',
    domain: 'UIUX',
    popularity: '高頻度',
    description: '情報の分類、構造、導線を整理して、わかりやすく設計する考え方。',
    importance: 'AI機能は精度だけでなく、どこにどう見せるかで利用率が決まる。',
    workUse: 'AIチャット導線、FAQ構造、管理画面メニュー設計で使う。',
    related: 'UIデザインより上位の情報構造の話。',
    clientTalk: 'AI機能を置くだけでなく、必要な人が必要な場面で見つけられる構造が重要です。'
  },
  {
    key: 'user-flow',
    title: 'User Flow',
    domain: 'UIUX',
    popularity: '高頻度',
    description: 'ユーザーが目的を達成するまでの画面・行動の流れ。',
    importance: 'AI機能は単体より、業務フローにどう組み込むかが重要。',
    workUse: '問い合わせ対応、文書作成支援、レビュー補助の導線設計で使う。',
    related: '画面単体ではなく、前後の行動を含めた体験設計。',
    clientTalk: 'AIを置くだけではなく、業務の流れの中で自然に使える設計が必要です。'
  },
  {
    key: 'accessibility',
    title: 'Accessibility',
    domain: 'UIUX',
    popularity: '高頻度',
    description: '多様な利用者が使えるようにする設計や実装の考え方。',
    importance: 'AIプロダクトでも公共性や社内展開を考えると無視しにくい。',
    workUse: '読み上げ対応、色コントラスト、入力支援、音声UI検討で使う。',
    related: '使いやすさ全般よりも、利用制約を越えて使えるかに焦点を当てる。',
    clientTalk: '誰でも使える設計にすることで、導入効果の取りこぼしを減らせます。'
  },
  {
    key: 'onboarding',
    title: 'Onboarding',
    domain: 'UIUX',
    popularity: '高頻度',
    description: '初回利用者が迷わず価値を理解し、使い始められるようにする設計。',
    importance: 'AI機能は最初の体験で離脱しやすく、定着率に直結する。',
    workUse: '初回チュートリアル、サンプル質問、使い方ガイドの設計で使う。',
    related: 'ヘルプ表示とは違い、最初の成功体験まで導くのが目的。',
    clientTalk: '使い方を教えるより、最初に成功体験を作る設計が重要です。'
  },
  {
    key: 'heuristic-evaluation',
    title: 'Heuristic Evaluation',
    domain: 'UIUX',
    popularity: '中頻度',
    description: '経験則に基づいてUIの問題点を点検するレビュー手法。',
    importance: 'AI画面の使いにくさを、開発前後で素早く見つけるのに有効。',
    workUse: 'PoCのUX診断、操作迷い、フィードバック不足の洗い出しで使う。',
    related: 'ユーザーテストより軽量で、専門観点で素早く点検する。',
    clientTalk: '実際の利用前に、UIの分かりにくさを専門観点で先回りして見つける方法です。'
  },
  {
    key: 'design-tokens',
    title: 'Design Token',
    domain: 'UIUX',
    popularity: '中頻度',
    description: '色、余白、フォントなどのデザイン値を再利用可能な変数として管理する仕組み。',
    importance: 'AI機能を既存プロダクトに自然に載せる時、見た目の一貫性に役立つ。',
    workUse: '新機能追加時に既存デザインシステムへ合わせる議論で使う。',
    related: 'UIコンポーネントより下位の設計単位。',
    clientTalk: '新しいAI画面も、既存サービスと違和感なく統一するための仕組みです。'
  }
];

function getConceptIndex(date = new Date()) {
  const start = Date.UTC(2026, 0, 1);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const diffDays = Math.floor((today - start) / (24 * 60 * 60 * 1000));
  return ((diffDays * 2) % CONCEPTS.length + CONCEPTS.length) % CONCEPTS.length;
}

function getDailyConcepts(date = new Date()) {
  const firstIndex = getConceptIndex(date);
  const secondIndex = (firstIndex + 1) % CONCEPTS.length;
  return [CONCEPTS[firstIndex], CONCEPTS[secondIndex]];
}

module.exports = {
  getDailyConcepts
};
