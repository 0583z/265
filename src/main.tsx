import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { MentorProvider } from './context/MentorContext';

// 1. 引入 React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. 实例化一个全局的 queryClient
// 这里配置了 defaultOptions，让它不要在窗口重新获得焦点时疯狂重新请求数据
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 窗口获得焦点时不再重新请求，减少没必要的网络消耗
      retry: 1, // 如果请求失败，只重试 1 次
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. 在最外层包裹 QueryClientProvider */}
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MentorProvider>
          <App />
        </MentorProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);