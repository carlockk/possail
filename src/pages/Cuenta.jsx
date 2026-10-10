import { useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Paper, Stack, TextField, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eliminarMiCuenta } from '../services/api';

export default function Cuenta() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setPassword('');
    setError('');
  };

  const confirmDelete = async (event) => {
    event.preventDefault();
    if (!password || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await eliminarMiCuenta(password);
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudo eliminar la cuenta. Inténtalo nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>Mi cuenta</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Administra la cuenta de {usuario?.negocio || 'tu negocio'}.
      </Typography>
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>Eliminar cuenta</Typography>
          <Typography color="text.secondary">
            Puedes eliminar tu cuenta cuando quieras. Se borrarán tu negocio, sus locales, usuarios y todos sus datos de la base de datos. Esta acción no se puede deshacer.
          </Typography>
          <Box>
            <Button color="error" variant="outlined" onClick={() => setOpen(true)}>
              Eliminar mi cuenta
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={confirmDelete}>
          <DialogTitle>¿Estás seguro de que quieres eliminar tu cuenta?</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Alert severity="warning">
                Al confirmar, se eliminarán permanentemente tu cuenta, el negocio, todos sus locales, usuarios y datos de la base de datos. Esta acción no se puede deshacer.
              </Alert>
              <Typography color="text.secondary">
                Para confirmar que eres el propietario, escribe tu contraseña.
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField
                label="Contraseña actual"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                fullWidth
                autoFocus
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={close} disabled={deleting}>Cancelar</Button>
            <Button type="submit" color="error" variant="contained" disabled={!password || deleting}>
              {deleting ? 'Eliminando…' : 'Sí, eliminar mi cuenta'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
