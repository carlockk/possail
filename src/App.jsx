import { lazy, Suspense, useEffect, useState } from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box, CssBaseline, useMediaQuery, Snackbar, Alert
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuth } from './context/AuthContext';
import { CajaProvider } from './context/CajaContext';

import { LOCAL_REQUIRED_EVENT } from './services/api';

const Sidebar = lazy(() => import('./components/Sidebar'));
const PedidosWebWatcher = lazy(() => import('./components/PedidosWebWatcher'));
const RestauranteCobroWatcher = lazy(() => import('./components/RestauranteCobroWatcher'));
const ENABLE_BACKGROUND_WATCHERS = import.meta.env.VITE_ENABLE_BACKGROUND_WATCHERS === 'true';

const Productos = lazy(() => import('./pages/Productos'));
const CrearProducto = lazy(() => import('./pages/CrearProducto'));
const Categorias = lazy(() => import('./pages/CrearCategoria'));
const POS = lazy(() => import('./pages/POS'));
const Ticket = lazy(() => import('./pages/Ticket'));
const Historial = lazy(() => import('./pages/Historial'));
const Anulaciones = lazy(() => import('./pages/Anulaciones'));
const Caja = lazy(() => import('./pages/Caja'));
const HistorialCajas = lazy(() => import('./pages/HistorialCajas'));
const TicketCaja = lazy(() => import('./pages/TicketCaja'));
const CrearUsuario = lazy(() => import('./pages/CrearUsuario'));
const ListaUsuarios = lazy(() => import('./pages/ListaUsuarios'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const PlatformDashboard = lazy(() => import('./pages/PlatformConsole'));
const TicketsAbiertos = lazy(() => import('./pages/TicketsAbiertos'));
const Locales = lazy(() => import('./pages/Locales'));
const Cuenta = lazy(() => import('./pages/Cuenta'));
const Insumos = lazy(() => import('./pages/Insumos'));
const ConfigRecibo = lazy(() => import('./pages/ConfigRecibo'));
const Agregados = lazy(() => import('./pages/Agregados'));
const PedidosWeb = lazy(() => import('./pages/PedidosWeb'));
const SocialConfig = lazy(() => import('./pages/SocialConfig'));
const HorarioTienda = lazy(() => import('./pages/HorarioTienda'));
const Restaurante = lazy(() => import('./pages/Restaurante'));
const CheckoutResult = lazy(() => import('./pages/CheckoutResult'));
const Descuentos = lazy(() => import('./pages/Descuentos'));

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

export default function App() {
  const { usuario, modulos } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [localNoticeOpen, setLocalNoticeOpen] = useState(false);
  const [localNoticeMessage, setLocalNoticeMessage] = useState('');
  const [backgroundFeaturesReady, setBackgroundFeaturesReady] = useState(false);
  const location = useLocation();
  const isLoginRoute = location.pathname === '/login' || location.pathname === '/registro' || location.pathname === '/plataforma/login';
  const isPlatformRoute = location.pathname.startsWith('/plataforma');
  const isStandaloneRoute = isLoginRoute || isPlatformRoute;
  const isPlatformAdmin = usuario?.rol === 'platform_admin';
  const esMesero = usuario?.rol === 'mesero';
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'superadmin';
  const usuarioGeneral = Boolean(usuario) && !esMesero && !isPlatformAdmin;
  const rutaInicio = isPlatformAdmin ? '/plataforma' : esMesero && modulos.restaurante ? '/restaurante' : '/';
  const moduloDesactivado = <Box sx={{ p: 4 }}><Typography variant="h6">Módulo desactivado</Typography><Typography>Contacta al propietario del negocio para activarlo.</Typography></Box>;

  const toggleDrawer = () => setMobileOpen(!mobileOpen);
  const activeDrawerWidth = !isMobile && sidebarCollapsed ? collapsedDrawerWidth : drawerWidth;

  useEffect(() => {
    const handler = (event) => {
      const message = event?.detail?.message || 'Debes seleccionar un local para continuar.';
      setLocalNoticeMessage(message);
      setLocalNoticeOpen(true);
    };

    window.addEventListener(LOCAL_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(LOCAL_REQUIRED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (isStandaloneRoute) {
      setBackgroundFeaturesReady(false);
      return undefined;
    }

    let cancelled = false;
    const activate = () => {
      if (!cancelled) {
        setBackgroundFeaturesReady(true);
      }
    };

    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(activate, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(activate, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isStandaloneRoute]);

  return (
    <CajaProvider>
      <Box sx={{ display: isStandaloneRoute ? 'block' : 'flex', minHeight: '100vh' }}>
        <CssBaseline />

        {isMobile && !isStandaloneRoute && (
          <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <IconButton color="inherit" edge="start" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap sx={{ ml: 2 }}>
                POSSail
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {!isStandaloneRoute && (
          <Suspense fallback={null}>
            <Sidebar
              mobileOpen={mobileOpen}
              toggleDrawer={toggleDrawer}
              collapsed={!isMobile && sidebarCollapsed}
              onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
              drawerWidth={activeDrawerWidth}
            />
          </Suspense>
        )}

        {ENABLE_BACKGROUND_WATCHERS && backgroundFeaturesReady && !esMesero && !isPlatformAdmin && (
          <Suspense fallback={null}>
            {modulos.pedidosWeb && <PedidosWebWatcher />}
            {modulos.restaurante && <RestauranteCobroWatcher />}
          </Suspense>
        )}

        <Box
          component="main"
          sx={
            isStandaloneRoute
              ? {
                  flexGrow: 1,
                  width: '100%',
                  minHeight: '100vh',
                  p: 0,
                  backgroundColor: '#020617'
                }
              : {
                  flexGrow: 1,
                  p: 0.25,
                  mt: isMobile ? 7 : 0,
                  width: {
                    xs: '100%',
                    md: `calc(100% - ${activeDrawerWidth}px)`
                  },
                  maxWidth: '100%',
                  minWidth: 0,
                  overflowX: 'hidden',
                  transition: theme.transitions.create('width', {
                    duration: theme.transitions.duration.shortest
                  })
                }
          }
        >
          <Suspense fallback={<Box sx={{ p: 3 }}><Typography>Cargando...</Typography></Box>}>
          <Routes>
            <Route path="/login" element={!usuario ? <Login /> : <Navigate to={isPlatformAdmin ? '/plataforma' : esMesero ? '/restaurante' : usuario?.rol === 'superadmin' ? '/locales' : '/dashboard'} />} />
            <Route path="/registro" element={!usuario ? <Register /> : <Navigate to={rutaInicio} />} />
            <Route path="/plataforma/login" element={!usuario ? <Login platform /> : <Navigate to={rutaInicio} />} />
            <Route path="/plataforma" element={isPlatformAdmin ? <PlatformDashboard /> : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/plataforma/negocios" element={isPlatformAdmin ? <PlatformDashboard /> : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/plataforma/usuarios" element={isPlatformAdmin ? <PlatformDashboard /> : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/plataforma/planes" element={isPlatformAdmin ? <PlatformDashboard /> : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/plataforma/seguridad" element={isPlatformAdmin ? <PlatformDashboard /> : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/checkout/result" element={<CheckoutResult />} />
            <Route path="/" element={!usuario ? <Navigate to="/login" /> : isPlatformAdmin ? <Navigate to="/plataforma" /> : esMesero ? <Navigate to="/restaurante" /> : <Productos />} />
            <Route
              path="/crear"
              element={esAdmin ? <CrearProducto /> : <Navigate to={rutaInicio} />}
            />
            <Route path="/categorias" element={usuarioGeneral ? <Categorias /> : <Navigate to={rutaInicio} />} />
            <Route
              path="/crear-usuario"
              element={esAdmin ? <CrearUsuario /> : <Navigate to={rutaInicio} />}
            />
            <Route
              path="/usuarios"
              element={esAdmin ? <ListaUsuarios /> : <Navigate to={rutaInicio} />}
            />
            <Route path="/pos" element={usuarioGeneral ? <POS /> : <Navigate to={rutaInicio} />} />
            <Route path="/dashboard" element={usuarioGeneral ? <Dashboard /> : <Navigate to={rutaInicio} />} />
            <Route path="/historial" element={usuarioGeneral ? <Historial /> : <Navigate to={rutaInicio} />} />
            <Route path="/anulaciones" element={esAdmin ? <Anulaciones /> : <Navigate to={rutaInicio} />} />
            <Route path="/caja" element={usuarioGeneral ? <Caja /> : <Navigate to={rutaInicio} />} />
            <Route
              path="/historial-cajas"
              element={esAdmin ? <HistorialCajas /> : <Navigate to={rutaInicio} />}
            />
            <Route path="/ticket" element={usuarioGeneral ? <Ticket /> : <Navigate to={rutaInicio} />} />
            <Route path="/ticket-caja" element={usuarioGeneral ? <TicketCaja /> : <Navigate to={rutaInicio} />} />
            <Route path="/tickets-abiertos" element={usuarioGeneral ? <TicketsAbiertos /> : <Navigate to={rutaInicio} />} />
            <Route path="/pedidos-web" element={usuarioGeneral ? (modulos.pedidosWeb ? <PedidosWeb /> : moduloDesactivado) : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/restaurante" element={usuario && !isPlatformAdmin ? (modulos.restaurante ? <Restaurante /> : moduloDesactivado) : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/locales" element={usuarioGeneral ? <Locales /> : <Navigate to={rutaInicio} />} />
            <Route path="/cuenta" element={usuario?.rol === 'superadmin' ? <Cuenta /> : <Navigate to={rutaInicio} />} />
            <Route path="/insumos" element={usuarioGeneral ? <Insumos /> : <Navigate to={rutaInicio} />} />
            <Route path="/agregados" element={usuarioGeneral ? (modulos.agregados ? <Agregados /> : moduloDesactivado) : <Navigate to={usuario ? rutaInicio : '/login'} />} />
            <Route path="/descuentos" element={esAdmin ? <Descuentos /> : <Navigate to={rutaInicio} />} />
            <Route
              path="/social"
              element={esAdmin ? (modulos.pedidosWeb ? <SocialConfig /> : moduloDesactivado) : <Navigate to={usuario ? rutaInicio : '/login'} />}
            />
            <Route
              path="/horario-tienda"
              element={esAdmin ? (modulos.pedidosWeb ? <HorarioTienda /> : moduloDesactivado) : <Navigate to={usuario ? rutaInicio : '/login'} />}
            />
            <Route
              path="/config-recibo"
              element={esAdmin ? <ConfigRecibo /> : <Navigate to={rutaInicio} />}
            />
            <Route path="*" element={<Navigate to={usuario ? rutaInicio : '/login'} />} />
          </Routes>
          </Suspense>
        </Box>

        <Snackbar
          open={localNoticeOpen}
          autoHideDuration={3500}
          onClose={() => setLocalNoticeOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity="warning"
            variant="filled"
            onClose={() => setLocalNoticeOpen(false)}
            sx={{ width: '100%' }}
          >
            {localNoticeMessage}
          </Alert>
        </Snackbar>
      </Box>
    </CajaProvider>
  );
}
