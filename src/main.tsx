import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { MentorProvider } from './context/MentorContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MentorProvider>
        <App />
      </MentorProvider>
    </AuthProvider>
  </StrictMode>,
);
