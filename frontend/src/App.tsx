import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <header className="App-header">
            <h1>勤怠管理システム</h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<div>ホーム画面（開発中）</div>} />
              <Route path="/login" element={<div>ログイン画面（開発中）</div>} />
              <Route path="/dashboard" element={<div>ダッシュボード（開発中）</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;