import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthContext } from '../../contexts/AuthContext';
import { User } from '../../types';

const mockUser: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'employee',
};

const mockAuthContextValue = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
};

const TestComponent = () => <div>Protected Content</div>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>,
  );
};

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', () => {
    renderWithRouter(
      <AuthContext.Provider value={mockAuthContextValue}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    const unauthenticatedContext = {
      ...mockAuthContextValue,
      user: null,
    };

    renderWithRouter(
      <AuthContext.Provider value={unauthenticatedContext}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthContext.Provider>,
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows loading state when authentication is loading', () => {
    const loadingContext = {
      ...mockAuthContextValue,
      user: null,
      loading: true,
    };

    renderWithRouter(
      <AuthContext.Provider value={loadingContext}>
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});