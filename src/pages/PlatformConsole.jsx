import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Typography, useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import {
  cambiarEstadoNegocio, cambiarMiPassword, obtenerNegocioPlataforma, obtenerResumenPlataforma,
  obtenerUsuariosPlataforma
} from '../services/api';
import logo from '../possail.png';

const drawerWidth = 260;
const menu = [
  { key: 'resumen', label: 'Resumen', path: '/plataforma', icon: <DashboardOutlinedIcon /> },
  { key: 'negocios', label: 'Negocios', path: '/plataforma/negocios', icon: <StorefrontOutlinedIcon /> },
  { key: 'usuarios', label: 'Usuarios', path: '/plataforma/usuarios', icon: <PeopleAltOutlinedIcon /> },
  { key: 'planes', label: 'Planes y cobros', path: '/plataforma/planes', icon: <CreditCardOutlinedIcon /> },
  { key: 'seguridad', label: 'Seguridad', path: '/plataforma/seguridad', icon: <LockOutlinedIcon /> },
];
const descriptions = {
  resumen: 'Actividad general de los negocios registrados.',
  negocios: 'Revisa cada espacio de trabajo y administra su acceso.',
  usuarios: 'Cuentas creadas dentro de los negocios.',
  planes: 'Estado comercial de cada negocio.',
  seguridad: 'Protege el acceso a la administración global.',
};
const dateLabel = (value) => value ? new Date(value).toLocaleDateString('es-CL') : '—';
const billingLabel = (value) => value === 'no_configurado' || !value ? 'Sin configurar' : value;

