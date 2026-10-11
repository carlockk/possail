export const MODULES = [
  { key: 'agregados', label: 'Agregados', description: 'Opciones y extras que se pueden añadir a productos y ventas.' },
  { key: 'restaurante', label: 'Restaurante', description: 'Mesas, meseros y comandas para atención en el local.' },
  { key: 'pedidosWeb', label: 'Pedidos Web', description: 'Pedidos de la web conectada, configuración web y horario de la tienda.' },
];

export const getModules = (value) => Object.fromEntries(
  MODULES.map(({ key }) => [key, value?.[key] !== false])
);
