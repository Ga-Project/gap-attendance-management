# コンポーネント仕様書

## 概要

React フロントエンドアプリケーションのコンポーネント仕様書です。各コンポーネントの責務、Props、状態管理について説明します。

## アーキテクチャ概要

```
src/
├── components/          # 再利用可能なコンポーネント
├── pages/              # ページコンポーネント
├── contexts/           # React Context
├── services/           # API通信・ビジネスロジック
├── hooks/              # カスタムフック
└── types/              # TypeScript型定義
```

## 認証関連コンポーネント

### LoginPage

**責務**: Google OAuth 認証のログインページ

**ファイル**: `src/pages/LoginPage.tsx`

**Props**: なし

**状態**:

```typescript
interface LoginPageState {
  isLoading: boolean;
  error: string | null;
}
```

**主要機能**:

- Google OAuth 認証ボタンの表示
- 認証成功時のリダイレクト処理
- エラーハンドリング

**使用例**:

```tsx
<LoginPage />
```

### AuthProvider

**責務**: アプリケーション全体の認証状態管理

**ファイル**: `src/contexts/AuthContext.tsx`

**Context 値**:

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

**使用例**:

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### ProtectedRoute

**責務**: 認証が必要なルートの保護

**ファイル**: `src/components/ProtectedRoute.tsx`

**Props**:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}
```

**使用例**:

```tsx
<ProtectedRoute requireAuth={true}>
  <Dashboard />
</ProtectedRoute>
```

### AdminRoute

**責務**: 管理者権限が必要なルートの保護

**ファイル**: `src/components/AdminRoute.tsx`

**Props**:

```typescript
interface AdminRouteProps {
  children: React.ReactNode;
}
```

**使用例**:

```tsx
<AdminRoute>
  <AdminDashboard />
</AdminRoute>
```

## ダッシュボード関連コンポーネント

### Dashboard

**責務**: 一般ユーザーのメインダッシュボード

**ファイル**: `src/pages/Dashboard.tsx`

**Props**: なし

**状態**:

```typescript
interface DashboardState {
  todayAttendance: Attendance | null;
  isLoading: boolean;
  error: string | null;
}
```

**主要機能**:

- 当日の勤怠状況表示
- 打刻ウィジェットの表示
- 勤怠履歴へのナビゲーション

### TimeClockWidget

**責務**: 勤怠打刻ボタン群の表示と操作

**ファイル**: `src/components/TimeClockWidget.tsx`

**Props**:

```typescript
interface TimeClockWidgetProps {
  attendance: Attendance | null;
  onClockAction: (action: ClockAction) => Promise<void>;
  isLoading?: boolean;
}

type ClockAction = "clock_in" | "clock_out" | "break_start" | "break_end";
```

**状態**:

```typescript
interface TimeClockWidgetState {
  isProcessing: boolean;
  lastAction: ClockAction | null;
}
```

**主要機能**:

- 現在の勤怠状態に応じたボタン表示制御
- 打刻処理の実行
- 成功・エラーメッセージの表示

**使用例**:

```tsx
<TimeClockWidget
  attendance={todayAttendance}
  onClockAction={handleClockAction}
  isLoading={isLoading}
