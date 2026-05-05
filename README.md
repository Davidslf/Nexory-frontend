# Nexory — Frontend

Interfaz web del sistema de gestión de ISP Nexory.  
**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · Framer Motion

> El frontend consume la API del backend. Asegúrate de tener el backend corriendo antes de iniciar el frontend.

---

## Requisitos previos

- Node.js 20+
- npm
- El backend corriendo en `http://localhost:3000`

> Si es una Mac nueva, primero sigue el **setup del backend** (`nexory-backend/README.md`) que instala Node.js y todo lo necesario.

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Correr en desarrollo
npm run dev
```

Corre en → `http://localhost:5001`

---

## Comandos disponibles

```bash
# Desarrollo con hot reload
npm run dev

# Compilar para producción
npm run build

# Previsualizar build de producción
npm run preview

# Verificar tipos TypeScript
npx tsc --noEmit
```

---

## Variables de entorno

El frontend no necesita un `.env` para correr en local — apunta al backend en `http://localhost:3000` por defecto.

Si necesitas cambiar la URL del backend, crea un `.env.local`:

```env
VITE_API_URL=http://localhost:3000
```

---

## Estructura

```
nexory-frontend/
├── public/
│   └── images/              # Logos de Nexory
├── src/
│   ├── components/
│   │   ├── layout/          # Sidebar, Navbar, DashboardLayout
│   │   └── ui/              # Componentes reutilizables (Tooltip, Pagination, etc.)
│   ├── context/             # AuthContext, SidebarContext, ThemeContext
│   ├── features/            # Páginas por módulo
│   │   ├── auth/            # Login
│   │   ├── clients/         # Gestión de clientes
│   │   ├── communications/  # Comunicados (WhatsApp + Email)
│   │   ├── cuts/            # Cortes de servicio
│   │   ├── dashboard/       # Dashboard principal
│   │   ├── settings/        # Configuración
│   │   └── support/         # Soporte técnico (tickets)
│   ├── services/            # Llamadas a la API (api.ts)
│   ├── utils/               # Helpers (permissions, formatDate, cn)
│   └── main.tsx             # Entrada principal
└── package.json
```

---

## Puertos

| Servicio    | Puerto |
|-------------|--------|
| Frontend    | 5001   |
| Backend API | 3000   |
