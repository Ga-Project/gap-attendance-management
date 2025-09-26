import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminRoute from '../AdminRoute';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';

const mockEmployeeUser: User = {
  id: '1',
  name: 'Test Employee',
  email: 'employee@example.com',
  role: 'employee',
};

const mockAdminUser: User = {
  id: '2',
  name: 'Test Admin',
  email: 'admin@example.com',
  role: 'admin',
};

const TestComponent = () => <div>Admin Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>,
  );
};

describe('AdminRoute', () => {
  it('renders children when user is admin', () => {
    const adminContext = {
      user: mockAdminUser,
      signIn: jest.fn(),
      signOut: jest.fn(),
      loading: false,
      isAuthenticated: true,
      error: null,
    };

    renderWithRouter(
      <AuthContext.Provider value={adminContext}>
        <AdminRoute>
          <TestComponent />
        </AdminRoute>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects to dashboard when user is not admin', () => {
    const employeeContext = {
      user: mockEmployeeUser,
      signIn: jest.fn(),
      signOut: jest.fn(),
      loading: false,
      isAuthenticated: true,
      error: null,
    };

    renderWithRouter(
      <AuthContext.Provider value={employeeContext}>
        <AdminRoute>
          <TestComponent />
        </AdminRoute>
      </AuthContext.Provider>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    const unauthenticatedContext = {
      user: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      loading: false,
      isAuthenticated: false,
      error: null,
    };

    renderWithRouter(
      <AuthContext.Provider value={unauthenticatedContext}>
        <AdminRoute>
          <TestComponent />
        </AdminRoute>
      </AuthContext.Provider>,
    );

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('shows loading state when authentication is loading', () => {
    const loadingContext = {
      user: null,
      signIn: jest.fn(),
      signOut: jest.fn(),
      loading: true,
      isAuthenticated: false,
      error: null,
    };

    renderWithRouter(
      <AuthContext.Provider value={loadingContext}>
        <AdminRoute>
          <TestComponent />
        </AdminRoute>
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
});