# API 仕様書

## 概要

勤怠管理システムの REST API 仕様書です。すべての API エンドポイントは JSON 形式でデータを送受信します。

## 基本情報

- **Base URL**: `http://localhost:3001/api` (開発環境)
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token

## 認証

### Google OAuth 認証

#### POST /api/auth/google

Google アカウントでの認証を行います。

**Request Body:**

```json
{
  "token": "google_oauth_token"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "山田太郎",
    "role": "employee"
  },
  "token": "jwt_token_here",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

**Error Responses:**

- `401 Unauthorized`: 無効な Google トークン
- `422 Unprocessable Entity`: リクエスト形式エラー

#### POST /api/auth/refresh

JWT トークンのリフレッシュを行います。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "token": "new_jwt_token_here",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

#### DELETE /api/auth/logout

ログアウト処理を行います。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "message": "ログアウトしました"
}
```

## 勤怠管理

### GET /api/attendances

個人の勤怠履歴を取得します。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `start_date` (optional): 開始日 (YYYY-MM-DD)
- `end_date` (optional): 終了日 (YYYY-MM-DD)
- `page` (optional): ページ番号 (default: 1)
- `per_page` (optional): 1 ページあたりの件数 (default: 30)

**Response (200 OK):**

```json
{
  "attendances": [
    {
      "id": 1,
      "date": "2024-01-01",
      "clock_in_time": "2024-01-01T09:00:00Z",
      "clock_out_time": "2024-01-01T18:00:00Z",
      "total_work_minutes": 480,
      "total_break_minutes": 60,
      "status": "clocked_out",
      "records": [
        {
          "id": 1,
          "record_type": "clock_in",
          "timestamp": "2024-01-01T09:00:00Z"
        },
        {
          "id": 2,
          "record_type": "break_start",
          "timestamp": "2024-01-01T12:00:00Z"
        },
        {
          "id": 3,
          "record_type": "break_end",
          "timestamp": "2024-01-01T13:00:00Z"
        },
        {
          "id": 4,
          "record_type": "clock_out",
          "timestamp": "2024-01-01T18:00:00Z"
        }
      ]
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_count": 150,
    "per_page": 30
  }
}
```

### GET /api/attendances/today

