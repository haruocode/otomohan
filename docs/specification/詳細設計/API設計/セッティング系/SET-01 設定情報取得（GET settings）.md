# SET-01 設定情報取得（GET /settings）

この API は、クライアントアプリの「設定画面（C-04）」に必要な情報（通知設定、利用規約リンク、プライバシーポリシーリンク、バージョン情報など）を**一括で返す統合エンドポイント** です。

アプリ起動直後や設定画面表示時に呼ばれる重要な API となります。

---

# 1. API 概要

| 項目           | 内容                                     |
| -------------- | ---------------------------------------- |
| API ID         | **SET-01**                               |
| メソッド       | GET                                      |
| エンドポイント | `/settings`                              |
| 認証           | 任意（※MVP ではユーザー認証後のみで OK） |
| 対象画面       | C-04（設定画面）                         |
| 主目的         | ・通知設定の取得                         |

・利用規約 URL 取得
・プライバシーポリシー URL
・アプリバージョン情報 |

---

# 2. 返却 JSON（レスポンス例）

```json
{
  "status": "success",
  "settings": {
    "notifications": {
      "incomingCall": true,
      "callSummary": true,
      "walletAlert": true,
      "marketing": false
    },
    "links": {
      "terms": "https://otmhn.app/terms",
      "privacy": "https://otmhn.app/privacy"
    },
    "app": {
      "version": "1.0.0",
      "minSupportedVersion": "1.0.0"
    }
  }
}
```

---

# 3. レスポンス項目の仕様

---

## (1) notifications（通知設定）

`user_settings.notifications(jsonb)` をそのまま返却

| 項目         | 型      | 説明             |
| ------------ | ------- | ---------------- |
| incomingCall | boolean | 着信通知         |
| callSummary  | boolean | 通話サマリー通知 |
| walletAlert  | boolean | 残高警告通知     |
| marketing    | boolean | お知らせ通知     |

---

## (2) links（固定リンク情報）

アプリの静的メタ情報：

| 項目    | 説明                     |
| ------- | ------------------------ |
| terms   | 利用規約 URL             |
| privacy | プライバシーポリシー URL |

※ バックエンドの env から読み込む想定（例：`process.env.TERMS_URL`）。

---

## (3) app（アプリ情報）

| 項目                | 説明                                       |
| ------------------- | ------------------------------------------ |
| version             | 現行アプリのバージョン（バックエンド定義） |
| minSupportedVersion | このバージョン未満は警告表示               |

→ 強制アップデートの判定にも利用できる拡張性。

---

# 4. リクエスト例

```
GET /settings
Authorization: Bearer <JWT>
```

---

# 5. 成功レスポンス例（再掲）

```json
{
  "status": "success",
  "settings": {
    "notifications": { ... },
    "links": { ... },
    "app": { ... }
  }
}
```

---

# 6. エラーレスポンス

| 状況       | ステータス | エラー       |
| ---------- | ---------- | ------------ |
| 認証が必要 | 401        | UNAUTHORIZED |
| DB エラー  | 500        | DB_ERROR     |

---

# 7. DB 参照（user_settings テーブル）

### user_settings テーブル

| カラム        | 型    | 説明                     |
| ------------- | ----- | ------------------------ |
| user_id       | uuid  | FK users.id              |
| notifications | jsonb | 通知設定                 |
| theme         | text  | 予備（ダークモードなど） |

---

参照 SQL：

```sql
SELECT notifications
FROM user_settings
WHERE user_id = $1;
```

---

# 8. Fastify + TypeScript 実装例（擬似コード）

```tsx
app.get("/settings", async (req, reply) => {
  const userId = req.user.userId;

  const row = await db.query(
    "SELECT notifications FROM user_settings WHERE user_id = $1",
    [userId],
  );

  const notifications = row.rows[0]?.notifications ?? {};

  return reply.send({
    status: "success",
    settings: {
      notifications,
      links: {
        terms: process.env.TERMS_URL,
        privacy: process.env.PRIVACY_URL,
      },
      app: {
        version: process.env.APP_VERSION,
        minSupportedVersion: process.env.MIN_APP_VERSION,
      },
    },
  });
});
```

---

# 9. この API の役割（まとめ）

SET-01 は設定画面だけでなく、アプリ全体の起動・初期化に関わる基盤的な API。

- 通知設定取得
- 利用規約リンク取得
- バージョン管理（将来の強制アップデート対応）
- 初回起動時のデータフィード

など、アプリ UX に直結する重要な役割を持っています。
