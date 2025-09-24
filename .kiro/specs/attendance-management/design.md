# Design Document

## Overview

社内勤怠管理アプリケーションは、Ruby on Rails APIバックエンドとReactフロントエンドで構成されるSPA（Single Page Application）として設計する。Google OAuth認証を使用し、一般ユーザーと管理者の2つの権限レベルを持つ。ローカルホスト環境での稼働を前提とし、PostgreSQLをデータベースとして使用する。

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Environment                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │   DevContainer  │  │     VS Code     │  │  GitHub Repo  │
│  │   (Docker)      │  │   Extensions    │  │   (Source)    │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                     │
│  ┌─────────────────┐    HTTP/JSON API    ┌─────────────────┐│
│  │   React SPA     │ ◄─────────────────► │  Rails API      ││
│  │  (Frontend)     │                     │  (Backend)      ││
│  │   Container     │                     │   Container     ││
│  └─────────────────┘                     └─────────────────┘│
│                                                │             │
│                                                ▼             │
│                                        ┌─────────────────┐  │
│                                        │   PostgreSQL    │  │
│                                        │   Container     │  │
│                                        └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Google OAuth   │
                        │    Service      │
                        └─────────────────┘
                                ▲
                                │
                        ┌─────────────────┐
                        │ GitHub Actions  │
                        │   (CI/CD)       │
                        └─────────────────┘
```

### Technology Stack

**Backend (Rails API)**
- Ruby on Rails 7.x (API mode)
- PostgreSQL 14+
- JWT for session management
- Google OAuth2 gem for authentication
- CORS configuration for React integration
- Rubocop for code quality and style enforcement

**Frontend (React)**
- React 18.x with TypeScript
- React Router for navigation
- Axios for API communication
- Google OAuth2 client library
- Material-UI or similar for UI components
- ESLint with TypeScript support for code quality

**Development Tools & Infrastructure**
- Docker & Docker Compose for containerized development
- DevContainer configuration for VS Code
- GitHub for version control and collaboration
- GitHub Actions for CI/CD pipeline
- Rubocop configuration for Rails best practices
- ESLint configuration with React and TypeScript rules
- Pre-commit hooks for automated linting
- VS Code extensions for real-time linting feedback

## Components and Interfaces

### Backend Components

#### 1. Authentication Module
- **GoogleAuthService**: Google OAuth認証処理
- **JwtService**: JWT トークンの生成・検証
- **AuthController**: 認証エンドポイント

#### 2. User Management Module
- **User Model**: ユーザー情報とロール管理
- **UsersController**: ユーザー関連API

#### 3. Attendance Module
- **Attendance Model**: 勤怠記録の管理
- **AttendanceRecord Model**: 個別打刻記録
- **AttendancesController**: 勤怠関連API

#### 4. Admin Module
- **AdminController**: 管理者専用API
- **AuditLog Model**: 監査ログ管理

### Frontend Components

#### 1. Authentication Components
- **LoginPage**: Google OAuth ログイン
- **AuthProvider**: 認証状態管理
- **ProtectedRoute**: 認証済みルート保護

#### 2. User Dashboard Components
- **Dashboard**: メインダッシュボード
- **TimeClockWidget**: 打刻ボタン群
- **AttendanceHistory**: 個人実績表示

#### 3. Admin Components
- **AdminDashboard**: 管理者ダッシュボード
- **UserList**: 全ユーザー一覧
- **AttendanceEditor**: 実績編集フォーム

### API Endpoints

#### Authentication
```
POST /api/auth/google          # Google OAuth認証
POST /api/auth/refresh         # トークンリフレッシュ
DELETE /api/auth/logout        # ログアウト
```

#### User Attendance
```
GET /api/attendances           # 個人勤怠履歴取得
POST /api/attendances/clock_in # 出勤打刻
POST /api/attendances/clock_out # 退勤打刻
POST /api/attendances/break_start # 休憩開始
POST /api/attendances/break_end # 休憩終了
GET /api/attendances/today     # 当日の勤怠状況
```

#### Admin
```
GET /api/admin/users           # 全ユーザー一覧
GET /api/admin/attendances     # 全ユーザー勤怠データ
PUT /api/admin/attendances/:id # 勤怠データ修正
GET /api/admin/export          # CSV エクスポート
GET /api/admin/audit_logs      # 監査ログ取得
```

## Data Models

### User Model
```ruby
class User < ApplicationRecord
  enum role: { employee: 0, admin: 1 }
  
  # Attributes
  # - google_id: string (unique)
  # - email: string (unique)
  # - name: string
  # - role: integer (enum)
  # - created_at: datetime
  # - updated_at: datetime
  
  has_many :attendances, dependent: :destroy
  has_many :audit_logs, dependent: :destroy
  
  validates :google_id, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true
  validates :name, presence: true
