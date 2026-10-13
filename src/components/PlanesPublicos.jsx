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
const CACHE_KEY = 'possail-public-plans';
const CACHE_MS = 5 * 60 * 1000;
let pendingPlans = null;

const readCachedPlans = () => {
  try {
    const cached = JSON.parse(window.sessionStorage.getItem(CACHE_KEY));
    return cached && Date.now() - cached.savedAt < CACHE_MS ? cached.data : null;
  } catch { return null; }
};

const fetchPlans = () => {
  if (!pendingPlans) {
    pendingPlans = obtenerPlanesPublicos().then(({ data }) => {
      try { window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() })); } catch { /* Storage may be unavailable. */ }
      return data;
    }).finally(() => { pendingPlans = null; });
  }
  return pendingPlans;
};

export default function PlanesPublicos({ open, onClose }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [planes, setPlanes] = useState(readCachedPlans);
  const [loading, setLoading] = useState(() => !readCachedPlans());
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchPlans().then((data) => {
      if (active) { setPlanes(data); setError(''); }
    }).catch(() => {
      if (active && !readCachedPlans()) setError('No se pudieron cargar los planes. Intenta nuevamente.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const contratar = (plan) => {
    onClose();
    navigate(`/registro?plan=${plan}`);
  };

  return (
    <Drawer anchor={mobile ? 'bottom' : 'right'} open={open} onClose={onClose}
      slotProps={{ paper: { sx: {
        width: mobile ? '100%' : 'min(715px, 90vw)', maxHeight: mobile ? '90dvh' : '100dvh',
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
        {loading && !planes && <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>}
        {error && !planes && <Alert severity="error" sx={{ mb: 2 }}>{error} <Button size="small" onClick={() => {
          setError(''); setLoading(true);
          fetchPlans().then(setPlanes).catch(() => setError('No se pudieron cargar los planes. Intenta nuevamente.')).finally(() => setLoading(false));
        }}>Reintentar</Button></Alert>}
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
            <Typography variant="h6" fontWeight={800}>¿Necesitas más capacidad?</Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5, mb: 2 }}>
              Puedes sumar cupos a los que ya incluye tu plan. Estos son los precios mensuales por cada extra:
            </Typography>
            <Stack spacing={1.5}>
              {[
                ['Un admin, cajero o mesero más', planes.precioUsuarioExtra?.general, 'por cada usuario del rol que elijas'],
                ['Un repartidor más', planes.precioUsuarioExtra?.repartidor, 'por cada repartidor'],
                ['Un local más', planes.localAdicional?.precioMensual, 'por cada local; disponible en Pro'],
              ].map(([label, price, detail]) => <Stack key={label} direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                <Box>
                  <Typography variant="body2" fontWeight={700}>{label}</Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1' }}>{detail}</Typography>
                </Box>
                <Typography variant="body2" fontWeight={800} sx={{ color: '#93c5fd', whiteSpace: 'nowrap' }}>+${Number(price || 0).toLocaleString('es-CL')}/mes</Typography>
              </Stack>)}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#17233a', color: '#f8fafc', borderColor: '#475569' }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Módulos opcionales en ambos planes</Typography>
            {MODULES.map(({ key, label, description }) => <Typography key={key} variant="body2" sx={{ color: '#cbd5e1', mb: 0.75 }}><strong>{label}:</strong> {description}</Typography>)}
          </Paper>
          <Alert severity="info">Los cobros en línea aún no están habilitados. Verás el plan elegido antes de crear tu cuenta.</Alert>
        </Stack>}
      </Box>
    </Drawer>
  );
}
