# Guía de Despliegue en Railway - Hammer Subastas

Este documento detalla los pasos para realizar el despliegue del **Backend** y de la **Base de Datos** en [Railway](https://railway.app/). Al tratarse de una aplicación móvil con Expo, no es necesario alojar el Frontend en Railway.

---

## 1. Crear y Configurar la Base de Datos en Railway

1. Inicia sesión en tu cuenta de [Railway](https://railway.app/).
2. Haz clic en **New Project** y selecciona **Provision PostgreSQL**.
3. Railway creará una base de datos PostgreSQL automáticamente.
4. Ve al servicio de la base de datos recién creada, ingresa a la pestaña **Variables** y copia el valor de la variable `DATABASE_URL` (se verá como `postgresql://postgres:password@host:port/railway`).

---

## 2. Desplegar el Backend en Railway

1. En el mismo proyecto de Railway, haz clic en **New** (o **Add Service**) y selecciona **GitHub Repo**.
2. Conecta tu repositorio de GitHub y selecciona el repositorio de la aplicación (`tpoDa2`).
3. Ve a la configuración del servicio del Backend y asegúrate de que el **Root Directory** esté configurado como `/backend` para que Railway instale y compile el subdirectorio correcto.
4. Ve a la pestaña **Variables** y agrega las siguientes variables de entorno:
   * `DATABASE_URL`: (Pega la URL de conexión que copiaste de tu base de datos del paso anterior).
   * `PORT`: `4000`
   * `JWT_SECRET`: `clave_secreta_segura_para_firmar_tokens`
   * `MAIL_USER`: (Tu correo electrónico para enviar notificaciones SMTP, o uno falso para desarrollo).
   * `MAIL_PASS`: (Contraseña de aplicación o una falsa).
5. Ve a **Settings** y en la sección **Environment**, genera un dominio público. Copia esa URL pública (se verá como `https://backend-production.up.railway.app`).

---

## 3. Ejecutar Migraciones y Cargar Datos Iniciales (Seed)

Para que tu base de datos en la nube tenga todas las tablas de PostgreSQL y los datos semilla (países, usuarios iniciales), sigue estos pasos localmente:

1. Abre tu archivo `.env` local en la carpeta `/backend` y actualiza temporalmente la variable `DATABASE_URL` con la URL de la base de datos de Railway.
2. Abre la terminal en la carpeta `/backend` y ejecuta los siguientes comandos:
   ```bash
   # Genera la estructura de tablas en la base de datos en la nube
   npx prisma db push

   # Inserta los datos semilla (paises y usuarios iniciales)
   npm run prisma seed
   ```
3. Reestablece la variable `DATABASE_URL` en tu `.env` local si deseas seguir desarrollando localmente.

---

## 4. Conectar el Frontend Móvil con Railway

Para que tu aplicación móvil consuma los servicios en la nube en lugar del localhost:

1. Abre el archivo `/front/.env` en tu proyecto de React Native.
2. Modifica la variable `EXPO_PUBLIC_API_URL` con la URL pública generada por Railway para tu backend:
   ```env
   EXPO_PUBLIC_API_URL=https://tu-backend-de-railway.up.railway.app
   ```
3. Reinicia tu servidor de Expo:
   ```bash
   npx expo start --clear
   ```