当日の勤怠状況を取得します。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "attendance": {
    "id": 1,
    "date": "2024-01-01",
    "clock_in_time": "2024-01-01T09:00:00Z",
    "clock_out_time": null,
    "total_work_minutes": 0,
    "total_break_minutes": 0,
    "status": "clocked_in",
    "records": [
      {
        "id": 1,
        "record_type": "clock_in",
        "timestamp": "2024-01-01T09:00:00Z"
      }
    ]
  }
}
```

### POST /api/attendances/clock_in

出勤打刻を行います。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (201 Created):**

```json
{
  "message": "出勤打刻が完了しました",
  "attendance": {
    "id": 1,
    "date": "2024-01-01",
    "status": "clocked_in",
    "clock_in_time": "2024-01-01T09:00:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: 既に出勤済み
- `422 Unprocessable Entity`: バリデーションエラー

### POST /api/attendances/clock_out

退勤打刻を行います。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "message": "退勤打刻が完了しました",
  "attendance": {
    "id": 1,
    "date": "2024-01-01",
    "status": "clocked_out",
    "clock_out_time": "2024-01-01T18:00:00Z",
    "total_work_minutes": 480,
    "total_break_minutes": 60
  }
}
```

**Error Responses:**

- `400 Bad Request`: 出勤打刻が未完了
- `422 Unprocessable Entity`: バリデーションエラー

### POST /api/attendances/break_start

休憩開始打刻を行います。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "message": "休憩開始打刻が完了しました",
  "attendance": {
    "id": 1,
    "date": "2024-01-01",
    "status": "on_break"
  }
}
```

### POST /api/attendances/break_end

休憩終了打刻を行います。

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**

```json
{
  "message": "休憩終了打刻が完了しました",
  "attendance": {
    "id": 1,
    "date": "2024-01-01",
    "status": "clocked_in",
    "total_break_minutes": 60
  }
}
```

## 管理者機能

### GET /api/admin/users

全ユーザー一覧を取得します。（管理者のみ）

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**

- `page` (optional): ページ番号 (default: 1)
- `per_page` (optional): 1 ページあたりの件数 (default: 50)

**Response (200 OK):**

```json
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "山田太郎",
      "role": "employee",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_count": 100,
    "per_page": 50
  }
}
```

### GET /api/admin/attendances

全ユーザーの勤怠データを取得します。（管理者のみ）

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**

- `user_id` (optional): 特定ユーザーのデータのみ取得
- `start_date` (optional): 開始日 (YYYY-MM-DD)
- `end_date` (optional): 終了日 (YYYY-MM-DD)
- `page` (optional): ページ番号 (default: 1)
- `per_page` (optional): 1 ページあたりの件数 (default: 50)

**Response (200 OK):**

```json
{
  "attendances": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "name": "山田太郎",
        "email": "user@example.com"
      },
      "date": "2024-01-01",
      "clock_in_time": "2024-01-01T09:00:00Z",
      "clock_out_time": "2024-01-01T18:00:00Z",
      "total_work_minutes": 480,
      "total_break_minutes": 60,
      "status": "clocked_out"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 10,
    "total_count": 500,
    "per_page": 50
  }
}
```

### PUT /api/admin/attendances/:id

勤怠データを修正します。（管理者のみ）

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**

```json
{
  "clock_in_time": "2024-01-01T09:00:00Z",
  "clock_out_time": "2024-01-01T18:00:00Z",
  "reason": "打刻忘れのため修正"
}
```

**Response (200 OK):**

```json
{
  "message": "勤怠データを修正しました",
  "attendance": {
    "id": 1,
    "date": "2024-01-01",
    "clock_in_time": "2024-01-01T09:00:00Z",
    "clock_out_time": "2024-01-01T18:00:00Z",
    "total_work_minutes": 480,
    "total_break_minutes": 60
  }
}
```

### GET /api/admin/export

勤怠データを CSV 形式でエクスポートします。（管理者のみ）

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**

- `start_date` (required): 開始日 (YYYY-MM-DD)
- `end_date` (required): 終了日 (YYYY-MM-DD)
- `user_id` (optional): 特定ユーザーのみエクスポート

**Response (200 OK):**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="attendance_export_20240101_20240131.csv"

ユーザー名,メールアドレス,日付,出勤時刻,退勤時刻,勤務時間,休憩時間
山田太郎,user@example.com,2024-01-01,09:00,18:00,8:00,1:00
```

### GET /api/admin/audit_logs

監査ログを取得します。（管理者のみ）

**Headers:**

```
Authorization: Bearer <admin_jwt_token>
```

**Query Parameters:**

- `target_user_id` (optional): 対象ユーザー ID
- `action` (optional): アクション種別
- `start_date` (optional): 開始日 (YYYY-MM-DD)
- `end_date` (optional): 終了日 (YYYY-MM-DD)
- `page` (optional): ページ番号 (default: 1)
- `per_page` (optional): 1 ページあたりの件数 (default: 50)

**Response (200 OK):**

```json
{
  "audit_logs": [
    {
      "id": 1,
      "admin_user": {
        "id": 2,
        "name": "管理者",
        "email": "admin@example.com"
      },
      "target_user": {
        "id": 1,
        "name": "山田太郎",
        "email": "user@example.com"
      },
      "action": "attendance_update",
      "changes": {
        "clock_in_time": ["09:30", "09:00"],
        "clock_out_time": ["17:30", "18:00"]
      },
      "reason": "打刻忘れのため修正",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_count": 150,
    "per_page": 50
  }
}
```

## エラーレスポンス

### 共通エラーフォーマット

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": ["詳細なエラー情報"]
  }
}
```

### HTTP ステータスコード

- `200 OK`: 成功
- `201 Created`: 作成成功
- `400 Bad Request`: リクエストエラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 権限エラー
- `404 Not Found`: リソースが見つからない
- `422 Unprocessable Entity`: バリデーションエラー
- `500 Internal Server Error`: サーバーエラー

### エラーコード一覧

#### 認証関連

- `INVALID_TOKEN`: 無効なトークン
- `TOKEN_EXPIRED`: トークンの有効期限切れ
- `GOOGLE_AUTH_FAILED`: Google 認証失敗
- `INSUFFICIENT_PERMISSIONS`: 権限不足

#### 勤怠関連

- `ALREADY_CLOCKED_IN`: 既に出勤済み
- `NOT_CLOCKED_IN`: 出勤打刻が未完了
- `ALREADY_ON_BREAK`: 既に休憩中
- `NOT_ON_BREAK`: 休憩中ではない
- `INVALID_ATTENDANCE_ORDER`: 不正な打刻順序

#### バリデーション関連

- `VALIDATION_ERROR`: バリデーションエラー
- `REQUIRED_FIELD_MISSING`: 必須フィールドが不足
- `INVALID_DATE_FORMAT`: 日付形式が不正
- `INVALID_TIME_RANGE`: 時刻範囲が不正

## レート制限

- **認証エンドポイント**: 1 分間に 10 回まで
- **一般エンドポイント**: 1 分間に 100 回まで
- **管理者エンドポイント**: 1 分間に 200 回まで

レート制限に達した場合、`429 Too Many Requests` が返されます。

## バージョニング

現在の API バージョンは `v1` です。将来的な変更に備えて、URL に `/api/v1/` を含めることを推奨します。

## サンプルコード

### JavaScript (Axios)

```javascript
// 認証
const authResponse = await axios.post("/api/auth/google", {
  token: googleToken,
});

const jwtToken = authResponse.data.token;

// 出勤打刻
const clockInResponse = await axios.post(
  "/api/attendances/clock_in",
  {},
  {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  }
);

// 勤怠履歴取得
const attendancesResponse = await axios.get("/api/attendances", {
  headers: {
    Authorization: `Bearer ${jwtToken}`,
  },
  params: {
    start_date: "2024-01-01",
    end_date: "2024-01-31",
  },
});
```

### Ruby (HTTParty)

```ruby
# 認証
auth_response = HTTParty.post('http://localhost:3001/api/auth/google', {
  body: { token: google_token }.to_json,
  headers: { 'Content-Type' => 'application/json' }
})

jwt_token = auth_response['token']

# 出勤打刻
clock_in_response = HTTParty.post('http://localhost:3001/api/attendances/clock_in', {
  headers: {
    'Authorization' => "Bearer #{jwt_token}",
    'Content-Type' => 'application/json'
  }
})

# 勤怠履歴取得
attendances_response = HTTParty.get('http://localhost:3001/api/attendances', {
  headers: { 'Authorization' => "Bearer #{jwt_token}" },
  query: { start_date: '2024-01-01', end_date: '2024-01-31' }
})
```
