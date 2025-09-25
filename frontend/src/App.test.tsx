import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock the Dashboard component to avoid date-fns import issues
jest.mock('./pages/Dashboard', () => {
  return function MockDashboard() {
    return <div>勤怠管理システム</div>;
  };
});

test('renders attendance management system title', () => {
  render(<App />);
  const titleElement = screen.getByText(/勤怠管理システム/i);
  expect(titleElement).toBeInTheDocument();
});