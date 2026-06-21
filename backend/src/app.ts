import express from 'express';
import cors from 'cors';
import autenticacionRoutes from './modulos/autenticacion/autenticacion.routes';
import usuariosRoutes from './modulos/usuarios/usuarios.routes';
import subastasRoutes from './modulos/subastas/subastas.routes';
import pujosRoutes from './modulos/pujos/pujos.routes';
import paisesRoutes from './modulos/paises/paises.routes';
import { articulosRoutes } from './modulos/articulos/articulos.routes';
import { pagosRoutes } from './modulos/pagos/pagos.routes';
import { notificacionesRoutes } from './modulos/notificaciones/notificaciones.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/paises', paisesRoutes);
app.use('/api/autenticacion', autenticacionRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/subastas', subastasRoutes);
app.use('/api/pujos', pujosRoutes);
app.use('/api/articulos', articulosRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/notificaciones', notificacionesRoutes);

export default app;