end
```

### Attendance Model
```ruby
class Attendance < ApplicationRecord
  # Attributes
  # - user_id: integer (foreign key)
  # - date: date
  # - clock_in_time: datetime
  # - clock_out_time: datetime
  # - total_work_minutes: integer
  # - total_break_minutes: integer
  # - status: integer (enum)
  # - created_at: datetime
  # - updated_at: datetime
  
  belongs_to :user
  has_many :attendance_records, dependent: :destroy
  
  enum status: { 
    not_started: 0, 
    clocked_in: 1, 
    on_break: 2, 
    clocked_out: 3 
  }
  
  validates :date, presence: true, uniqueness: { scope: :user_id }
  validates :user_id, presence: true
end
```

### AttendanceRecord Model
```ruby
class AttendanceRecord < ApplicationRecord
  # Attributes
  # - attendance_id: integer (foreign key)
  # - record_type: integer (enum)
  # - timestamp: datetime
  # - created_at: datetime
  # - updated_at: datetime
  
  belongs_to :attendance
  
  enum record_type: { 
    clock_in: 0, 
    clock_out: 1, 
    break_start: 2, 
    break_end: 3 
  }
  
  validates :record_type, presence: true
  validates :timestamp, presence: true
end
```

### AuditLog Model
```ruby
class AuditLog < ApplicationRecord
  # Attributes
  # - user_id: integer (foreign key to admin user)
  # - target_user_id: integer (foreign key to affected user)
  # - action: string
  # - changes: json
  # - reason: text
  # - created_at: datetime
  
  belongs_to :user
  belongs_to :target_user, class_name: 'User'
  
  validates :action, presence: true
  validates :reason, presence: true
end
```

### Database Schema Relationships

```
Users (1) ──── (N) Attendances (1) ──── (N) AttendanceRecords
  │                                              
  └── (1) ──── (N) AuditLogs ──── (N) Users (target)
```

## Error Handling

### Backend Error Handling

#### 1. Authentication Errors
- **401 Unauthorized**: 無効なトークンまたは未認証
- **403 Forbidden**: 権限不足（管理者機能へのアクセス等）
- **422 Unprocessable Entity**: Google OAuth認証失敗

#### 2. Business Logic Errors
- **400 Bad Request**: 不正な打刻順序（出勤前の退勤等）
- **409 Conflict**: 重複する打刻操作
- **422 Unprocessable Entity**: バリデーションエラー

#### 3. System Errors
- **500 Internal Server Error**: サーバー内部エラー
- **503 Service Unavailable**: 外部サービス（Google OAuth）接続エラー

### Frontend Error Handling

#### 1. Error Boundary Component
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  // React Error Boundary implementation
}
```

#### 2. API Error Interceptor
```typescript
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error types
    // - Network errors
    // - Authentication errors  
    // - Business logic errors
    return Promise.reject(error);
  }
);
```

#### 3. User-Friendly Error Messages
- ネットワークエラー: "接続に問題があります。しばらく待ってから再試行してください。"
- 認証エラー: "セッションが期限切れです。再度ログインしてください。"
- 業務ロジックエラー: "既に出勤済みです。"

## Testing Strategy

### Backend Testing

#### 1. Unit Tests (RSpec)
```ruby
# Model tests
describe User do
  it "validates uniqueness of google_id"
  it "has correct role enum values"
end

# Service tests  
describe GoogleAuthService do
  it "creates user from Google OAuth response"
  it "handles invalid OAuth tokens"
end
```

#### 2. Integration Tests
```ruby
# API endpoint tests
describe "POST /api/attendances/clock_in" do
  it "creates attendance record for authenticated user"
  it "returns error for duplicate clock_in"
end
```

