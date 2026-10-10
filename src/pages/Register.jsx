import { useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import { registrarNegocio } from '../services/api';
import { useAuth } from '../context/AuthContext';
import logo from '../possail.png';

export default function Register() {
  const [form, setForm] = useState({ negocio: '', nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
      <Paper sx={{ position: 'relative', width: '100%', maxWidth: 480, p: { xs: 3, sm: 5 }, borderRadius: 3 }}>
        <IconButton
          aria-label="Cerrar registro"
          onClick={() => navigate('/login')}
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <CloseIcon />
        </IconButton>
        <Stack spacing={2.5} component="form" onSubmit={submit}>
          <Box component="img" src={logo} alt="Possail" sx={{ width: 125, alignSelf: 'center' }} />
          <Typography variant="h5" fontWeight={700}>Crea el espacio de tu negocio</Typography>
          <Typography variant="body2" color="text.secondary">
            Tendrás acceso a productos, locales, ventas y usuarios en un espacio propio.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField name="negocio" label="Nombre del negocio" value={form.negocio} onChange={change} required inputProps={{ maxLength: 100 }} />
          <TextField name="nombre" label="Tu nombre" value={form.nombre} onChange={change} required inputProps={{ maxLength: 80 }} />
          <TextField name="email" label="Correo electrónico" type="email" value={form.email} onChange={change} required autoComplete="email" />
          <TextField name="password" label="Contraseña" type="password" value={form.password} onChange={change} required inputProps={{ minLength: 12 }} helperText="Mínimo 12 caracteres" autoComplete="new-password" />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta'}
          </Button>
          <Typography variant="body2" textAlign="center">
            ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
