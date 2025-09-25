# Implementation Plan

- [x] 1. プロジェクト基盤とDevContainer環境の構築
  - Docker Compose設定でPostgreSQL、Rails API、Reactの開発環境を構築
  - DevContainer設定でVS Code統合開発環境を自動構築
  - GitHub Actions CI/CDパイプラインの基本設定を実装
  - _Requirements: 12.1, 14.1, 14.2, 15.1, 15.2_

- [x] 2. コード品質管理ツールの設定
  - RubocopとESLintの設定ファイルを作成し、プロジェクト標準を定義
  - Pre-commitフックを設定してコミット前の自動Lintチェックを実装
  - GitHub ActionsワークフローにLintチェックを統合
  - _Requirements: 11.1, 11.2, 11.4, 13.2, 13.3_

- [x] 3. Rails APIプロジェクトの初期設定
  - Rails 7 API modeプロジェクトを作成し、基本的なGemfileを設定
  - PostgreSQLデータベース接続とCORS設定を実装
  - JWT認証とGoogle OAuth2の基本設定を追加
  - _Requirements: 1.2, 2.2, 10.1_

- [x] 4. Reactフロントエンドプロジェクトの初期設定
  - React 18 + TypeScriptプロジェクトを作成し、基本的なpackage.jsonを設定
  - React Router、Axios、Material-UIの基本設定を実装
  - Google OAuth2クライアントライブラリの設定を追加
  - _Requirements: 1.1, 2.1, 11.2_

- [x] 5. データベースモデルとマイグレーションの実装
- [x] 5.1 Userモデルの作成
  - Google OAuth認証に対応したUserモデルを実装
  - ロール管理（employee/admin）のenum設定を追加
  - バリデーションとアソシエーションを定義
  - _Requirements: 1.3, 7.2, 10.4_

- [x] 5.2 Attendanceモデルの作成
  - 日次勤怠記録を管理するAttendanceモデルを実装
  - ステータス管理（not_started/clocked_in/on_break/clocked_out）を追加
  - 勤務時間と休憩時間の計算ロジックを実装
  - _Requirements: 3.2, 4.4, 5.4, 10.3_

- [x] 5.3 AttendanceRecordモデルの作成
  - 個別打刻記録を管理するAttendanceRecordモデルを実装
  - 打刻タイプ（clock_in/clock_out/break_start/break_end）のenum設定
  - タイムスタンプの正確な記録機能を実装
  - _Requirements: 3.4, 4.4, 5.3, 10.3_

- [x] 5.4 AuditLogモデルの作成
  - 管理者による変更履歴を記録するAuditLogモデルを実装
  - 変更内容のJSON形式保存と理由記録機能を追加
  - 監査ログの検索・フィルタリング機能を実装
  - _Requirements: 9.3, 10.5_

- [x] 6. Google OAuth認証システムの実装
- [x] 6.1 バックエンド認証サービスの実装
  - GoogleAuthServiceクラスでOAuth認証処理を実装
  - JwtServiceクラスでトークン生成・検証機能を実装
  - AuthControllerで認証エンドポイントを作成
  - _Requirements: 1.2, 1.3, 2.2, 2.3_

- [x] 6.2 フロントエンド認証コンポーネントの実装
  - LoginPageコンポーネントでGoogle OAuthログインUIを実装
  - AuthProviderでReact Context APIを使用した認証状態管理を実装
  - ProtectedRouteコンポーネントで認証済みルート保護を実装
  - _Requirements: 1.1, 2.1, 2.4, 2.5_

- [x] 7. 勤怠打刻機能の実装
- [x] 7.1 バックエンド勤怠APIの実装
  - AttendancesControllerで打刻エンドポイント（clock_in/clock_out/break_start/break_end）を実装
  - 打刻順序の検証と重複チェックのビジネスロジックを実装
  - 勤務時間と休憩時間の自動計算機能を実装
  - _Requirements: 3.2, 4.2, 5.2, 5.3, 10.2, 10.4_