/>
```

### AttendanceHistory

**責務**: 個人の勤怠履歴表示

**ファイル**: `src/components/AttendanceHistory.tsx`

**Props**:

```typescript
interface AttendanceHistoryProps {
  userId?: number;
  startDate?: string;
  endDate?: string;
  showUserInfo?: boolean;
}
```

**状態**:

```typescript
interface AttendanceHistoryState {
  attendances: Attendance[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  filters: {
    startDate: string;
    endDate: string;
  };
}
```

**主要機能**:

- 勤怠履歴の一覧表示
- 日付範囲フィルタリング
- ページネーション
- 月次統計の表示

## 管理者関連コンポーネント

### AdminDashboard

**責務**: 管理者のメインダッシュボード

**ファイル**: `src/pages/AdminDashboard.tsx`

**Props**: なし

**状態**:

```typescript
interface AdminDashboardState {
  stats: {
    totalUsers: number;
    todayAttendances: number;
    pendingApprovals: number;
  };
  isLoading: boolean;
  error: string | null;
}
```

**主要機能**:

- 全体統計の表示
- 管理機能へのナビゲーション
- 最近のアクティビティ表示

### UserList

**責務**: 全ユーザー一覧の表示と管理

**ファイル**: `src/components/admin/UserList.tsx`

**Props**:

```typescript
interface UserListProps {
  onUserSelect?: (user: User) => void;
  showActions?: boolean;
}
```

**状態**:

```typescript
interface UserListState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  searchQuery: string;
  selectedUsers: number[];
}
```

**主要機能**:

- ユーザー一覧の表示
- 検索・フィルタリング
- ユーザー詳細への遷移
- 一括操作

### AttendanceManagement

**責務**: 全社員の勤怠データ管理

**ファイル**: `src/components/admin/AttendanceManagement.tsx`

**Props**:

```typescript
interface AttendanceManagementProps {
  userId?: number;
  initialDateRange?: {
    startDate: string;
    endDate: string;
  };
}
```

**状態**:

```typescript
interface AttendanceManagementState {
  attendances: AttendanceWithUser[];
  isLoading: boolean;
  error: string | null;
  filters: {
    userId: number | null;
    startDate: string;
    endDate: string;
  };
  editingAttendance: Attendance | null;
}
```

**主要機能**:

- 全社員勤怠データの表示
- フィルタリング・検索
- 勤怠データの編集
- CSV エクスポート

### AuditLogs

**責務**: 監査ログの表示

**ファイル**: `src/components/admin/AuditLogs.tsx`

**Props**:

```typescript
interface AuditLogsProps {
  targetUserId?: number;
  action?: string;
}
```

**状態**:

```typescript
interface AuditLogsState {
  logs: AuditLog[];
  isLoading: boolean;
  error: string | null;
  filters: {
    targetUserId: number | null;
    action: string | null;
    startDate: string;
    endDate: string;
  };
  pagination: PaginationInfo;
}
```

**主要機能**:

- 監査ログの一覧表示
- フィルタリング機能
- ログ詳細の表示

## 共通コンポーネント

### ErrorBoundary

**責務**: React エラーの捕捉と表示

**ファイル**: `src/components/ErrorBoundary.tsx`

**Props**:

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}
```

**状態**:

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}
```

**使用例**:

```tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### NotificationProvider

**責務**: アプリケーション全体の通知管理

**ファイル**: `src/components/NotificationProvider.tsx`

**Context 値**:

```typescript
interface NotificationContextType {
  showNotification: (
    message: string,
    type: "success" | "error" | "info"
  ) => void;
  hideNotification: () => void;
}
```

**使用例**:

```tsx
<NotificationProvider>
  <App />
</NotificationProvider>
```

## カスタムフック

### useErrorHandler

**責務**: エラーハンドリングの共通化

**ファイル**: `src/hooks/useErrorHandler.ts`

**戻り値**:

```typescript
interface UseErrorHandlerReturn {
  handleError: (error: unknown) => void;
  clearError: () => void;
  error: string | null;
}
```

**使用例**:

```tsx
const { handleError, clearError, error } = useErrorHandler();

try {
  await apiCall();
} catch (err) {
  handleError(err);
}
```

## サービス層

### API Service

**責務**: HTTP 通信の抽象化

**ファイル**: `src/services/api.ts`

**主要機能**:

- Axios インスタンスの設定
- 認証ヘッダーの自動付与
- エラーハンドリング
- レスポンスインターセプター

### Attendance Service

**責務**: 勤怠関連 API 呼び出し

**ファイル**: `src/services/attendance.ts`

**主要メソッド**:

```typescript
interface AttendanceService {
  getTodayAttendance(): Promise<Attendance | null>;
  getAttendanceHistory(
    params: AttendanceHistoryParams
  ): Promise<AttendanceHistoryResponse>;
  clockIn(): Promise<void>;
  clockOut(): Promise<void>;
  startBreak(): Promise<void>;
  endBreak(): Promise<void>;
}
```

