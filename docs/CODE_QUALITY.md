# Code Quality Management

このドキュメントでは、プロジェクトのコード品質管理について説明します。

## 概要

このプロジェクトでは、以下のツールを使用してコード品質を維持しています：

- **Rubocop**: Ruby/Railsコードの静的解析とスタイルチェック
- **ESLint**: JavaScript/TypeScriptコードの静的解析とスタイルチェック
- **Prettier**: コードフォーマッター（フロントエンド）
- **Pre-commit hooks**: コミット前の自動品質チェック
- **GitHub Actions**: CI/CDでの継続的品質チェック

## セットアップ

### 1. 開発環境での初期設定

```bash
# Pre-commitフックのインストール
./scripts/setup-pre-commit.sh

# 全体の品質チェック実行
./scripts/quality-check.sh
```

### 2. VS Code設定

プロジェクトには以下の設定が含まれています：

- `.vscode/settings.json`: エディタ設定（保存時フォーマット、ESLint自動修正）
- `.vscode/extensions.json`: 推奨拡張機能

推奨拡張機能を一括インストールするには、VS Codeのコマンドパレットで「Extensions: Show Recommended Extensions」を実行してください。

## 使用方法

### バックエンド（Ruby/Rails）

#### Rubocopの実行
```bash
cd backend

# 全ファイルをチェック
bundle exec rubocop

# 特定のファイルをチェック
bundle exec rubocop app/models/user.rb

# 自動修正可能な問題を修正
bundle exec rubocop -a

# 安全でない修正も含めて自動修正
bundle exec rubocop -A
```

#### 設定ファイル
- `backend/.rubocop.yml`: Rubocop設定
- 除外ファイル: `db/schema.rb`, `db/migrate/*`, `vendor/**/*`, `bin/*`

### フロントエンド（TypeScript/React）

#### ESLintの実行
```bash
cd frontend

# 全ファイルをチェック
npm run lint

# 自動修正可能な問題を修正
npm run lint:fix

# 特定のファイルをチェック
npx eslint src/components/App.tsx
```

#### 設定ファイル
- `frontend/.eslintrc.json`: ESLint設定
- `frontend/.prettierrc`: Prettier設定

## Pre-commitフック

コミット前に以下のチェックが自動実行されます：

1. **Rubocop**: Rubyファイルのスタイルチェック
2. **ESLint**: TypeScript/JavaScriptファイルのスタイルチェック
3. **Trailing whitespace**: 行末の空白除去
4. **End of file fixer**: ファイル末尾の改行統一
5. **YAML check**: YAML構文チェック
6. **Large files check**: 大きなファイルの検出

### Pre-commitフックの管理

```bash
# フックを一時的に無効化してコミット
git commit --no-verify -m "commit message"

# フックを再インストール
pre-commit install

# 全ファイルに対してフックを実行
pre-commit run --all-files

# 特定のフックのみ実行
pre-commit run rubocop
pre-commit run eslint
```

## CI/CD統合

GitHub Actionsワークフロー（`.github/workflows/ci.yml`）では以下が実行されます：

### Lint Jobs
1. **backend-lint**: Rubocopによるバックエンドコードチェック
2. **frontend-lint**: ESLintによるフロントエンドコードチェック

### Test Jobs（Lintが成功した場合のみ実行）
3. **backend-tests**: RSpecテスト実行
4. **frontend-tests**: Jestテスト実行

### ワークフロートリガー
- `main`、`develop`ブランチへのプッシュ
- `main`、`develop`ブランチへのプルリクエスト

## ルールのカスタマイズ

### Rubocopルールの変更

`backend/.rubocop.yml`を編集してルールをカスタマイズできます：

```yaml
# 例: 行の長さ制限を変更
Metrics/LineLength:
  Max: 100

# 例: 特定のルールを無効化
Style/Documentation:
  Enabled: false

# 例: 特定のファイルを除外
AllCops:
  Exclude:
    - 'path/to/exclude/**/*'
```

### ESLintルールの変更

`frontend/.eslintrc.json`を編集してルールをカスタマイズできます：

```json
{
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "prefer-const": "error"
  }
}
```

## トラブルシューティング

### よくある問題

#### 1. Rubocopエラーが大量に出る
```bash
# 自動修正を試す
cd backend
bundle exec rubocop -a

# それでも残るエラーは手動で修正
```

#### 2. ESLintエラーが大量に出る
```bash
# 自動修正を試す
cd frontend
npm run lint:fix

# Prettierでフォーマット
npx prettier --write src/
```

#### 3. Pre-commitフックが失敗する
```bash
# 問題のあるファイルを修正してから再コミット
git add .
git commit -m "fix lint issues"

# または一時的にフックを無効化
git commit --no-verify -m "commit message"
```

#### 4. CI/CDでLintが失敗する
- ローカルで`./scripts/quality-check.sh`を実行して問題を修正
- 修正後にプッシュし直す

### パフォーマンス最適化

#### Rubocopの高速化
```bash
# 並列実行を有効化
bundle exec rubocop --parallel

# キャッシュを使用
bundle exec rubocop --cache true
```

#### ESLintの高速化
```bash
# キャッシュを使用
npm run lint -- --cache

# 特定のディレクトリのみチェック
npm run lint -- src/components/
```

## 参考リンク

- [Rubocop Documentation](https://docs.rubocop.org/)
- [ESLint Documentation](https://eslint.org/docs/)
- [Prettier Documentation](https://prettier.io/docs/)
- [Pre-commit Documentation](https://pre-commit.com/)