import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { cambiarEstadoNegocio, obtenerNegocioPlataforma, obtenerResumenPlataforma } from '../services/api';

export default function PlatformDashboard() {
  const { usuario, logout } = useAuth();
  const [data, setData] = useState(null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    try {
      const response = await obtenerResumenPlataforma();
      setData(response.data);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo cargar el panel');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openDetail = async (id) => {
    try {
      const response = await obtenerNegocioPlataforma(id);
      setDetail(response.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo cargar el negocio');
    }
  };

  const toggleStatus = async () => {
    if (!detail || saving) return;
    setSaving(true);
    try {
      const estado = detail.estado === 'activo' ? 'suspendido' : 'activo';
      await cambiarEstadoNegocio(detail._id, estado);
      await openDetail(detail._id);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo actualizar el negocio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', p: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Plataforma Possail</Typography>
          <Typography color="text.secondary">Administrador: {usuario?.email}</Typography>
        </Box>
        <Button variant="outlined" onClick={logout}>Cerrar sesión</Button>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? <CircularProgress /> : (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            {[
              ['Negocios registrados', data?.totalNegocios || 0],
              ['Negocios activos', data?.negociosActivos || 0],
              ['Usuarios de negocios', data?.usuarios || 0]
            ].map(([label, value]) => (
              <Paper key={label} sx={{ p: 2.5, flex: 1 }}>
                <Typography color="text.secondary">{label}</Typography>
                <Typography variant="h4" fontWeight={700}>{value}</Typography>
              </Paper>
            ))}
          </Stack>
          <TableContainer component={Paper}>
            <Table>
              <TableHead><TableRow>
                <TableCell>Negocio</TableCell><TableCell>Propietario</TableCell><TableCell>Estado</TableCell><TableCell>Plan</TableCell><TableCell>Cobro</TableCell>
                <TableCell>Usuarios</TableCell><TableCell>Locales</TableCell><TableCell>Productos</TableCell>
                <TableCell>Ventas</TableCell><TableCell>Registro</TableCell><TableCell />
              </TableRow></TableHead>
              <TableBody>
                {(data?.negocios || []).map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell>{item.ownerEmail}</TableCell>
                    <TableCell><Chip size="small" color={item.estado === 'activo' ? 'success' : 'default'} label={item.estado} /></TableCell>
                    <TableCell>{item.plan}</TableCell><TableCell>{item.billingStatus === 'no_configurado' ? 'Por configurar' : item.billingStatus}</TableCell>
                    <TableCell>{item.usuarios}</TableCell><TableCell>{item.locales}</TableCell>
                    <TableCell>{item.productos}</TableCell><TableCell>{item.ventas}</TableCell>
                    <TableCell>{new Date(item.createdAt).toLocaleDateString('es-CL')}</TableCell>
                    <TableCell><Button onClick={() => openDetail(item._id)}>Ver</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>{detail?.nombre}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {detail?.usuarios} usuarios · {detail?.locales} locales · {detail?.productos} productos · {detail?.ventas} ventas
          </Typography>
          <Typography variant="h6">Usuarios</Typography>
          {(detail?.users || []).map((user) => (
            <Typography key={user._id} variant="body2">{user.nombre} · {user.email} · {user.rol}</Typography>
          ))}
          <Typography variant="h6" sx={{ mt: 2 }}>Locales</Typography>
          {(detail?.listaLocales || []).map((local) => (
            <Typography key={local._id} variant="body2">{local.nombre}</Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button color={detail?.estado === 'activo' ? 'error' : 'success'} onClick={toggleStatus} disabled={saving}>
            {detail?.estado === 'activo' ? 'Suspender negocio' : 'Activar negocio'}
          </Button>
          <Button onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
