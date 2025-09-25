# 勤怠管理システム

社内で使用する勤怠管理アプリケーション。従業員がGoogleアカウントでサインインし、出勤・退勤・休憩の打刻を行い、自身の稼働実績を確認できるシステムです。

## 技術スタック

- **Backend**: Ruby on Rails 7 (API mode)
- **Frontend**: React 18 + TypeScript
- **Database**: PostgreSQL 14
- **Authentication**: Google OAuth2
- **Development Environment**: Docker + DevContainer
- **CI/CD**: GitHub Actions

## 開発環境セットアップ

### 前提条件

- Docker Desktop
- Visual Studio Code
- Dev Containers extension for VS Code

### セットアップ手順

1. リポジトリをクローン
```bash
git clone <repository-url>
cd attendance-management
```

2. VS CodeでDevContainerを開く
```bash
code .
```
VS Codeが開いたら、「Reopen in Container」を選択するか、コマンドパレット（Cmd/Ctrl+Shift+P）から「Dev Containers: Reopen in Container」を実行

3. 開発環境の起動
DevContainer内で以下のコマンドを実行：
```bash
# バックエンドの依存関係をインストール
cd backend
bundle install

# データベースのセットアップ
rails db:create
rails db:migrate

# フロントエンドの依存関係をインストール
cd ../frontend
npm install
```

4. アプリケーションの起動
```bash
# Docker Composeでサービスを起動
docker-compose up
```

アクセス先：
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432

## 開発ワークフロー

### コード品質管理

このプロジェクトでは、コード品質を維持するために以下のツールを使用しています：

#### Lintツール
- **Backend (Ruby)**: Rubocop - Ruby標準とRails best practicesに準拠
- **Frontend (TypeScript/React)**: ESLint + Prettier - TypeScript/React標準に準拠

#### Pre-commitフックのセットアップ
初回セットアップ時に以下を実行してください：
```bash
./scripts/setup-pre-commit.sh
```

これにより、コミット前に自動的にLintチェックが実行されます。

#### 手動でのLintチェック

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

#### CI/CDでの品質チェック
GitHub Actionsにより、以下が自動実行されます：
- プルリクエスト作成時のLintチェック
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
- Googleアカウントでのサインアップ・サインイン
- 出勤・退勤・休憩の打刻
- 個人の稼働実績確認（日次・月次）

### 管理者機能
- 全社員の勤怠データ確認
- 勤怠データの修正
- CSVエクスポート
- 監査ログの確認

## 開発中の注意事項

- 現在開発中のため、一部機能は実装されていません
- Google OAuth設定は後続のタスクで実装予定
- 本番環境用の設定は別途実装予定