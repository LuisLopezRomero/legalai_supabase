# 🔐 Configuración de Variables de Entorno

## 📍 Ubicación del archivo

El archivo `.env` debe estar en la raíz del proyecto:

```
/home/user/webapp/.env
```

## ✅ Estado Actual

Ya he creado el archivo `.env` con tus credenciales existentes de Supabase. El archivo contiene:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jzzkvaakfzwftnwukodj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🔑 Obtener tu API Key de Gemini

Para que funcionen las **sugerencias inteligentes de casos con IA**, necesitas configurar tu API key de Gemini:

### Paso 1: Obtener la API Key

1. Ve a: **https://makersuite.google.com/app/apikey**
2. Inicia sesión con tu cuenta de Google
3. Click en "Get API Key" o "Create API Key"
4. Copia la clave generada

### Paso 2: Configurar en tu proyecto

1. Abre el archivo `.env` en la raíz del proyecto:
   ```bash
   cd /home/user/webapp
   nano .env
   ```
   
   O simplemente edítalo con cualquier editor de texto.

2. Reemplaza `your_gemini_api_key_here` con tu clave real:
   ```env
   VITE_GEMINI_API_KEY=AIzaSyD-tu-clave-real-aqui
   ```

3. Guarda el archivo

### Paso 3: Reiniciar el servidor de desarrollo

Si tienes el servidor corriendo, reinícialo para que cargue las nuevas variables:

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

## 🔒 Seguridad

- ✅ El archivo `.env` está en `.gitignore` - **NO se subirá a GitHub**
- ✅ Tus credenciales están protegidas localmente
- ✅ El archivo `.env.example` sirve como plantilla (sin credenciales reales)

## 📝 Variables Disponibles

| Variable | Descripción | Estado |
|----------|-------------|--------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Configurada |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ Configurada |
| `VITE_GEMINI_API_KEY` | API Key de Google Gemini | ⚠️ Necesita configurarse |

## 🚀 Funcionalidades que dependen de Gemini API

Si NO configuras `VITE_GEMINI_API_KEY`, estas funcionalidades usarán el **fallback de búsqueda por palabras clave**:

- 🤖 Análisis inteligente de emails
- 💡 Sugerencias de casos con porcentaje de confianza
- 🧠 Razonamiento detallado de cada sugerencia

**Con la API configurada**, obtendrás análisis más precisos y contextuales.

## ❓ Solución de Problemas

### Error: "API key not configured"

Si ves este error, significa que necesitas configurar `VITE_GEMINI_API_KEY` en tu archivo `.env`.

### Error: "Invalid API key"

Verifica que:
1. La clave esté correctamente copiada (sin espacios extra)
2. La clave esté activa en Google AI Studio
3. Hayas reiniciado el servidor después de cambiar el `.env`

### El archivo .env no existe

Si por alguna razón se borró, puedes recrearlo usando `.env.example` como plantilla:

```bash
cp .env.example .env
# Luego edita .env con tus credenciales reales
```

## 📞 Más Información

- Documentación de Gemini API: https://ai.google.dev/docs
- Supabase Dashboard: https://supabase.com/dashboard/project/jzzkvaakfzwftnwukodj