- [x] 7.2 フロントエンド打刻UIの実装
  - TimeClockWidgetコンポーネントで打刻ボタン群のUIを実装
  - 現在の勤怠状態に応じたボタンの表示/非表示制御を実装
  - 打刻成功・エラー時の確認メッセージ表示機能を実装
  - _Requirements: 3.1, 3.3, 4.1, 4.3, 5.1_

- [ ] 8. 個人勤怠実績表示機能の実装
- [ ] 8.1 バックエンド実績取得APIの実装
  - 個人勤怠履歴取得エンドポイントを実装
  - 日付範囲指定と月次集計機能を実装
  - 勤務統計（総勤務時間、総休憩時間）の計算機能を実装
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8.2 フロントエンド実績表示UIの実装
  - AttendanceHistoryコンポーネントで個人実績表示UIを実装
  - 日付選択機能と月次表示切り替え機能を実装
  - データが存在しない場合の適切なメッセージ表示を実装
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. 管理者機能の実装
- [ ] 9.1 管理者権限システムの実装
  - 管理者権限チェックのミドルウェアを実装
  - AdminControllerで管理者専用エンドポイントを作成
  - 権限に応じたナビゲーションメニューの表示制御を実装
  - _Requirements: 7.1, 7.3, 7.4, 8.1_

- [ ] 9.2 全社員勤怠管理機能の実装
  - 全ユーザー勤怠データ取得APIを実装
  - UserListコンポーネントで全社員一覧表示UIを実装
  - 日付範囲指定と月次レポート機能を実装
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 9.3 勤怠データ修正機能の実装
  - 勤怠データ修正APIとバリデーション機能を実装
  - AttendanceEditorコンポーネントで修正フォームUIを実装
  - 修正履歴の監査ログ記録機能を実装
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 9.4 CSVエクスポート機能の実装
  - 勤怠データCSVエクスポートAPIを実装
  - フロントエンドでCSVダウンロード機能を実装
  - エクスポート対象期間の指定機能を実装
  - _Requirements: 8.5_

- [ ] 10. テストスイートの実装
- [ ] 10.1 バックエンドテストの実装
  - RSpecでモデル、サービス、コントローラーのユニットテストを実装
  - 認証フロー、打刻フロー、管理者機能の統合テストを実装
  - FactoryBotでテストデータ生成の仕組みを構築
  - _Requirements: 1.4, 2.6, 3.2, 4.2, 5.2, 7.1, 8.1, 9.1_

- [ ] 10.2 フロントエンドテストの実装
  - Jest + React Testing Libraryでコンポーネントのユニットテストを実装
  - 認証フロー、打刻フロー、実績表示の統合テストを実装
  - APIエラーハンドリングのテストケースを実装
  - _Requirements: 1.5, 2.6, 3.1, 4.1, 6.1, 8.1_

- [ ] 11. エラーハンドリングとユーザビリティの向上
- [ ] 11.1 バックエンドエラーハンドリングの実装
  - 認証エラー、業務ロジックエラー、システムエラーの適切な処理を実装
  - エラーレスポンスの標準化とログ出力機能を実装
  - Google OAuth接続エラーの処理を実装
  - _Requirements: 1.5, 2.6, 10.2_

- [ ] 11.2 フロントエンドエラーハンドリングの実装
  - Error BoundaryコンポーネントでReactエラーの処理を実装
  - AxiosインターセプターでAPIエラーの統一処理を実装
  - ユーザーフレンドリーなエラーメッセージ表示を実装
  - _Requirements: 1.5, 2.6, 3.3, 4.3, 5.1_

- [ ] 12. 本番環境準備とドキュメント整備
- [ ] 12.1 本番環境用Docker設定の実装
  - 本番用Dockerfileとdocker-compose.prod.ymlを作成
  - 環境変数管理とセキュリティ設定を実装
  - データベースマイグレーションの自動実行設定を追加
  - _Requirements: 15.4, 15.5_

- [ ] 12.2 デプロイメントとドキュメントの整備
  - README.mdでセットアップ手順と使用方法を文書化
  - API仕様書とコンポーネント仕様書を作成
  - 開発者向けのコントリビューションガイドを作成
  - _Requirements: 12.1, 14.4_