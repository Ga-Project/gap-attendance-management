# Requirements Document

## Introduction

社内で使用する勤怠管理アプリケーションの開発。従業員がアカウントを作成し、サインインして、出勤・退勤・休憩の打刻を行い、自身の稼働実績を確認できるシステムを構築する。技術スタックはRuby on Rails（API）とReact（フロントエンド）を使用し、ローカルホスト環境での稼働を前提とする。コード品質管理のため、バックエンドにはRubocop、フロントエンドにはESLintを導入する。

## Requirements

### Requirement 1

**User Story:** As a 従業員, I want Googleアカウントでサインアップする, so that 勤怠管理システムを簡単に利用開始できる

#### Acceptance Criteria

1. WHEN ユーザーがサインアップページにアクセス THEN システム SHALL 「Googleでサインアップ」ボタンを表示する
2. WHEN ユーザーが「Googleでサインアップ」ボタンをクリック THEN システム SHALL Google OAuth認証フローを開始する
3. WHEN ユーザーがGoogle認証を完了 THEN システム SHALL Googleアカウント情報を使用して新しいユーザーアカウントを作成する
4. WHEN ユーザーが既に登録済みのGoogleアカウントでサインアップを試行 THEN システム SHALL 既存アカウントへのサインインを促すメッセージを表示する
5. WHEN Google認証が失敗またはキャンセル THEN システム SHALL エラーメッセージを表示し、サインアップページに戻る

### Requirement 2

**User Story:** As a 従業員, I want Googleアカウントでサインインする, so that 自分の勤怠データに安全にアクセスできる

#### Acceptance Criteria

1. WHEN ユーザーがログインページにアクセス THEN システム SHALL 「Googleでサインイン」ボタンを表示する
2. WHEN ユーザーが「Googleでサインイン」ボタンをクリック THEN システム SHALL Google OAuth認証フローを開始する
3. WHEN ユーザーがGoogle認証を完了し、登録済みアカウントが存在 THEN システム SHALL ユーザーをダッシュボードにリダイレクトし、認証トークンを発行する
4. WHEN ユーザーが未登録のGoogleアカウントでサインインを試行 THEN システム SHALL サインアップを促すメッセージを表示する
5. WHEN ユーザーがサインアウトボタンをクリック THEN システム SHALL ユーザーをログアウトし、ログインページにリダイレクトする
6. WHEN Google認証が失敗またはキャンセル THEN システム SHALL エラーメッセージを表示し、ログインページに戻る

### Requirement 3

**User Story:** As a 従業員, I want 出勤打刻をする, so that 勤務開始時刻を記録できる

#### Acceptance Criteria

1. WHEN ユーザーがダッシュボードにアクセスし、まだ出勤打刻していない THEN システム SHALL 「出勤」ボタンを表示する
2. WHEN ユーザーが「出勤」ボタンをクリック THEN システム SHALL 現在時刻で出勤記録を作成し、確認メッセージを表示する
3. WHEN ユーザーが既に出勤打刻済みの場合 THEN システム SHALL 「出勤」ボタンを無効化または非表示にする
4. WHEN ユーザーが出勤打刻を行う THEN システム SHALL 打刻時刻と日付を正確に記録する

### Requirement 4

**User Story:** As a 従業員, I want 退勤打刻をする, so that 勤務終了時刻を記録できる

#### Acceptance Criteria

1. WHEN ユーザーが出勤打刻済みで退勤打刻していない THEN システム SHALL 「退勤」ボタンを表示する
2. WHEN ユーザーが「退勤」ボタンをクリック THEN システム SHALL 現在時刻で退勤記録を作成し、確認メッセージを表示する
3. WHEN ユーザーが出勤打刻していない場合 THEN システム SHALL 「退勤」ボタンを無効化または非表示にする
4. WHEN ユーザーが退勤打刻を行う THEN システム SHALL その日の勤務時間を自動計算する

### Requirement 5

**User Story:** As a 従業員, I want 休憩打刻をする, so that 休憩時間を正確に記録できる

#### Acceptance Criteria

