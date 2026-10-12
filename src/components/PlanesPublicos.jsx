import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider, Drawer, IconButton,
  Paper, Stack, Typography, useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { obtenerPlanesPublicos } from '../services/api';
import { MODULES } from '../lib/modules';

const roles = [
  ['admin', 'admins'], ['cajero', 'cajeros'], ['mesero', 'meseros'], ['repartidor', 'repartidores'],
];

export default function PlanesPublicos({ open, onClose }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [planes, setPlanes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || planes) return;
    let active = true;
    setLoading(true);
    obtenerPlanesPublicos().then(({ data }) => {
      if (active) { setPlanes(data); setError(''); }
    }).catch(() => {
      if (active) setError('No se pudieron cargar los planes. Intenta abrir esta sección nuevamente.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, planes]);

  const contratar = (plan) => {
    onClose();
    navigate(`/registro?plan=${plan}`);
  };

  return (
    <Drawer anchor={mobile ? 'bottom' : 'right'} open={open} onClose={onClose}
      slotProps={{ paper: { sx: {
        width: mobile ? '100%' : 550, maxHeight: mobile ? '90dvh' : '100dvh',
        borderRadius: mobile ? '20px 20px 0 0' : 0, bgcolor: '#0f172a', color: '#f8fafc',
      } } }}>
      <Box sx={{ p: { xs: 2.5, sm: 4 }, overflowY: 'auto' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Elige tu plan</Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
              Todos incluyen punto de venta, inventario y módulos opcionales para tu negocio.
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar planes" onClick={onClose} sx={{ color: '#f8fafc' }}><CloseIcon /></IconButton>
        </Stack>
        <Divider sx={{ my: 3, borderColor: '#334155' }} />
        {loading && <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {planes && <Stack spacing={2}>
          {['inicio', 'pro'].map((key) => {
            const plan = planes[key];
            if (!plan) return null;
            return <Paper key={key} variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#17233a', color: '#f8fafc', borderColor: key === 'pro' ? '#60a5fa' : '#475569' }}>
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
                <Typography variant="h6" fontWeight={800}>{plan.nombre}</Typography>
                <Typography fontWeight={800} sx={{ color: '#93c5fd' }}>${Number(plan.precioMensual).toLocaleString('es-CL')}<Typography component="span" variant="body2" sx={{ color: '#cbd5e1' }}>/mes</Typography></Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 1.5 }}>
                {plan.maxLocales} {plan.maxLocales === 1 ? 'local' : 'locales'} · 1 propietario · {roles.map(([role, label]) => `${plan.cuposPorRol[role]} ${label}`).join(' · ')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 1.5 }}>
                Incluye ventas POS, caja, tickets, productos e inventario.
              </Typography>
              <Button variant="contained" fullWidth sx={{ mt: 2, textTransform: 'none' }} onClick={() => contratar(key)}>
                Contratar {plan.nombre}
              </Button>
            </Paper>;
          })}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#17233a', color: '#f8fafc', borderColor: '#475569' }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Módulos opcionales en ambos planes</Typography>
            {MODULES.map(({ key, label, description }) => <Typography key={key} variant="body2" sx={{ color: '#cbd5e1', mb: 0.75 }}><strong>{label}:</strong> {description}</Typography>)}
          </Paper>
          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
            Extras mensuales: local adicional en Pro ${Number(planes.localAdicional?.precioMensual || 0).toLocaleString('es-CL')}; usuario adicional ${Number(planes.precioUsuarioExtra?.general || 0).toLocaleString('es-CL')}, o repartidor adicional ${Number(planes.precioUsuarioExtra?.repartidor || 0).toLocaleString('es-CL')}.
          </Typography>
          <Alert severity="info">Los cobros en línea aún no están habilitados. Verás el plan elegido antes de crear tu cuenta.</Alert>
        </Stack>}
      </Box>
    </Drawer>
  );
}
