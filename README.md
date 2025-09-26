# 勤怠管理システム

社内で使用する勤怠管理アプリケーション。従業員が Google アカウントでサインインし、出勤・退勤・休憩の打刻を行い、自身の稼働実績を確認できるシステムです。

## 📋 目次

- [技術スタック](#技術スタック)
- [機能概要](#機能概要)
- [開発環境セットアップ](#開発環境セットアップ)
- [本番環境デプロイ](#本番環境デプロイ)
- [開発ワークフロー](#開発ワークフロー)
- [API 仕様](#api仕様)
- [プロジェクト構成](#プロジェクト構成)
- [トラブルシューティング](#トラブルシューティング)
- [コントリビューション](#コントリビューション)

## 🛠 技術スタック

- **Backend**: Ruby on Rails 7 (API mode)
- **Frontend**: React 18 + TypeScript
- **Database**: PostgreSQL 14
- **Authentication**: Google OAuth2
- **Development Environment**: Docker + DevContainer
- **CI/CD**: GitHub Actions
- **Code Quality**: Rubocop (Ruby) + ESLint (TypeScript/React)
- **Testing**: RSpec (Backend) + Jest/React Testing Library (Frontend)

## ✨ 機能概要

### 一般ユーザー機能

- 🔐 Google アカウントでのサインアップ・サインイン
- ⏰ 出勤・退勤・休憩の打刻
- 📊 個人の稼働実績確認（日次・月次）
- 📈 勤務時間と休憩時間の自動計算

### 管理者機能

- 👥 全社員の勤怠データ確認
- ✏️ 勤怠データの修正（監査ログ付き）
- 📤 CSV エクスポート
- 🔍 監査ログの確認
- 📋 ユーザー管理

## 🚀 開発環境セットアップ

### 前提条件

- Docker Desktop (最新版)
- Visual Studio Code
- Dev Containers extension for VS Code
- Git

### セットアップ手順

1. **リポジトリをクローン**

```bash
git clone <repository-url>
cd attendance-management
```

2. **VS Code で DevContainer を開く**

```bash
code .
```

VS Code が開いたら、「Reopen in Container」を選択するか、コマンドパレット（Cmd/Ctrl+Shift+P）から「Dev Containers: Reopen in Container」を実行

3. **環境変数の設定**

```bash
# 開発環境用の環境変数をコピー
cp .env.example .env
```

4. **開発環境の起動**

```bash
# Docker Composeでサービスを起動
docker-compose up -d

# データベースのセットアップ
docker compose exec backend rails db:create db:migrate db:seed
```

5. **アクセス確認**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

### 🔧 開発用コマンド

```bash
# バックエンドコンソール
docker compose exec backend rails console

# データベースリセット
docker compose exec backend rails db:reset

# テスト実行
docker compose exec backend rspec
docker compose exec frontend npm test

# Lintチェック
docker compose exec backend bundle exec rubocop
docker compose exec frontend npm run lint
```

## 開発ワークフロー

### コード品質管理

このプロジェクトでは、コード品質を維持するために以下のツールを使用しています：

#### Lint ツール

- **Backend (Ruby)**: Rubocop - Ruby 標準と Rails best practices に準拠
- **Frontend (TypeScript/React)**: ESLint - TypeScript/React 標準に準拠

#### Pre-commit フックのセットアップ

初回セットアップ時に以下を実行してください：

```bash
./scripts/setup-pre-commit.sh
```

これにより、コミット前に自動的に Lint チェックが実行されます。

#### 手動での Lint チェック

バックエンド（Ruby）:

```bash
cd backend
bundle exec rubocop
# 自動修正可能な問題を修正
bundle exec rubocop -a
```

フロントエンド（TypeScript/React）:

```bash
cd frontend
npm run lint
# 自動修正可能な問題を修正
npm run lint:fix
```

#### CI/CD での品質チェック

GitHub Actions により、以下が自動実行されます：

- プルリクエスト作成時の Lint チェック
- テスト実行前の品質チェック
- メインブランチへのマージ前の品質ゲート

### テスト実行

バックエンド:

```bash
cd backend
bundle exec rspec
```

フロントエンド:

```bash
cd frontend
npm test
```

## プロジェクト構成

```
.
├── .devcontainer/          # DevContainer設定
├── .github/workflows/      # GitHub Actions CI/CD
├── backend/               # Rails API
│   ├── app/
│   ├── config/
│   ├── db/
│   └── spec/
├── frontend/              # React アプリケーション
│   ├── public/
│   ├── src/
│   └── package.json
├── docker-compose.yml     # Docker Compose設定
└── README.md
```

## 機能概要

### 一般ユーザー機能

- Google アカウントでのサインアップ・サインイン
- 出勤・退勤・休憩の打刻
- 個人の稼働実績確認（日次・月次）

### 管理者機能

- 全社員の勤怠データ確認
- 勤怠データの修正
- CSV エクスポート
- 監査ログの確認

## 開発中の注意事項

- 現在開発中のため、一部機能は実装されていません
- Google OAuth 設定は後続のタスクで実装予定
- 本番環境用の設定は別途実装予定

## 🏭 本番環境デプロイ

### 本番環境の前提条件

- Docker & Docker Compose
- SSL 証明書（HTTPS 用）
- Google OAuth2 認証情報
- 十分なサーバーリソース（推奨: 2GB RAM 以上）

### 本番環境セットアップ

1. **環境変数の設定**

```bash
# 本番環境用の環境変数をコピーして設定
cp .env.production.example .env.production
# .env.productionを編集して必要な値を設定
```

2. **必要な環境変数**

```bash
# データベース設定
POSTGRES_PASSWORD=your_secure_password
SECRET_KEY_BASE=$(docker compose exec backend rails secret)
JWT_SECRET=$(openssl rand -hex 32)

# Google OAuth設定
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

3. **本番環境デプロイ**

```bash
# 自動デプロイスクリプトを実行
./scripts/deploy-production.sh
```

### 本番環境管理

```bash
# サービス状況確認
docker-compose -f docker-compose.prod.yml ps

# ログ確認
docker-compose -f docker-compose.prod.yml logs -f

# データベースバックアップ
./scripts/backup-production.sh

# システム監視
./scripts/monitor-production.sh
```

## 🔄 開発ワークフロー

### Git ブランチ戦略

```bash
main          # 本番環境用ブランチ
├── develop   # 開発統合ブランチ
└── feature/* # 機能開発ブランチ
```

### コード品質管理

#### Lint ツール

- **Backend (Ruby)**: Rubocop - Ruby 標準と Rails best practices に準拠
- **Frontend (TypeScript/React)**: ESLint - TypeScript/React 標準に準拠

#### Pre-commit フックのセットアップ

```bash
# 初回セットアップ時に実行
./scripts/setup-pre-commit.sh
```

#### 手動での Lint チェック

```bash
# バックエンド（Ruby）
docker compose exec backend bundle exec rubocop
docker compose exec backend bundle exec rubocop -a  # 自動修正

# フロントエンド（TypeScript/React）
docker compose exec frontend npm run lint
docker compose exec frontend npm run lint:fix  # 自動修正
```

### テスト実行

```bash
# バックエンドテスト
docker compose exec backend rspec

# フロントエンドテスト
docker compose exec frontend npm test

# 全テスト実行
./scripts/run-all-tests.sh
```

### CI/CD パイプライン

GitHub Actions により以下が自動実行されます：

- ✅ Lint チェック
- ✅ テスト実行
- ✅ セキュリティスキャン
- ✅ ビルド確認

## 📚 API 仕様

### 認証エンドポイント

```http
POST /api/auth/google          # Google OAuth認証
POST /api/auth/refresh         # トークンリフレッシュ
DELETE /api/auth/logout        # ログアウト
```

### 勤怠管理エンドポイント

```http
GET /api/attendances           # 個人勤怠履歴取得
POST /api/attendances/clock_in # 出勤打刻
POST /api/attendances/clock_out # 退勤打刻
POST /api/attendances/break_start # 休憩開始
POST /api/attendances/break_end # 休憩終了
GET /api/attendances/today     # 当日の勤怠状況
```

### 管理者エンドポイント

```http
GET /api/admin/users           # 全ユーザー一覧
GET /api/admin/attendances     # 全ユーザー勤怠データ
PUT /api/admin/attendances/:id # 勤怠データ修正
GET /api/admin/export          # CSV エクスポート
GET /api/admin/audit_logs      # 監査ログ取得
```

詳細な API 仕様は [API Documentation](docs/api-specification.md) を参照してください。

## 📁 プロジェクト構成

```
.
├── .devcontainer/              # DevContainer設定
├── .github/workflows/          # GitHub Actions CI/CD
├── backend/                    # Rails API
│   ├── app/
│   │   ├── controllers/        # APIコントローラー
│   │   ├── models/            # データモデル
│   │   ├── services/          # ビジネスロジック
│   │   └── serializers/       # JSONシリアライザー
│   ├── config/                # Rails設定
│   ├── db/                    # データベース関連
│   ├── spec/                  # テストファイル
│   ├── Dockerfile             # 開発用Dockerfile
│   └── Dockerfile.prod        # 本番用Dockerfile
├── frontend/                   # React アプリケーション
│   ├── public/                # 静的ファイル
│   ├── src/
│   │   ├── components/        # Reactコンポーネント
│   │   ├── pages/            # ページコンポーネント
│   │   ├── services/         # API通信
│   │   ├── contexts/         # React Context
│   │   └── types/            # TypeScript型定義
│   ├── Dockerfile            # 開発用Dockerfile
│   ├── Dockerfile.prod       # 本番用Dockerfile
│   └── nginx.conf            # 本番用nginx設定
├── scripts/                   # 運用スクリプト
│   ├── deploy-production.sh   # 本番デプロイ
│   ├── backup-production.sh   # バックアップ
│   └── monitor-production.sh  # 監視
├── config/                    # 設定ファイル
│   └── security.md           # セキュリティ設定
├── docs/                      # ドキュメント
├── docker-compose.yml         # 開発環境用
├── docker-compose.prod.yml    # 本番環境用
└── .env.production.example    # 本番環境変数テンプレート
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### Docker 関連

**問題**: コンテナが起動しない

```bash
# 解決方法
docker-compose down
docker-compose up --build
```

**問題**: データベース接続エラー

```bash
# 解決方法
docker-compose restart db
docker-compose exec backend rails db:reset
```

#### 開発環境関連

**問題**: Bundler エラー

```bash
# 解決方法
docker-compose exec backend bundle install
```

**問題**: npm 依存関係エラー

```bash
# 解決方法
docker-compose exec frontend npm install
```

#### 本番環境関連

**問題**: 環境変数が読み込まれない

```bash
# .env.productionファイルの確認
cat .env.production
# 必要な環境変数が設定されているか確認
```

**問題**: SSL 証明書エラー

```bash
# nginx設定の確認
docker-compose -f docker-compose.prod.yml logs frontend
```

### ログの確認方法

```bash
# 開発環境
docker-compose logs -f [service_name]

# 本番環境
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# 特定のサービスのログ
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

## 🤝 コントリビューション

### 開発への参加方法

1. **Issue 作成**: バグ報告や機能要望は GitHub Issues で作成
2. **Fork & Clone**: リポジトリをフォークしてローカルにクローン
3. **ブランチ作成**: `feature/your-feature-name` でブランチを作成
4. **開発**: コードを実装し、テストを追加
5. **Pull Request**: メインブランチに対して PR を作成

### コーディング規約

#### Ruby (Backend)

- Rubocop の設定に従う
- RSpec でテストを書く
- コメントは日本語で記述

#### TypeScript/React (Frontend)

- ESLint の設定に従う
- Jest/React Testing Library でテストを書く
- コンポーネントは関数型で実装

### コミットメッセージ規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: その他の変更
```

### レビュープロセス

1. **自動チェック**: CI/CD で Lint・テストが実行
2. **コードレビュー**: 最低 1 名のレビューが必要
3. **マージ**: 承認後にメインブランチにマージ

## 📄 ライセンス

このプロジェクトは社内利用を目的としており、外部への配布は禁止されています。

## 📞 サポート

技術的な質問や問題については、以下の方法でサポートを受けられます：

- **GitHub Issues**: バグ報告や機能要望
- **開発チーム**: 内部 Slack チャンネル #attendance-system
- **ドキュメント**: [docs/](docs/) フォルダ内の詳細ドキュメント

---

**最終更新**: 2025 年 9 月 26 日
