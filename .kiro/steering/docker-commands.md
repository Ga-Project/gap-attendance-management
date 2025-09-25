# Docker Command Guidelines

このプロジェクトでは、Rails、Bundle、NPMコマンドは必ずDocker内で実行する必要があります。

## コマンド変換ルール

### Railsコマンド
- `rails` → `./scripts/docker-cmd.sh rails`
- `bundle exec rails` → `./scripts/docker-cmd.sh rails`

例：
- `rails generate model User name:string` → `./scripts/docker-cmd.sh rails generate model User name:string`
- `rails db:migrate` → `./scripts/docker-cmd.sh rails db:migrate`
- `rails console` → `./scripts/docker-cmd.sh rails console`
- `rails server` → `./scripts/docker-cmd.sh rails server`

### Bundleコマンド
- `bundle` → `./scripts/docker-cmd.sh bundle`
- `bundle install` → `./scripts/docker-cmd.sh bundle install`
- `bundle update` → `./scripts/docker-cmd.sh bundle update`
- `bundle exec` → `./scripts/docker-cmd.sh rails` (railsコマンドの場合)

### NPMコマンド
- `npm` → `./scripts/docker-cmd.sh npm`
- `npm install` → `./scripts/docker-cmd.sh npm install`
- `npm run` → `./scripts/docker-cmd.sh npm run`
- `npm start` → `./scripts/docker-cmd.sh npm start`

## 重要な注意事項

1. **必須**: rails、bundle、npmコマンドを提案する際は、必ずDockerラッパースクリプトを使用してください
2. **直接実行禁止**: ローカルでのrails、bundle、npmコマンドの直接実行は避けてください
3. **統合スクリプト推奨**: `./scripts/docker-cmd.sh` の使用を推奨します

## 例外

以下のコマンドはDockerラッパーを使用しません：
- `docker-compose` コマンド
- `git` コマンド
- システム管理コマンド（`ls`, `cd`, `mkdir` など）