# Supabase Edge Functions

Este directorio contiene las Edge Functions de Supabase para el proyecto LegalAI.

## 📋 Funciones Disponibles

### `invite-user`
Crea e invita nuevos usuarios a la organización con permisos de administrador (service_role).

**Endpoint:** `POST https://[your-project-ref].supabase.co/functions/v1/invite-user`

**Autenticación:** Requiere JWT token de usuario admin

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "fullName": "Nombre Completo",
  "role": "admin" | "member"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "User invited successfully",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "full_name": "Nombre Completo",
    "role": "member"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🚀 Despliegue

### Requisitos Previos

1. **Instalar Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Iniciar sesión en Supabase:**
   ```bash
   supabase login
   ```

3. **Vincular tu proyecto:**
   ```bash
   supabase link --project-ref [your-project-ref]
   ```
   
   Puedes encontrar tu `project-ref` en tu dashboard de Supabase en la URL:
   `https://supabase.com/dashboard/project/[project-ref]`

### Desplegar la Función

Desde la raíz del proyecto, ejecuta:

```bash
# Desplegar TODAS las funciones
supabase functions deploy

# O desplegar solo invite-user
supabase functions deploy invite-user
```

### Configurar Variables de Entorno

Las siguientes variables se configuran automáticamente por Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

No necesitas configurar nada adicional.

---

## 🧪 Probar Localmente

### 1. Iniciar Supabase Local

```bash
supabase start
```

Esto iniciará:
- PostgreSQL (puerto 54322)
- PostgREST (puerto 54321)
- Studio (puerto 54323)
- Edge Functions Runtime

### 2. Ejecutar la Función Localmente

```bash
supabase functions serve invite-user
```

La función estará disponible en: `http://localhost:54321/functions/v1/invite-user`

### 3. Probar con curl

```bash
# Obtén un token de autenticación primero
# (desde tu app o usando supabase auth)

curl -X POST http://localhost:54321/functions/v1/invite-user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "member"
  }'
```

---

## 🔒 Seguridad

- ✅ La función verifica que el usuario esté autenticado
- ✅ Solo usuarios con rol "admin" pueden invitar a otros
- ✅ Usa service_role key (solo disponible en el servidor)
- ✅ Valida todos los campos de entrada
- ✅ Maneja errores de forma segura

---

## 🐛 Troubleshooting

### Error: "Function not found"
**Solución:** Asegúrate de haber desplegado la función:
```bash
supabase functions deploy invite-user
```

### Error: "Missing service_role key"
**Solución:** Verifica que tu proyecto esté vinculado correctamente:
```bash
supabase link --project-ref [your-project-ref]
```

### Error: "Unauthorized"
**Solución:** El usuario que intenta invitar no tiene rol "admin". Verifica en la tabla `user_profiles`.

---

## 📚 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
