# コントリビューションガイド

勤怠管理システムの開発に参加していただき、ありがとうございます。このガイドでは、プロジェクトへの貢献方法について説明します。

## 📋 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [開発ワークフロー](#開発ワークフロー)
- [コーディング規約](#コーディング規約)
- [テスト](#テスト)
- [プルリクエスト](#プルリクエスト)
- [Issue 報告](#issue報告)
- [コミュニケーション](#コミュニケーション)

## 🚀 開発環境のセットアップ

### 前提条件

- Docker Desktop (最新版)
- Visual Studio Code
- Git
- Node.js 18+ (ローカル開発用、オプション)
- Ruby 3.2+ (ローカル開発用、オプション)

### セットアップ手順

1. **リポジトリをフォーク**
   - GitHub でリポジトリをフォーク
   - フォークしたリポジトリをローカルにクローン

```bash
git clone https://github.com/your-username/attendance-management.git
cd attendance-management
```

2. **上流リポジトリを追加**

```bash
git remote add upstream https://github.com/original-repo/attendance-management.git
```

3. **開発環境を起動**

```bash
# DevContainerを使用する場合
code .
# VS Codeで「Reopen in Container」を選択

# または直接Docker Composeを使用
docker-compose up -d
```

4. **データベースセットアップ**

```bash
docker compose exec backend rails db:create db:migrate db:seed
```

5. **動作確認**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔄 開発ワークフロー

### ブランチ戦略

```
main          # 本番環境用（保護されたブランチ）
├── develop   # 開発統合ブランチ
└── feature/* # 機能開発ブランチ
└── bugfix/*  # バグ修正ブランチ
└── hotfix/*  # 緊急修正ブランチ
```

### 開発の流れ

1. **最新のコードを取得**

```bash
git checkout develop
git pull upstream develop
```

2. **機能ブランチを作成**

```bash
git checkout -b feature/your-feature-name
```

3. **開発・テスト**

```bash
# コードを実装
# テストを追加・実行
docker compose exec backend rspec
docker compose exec frontend npm test

# Lintチェック
docker compose exec backend bundle exec rubocop
docker compose exec frontend npm run lint
```

4. **コミット**

```bash
git add .
git commit -m "feat: 新機能の説明"
```

5. **プッシュ・プルリクエスト**

```bash
git push origin feature/your-feature-name
# GitHubでプルリクエストを作成
```

### ブランチ命名規則

- `feature/機能名`: 新機能開発
- `bugfix/バグ名`: バグ修正
- `hotfix/緊急修正名`: 緊急修正
- `docs/ドキュメント名`: ドキュメント更新
- `refactor/リファクタリング名`: リファクタリング

例:

- `feature/user-profile-edit`
- `bugfix/attendance-calculation-error`
- `docs/api-specification-update`

## 📝 コーディング規約

### 共通規約

- **言語**: コメント・ドキュメントは日本語、コード・変数名は英語
- **インデント**: スペース 2 文字
- **改行コード**: LF
- **文字エンコーディング**: UTF-8

### Ruby (Backend)

#### スタイルガイド

Rubocop の設定に従います。主要なルール：

```ruby
# クラス名: PascalCase
class AttendanceService
end

# メソッド名・変数名: snake_case
def calculate_work_hours
  total_minutes = 0
end

# 定数: SCREAMING_SNAKE_CASE
MAX_WORK_HOURS = 8

# コメント: 日本語で記述
# ユーザーの勤務時間を計算する
def calculate_work_hours(attendance)
  # 実装
end
```

#### Rails 規約

```ruby
# モデル
class User < ApplicationRecord
  # アソシエーション
  has_many :attendances, dependent: :destroy

  # バリデーション
  validates :email, presence: true, uniqueness: true

  # スコープ
  scope :active, -> { where(active: true) }

  # メソッド（public → private の順）
  def full_name
    "#{first_name} #{last_name}"
  end

  private

  def some_private_method
    # 実装
  end
end

# コントローラー
class Api::V1::AttendancesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_attendance, only: [:show, :update, :destroy]

  def index
    @attendances = current_user.attendances.includes(:records)
    render json: @attendances
  end

  private

  def set_attendance
    @attendance = current_user.attendances.find(params[:id])
  end

  def attendance_params
    params.require(:attendance).permit(:clock_in_time, :clock_out_time)
  end
end
```

### TypeScript/React (Frontend)

#### スタイルガイド

ESLint の設定に従います。主要なルール：

```typescript
// インターフェース名: PascalCase
interface UserProfile {
  id: number;
  name: string;
  email: string;
}

// 型名: PascalCase
type AttendanceStatus = "clocked_in" | "clocked_out" | "on_break";

// 変数名・関数名: camelCase
const userName = "John Doe";
const calculateWorkHours = (attendance: Attendance): number => {
  // 実装
};

// 定数: SCREAMING_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// コンポーネント名: PascalCase
const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({ attendance }) => {
  return <div>{/* JSX */}</div>;
};
```

#### React 規約

```typescript
// Props型定義
interface TimeClockWidgetProps {
  attendance: Attendance | null;
  onClockAction: (action: ClockAction) => Promise<void>;
  isLoading?: boolean;
}

// 関数コンポーネント
const TimeClockWidget: React.FC<TimeClockWidgetProps> = ({
  attendance,
  onClockAction,
  isLoading = false,
}) => {
  // Hooks（useState → useEffect → カスタムフックの順）
  const [isProcessing, setIsProcessing] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    // 副作用処理
  }, [attendance]);

  // イベントハンドラー
  const handleClockIn = useCallback(async () => {
    try {
      setIsProcessing(true);
      await onClockAction("clock_in");
      showNotification("出勤打刻が完了しました", "success");
    } catch (error) {
      showNotification("エラーが発生しました", "error");
    } finally {
      setIsProcessing(false);
    }
  }, [onClockAction, showNotification]);

  // 条件分岐による早期リターン
  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  return <div className={styles.timeClockWidget}>{/* JSX */}</div>;
};

// メモ化（必要な場合のみ）
export default React.memo(TimeClockWidget);
```

### CSS

#### スタイルガイド

```css
/* BEM記法を使用 */
.timeClockWidget {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeClockWidget__button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.timeClockWidget__button--primary {
  background-color: #3b82f6;
  color: white;
}

.timeClockWidget__button--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* レスポンシブデザイン（モバイルファースト） */
@media (min-width: 768px) {
  .timeClockWidget {
    flex-direction: row;
  }
}
```

## 🧪 テスト

### テスト戦略

- **ユニットテスト**: 個別の関数・コンポーネントのテスト
- **統合テスト**: 複数のコンポーネント間の連携テスト
- **E2E テスト**: ユーザーシナリオのテスト

### Backend (RSpec)

```ruby
# spec/models/user_spec.rb
RSpec.describe User, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
  end

  describe 'associations' do
    it { should have_many(:attendances).dependent(:destroy) }
  end

  describe '#full_name' do
    let(:user) { create(:user, first_name: '太郎', last_name: '山田') }

    it 'returns full name' do
      expect(user.full_name).to eq('太郎 山田')
    end
  end
end

# spec/controllers/api/v1/attendances_controller_spec.rb
RSpec.describe Api::V1::AttendancesController, type: :controller do
  let(:user) { create(:user) }

  before { sign_in user }

  describe 'POST #clock_in' do
    context 'when user is not clocked in' do
      it 'creates attendance record' do
        expect {
          post :clock_in
        }.to change(Attendance, :count).by(1)
      end

      it 'returns success response' do
        post :clock_in
        expect(response).to have_http_status(:created)
      end
    end

    context 'when user is already clocked in' do
      before { create(:attendance, user: user, status: :clocked_in) }

      it 'returns error response' do
        post :clock_in
        expect(response).to have_http_status(:bad_request)
      end
    end
  end
end
```

### Frontend (Jest + React Testing Library)

```typescript
// src/components/__tests__/TimeClockWidget.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TimeClockWidget } from "../TimeClockWidget";

describe("TimeClockWidget", () => {
  const mockOnClockAction = jest.fn();

  beforeEach(() => {
    mockOnClockAction.mockClear();
  });

  it("shows clock in button when not clocked in", () => {
    render(
      <TimeClockWidget attendance={null} onClockAction={mockOnClockAction} />
    );

    expect(screen.getByText("出勤")).toBeInTheDocument();
    expect(screen.queryByText("退勤")).not.toBeInTheDocument();
  });

  it("calls onClockAction when clock in button is clicked", async () => {
    render(
      <TimeClockWidget attendance={null} onClockAction={mockOnClockAction} />
    );

    fireEvent.click(screen.getByText("出勤"));

    await waitFor(() => {
      expect(mockOnClockAction).toHaveBeenCalledWith("clock_in");
    });
  });

  it("shows loading state when isLoading is true", () => {
    render(
      <TimeClockWidget
        attendance={null}
        onClockAction={mockOnClockAction}
        isLoading={true}
      />
    );

    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });
});
```

### テスト実行

```bash
# Backend
docker compose exec backend rspec
docker compose exec backend rspec spec/models/user_spec.rb  # 特定ファイル

# Frontend
docker compose exec frontend npm test
docker compose exec frontend npm test -- --watch  # ウォッチモード
docker compose exec frontend npm test -- --coverage  # カバレッジ

# 全テスト実行
./scripts/run-all-tests.sh
```

## 📤 プルリクエスト

### プルリクエストの作成

1. **タイトル**: 簡潔で分かりやすいタイトル
2. **説明**: 変更内容と理由を詳しく記述
3. **関連 Issue**: 関連する Issue があれば記載
4. **テスト**: テストの追加・実行結果
5. **スクリーンショット**: UI 変更がある場合

### プルリクエストテンプレート

```markdown
## 概要

<!-- 変更内容の概要を記述 -->

## 変更内容

<!-- 具体的な変更内容をリストアップ -->

- [ ] 機能 A を追加
- [ ] バグ B を修正
- [ ] テスト C を追加

## 関連 Issue

<!-- 関連するIssueがあれば記載 -->

Closes #123

## テスト

<!-- テストの実行結果や追加したテストについて記述 -->

- [ ] 既存テストが通ることを確認
- [ ] 新しいテストを追加
- [ ] 手動テストを実行

## スクリーンショット

<!-- UI変更がある場合はスクリーンショットを添付 -->

## チェックリスト

- [ ] コードレビューの準備ができている
- [ ] テストが通る
- [ ] Lint エラーがない
- [ ] ドキュメントを更新した（必要な場合）
```

### レビュープロセス

1. **自動チェック**: CI/CD で Lint・テストが実行
2. **コードレビュー**: 最低 1 名のレビューが必要
3. **修正対応**: レビューコメントに対する修正
4. **承認**: レビュアーの承認
5. **マージ**: メインブランチにマージ

### レビューのポイント

#### レビュアー向け

- **機能性**: 要件を満たしているか
- **コード品質**: 可読性・保守性・パフォーマンス
- **テスト**: 適切なテストが書かれているか
- **セキュリティ**: セキュリティ上の問題がないか
- **ドキュメント**: 必要なドキュメントが更新されているか

#### 作成者向け

- **小さな PR**: 大きすぎる PR は避ける
- **明確な説明**: 変更理由と内容を明確に記述
- **テスト**: 変更に対応するテストを追加
- **自己レビュー**: 提出前に自分でコードを確認

## 🐛 Issue 報告

### バグ報告

```markdown
## バグの概要

<!-- バグの簡潔な説明 -->

## 再現手順

1. ページ A にアクセス
2. ボタン B をクリック
3. エラーが発生

## 期待される動作

<!-- 本来どうあるべきか -->

## 実際の動作

<!-- 実際に何が起こったか -->

## 環境

- OS: macOS 13.0
- ブラウザ: Chrome 120.0
- デバイス: MacBook Pro

## スクリーンショット

<!-- エラー画面のスクリーンショット -->

## 追加情報

<!-- その他の関連情報 -->
```

### 機能要望

```markdown
## 機能の概要

<!-- 要望する機能の簡潔な説明 -->

## 背景・理由

<!-- なぜこの機能が必要か -->

## 提案する解決策

<!-- どのような実装を想定しているか -->

## 代替案

<!-- 他に考えられる解決策 -->

## 追加情報

<!-- その他の関連情報 -->
```

### ラベルの使用

- `bug`: バグ報告
- `enhancement`: 機能要望
- `documentation`: ドキュメント関連
- `good first issue`: 初心者向け
- `help wanted`: ヘルプ募集
- `priority: high`: 高優先度
- `priority: low`: 低優先度

## 💬 コミュニケーション

### コミュニケーションチャンネル

- **GitHub Issues**: バグ報告・機能要望
- **GitHub Discussions**: 一般的な議論
- **Slack**: #attendance-system チャンネル（社内）
- **プルリクエスト**: コードレビュー

### コミュニケーションのガイドライン

- **建設的**: 建設的なフィードバックを心がける
- **具体的**: 具体的で実行可能な提案をする
- **尊重**: 他の開発者を尊重する
- **迅速**: 質問や要求には迅速に対応する

## 📚 参考資料

### 技術ドキュメント

- [API 仕様書](./api-specification.md)
- [コンポーネント仕様書](./component-specification.md)
- [セキュリティ設定](../config/security.md)

### 外部リソース

- [Ruby Style Guide](https://rubystyle.guide/)
- [Rails Guide](https://guides.rubyonrails.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎉 貢献者への感謝

プロジェクトに貢献していただいた皆様に心から感謝いたします。あなたの貢献により、より良いシステムを構築することができます。

### 貢献の種類

- **コード**: 新機能・バグ修正・リファクタリング
- **ドキュメント**: README・API 仕様書・ガイドの改善
- **テスト**: テストケースの追加・改善
- **レビュー**: コードレビュー・フィードバック
- **Issue 報告**: バグ報告・機能要望
- **議論**: 設計・実装方針の議論

すべての貢献が価値あるものです。どんな小さな貢献でも歓迎します！

---

**最終更新**: 2025 年 9 月 26 日