#### 3. System Tests
- Google OAuth認証フロー
- 管理者権限チェック
- データ整合性検証

### Frontend Testing

#### 1. Unit Tests (Jest + React Testing Library)
```typescript
// Component tests
describe('TimeClockWidget', () => {
  it('shows clock_in button when not clocked in');
  it('disables clock_out button when not clocked in');
});

// Service tests
describe('AttendanceService', () => {
  it('handles API errors gracefully');
});
```

#### 2. Integration Tests
```typescript
// User flow tests
describe('Attendance Flow', () => {
  it('allows complete clock_in -> break -> clock_out flow');
});
```

#### 3. E2E Tests (Cypress)
- Google OAuth ログインフロー
- 完全な勤怠打刻フロー
- 管理者機能テスト

### Test Data Management

#### 1. Factory Pattern (FactoryBot)
```ruby
FactoryBot.define do
  factory :user do
    google_id { "google_#{SecureRandom.hex(8)}" }
    email { Faker::Internet.email }
    name { Faker::Name.name }
    role { :employee }
  end
  
  factory :admin_user, parent: :user do
    role { :admin }
  end
end
```

#### 2. Test Database Seeding
- 開発環境用のサンプルデータ
- テスト環境用のフィクスチャ
- 管理者アカウントの初期設定

### Performance Testing

#### 1. Load Testing
- 同時打刻処理の負荷テスト
- 大量データでの実績表示性能
- CSV エクスポート処理時間

#### 2. Database Performance
- インデックス最適化
- N+1 クエリ問題の検出
- 大量データでのクエリ性能

## Development Environment & Code Quality

### Docker Configuration

#### Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: attendance_development
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    volumes:
      - ./backend:/app
    ports:
      - "3001:3000"
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/attendance_development

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

#### DevContainer Configuration
```json
{
  "name": "Attendance Management",
  "dockerComposeFile": "docker-compose.yml",
  "service": "backend",
  "workspaceFolder": "/app",
  "customizations": {
    "vscode": {
      "extensions": [
        "rebornix.Ruby",
        "ms-vscode.vscode-typescript-next",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-eslint"
      ]
    }
  },
  "postCreateCommand": "bundle install && npm install --prefix ../frontend"
}
```

### GitHub Actions CI/CD

#### Workflow Configuration
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: 3.1
          bundler-cache: true
      - name: Run Rubocop
        run: bundle exec rubocop
      - name: Run RSpec
        run: bundle exec rspec

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run ESLint
        run: npm run lint
      - name: Run Tests
        run: npm test
```

### Code Quality Tools

#### Backend (Rubocop)
```ruby
# .rubocop.yml
AllCops:
  TargetRubyVersion: 3.1
  NewCops: enable
  Exclude:
    - 'db/schema.rb'
    - 'db/migrate/*'
    - 'vendor/**/*'
    - 'bin/*'

Style/Documentation:
  Enabled: false

Metrics/LineLength:
  Max: 120

Metrics/MethodLength:
  Max: 15

Layout/LineLength:
  Max: 120
```

#### Frontend (ESLint)
```json
{
  "extends": [
    "react-app",
    "react-app/jest",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: rubocop
        name: Rubocop
        entry: bundle exec rubocop
        language: system
        files: \.rb$
        
      - id: eslint
        name: ESLint
        entry: npm run lint
        language: system
        files: \.(js|jsx|ts|tsx)$
```

### Development Workflow
1. **Setup**: 開発環境構築時に自動的にLintツールを設定
2. **Real-time**: VS Code拡張による編集中のリアルタイムチェック
3. **Pre-commit**: コミット前の自動Lintチェック
4. **CI/CD**: 継続的インテグレーションでのコード品質チェック

## Security Considerations

### Authentication & Authorization
- Google OAuth2 による安全な認証
- JWT トークンの適切な有効期限設定
- CSRF 保護（Rails標準機能）
- 管理者権限の厳密なチェック

### Data Protection
- 個人情報の暗号化（データベースレベル）
- 監査ログによる変更履歴追跡
- API レスポンスでの機密情報フィルタリング

### Infrastructure Security
- CORS 設定の適切な制限
- HTTPS 通信の強制（本番環境）
- 環境変数による機密情報管理