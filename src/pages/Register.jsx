import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, FormControlLabel, IconButton, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import { obtenerPlanesPublicos, registrarNegocio } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../possail.png';
import { MODULES } from '../lib/modules';

export default function Register() {
  const [form, setForm] = useState({ negocio: '', nombre: '', email: '', password: '', modulos: { agregados: false, restaurante: false, pedidosWeb: false } });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inicio, setInicio] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    obtenerPlanesPublicos().then((response) => { if (!cancelled) setInicio(response.data.inicio); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await registrarNegocio(form);
      login(response.data);
      navigate('/locales');
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo crear la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#020617', p: 2 }}>
      <Paper sx={{
        position: 'relative',
        width: '100%',
        maxWidth: 480,
        p: { xs: 3, sm: 5 },
        borderRadius: 3,
        color: '#f8fafc',
        background: 'linear-gradient(135deg, #0f172a, #020617)',
        border: '1px solid rgba(59,130,246,0.3)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        '& .MuiInputLabel-root': { color: '#94a3b8' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#60a5fa' },
        '& .MuiOutlinedInput-root': {
          color: '#f8fafc',
          bgcolor: 'rgba(255,255,255,0.05)',
          '& fieldset': { borderColor: 'rgba(148,163,184,0.35)' },
          '&:hover fieldset': { borderColor: '#60a5fa' },
          '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
        },
        '& .MuiFormHelperText-root': { color: '#94a3b8' },
      }}>
        <IconButton
          aria-label="Cerrar registro"
          onClick={() => navigate('/login')}
          sx={{ position: 'absolute', top: 12, right: 12, color: '#cbd5e1' }}
        >
          <CloseIcon />
        </IconButton>
        <Stack spacing={2.5} component="form" onSubmit={submit}>
          <Box component="img" src={logo} alt="Possail" sx={{ width: 165, height: 72, objectFit: 'contain', alignSelf: 'center' }} />
          <Typography variant="h5" fontWeight={700}>Crea el espacio de tu negocio</Typography>
          <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
            Tendrás acceso a productos, locales, ventas y usuarios en un espacio propio.
          </Typography>
          {inicio && <Alert severity="info">Tu cuenta comenzará en el plan {inicio.nombre}: {inicio.maxLocales} local, 1 propietario, {inicio.cuposPorRol.admin} admin, {inicio.cuposPorRol.cajero} cajeros, {inicio.cuposPorRol.mesero} meseros y {inicio.cuposPorRol.repartidor} repartidor. Precio de referencia: ${Number(inicio.precioMensual).toLocaleString('es-CL')}/mes. El cobro automático aún no está habilitado.</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          <TextField name="negocio" label="Nombre del negocio" value={form.negocio} onChange={change} required inputProps={{ maxLength: 100 }} />
          <TextField name="nombre" label="Tu nombre" value={form.nombre} onChange={change} required inputProps={{ maxLength: 80 }} />
          <TextField name="email" label="Correo electrónico" type="email" value={form.email} onChange={change} required autoComplete="email" />
          <TextField name="password" label="Contraseña" type="password" value={form.password} onChange={change} required inputProps={{ minLength: 12 }} helperText="Mínimo 12 caracteres" autoComplete="new-password" />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Módulos opcionales</Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 1 }}>Puedes activarlos ahora o más adelante en Mi cuenta.</Typography>
            {MODULES.map(({ key, label, description }) => (
              <Box key={key} sx={{ py: 0.75 }}>
                <FormControlLabel
                  control={<Switch checked={form.modulos[key]} onChange={(event) => setForm((current) => ({ ...current, modulos: { ...current.modulos, [key]: event.target.checked } }))} />}
                  label={label}
                />
                <Typography variant="body2" sx={{ color: '#cbd5e1', pl: 6 }}>{description}</Typography>
              </Box>
            ))}
          </Box>
          <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.4, textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta'}
          </Button>
          <Typography variant="body2" textAlign="center">
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#60a5fa' }}>Iniciar sesión</Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
