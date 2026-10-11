import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Paper, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eliminarMiCuenta, guardarModulosNegocio, obtenerModulosNegocio } from '../services/api';
import { getModules, MODULES } from '../lib/modules';

export default function Cuenta() {
  const { usuario, modulos, actualizarModulos, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedModules, setSelectedModules] = useState(() => getModules(modulos));
  const [moduleError, setModuleError] = useState('');
  const [moduleSuccess, setModuleSuccess] = useState('');
  const [savingModules, setSavingModules] = useState(false);

  useEffect(() => setSelectedModules(getModules(modulos)), [modulos]);

  useEffect(() => {
    let cancelled = false;
    obtenerModulosNegocio().then((response) => {
      if (!cancelled) {
        actualizarModulos(response.data.modulos);
        setSelectedModules(getModules(response.data.modulos));
      }
    }).catch(() => { if (!cancelled) setModuleError('No se pudo cargar la configuración de módulos.'); });
    return () => { cancelled = true; };
  }, [actualizarModulos]);

  const saveModules = async () => {
    setSavingModules(true);
    setModuleError('');
    setModuleSuccess('');
    try {
      const response = await guardarModulosNegocio(selectedModules);
      actualizarModulos(response.data.modulos);
      setModuleSuccess('Módulos guardados. Los cambios ya están disponibles.');
    } catch (err) {
      setModuleError(err?.response?.data?.error || 'No se pudieron guardar los módulos.');
    } finally {
      setSavingModules(false);
    }
  };

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
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight={700}>Módulos del negocio</Typography>
          <Typography color="text.secondary">Activa solo las funciones que uses. Puedes cambiarlas cuando quieras; tus datos se conservan al desactivar un módulo.</Typography>
          {MODULES.map(({ key, label, description }) => (
            <Box key={key}>
              <FormControlLabel
                control={<Switch checked={selectedModules[key]} onChange={(event) => setSelectedModules((current) => ({ ...current, [key]: event.target.checked }))} />}
                label={label}
              />
              <Typography variant="body2" color="text.secondary" sx={{ pl: 6 }}>{description}</Typography>
            </Box>
          ))}
          {moduleError && <Alert severity="error">{moduleError}</Alert>}
          {moduleSuccess && <Alert severity="success">{moduleSuccess}</Alert>}
          <Box><Button variant="contained" onClick={saveModules} disabled={savingModules || MODULES.every(({ key }) => selectedModules[key] === modulos[key])}>{savingModules ? 'Guardando…' : 'Guardar módulos'}</Button></Box>
        </Stack>
      </Paper>
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
