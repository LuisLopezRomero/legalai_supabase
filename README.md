<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 📧 LegalAI - Gestión Inteligente de Correos Legales

Sistema inteligente de gestión de correos electrónicos y expedientes legales con IA integrada.

[![React](https://img.shields.io/badge/React-19.2.0-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.io/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange)](https://ai.google.dev/)

## ✨ Características

### 🎨 **UI/UX Moderna**
- ✅ Sistema de colores expandido con más de 20 variantes
- ✅ Animaciones suaves y transiciones profesionales
- ✅ Modo claro/oscuro con toggle animado 🌙☀️
- ✅ Diseño responsive y accesible
- ✅ Efectos hover elegantes y micro-interacciones

### 🤖 **IA Integrada**
- ✅ **Asignación inteligente de expedientes** con Gemini AI
- ✅ Análisis automático de contenido de emails
- ✅ Sugerencias con porcentaje de confianza (0-100%)
- ✅ Extracción de información clave (clientes, tipos de caso)
- ✅ Sistema de fallback con análisis por palabras clave

### 📋 **Gestión de Expedientes**
- ✅ Creación rápida desde emails
- ✅ Auto-asignación de expedientes a correos
- ✅ Búsqueda y filtrado avanzado
- ✅ Vista detallada con historial

### 📧 **Gestión de Emails**
- ✅ Bandeja de entrada con filtros
- ✅ Asignación a expedientes con un click
- ✅ Adjuntos con preview
- ✅ Análisis de contenido con IA

## 🚀 Instalación

### Prerequisitos

- Node.js 18+ 
- Cuenta de Supabase
- API Key de Google Gemini (opcional, para IA)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/LuisLopezRomero/legalai_supabase.git
cd legalai_supabase
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### A. Crear tablas en Supabase

Ejecuta el archivo `supabase_schema.sql` en el SQL Editor de Supabase:

```bash
# El archivo contiene todas las tablas, índices y políticas RLS
```

Ver [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para instrucciones detalladas.

#### B. Crear Storage Bucket

1. Ve a **Storage** en el dashboard de Supabase
2. Crea un bucket llamado `adjuntos-emails`
3. Configura las políticas de acceso (ver documentación)

### 4. Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```env
# Supabase (ya configurado en constants.ts)
SUPABASE_URL=https://jzzkvaakfzwftnwukodj.supabase.co
SUPABASE_ANON_KEY=tu-anon-key

# Gemini AI (para sugerencias inteligentes)
GEMINI_API_KEY=tu-gemini-api-key

# Opcional: Webhooks de n8n
WEBHOOK_URL=https://n8n.srv978987.hstgr.cloud/webhook/prueba-mails
FILE_UPLOAD_WEBHOOK_URL=https://n8n.srv978987.hstgr.cloud/webhook/subida-archivos
```

### 5. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Documentación

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Configuración completa de la base de datos
- **[supabase_schema.sql](./supabase_schema.sql)** - Script SQL ejecutable

## 🎯 Características Principales

### 🤖 Asignación Inteligente con IA

```typescript
// El sistema analiza automáticamente el contenido del email
const suggestions = await analyzeEmailForCaseAssignment(email, existingCases);

// Retorna sugerencias ordenadas por confianza
// [
//   { caseId: "...", confidence: 85, reasons: ["..."] },
//   { caseId: "...", confidence: 65, reasons: ["..."] }
// ]
```

### 🎨 Modo Claro/Oscuro

```typescript
// Hook para cambiar tema
const { theme, toggleTheme } = useTheme();

// Persiste automáticamente en localStorage
// Transiciones suaves de 300ms
```

### 📧 Creación Rápida de Expedientes

```typescript
// Modal con auto-completado desde email
<QuickCaseCreateModal 
  email={selectedEmail}
  onCreateCase={handleCreate}
/>
```

## 🏗️ Arquitectura

```
src/
├── components/           # Componentes React
│   ├── Auth.tsx         # Autenticación
│   ├── EmailDetail.tsx  # Detalle de email
│   ├── EmailList.tsx    # Lista de emails
│   ├── SidebarNav.tsx   # Navegación lateral
│   ├── ThemeToggle.tsx  # Toggle de tema
│   ├── SmartCaseAssignment.tsx  # Asignación con IA
│   └── cases/           # Gestión de expedientes
├── contexts/            # Contextos React
│   └── ThemeContext.tsx # Gestión de tema
├── services/            # Servicios
│   ├── supabaseClient.ts    # Cliente Supabase
│   ├── supabaseService.ts   # Operaciones DB
│   └── aiService.ts         # Análisis con IA
├── types.ts             # Tipos TypeScript
└── constants.ts         # Constantes
```

## 🔒 Seguridad

- ✅ **Row Level Security (RLS)** habilitado en todas las tablas
- ✅ Usuarios solo acceden a sus propios datos
- ✅ Políticas de seguridad estrictas en Storage
- ✅ Autenticación con Supabase Auth

## 🎨 Stack Tecnológico

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS, CSS Variables
- **Backend:** Supabase (PostgreSQL)
- **IA:** Google Gemini AI
- **Storage:** Supabase Storage
- **Auth:** Supabase Auth

## 📊 Base de Datos

### Tablas Principales

- `user_profiles` - Perfiles de usuario
- `expedientes` - Casos legales
- `emails` - Correos electrónicos
- `attachments` - Adjuntos
- `prompts` - Prompts guardados de IA

Ver [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para el esquema completo.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y pertenece a LuisLopezRomero.

## 🙏 Agradecimientos

- Google Gemini AI por el análisis inteligente
- Supabase por la infraestructura backend
- React y Vite por el framework frontend

---

**Desarrollado con ❤️ para la gestión legal inteligente**