1. WHEN ユーザーが出勤打刻済みで休憩中でない THEN システム SHALL 「休憩開始」ボタンを表示する
2. WHEN ユーザーが「休憩開始」ボタンをクリック THEN システム SHALL 休憩開始時刻を記録し、「休憩終了」ボタンを表示する
3. WHEN ユーザーが休憩中で「休憩終了」ボタンをクリック THEN システム SHALL 休憩終了時刻を記録し、休憩時間を計算する
4. WHEN ユーザーが複数回休憩を取る THEN システム SHALL 各休憩時間を個別に記録し、合計休憩時間を計算する

### Requirement 6

**User Story:** As a 従業員, I want 稼働実績を確認する, so that 自分の勤務状況を把握できる

#### Acceptance Criteria

1. WHEN ユーザーが実績確認ページにアクセス THEN システム SHALL 当日の出勤時刻、退勤時刻、休憩時間、勤務時間を表示する
2. WHEN ユーザーが過去の実績を確認したい THEN システム SHALL 日付選択機能を提供し、選択した日の実績を表示する
3. WHEN ユーザーが月次実績を確認したい THEN システム SHALL 月単位での勤務日数、総勤務時間、総休憩時間を表示する
4. IF ユーザーが実績データが存在しない日を選択 THEN システム SHALL 「データがありません」メッセージを表示する

### Requirement 7

**User Story:** As a 管理者, I want 管理者権限でサインインする, so that 全社員の勤怠管理を行える

#### Acceptance Criteria

1. WHEN 管理者がGoogleアカウントでサインイン THEN システム SHALL 管理者権限を確認し、管理者ダッシュボードへリダイレクトする
2. WHEN 管理者アカウントが初回サインイン THEN システム SHALL 管理者権限を設定し、管理機能へのアクセスを許可する
3. WHEN 一般ユーザーが管理者機能にアクセスを試行 THEN システム SHALL アクセス拒否メッセージを表示し、一般ダッシュボードにリダイレクトする
4. WHEN システムが管理者を識別 THEN システム SHALL 管理者専用のナビゲーションメニューを表示する

### Requirement 8

**User Story:** As a 管理者, I want 全ユーザーの稼働実績を確認する, so that 社員の勤務状況を把握できる

#### Acceptance Criteria

1. WHEN 管理者が全社員実績ページにアクセス THEN システム SHALL 全ユーザーの一覧と各ユーザーの当日実績を表示する
2. WHEN 管理者が特定のユーザーを選択 THEN システム SHALL そのユーザーの詳細な勤怠履歴を表示する
3. WHEN 管理者が日付範囲を指定 THEN システム SHALL 指定期間内の全ユーザーの実績を表示する
4. WHEN 管理者が月次レポートを要求 THEN システム SHALL 全ユーザーの月次勤務統計を表示する
5. WHEN 管理者が実績データをエクスポート THEN システム SHALL CSV形式でデータをダウンロード可能にする

### Requirement 9

**User Story:** As a 管理者, I want ユーザーの稼働実績を修正する, so that 打刻ミスや特別な事情に対応できる

#### Acceptance Criteria

1. WHEN 管理者がユーザーの実績編集ページにアクセス THEN システム SHALL 出勤時刻、退勤時刻、休憩時間の編集フォームを表示する
2. WHEN 管理者が実績データを修正して保存 THEN システム SHALL 変更内容を記録し、修正履歴を保存する
3. WHEN 管理者が実績を修正 THEN システム SHALL 修正理由の入力を必須とし、監査ログに記録する
4. WHEN 管理者が無効な時刻データを入力 THEN システム SHALL バリデーションエラーを表示し、修正を拒否する
5. WHEN 実績が修正される THEN システム SHALL 関連する勤務時間と休憩時間を自動再計算する

### Requirement 10

**User Story:** As a システム管理者, I want データの整合性を保つ, so that 正確な勤怠管理ができる

#### Acceptance Criteria

1. WHEN システムが稼働中 THEN システム SHALL 全ての打刻データをデータベースに永続化する
2. WHEN ユーザーが不正な順序で打刻を試行（例：出勤前の退勤） THEN システム SHALL エラーメッセージを表示し、操作を拒否する
3. WHEN システムがデータを保存する THEN システム SHALL タイムゾーンを適切に処理し、一貫した時刻形式で記録する
4. WHEN ユーザーが同じ操作を重複して実行 THEN システム SHALL 重複を検知し、適切に処理する
5. WHEN 管理者が実績を修正 THEN システム SHALL 修正前後のデータを監査ログに記録する

