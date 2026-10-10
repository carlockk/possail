import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { CarritoProvider } from './context/CarritoContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider, useThemeMode } from './context/ThemeContext';

// Una pestaña abierta durante un despliegue puede pedir módulos ya reemplazados.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const key = 'possail:chunk-reload';
  const lastReload = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - lastReload > 15000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
    return;
  }
  if (document.getElementById('possail-update-notice')) return;
  const notice = document.createElement('div');
  notice.id = 'possail-update-notice';
  notice.textContent = 'Hay una versión nueva de Possail. ';
  Object.assign(notice.style, {
    position: 'fixed', bottom: '20px', left: '20px', zIndex: '9999',
    padding: '14px 18px', borderRadius: '8px', color: '#fff',
    background: '#111827', boxShadow: '0 8px 30px rgba(0,0,0,.35)'
  });
  const button = document.createElement('button');
  button.textContent = 'Actualizar';
  Object.assign(button.style, {
    marginLeft: '12px', padding: '6px 10px', border: '0', borderRadius: '5px',
    color: '#fff', background: '#2563eb', cursor: 'pointer'
  });
  button.addEventListener('click', () => {
    sessionStorage.removeItem(key);
    window.location.reload();
  });
  notice.appendChild(button);
  document.body.appendChild(notice);
});

function Root() {
  const { theme } = useThemeMode();
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <CarritoProvider>
            <App />
          </CarritoProvider>
        </AuthProvider>
      </BrowserRouter>
    </MuiThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </React.StrictMode>
);
