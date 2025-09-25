# Docker Command Guidelines

このプロジェクトでは、Rails、Bundle、NPMコマンドは必ずDocker内で実行する必要があります。

## コマンド変換ルール

### Railsコマンド
- `rails` → `docker compose exec backend rails`
- `bundle exec rails` → `docker compose exec backend rails`

例：
- `rails generate model User name:string` → `docker compose exec backend rails generate model User name:string`
- `rails db:migrate` → `docker compose exec backend rails db:migrate`
- `rails console` → `docker compose exec backend rails console`
- `rails server` → `docker compose exec backend rails server`

### Bundleコマンド
- `bundle` → `docker compose exec backend bundle`
- `bundle install` → `docker compose exec backend bundle install`
- `bundle update` → `docker compose exec backend bundle update`
- `bundle exec` → `docker compose exec backend rails` (railsコマンドの場合)

### NPMコマンド
- `npm` → `docker compose exec frontend npm`
- `npm install` → `docker compose exec frontend npm install`
- `npm run` → `docker compose exec frontend npm run`
- `npm start` → `docker compose exec frontend npm start`

## 重要な注意事項

1. **必須**: rails、bundle、npmコマンドを提案する際は、必ずDockerラッパースクリプトを使用してください
2. **直接実行禁止**: ローカルでのrails、bundle、npmコマンドの直接実行は避けてください
3. **統合スクリプト推奨**: `docker compose exec` の使用を推奨します

## 例外

以下のコマンドはDockerラッパーを使用しません：
- `docker-compose` コマンド
- `git` コマンド
- システム管理コマンド（`ls`, `cd`, `mkdir` など）