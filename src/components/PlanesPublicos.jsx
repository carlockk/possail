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
const ink = '#17212f';
const muted = '#667085';
const border = '#e9edf2';
const accent = '#526e9e';
const cardStyle = { p: 2.5, borderRadius: 2, bgcolor: '#fff', color: ink, borderColor: border };

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
        width: mobile ? '100%' : 'min(1000px, 90vw)', maxHeight: mobile ? '90dvh' : '100dvh',
        borderRadius: mobile ? '20px 20px 0 0' : 0, bgcolor: '#fff', color: ink,
        borderLeft: mobile ? 0 : `1px solid ${border}`,
      } } }}>
      <Box sx={{ p: { xs: 2.5, sm: 4 }, overflowY: 'auto' }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Elige tu plan</Typography>
            <Typography variant="body2" sx={{ color: muted, mt: 0.5 }}>
              Todos incluyen punto de venta, inventario y módulos opcionales para tu negocio.
            </Typography>
          </Box>
          <IconButton aria-label="Cerrar planes" onClick={onClose} sx={{ color: muted }}><CloseIcon /></IconButton>
        </Stack>
        <Divider sx={{ my: 3, borderColor: border }} />
        {loading && !planes && <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress /></Box>}
        {error && !planes && <Alert severity="error" sx={{ mb: 2 }}>{error} <Button size="small" onClick={() => {
          setError(''); setLoading(true);
          fetchPlans().then(setPlanes).catch(() => setError('No se pudieron cargar los planes. Intenta nuevamente.')).finally(() => setLoading(false));
        }}>Reintentar</Button></Alert>}
        {planes && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          {['inicio', 'pro'].map((key) => {
            const plan = planes[key];
            if (!plan) return null;
            return <Paper key={key} variant="outlined" sx={{ ...cardStyle, borderColor: key === 'pro' ? '#d9def4' : border, boxShadow: key === 'pro' ? '0 4px 18px rgba(111, 117, 170, 0.07)' : 'none' }}>
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" gap={1}>
                <Typography variant="h6" fontWeight={800}>{plan.nombre}</Typography>
                <Typography fontWeight={800} sx={{ color: key === 'pro' ? '#75629b' : accent }}>${Number(plan.precioMensual).toLocaleString('es-CL')}<Typography component="span" variant="body2" sx={{ color: muted }}>/mes</Typography></Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: muted, mt: 1.5 }}>
                {plan.maxLocales} {plan.maxLocales === 1 ? 'local' : 'locales'} · 1 propietario · {roles.map(([role, label]) => `${plan.cuposPorRol[role]} ${label}`).join(' · ')}
              </Typography>
              <Typography variant="body2" sx={{ color: muted, mt: 1.5 }}>
                Incluye ventas POS, caja, tickets, productos e inventario.
              </Typography>
              <Button variant="contained" fullWidth sx={{ mt: 2, textTransform: 'none' }} onClick={() => contratar(key)}>
                Contratar {plan.nombre}
              </Button>
            </Paper>;
          })}
          <Paper variant="outlined" sx={{ ...cardStyle, gridColumn: { md: '1 / -1' } }}>
            <Typography variant="h6" fontWeight={800}>¿Necesitas más capacidad?</Typography>
            <Typography variant="body2" sx={{ color: muted, mt: 0.5, mb: 2 }}>
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
                  <Typography variant="caption" sx={{ color: muted }}>{detail}</Typography>
                </Box>
                <Typography variant="body2" fontWeight={800} sx={{ color: accent, whiteSpace: 'nowrap' }}>+${Number(price || 0).toLocaleString('es-CL')}/mes</Typography>
              </Stack>)}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ ...cardStyle, gridColumn: { md: '1 / -1' } }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Módulos opcionales en ambos planes</Typography>
            {MODULES.map(({ key, label, description }) => <Typography key={key} variant="body2" sx={{ color: muted, mb: 0.75 }}><Box component="strong" sx={{ color: ink }}>{label}:</Box> {description}</Typography>)}
          </Paper>
          <Alert severity="info" sx={{ gridColumn: { md: '1 / -1' } }}>Los cobros en línea aún no están habilitados. Verás el plan elegido antes de crear tu cuenta.</Alert>
        </Box>}
      </Box>
    </Drawer>
  );
}
