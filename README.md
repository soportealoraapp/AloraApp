# Alora - App de Citas Segura

## 🌸 Descripción

Alora es una aplicación de citas diseñada para crear un espacio seguro y auténtico donde las personas puedan conocerse. Con foco especial en la seguridad femenina, verificación de identidad y moderación de contenido.

## ✨ Características Principales

- 🔐 **Autenticación real** (Email, Google, Apple)
- 🔐 **Seguridad Hardened**: Lógica crítica (likes, matches) migrada totalmente al servidor (API Routes + Admin SDK) para prevenir exploits.
- 💖 **Matching inteligente**: Algoritmo de compatibilidad protegido y optimizado.
- 💬 **Chat en tiempo real**: Moderación AI asincrónica mejorada (Genkit + Gemini) con indicadores de estado (enviando/filtrado).
- ✔️ **Verificación Real-Time**: Captura directa de selfie desde la cámara integrada para una verificación de identidad más robusta.
- 🛡️ **Reglas de Seguridad**: Firestore y Storage configurados con el principio de mínimo privilegio.
- 📱 **Estabilidad Mobile**: Scroll y viewport optimizados para dispositivos móviles (Capacitor).
- 🎨 **UI/UX femenino** con tonos suaves y microcopy empático

## 🚀 Getting Started

### Prerequisitos

- Node.js 18+ instalado
- Cuenta de Firebase
- npm o yarn

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd Alora

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase
```

### Configuración de Firebase

1. **Crear proyecto en Firebase Console**
   - Ir a https://console.firebase.google.com
   - Crear nuevo proyecto "Alora"

2. **Habilitar servicios**
   ```
   - Authentication → Email/Password, Google, Apple
   - Firestore Database → Modo producción
   - Storage → Configurar
   - (Opcional) Hosting
   ```

3. **Obtener credenciales Web**
   - Settings → General → Tu app web
   - Copiar config a `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

4. **Obtener credenciales Admin**
   - Settings → Service Accounts → Generar nueva clave privada
   - Copiar valores a `.env.local`:
   ```env
   FIREBASE_ADMIN_PROJECT_ID=...
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_ADMIN_CLIENT_EMAIL=...
   ```

5. **Variables adicionales**
   ```env
   NEXT_PUBLIC_APP_URL=http://localhost:9002
   SESSION_SECRET_KEY=<generar-random-32-chars>
   ```

### Crear Índices de Firestore

Ir a Firebase Console → Firestore → Indexes y crear:

```javascript
// discover feed
Collection: profiles
Fields: isActive ASC, gender ASC

// matches
Collection: matches
Fields: users ARRAY, status ASC, matchedAt DESC

// messages
Collection: messages
Fields: matchId ASC, createdAt ASC

// likes
Collection: likes
Fields: toUserId ASC, fromUserId ASC
```

### Configurar Storage Rules

Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:9002](http://localhost:9002)

## 🏗️ Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/              # Login, Signup
│   ├── (app)/               # App principal
│   │   ├── discover/        # Feed de perfiles
│   │   ├── chat/            # Conversaciones
│   │   ├── profile/         # Perfil usuario
│   │   ├── settings/        # Configuración
│   │   └── compatibility/   # Juegos (futuro)
│   └── api/                 # API Routes
│       ├── profile/
│       ├── match/
│       ├── chat/
│       ├── discover/
│       └── block/
├── lib/
│   └── firebase/            # 13 servicios Firebase
│       ├── config.ts
│       ├── admin.ts
│       ├── auth-service.ts
│       ├── profile-service.ts
│       ├── matching-service.ts
│       ├── chat-service.ts
│       ├── block-service.ts
│       ├── report-service.ts
│       ├── referral-service.ts
│       ├── storage-service.ts
│       ├── discover-service.ts
│       ├── preferences-service.ts
│       └── verification-service.ts
├── hooks/                   # Custom hooks
│   ├── use-profile.ts
│   ├── use-discover.ts
│   ├── use-matches.ts
│   ├── use-chat.ts
│   └── use-block.ts
├── contexts/
│   └── AuthContext.tsx
└── components/              # Componentes UI
    ├── discover/
    └── chat/
```

## 🔥 Scripts Disponibles

```bash
npm run dev          # Servidor desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run lint         # Linter
npm run typecheck    # TypeScript check
```

## 🎯 Flujos Principales

### 1. Registro
1. Usuario ingresa email, contraseña, edad, ciudad
2. Selecciona intereses y valores
3. Se crea cuenta en Firebase Auth
4. Se crea perfil en Firestore
5. Se generan preferencias y código referido

### 2. Discover
1. Usuario ve feed de perfiles filtrado por preferencias
2. Puede dar Like o Super Match
3. Si like es mutuo → ¡Match! → Chat disponible
4. Perfiles rechazados se guardan en preferencias

### 3. Chat
1. Usuarios con match pueden chatear
2. Mensajes en tiempo real con Firestore
3. Moderación AI automática (Genkit)
4. Indicadores de lectura

### 4. Seguridad
1. Bloquear usuario → no aparecerá más
2. Reportar usuario → revisión admin
3. Modo incógnito → perfil oculto en discover
4. Solo verificados → filtro activo por defecto

## 📱 Características de Seguridad

- ✅ Verificación obligatoria de email
- ✅ Moderación AI en todos los mensajes
- ✅ Sistema de bloqueo instantáneo
- ✅ Sistema de reportes
- ✅ Modo incógnito
- ✅ Control de visibilidad
- ✅ Badge de verificación visible
- ✅ Filtro "solo verificados"

## 🎨 Diseño UX/UI

El diseño está optimizado para crear un ambiente seguro y acogedor:

- **Paleta de colores:** Rosa suave, violeta, tonos pasteles
- **Tipografía:** PT Sans (cálida y legible)
- **Microcopy:** Empático y amigable
- **Iconografía:** Suave y redondeada
- **Feedback:** Toasts y animaciones sutiles

## 🧪 Testing (Próximamente)

```bash
# Tests E2E con Playwright
npm run e2e

# Tests unitarios
npm run test
```

## 🚀 Deployment

### Build local

```bash
npm run build
npm run start
```

### Firebase Hosting (Opcional)

```bash
firebase login
firebase init hosting
firebase deploy
```

## 📊 Algoritmo de Matching

El score de compatibilidad se calcula así:

- **30%** Intereses compartidos
- **25%** Valores en común
- **15%** Estilo de vida (fumar, beber, hijos)
- **10%** Gustos musicales
- **10%** Nivel educativo
- **10%** Diferencia de edad

Score final: 0-100%

## 🔐 Variables de Entorno

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_PRIVATE_KEY=
FIREBASE_ADMIN_CLIENT_EMAIL=

# App
NEXT_PUBLIC_APP_URL=http://localhost:9002
SESSION_SECRET_KEY=
```

## 📝 Próximas Funcionalidades

- [ ] 6 Juegos de compatibilidad interactivos
- [ ] Verificación de identidad con selfie
- [ ] Notificaciones push (FCM)
- [ ] Geolocalización y distancia real
- [ ] Video chat integrado
- [ ] Stories temporales
- [ ] Sistema de recompensas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso exclusivo.

## 👥 Equipo

Desarrollado con ❤️ para crear espacios seguros en el mundo digital.

---

**Estado del Proyecto:** 🟢 Producción Ready (MVP)
**Última Actualización:** Diciembre 2025

Para soporte o preguntas, contactar al equipo de desarrollo.