export default function PlatformConsole() {
  const { usuario, logout } = useAuth();
  const { modoOscuro, toggleTema } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = useLocation().pathname;
  const section = pathname.endsWith('/negocios') ? 'negocios'
    : pathname.endsWith('/usuarios') ? 'usuarios'
      : pathname.endsWith('/planes') ? 'planes'
        : pathname.endsWith('/seguridad') ? 'seguridad' : 'resumen';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);
  const [businessPage, setBusinessPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersData, setUsersData] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const submitPassword = async (event) => {
    event.preventDefault();
    if (passwordSaving) return;
    if (passwordForm.newPassword !== passwordForm.confirmation) {
      setPasswordError('Las contraseñas nuevas no coinciden.');
      return;
    }
    setPasswordSaving(true);
    setPasswordError('');
    try {
      await cambiarMiPassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmation: '' });
      logout();
    } catch (err) {
      setPasswordError(err?.response?.data?.error || 'No se pudo cambiar la contraseña.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const refreshSummary = useCallback(async () => {
    try {
      const response = await obtenerResumenPlataforma();
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo cargar el panel');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await obtenerUsuariosPlataforma(usersPage);
      setUsersData(response.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudieron cargar los usuarios');
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage]);

  useEffect(() => { refreshSummary(); }, [refreshSummary]);
  useEffect(() => { if (section === 'usuarios') refreshUsers(); }, [section, refreshUsers]);

  const negocios = useMemo(() => (data?.negocios || []).filter((item) => {
    const search = query.trim().toLowerCase();
    return !search || `${item.nombre} ${item.ownerEmail}`.toLowerCase().includes(search);
  }), [data, query]);
  const businessPages = Math.max(1, Math.ceil(negocios.length / 10));
  const currentBusinessPage = Math.min(businessPage, businessPages);
  const paginatedBusinesses = negocios.slice((currentBusinessPage - 1) * 10, currentBusinessPage * 10);
  const updateBusinessQuery = (value) => {
    setQuery(value);
    setBusinessPage(1);
  };
  const openBusinessDialog = () => {
    setQuery('');
    setBusinessPage(1);
    setBusinessDialogOpen(true);
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const response = await obtenerNegocioPlataforma(id);
      setDetail(response.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo cargar el negocio');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!detail || saving) return;
    setSaving(true);
    try {
      const estado = detail.estado === 'activo' ? 'suspendido' : 'activo';
      await cambiarEstadoNegocio(detail._id, estado);
      await Promise.all([openDetail(detail._id), refreshSummary()]);
      if (section === 'usuarios') await refreshUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo actualizar el negocio');
    } finally {
      setSaving(false);
    }
  };

  const sidebar = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#212121', color: '#f8fafc' }}>
      <Box sx={{ p: 3, pb: 2 }}>
        <Box component="img" src={logo} alt="Possail" sx={{ width: 112, height: 50, objectFit: 'contain' }} />
        <Typography variant="caption" sx={{ display: 'block', color: '#93c5fd', letterSpacing: 1.4, fontWeight: 700, mt: 1 }}>
          ADMINISTRACIÓN GLOBAL
        </Typography>
      </Box>
      <Divider sx={{ borderColor: '#525252' }} />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {menu.map((item) => (
          <ListItemButton
            key={item.key} component={Link} to={item.path}
            selected={section === item.key} onClick={() => setDrawerOpen(false)}
            sx={{
              borderRadius: 1.5, mb: 0.5, color: '#cbd5e1',
              '& .MuiListItemIcon-root': { color: 'inherit' },
              '&.Mui-selected': { bgcolor: '#1d4ed8', color: '#fff' },
              '&.Mui-selected:hover': { bgcolor: '#2563eb' },
              '&:hover': { bgcolor: '#303030' },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ borderColor: '#525252' }} />
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Administrador de plataforma</Typography>
        <Typography variant="body2" noWrap sx={{ mb: 1.5 }}>{usuario?.email}</Typography>
        <Button fullWidth size="small" onClick={toggleTema} sx={{ color: '#cbd5e1', justifyContent: 'flex-start', mb: 0.5 }}>
          {modoOscuro ? 'Tema claro' : 'Tema oscuro'}
        </Button>
        <Button fullWidth size="small" onClick={logout} startIcon={<LogoutOutlinedIcon />} sx={{ color: '#cbd5e1', justifyContent: 'flex-start' }}>
          Cerrar sesión
        </Button>
      </Box>
    </Box>
  );

  const businessTable = (items, showBilling = false) => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Negocio</TableCell><TableCell>Propietario</TableCell><TableCell>Estado</TableCell>
          {showBilling ? <><TableCell>Plan</TableCell><TableCell>Cobro</TableCell></> : <>
            <TableCell align="right">Usuarios</TableCell><TableCell align="right">Locales</TableCell>
            <TableCell align="right">Productos</TableCell><TableCell align="right">Ventas</TableCell>
            <TableCell>Registro</TableCell>
          </>}
          <TableCell align="right">Detalle</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {items.map((item) => <TableRow key={item._id} hover>
            <TableCell sx={{ fontWeight: 600 }}>{item.nombre}</TableCell>
            <TableCell>{item.ownerEmail || '—'}</TableCell>
            <TableCell><Chip size="small" color={item.estado === 'activo' ? 'success' : 'default'} label={item.estado} /></TableCell>
            {showBilling ? <><TableCell>{item.plan || 'gratis'}</TableCell><TableCell>{billingLabel(item.billingStatus)}</TableCell></> : <>
              <TableCell align="right">{item.usuarios}</TableCell><TableCell align="right">{item.locales}</TableCell>
              <TableCell align="right">{item.productos}</TableCell><TableCell align="right">{item.ventas}</TableCell>
              <TableCell>{dateLabel(item.createdAt)}</TableCell>
            </>}
            <TableCell align="right"><Button size="small" onClick={() => openDetail(item._id)}>Ver</Button></TableCell>
          </TableRow>)}
          {!items.length && <TableRow><TableCell colSpan={showBilling ? 6 : 9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
            {query && !showBilling ? 'No hay negocios que coincidan con la búsqueda.' : 'Todavía no hay negocios registrados.'}
          </TableCell></TableRow>}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const businessPagination = (
    <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2 }}>
      <Button disabled={currentBusinessPage <= 1} onClick={() => setBusinessPage(currentBusinessPage - 1)}>Anterior</Button>
      <Typography variant="body2">Página {currentBusinessPage} de {businessPages}</Typography>
      <Button disabled={currentBusinessPage >= businessPages} onClick={() => setBusinessPage(currentBusinessPage + 1)}>Siguiente</Button>
    </Stack>
  );

  const stats = [
    ['Negocios registrados', data?.totalNegocios || 0, <StorefrontOutlinedIcon key="business" color="primary" />],
    ['Negocios activos', data?.negociosActivos || 0, <DashboardOutlinedIcon key="active" color="success" />],
    ['Usuarios', data?.usuarios || 0, <PeopleAltOutlinedIcon key="users" color="primary" />],
    ['Ventas registradas', (data?.negocios || []).reduce((sum, item) => sum + (item.ventas || 0), 0), <CreditCardOutlinedIcon key="sales" color="primary" />],
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'} open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)} ModalProps={{ keepMounted: true }}
        sx={{ width: isMobile ? 0 : drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, borderRight: '1px solid #525252' } }}
      >{sidebar}</Drawer>
      <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
        <Paper square elevation={0} sx={{ px: { xs: 2, md: 4 }, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && <IconButton aria-label="Abrir menú" onClick={() => setDrawerOpen(true)}><MenuIcon /></IconButton>}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>{menu.find((item) => item.key === section)?.label}</Typography>
            <Typography variant="body2" color="text.secondary">{descriptions[section]}</Typography>
          </Box>
          <IconButton aria-label="Actualizar datos" onClick={() => { refreshSummary(); if (section === 'usuarios') refreshUsers(); }}><RefreshIcon /></IconButton>
        </Paper>
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1500, mx: 'auto' }}>
          {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
          {loading ? <CircularProgress /> : <>
            {section === 'resumen' && <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
                {stats.map(([label, value, icon]) => <Paper key={label} sx={{ p: 2.5, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography color="text.secondary" variant="body2">{label}</Typography>{icon}
                  </Stack>
                  <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>{value}</Typography>
                </Paper>)}
              </Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Negocios recientes</Typography>
                {(data?.negocios?.length || 0) > 5 && <Button onClick={openBusinessDialog}>Ver todos</Button>}
              </Stack>
              {businessTable((data?.negocios || []).slice(0, 5))}
            </>}
            {section === 'negocios' && <>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>{data?.totalNegocios || 0} negocios registrados</Typography>
                <TextField size="small" label="Buscar negocio o propietario" value={query} onChange={(event) => updateBusinessQuery(event.target.value)} sx={{ minWidth: 280 }} />
              </Stack>
              {businessTable(paginatedBusinesses)}
              {businessPagination}
            </>}
            {section === 'usuarios' && <>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>{usersData?.total ?? data?.usuarios ?? 0} usuarios de negocios</Typography>
              {usersLoading ? <CircularProgress /> : <>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead><TableRow><TableCell>Nombre</TableCell><TableCell>Correo</TableCell><TableCell>Rol</TableCell>
                      <TableCell>Negocio</TableCell><TableCell>Estado del negocio</TableCell><TableCell align="right">Detalle</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {(usersData?.usuarios || []).map((item) => <TableRow key={item._id} hover>
                        <TableCell>{item.nombre}</TableCell><TableCell>{item.email}</TableCell><TableCell>{item.rol}</TableCell>
                        <TableCell>{item.negocio}</TableCell>
                        <TableCell><Chip size="small" color={item.estadoNegocio === 'activo' ? 'success' : 'default'} label={item.estadoNegocio} /></TableCell>
                        <TableCell align="right"><Button size="small" onClick={() => openDetail(item.tenantId)}>Ver negocio</Button></TableCell>
                      </TableRow>)}
                      {!usersData?.usuarios?.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>Todavía no hay usuarios registrados.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2 }}>
                  <Button disabled={usersPage <= 1} onClick={() => setUsersPage((page) => page - 1)}>Anterior</Button>
                  <Typography variant="body2">Página {usersData?.pagina || usersPage} de {usersData?.totalPaginas || 1}</Typography>
                  <Button disabled={usersPage >= (usersData?.totalPaginas || 1)} onClick={() => setUsersPage((page) => page + 1)}>Siguiente</Button>
                </Stack>
              </>}
            </>}
            {section === 'planes' && <>
              <Alert severity="info" sx={{ mb: 3 }}>Los cobros automáticos aún no están configurados. Esta sección muestra el plan y el estado preparado para cada negocio.</Alert>
              {businessTable(data?.negocios || [], true)}
            </>}
            {section === 'seguridad' && <Paper component="form" onSubmit={submitPassword} sx={{ p: 3, maxWidth: 500, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Cambiar contraseña</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Al guardarla, se cerrarán todas las sesiones de esta cuenta.</Typography>
              {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}
              <Stack spacing={2}>
                <TextField label="Contraseña actual" type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, currentPassword: event.target.value }))} />
                <TextField label="Nueva contraseña" type="password" autoComplete="new-password" required inputProps={{ minLength: 12 }} helperText="Mínimo 12 caracteres" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((value) => ({ ...value, newPassword: event.target.value }))} />
                <TextField label="Repetir nueva contraseña" type="password" autoComplete="new-password" required inputProps={{ minLength: 12 }} value={passwordForm.confirmation} onChange={(event) => setPasswordForm((value) => ({ ...value, confirmation: event.target.value }))} />
                <Button type="submit" variant="contained" disabled={passwordSaving}>{passwordSaving ? 'Guardando…' : 'Guardar contraseña'}</Button>
              </Stack>
            </Paper>}
          </>}
        </Box>
      </Box>
      <Dialog open={businessDialogOpen} onClose={() => setBusinessDialogOpen(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Todos los negocios ({data?.totalNegocios || 0})
          <IconButton aria-label="Cerrar lista de negocios" onClick={() => setBusinessDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            size="small"
            label="Buscar negocio o propietario"
            value={query}
            onChange={(event) => updateBusinessQuery(event.target.value)}
            sx={{ mb: 2, minWidth: { sm: 300 } }}
            fullWidth={isMobile}
          />
          {businessTable(paginatedBusinesses)}
          {businessPagination}
        </DialogContent>
      </Dialog>
      <Dialog open={detailLoading || Boolean(detail)} onClose={() => { if (!saving) setDetail(null); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {detail?.nombre || 'Cargando negocio'}
          <IconButton aria-label="Cerrar detalle" onClick={() => setDetail(null)} disabled={saving}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? <CircularProgress /> : <>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
              <Chip label={`${detail?.usuarios || 0} usuarios`} /><Chip label={`${detail?.locales || 0} locales`} />
              <Chip label={`${detail?.productos || 0} productos`} /><Chip label={`${detail?.ventas || 0} ventas`} />
              <Chip color={detail?.estado === 'activo' ? 'success' : 'default'} label={detail?.estado || ''} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Propietario: {detail?.ownerEmail || '—'}</Typography>
            <Typography variant="subtitle1" fontWeight={700}>Usuarios</Typography>
            {(detail?.users || []).map((user) => <Typography key={user._id} variant="body2" sx={{ py: 0.5 }}>{user.nombre} · {user.email} · {user.rol}</Typography>)}
            {!detail?.users?.length && <Typography variant="body2" color="text.secondary">Sin usuarios.</Typography>}
            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3 }}>Locales</Typography>
            {(detail?.listaLocales || []).map((local) => <Typography key={local._id} variant="body2" sx={{ py: 0.5 }}>{local.nombre}</Typography>)}
            {!detail?.listaLocales?.length && <Typography variant="body2" color="text.secondary">Sin locales.</Typography>}
          </>}
        </DialogContent>
        <DialogActions>
          <Button color={detail?.estado === 'activo' ? 'error' : 'success'} onClick={toggleStatus} disabled={saving || detailLoading || !detail}>
            {detail?.estado === 'activo' ? 'Suspender negocio' : 'Activar negocio'}
          </Button>
          <Button onClick={() => setDetail(null)} disabled={saving}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
