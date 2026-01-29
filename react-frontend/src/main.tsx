import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "@asgardeo/auth-react";
import './index.css'
import App from './App.tsx'
import { authConfig } from './auth.config.ts';

console.log("Auth Config:", authConfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={authConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