### Requirement 11

**User Story:** As a 開発者, I want コード品質を維持する, so that 保守性の高いアプリケーションを構築できる

#### Acceptance Criteria

1. WHEN バックエンドコードが変更される THEN システム SHALL Rubocopによる静的解析を実行し、Ruby標準に準拠することを確認する
2. WHEN フロントエンドコードが変更される THEN システム SHALL ESLintによる静的解析を実行し、JavaScript/TypeScript標準に準拠することを確認する
3. WHEN Lintエラーが検出される THEN システム SHALL 具体的なエラー内容と修正方法を開発者に提示する
4. WHEN 開発環境が構築される THEN システム SHALL RubocopとESLintの設定ファイルを自動的に適用する
5. WHEN コードがコミットされる前 THEN システム SHALL Lintチェックを自動実行し、エラーがある場合はコミットを阻止する

### Requirement 12

**User Story:** As a 開発者, I want GitHubでコード管理を行う, so that チーム開発とバージョン管理を効率的に実行できる

#### Acceptance Criteria

1. WHEN プロジェクトが開始される THEN システム SHALL GitHubリポジトリを作成し、初期コードをプッシュする
2. WHEN 開発者がコードを変更 THEN システム SHALL ブランチ戦略に従ってfeatureブランチでの開発を促進する
3. WHEN プルリクエストが作成される THEN システム SHALL コードレビュープロセスを実行し、マージ前の承認を必須とする
4. WHEN メインブランチにマージされる THEN システム SHALL 自動的にCI/CDパイプラインを実行する
5. WHEN リリースが実行される THEN システム SHALL GitHubのリリース機能を使用してバージョン管理を行う

### Requirement 13

**User Story:** As a 開発者, I want GitHub Actionsで継続的インテグレーションを実行する, so that コード品質と動作を自動的に検証できる

#### Acceptance Criteria

1. WHEN コードがプッシュまたはプルリクエストが作成される THEN システム SHALL GitHub Actionsワークフローを自動実行する
2. WHEN CIワークフローが実行される THEN システム SHALL Rubocopによるバックエンドコードの静的解析を実行する
3. WHEN CIワークフローが実行される THEN システム SHALL ESLintによるフロントエンドコードの静的解析を実行する
4. WHEN CIワークフローが実行される THEN システム SHALL バックエンドとフロントエンドのテストスイートを実行する
5. WHEN CIが失敗する THEN システム SHALL プルリクエストのマージを阻止し、失敗理由を明確に表示する

### Requirement 14

**User Story:** As a 開発者, I want DevContainerで開発環境を構築する, so that 一貫した開発環境でチーム開発を行える

#### Acceptance Criteria

1. WHEN 開発者がプロジェクトをクローン THEN システム SHALL DevContainer設定により自動的に開発環境を構築する
2. WHEN DevContainerが起動される THEN システム SHALL Ruby、Node.js、PostgreSQLを含む完全な開発環境を提供する
3. WHEN DevContainer内で開発する THEN システム SHALL VS Code拡張機能とLintツールが自動的に設定される
4. WHEN 複数の開発者が参加 THEN システム SHALL 全員が同一の開発環境で作業できることを保証する
5. WHEN 開発環境に問題が発生 THEN システム SHALL DevContainerの再構築により環境をリセットできる

### Requirement 15

**User Story:** As a 開発者, I want Docker環境でアプリケーションを稼働させる, so that 本番環境と同等の環境で開発・テストできる

#### Acceptance Criteria

1. WHEN アプリケーションが起動される THEN システム SHALL DockerコンテナでRails API、React、PostgreSQLを実行する
2. WHEN Docker Composeが実行される THEN システム SHALL 全てのサービスが適切に連携して動作する
3. WHEN 開発者がローカルでテスト THEN システム SHALL Docker環境で完全なアプリケーションスタックを提供する
4. WHEN データベースマイグレーションが必要 THEN システム SHALL Dockerコンテナ内で自動的に実行する
5. WHEN 環境変数が変更される THEN システム SHALL Docker環境設定を通じて適切に反映する