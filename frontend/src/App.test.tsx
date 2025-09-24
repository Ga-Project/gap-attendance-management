import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders attendance management system title', () => {
  render(<App />);
  const titleElement = screen.getByText(/勤怠管理システム/i);
  expect(titleElement).toBeInTheDocument();
});