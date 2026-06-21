# Documentación del Front-End (React Native / Expo)

## Descripción General
La carpeta **APP_MOVIL_TPO** contiene el cliente móvil construido con **React Native**, **Expo**, **Tailwind-CSS (vía `tailwind.config.js`)** y **TypeScript**. La interfaz de usuario (UI) sigue una estética moderna y premium con:
- Paleta de colores personalizada (`#6A4F99`, `#A08C79`, `#333F48` etc.)
- Tarjetas redondeadas, sombras y bordes discontinuos
- Iconografía proporcionada por **lucide-react-native**
- Clases de utilidad tipo **Tailwind** gracias a `nativewind`

El front-end consta de tres pantallas principales en la ruta **(auth)**:
1. **register.tsx** – formulario de registro
2. **login.tsx** – formulario de inicio de sesión (estructura similar – no se muestra aquí)
3. **complete-registration.tsx** – verificación del código temporal y configuración de la contraseña

Todas las pantallas se comunican con el back-end a través de la función auxiliar `apiPost` definida en `app/lib/api.ts`.

---

## Valores Estáticos / Hardcodeados
| Archivo | Elemento | Descripción |
|------|---------|-------------|
| `register.tsx` | Valores de colores (`#6A4F99`, `#A08C79`, `#333F48`, `#9CA3AF`) | Escritos directamente en las clases JSX / props de componentes – cámbialos en **un solo lugar** para actualizar el tema.
| `register.tsx` | Ítems del `<Picker>` de países | La lista de países sudamericanos está hardcodeada (líneas 115-125). Para agregar/quitar países, edita este bloque.
| `register.tsx` | Texto de botones, placeholders, strings de alertas | Todos los textos de la UI son literales en español – aún no hay una capa de internacionalización (i18n).
| `register.tsx` | Endpoint de la API `/auth/register` | URL pasada a `apiPost` – la ruta es estática.
| `login.tsx` (similar) | Misma paleta de colores y strings de placeholders.
| `complete-registration.tsx` | Endpoint de la API `/auth/complete-registration` – estático.
| `complete-registration.tsx` | Flujo de verificación de código temporal – la UI espera solo un **código** y una **nueva contraseña**; el código es enviado por el back-end a través de un console log (simulando un correo electrónico).

---

## Desglose de Componentes (ejemplo de registro)
```tsx
export default function Register() {
  // Enrutador para navegación (expo-router)
  const router = useRouter();

  // Estado del formulario – guarda los valores ingresados por el usuario
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    country: '',
  });

  // Imágenes de documentos (frente/dorso del DNI) – guardadas como URIs desde ImagePicker
  const [documentFront, setDocumentFront] = useState<string | null>(null);
  const [documentBack, setDocumentBack] = useState<string | null>(null);

  // Alternador de visibilidad del modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
```

### Diseño de la UI (Layout)
- **`<ScrollView>`** con clases Tailwind `flex-1 bg-gray-50` proporciona un contenedor desplazable.
- En el interior, una **`<View>` central** (`max-w-lg`) envuelve todo el formulario, dándole un aspecto de tarjeta.
- Cada entrada (input) está envuelta por una **`<View className="flex-row gap-4 mb-4">`** para colocar el ícono y el `<Input>` lado a lado.
- Los íconos (`User`, `Mail`, `MapPin`, `FileText`, `Upload`) están coloreados con el color secundario `#A08C79`.
- El **selector de países** usa `@react-native-picker/picker`. El valor seleccionado se guarda en `formData.country`.
- La **carga de documentos** usa `expo-image-picker`. La URI de la imagen seleccionada se muestra como texto dentro del botón.
- El **botón de Enviar (Crear Cuenta)** activa un modal (`<Modal visible={showConfirmModal}>`) que pide al usuario que confirme antes de enviar los datos.
- Cuando el usuario confirma, se llama a `apiPost('/auth/register', formData)`. Si es exitoso, aparece una **Alerta (Alert)** con un botón que redirige a `/complete-registration`.

### Flujo de Datos
1. El usuario llena el formulario → `formData` se actualiza mediante `updateFormData`.
2. El usuario selecciona las imágenes de frente/dorso → `documentFront`/`documentBack` guardan las URIs (estas **no** se suben aún; el back-end actualmente las ignora).
3. Presiona **Crear Cuenta** → `showConfirmModal` cambia a `true`.
4. En el modal, al presionar **Confirmar**:
   - Llama a `apiPost('/auth/register', formData)`.
   - El back-end crea una entrada en **personas**, una entrada en **credenciales_web** con un código temporal, y devuelve un mensaje de éxito.
   - El front-end muestra una **Alerta** que simula un correo electrónico con el código temporal (el correo real solo se registra en la consola del servidor).
   - Después de que el usuario toca **Completar Registro**, la navegación lo lleva a la pantalla de verificación.

---

## Cómo funciona la verificación del código temporal (complete-registration.tsx)
1. El usuario ve un **input de código** y un campo de **nueva contraseña**.
2. Al enviar, llama a `apiPost('/auth/complete-registration', { email, code, newPassword })`.
3. El back-end valida el código (código temporal hasheado con bcrypt) y actualiza el registro de credenciales (`mustChangePassword = false`).
4. La UI luego redirige al usuario a la pantalla de **inicio de sesión (login)**.

Todos los valores (endpoints, nombres de campos) son strings literales – no hay un archivo de configuración.

---

## Cómo extender / refactorizar
- **Tema (Theme)** – mueve los valores de colores a `tailwind.config.js` bajo `theme.extend.colors` y reemplaza los valores hexadecimales hardcodeados con clases de utilidad de Tailwind (`bg-primary`, `text-primary-dark`, …). Esto centraliza la paleta.
- **Lista de países** – extrae el array de `<Picker.Item>` a un archivo separado `constants/countries.ts` e impórtalo. Esto hace que la lista sea reutilizable en otras pantallas.
- **Internacionalización** – envuelve todos los textos de la UI en una función auxiliar de i18n simple (ej., `i18n.t('register.title')`).
- **Carga de documentos** – actualmente las URIs nunca se envían. Agrega una solicitud multipart/form-data en `apiPost` y una ruta correspondiente en el back-end que guarde la imagen en `personas.foto` (varbinary).
- **Manejo de errores** – unifica los mensajes de error capturando los errores de Axios en `api.ts` y devolviendo un payload consistente.

---

## Qué está **hardcodeado** vs **dinámico**
| Aspecto | Hardcodeado | Dinámico (manejado por el back-end) |
|--------|------------|------------------------------|
| URLs de la API | `/auth/register`, `/auth/login`, `/auth/complete-registration` | – |
| Colores | Valores hexadecimales directamente en las clases JSX | – (podrían moverse a la configuración de Tailwind) |
| Opciones de países | Lista de `<Picker.Item>` en `register.tsx` | – |
| Nombres de campos del formulario | `firstName`, `lastName`, … definidos en `formData` | – |
| Manejo del código temporal | Simulado por un console log en el back-end; el front-end solo muestra una alerta | El código en sí es generado en el lado del servidor, no se guarda en el front-end |
| Redirecciones | `router.push('/(auth)/complete-registration')` | – |