### Google Auth Service

**責務**: Google OAuth 認証処理

**ファイル**: `src/services/googleAuth.ts`

**主要メソッド**:

```typescript
interface GoogleAuthService {
  initializeGoogleAuth(): Promise<void>;
  signIn(): Promise<string>;
  signOut(): Promise<void>;
  getCurrentUser(): gapi.auth2.GoogleUser | null;
}
```

## 型定義

### User

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: "employee" | "admin";
  createdAt: string;
  updatedAt: string;
}
```

### Attendance

```typescript
interface Attendance {
  id: number;
  userId: number;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  status: "not_started" | "clocked_in" | "on_break" | "clocked_out";
  records: AttendanceRecord[];
}
```

### AttendanceRecord

```typescript
interface AttendanceRecord {
  id: number;
  attendanceId: number;
  recordType: "clock_in" | "clock_out" | "break_start" | "break_end";
  timestamp: string;
}
```

### AuditLog

```typescript
interface AuditLog {
  id: number;
  adminUser: User;
  targetUser: User;
  action: string;
  changes: Record<string, [string, string]>;
  reason: string;
  createdAt: string;
}
```

## スタイリング規約

### CSS Modules

各コンポーネントは対応する `.module.css` ファイルを持ちます。

```
TimeClockWidget.tsx
TimeClockWidget.module.css
```

### クラス命名規則

BEM 記法を使用します：

```css
.timeClockWidget {
  /* ブロック */
}

.timeClockWidget__button {
  /* エレメント */
}

.timeClockWidget__button--disabled {
  /* モディファイア */
}
```

### レスポンシブデザイン

```css
/* モバイルファースト */
.component {
  /* モバイル用スタイル */
}

@media (min-width: 768px) {
  .component {
    /* タブレット用スタイル */
  }
}

@media (min-width: 1024px) {
  .component {
    /* デスクトップ用スタイル */
  }
}
```

## テスト戦略

### ユニットテスト

各コンポーネントに対応するテストファイルを作成：

```
TimeClockWidget.tsx
__tests__/TimeClockWidget.test.tsx
```

### テストの書き方

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { TimeClockWidget } from "../TimeClockWidget";

describe("TimeClockWidget", () => {
  it("should show clock in button when not clocked in", () => {
    render(<TimeClockWidget attendance={null} onClockAction={jest.fn()} />);

    expect(screen.getByText("出勤")).toBeInTheDocument();
  });
});
```

### モック

API サービスのモック：

```typescript
jest.mock("../services/attendance", () => ({
  clockIn: jest.fn().mockResolvedValue(undefined),
  clockOut: jest.fn().mockResolvedValue(undefined),
}));
```

## パフォーマンス最適化

### React.memo

不要な再レンダリングを防ぐ：

```typescript
export const TimeClockWidget = React.memo<TimeClockWidgetProps>(
  ({ attendance, onClockAction, isLoading }) => {
    // コンポーネント実装
  }
);
```

### useMemo / useCallback

重い計算やコールバック関数の最適化：

```typescript
const expensiveValue = useMemo(() => {
  return calculateWorkHours(attendance);
}, [attendance]);

const handleClockIn = useCallback(async () => {
  await onClockAction("clock_in");
}, [onClockAction]);
```

### 遅延読み込み

```typescript
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));

<Suspense fallback={<div>Loading...</div>}>
  <AdminDashboard />
</Suspense>;
```

## アクセシビリティ

### ARIA 属性

```tsx
<button
  aria-label="出勤打刻"
  aria-describedby="clock-in-description"
  disabled={isLoading}
>
  出勤
</button>
```

### キーボードナビゲーション

```tsx
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
>
  クリック可能な要素
</div>
```

### セマンティック HTML

```tsx
<main>
  <h1>勤怠管理ダッシュボード</h1>
  <section aria-labelledby="today-attendance">
    <h2 id="today-attendance">本日の勤怠</h2>
    {/* 内容 */}
  </section>
</main>
```
