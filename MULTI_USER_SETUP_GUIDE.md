# 🚀 Guía Completa: Sistema Multi-Usuario con Organizaciones

## 📋 Índice

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Paso 1: Ejecutar SQL en Supabase](#paso-1-ejecutar-sql-en-supabase)
3. [Paso 2: Configurar Primer Usuario Admin](#paso-2-configurar-primer-usuario-admin)
4. [Paso 3: Implementación Frontend](#paso-3-implementación-frontend)
5. [Paso 4: Testing](#paso-4-testing)
6. [Flujos de Trabajo](#flujos-de-trabajo)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Resumen del Sistema

### **Arquitectura**

```
Organización (Despacho)
  └── Usuarios
      ├── Admins (Asignadores)
      │   ├── Ven todos los emails
      │   ├── Asignan expedientes
      │   └── Gestionan usuarios
      └── Members (Usuarios Normales)
          ├── Solo ven expedientes asignados
          ├── Pueden editar expedientes asignados
          └── Pueden crear expedientes propios
```

### **Tablas Creadas**

1. **`organizations`** - Organizaciones/Despachos
2. **`user_profiles`** - Perfiles extendidos con rol y organización
3. **`expedientes`** - Expedientes con organization_id
4. **`expediente_assignments`** - Asignaciones de expedientes a usuarios
5. **`emails`** - Emails con organization_id y asignación
6. **`clientes`** - Clientes por organización

---

## 📝 Paso 1: Ejecutar SQL en Supabase

### **Opción A: SQL Editor (Recomendado)**

1. Ve a tu dashboard de Supabase:
   ```
   https://supabase.com/dashboard/project/jzzkvaakfzwftnwukodj
   ```

2. En el menú lateral → **SQL Editor**

3. Click en **"New query"**

4. Abre el archivo:
   ```
   /home/user/webapp/database/migrations/setup_multi_user_system.sql
   ```

5. Copia TODO el contenido del archivo

6. Pégalo en el SQL Editor

7. Click en **"Run"** o `Ctrl+Enter`

8. Espera a que termine (debería tomar 5-10 segundos)

9. Verifica que aparezca al final:
   ```
   ✅ Sistema multi-usuario creado exitosamente!
   ```

### **⚠️ IMPORTANTE: Respaldo de Datos**

Este script **BORRA** las tablas existentes. Si tienes datos importantes:

1. Exporta tus datos antes:
   - Table Editor → Selecciona tabla → Export to CSV

2. O comenta las líneas de DROP en el SQL:
   ```sql
   -- DROP TABLE IF EXISTS public.expedientes CASCADE;
   -- DROP TABLE IF EXISTS public.emails CASCADE;
   ```

---

## 👤 Paso 2: Configurar Primer Usuario Admin

Después de ejecutar el SQL, necesitas crear tu primer usuario admin manualmente.

### **Método 1: SQL Directo**

```sql
-- 1. Primero, crea tu usuario en Supabase Auth (si no existe)
-- Ve a Authentication → Users → Add user
-- Email: tu-email@ejemplo.com
-- Password: [genera una contraseña]
-- Copia el UUID del usuario

-- 2. Luego ejecuta esto en SQL Editor:
INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role
) VALUES (
    'TU-USER-UUID-AQUI', -- UUID del usuario de auth.users
    '00000000-0000-0000-0000-000000000001', -- ID de la org demo
    'Tu Nombre Completo',
    'tu-email@ejemplo.com',
    'admin' -- ROL IMPORTANTE
);
```

### **Método 2: Crear Organización Nueva**

Si quieres crear tu propia organización:

```sql
-- 1. Crear tu organización
INSERT INTO public.organizations (name, slug, subscription_plan, contact_email)
VALUES (
    'Mi Despacho',
    'mi-despacho',
    'professional',
    'contacto@midespacho.com'
)
RETURNING id; -- Guarda este ID

-- 2. Crear tu perfil de usuario (admin)
INSERT INTO public.user_profiles (
    user_id,
    organization_id,
    full_name,
    email,
    role
) VALUES (
    'TU-USER-UUID', -- UUID de auth.users
    'ID-DE-TU-ORG', -- ID de la organización creada arriba
    'Tu Nombre',
    'tu-email@ejemplo.com',
    'admin'
);
```

---

## 💻 Paso 3: Implementación Frontend

### **3.1: Crear AuthContext con Organización**

Ya tengo el código listo. Lo implementaremos en los siguientes commits:

**Archivo:** `/contexts/AuthContext.tsx`

Funcionalidades:
- Carga automática de `userProfile` al iniciar sesión
- Carga de `organization`
- Helper `isAdmin` y `isMember`
- Función `refreshProfile()` para actualizar datos

### **3.2: Proteger Rutas por Rol**

```typescript
// Ejemplo de componente protegido
const AdminOnly = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/unauthorized" />;
  
  return children;
};
```

### **3.3: Componentes a Crear/Modificar**

1. **Panel de Gestión de Usuarios** (solo admins)
   - Ver lista de usuarios de la organización
   - Invitar nuevos usuarios
   - Cambiar roles
   - Desactivar usuarios

2. **Panel de Asignación de Emails** (solo admins)
   - Ver bandeja de entrada completa
   - Asignar emails a usuarios
   - Crear expedientes desde emails

3. **Vista de Expedientes (modificada)**
   - Admins: ven todos
   - Members: solo asignados

4. **Selector de Usuario** (para asignaciones)
   - Dropdown con usuarios de la organización
   - Filtro por rol

---

## 🔄 Flujos de Trabajo

### **Flujo 1: Llega un Email Nuevo**

```
1. Email llega → Tabla `emails` (organization_id, is_processed=false)
2. Admin ve email en bandeja de entrada
3. Admin decide:
   a) Asignar a expediente existente
   b) Crear nuevo expediente
4. Admin selecciona usuario asignado
5. Se crea/actualiza expediente
6. Se crea registro en `expediente_assignments`
7. Email se marca como procesado
8. Usuario asignado ve el expediente en su lista
```

### **Flujo 2: Usuario Normal Crea Expediente**

```
1. Usuario member crea expediente
2. Se guarda con:
   - organization_id (su organización)
   - created_by_user_id (su user_id)
3. Se crea asignación automática:
   - expediente_id
   - assigned_to_user_id (él mismo)
   - is_primary = true
4. Usuario ve el expediente en su lista
```

### **Flujo 3: Admin Asigna Expediente a Otro Usuario**

```
1. Admin busca expediente
2. Click en "Asignar a usuario"
3. Selecciona usuario(s) del dropdown
4. Se crea registro en `expediente_assignments`:
   - expediente_id
   - assigned_to_user_id
   - assigned_by_user_id (admin)
5. Usuario recibe notificación (opcional)
6. Usuario ve expediente en su lista
```

### **Flujo 4: Invitar Nuevo Usuario**

```
1. Admin va a "Gestión de Usuarios"
2. Click "Invitar Usuario"
3. Completa formulario:
   - Email
   - Nombre completo
   - Rol (admin/member)
4. Sistema envía invitación por email (Supabase Auth)
5. Usuario se registra
6. Se crea automáticamente su `user_profile`
7. Usuario ya puede acceder al sistema
```

---

## 🧪 Paso 4: Testing

### **Test 1: Verificar RLS para Admins**

```sql
-- Simular que eres un admin
SET request.jwt.claims.sub = 'UUID-DEL-ADMIN';

-- Deberías ver todos los expedientes
SELECT * FROM expedientes;

-- Deberías ver todos los emails
SELECT * FROM emails;
```

### **Test 2: Verificar RLS para Members**

```sql
-- Simular que eres un member
SET request.jwt.claims.sub = 'UUID-DEL-MEMBER';

-- Solo deberías ver expedientes asignados a ti
SELECT * FROM expedientes;

-- No deberías ver emails no asignados
SELECT * FROM emails;
```

### **Test 3: Crear Asignación**

```sql
-- Como admin, asignar expediente
INSERT INTO expediente_assignments (
    expediente_id,
    assigned_to_user_id,
    assigned_by_user_id
) VALUES (
    'UUID-EXPEDIENTE',
    'UUID-USUARIO-MEMBER',
    'UUID-ADMIN'
);

-- Verificar que el member ahora lo ve
-- (cambiar request.jwt.claims.sub y hacer SELECT)
```

---

## 🔍 Troubleshooting

### **Error: "new row violates row-level security policy"**

**Causa:** Intentas insertar un registro sin cumplir las políticas RLS.

**Solución:**
1. Verifica que tu `user_profile` existe y tiene rol asignado
2. Verifica que estás usando el `organization_id` correcto
3. Revisa las políticas con:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'nombre_tabla';
   ```

### **Error: "null value in column organization_id"**

**Causa:** Intentas crear un registro sin especificar la organización.

**Solución:**
1. Siempre incluye `organization_id` en los INSERT
2. Obtén el organization_id desde el userProfile:
   ```typescript
   const { userProfile } = useAuth();
   const organization_id = userProfile.organization_id;
   ```

### **No veo expedientes siendo member**

**Causa:** No tienes asignaciones en `expediente_assignments`.

**Solución:**
1. Verifica asignaciones:
   ```sql
   SELECT * FROM expediente_assignments 
   WHERE assigned_to_user_id = 'TU-USER-ID';
   ```
2. Si no hay, pide a un admin que te asigne expedientes

### **No puedo crear usuarios**

**Causa:** Solo admins pueden crear usuarios.

**Solución:**
1. Verifica tu rol:
   ```sql
   SELECT role FROM user_profiles WHERE user_id = 'TU-USER-ID';
   ```
2. Si no eres admin, pide a un admin que cambie tu rol

---

## 📊 Consultas Útiles

### **Ver estructura de mi organización**

```sql
SELECT 
    o.name as organizacion,
    COUNT(DISTINCT up.id) as total_usuarios,
    COUNT(DISTINCT CASE WHEN up.role = 'admin' THEN up.id END) as admins,
    COUNT(DISTINCT CASE WHEN up.role = 'member' THEN up.id END) as members,
    COUNT(DISTINCT e.id) as total_expedientes,
    COUNT(DISTINCT em.id) as total_emails
FROM organizations o
LEFT JOIN user_profiles up ON up.organization_id = o.id
LEFT JOIN expedientes e ON e.organization_id = o.id
LEFT JOIN emails em ON em.organization_id = o.id
WHERE o.id = 'TU-ORGANIZATION-ID'
GROUP BY o.id, o.name;
```

### **Ver mis asignaciones**

```sql
SELECT 
    e.titulo_asunto,
    e.numero_expediente,
    e.estado,
    ea.assigned_at,
    up.full_name as asignado_por
FROM expediente_assignments ea
JOIN expedientes e ON e.id = ea.expediente_id
LEFT JOIN user_profiles up ON up.user_id = ea.assigned_by_user_id
WHERE ea.assigned_to_user_id = 'TU-USER-ID'
ORDER BY ea.assigned_at DESC;
```

### **Ver emails sin procesar (solo admins)**

```sql
SELECT 
    subject,
    sender,
    received_at,
    is_processed
FROM emails
WHERE organization_id = 'TU-ORGANIZATION-ID'
AND is_processed = false
ORDER BY received_at DESC;
```

---

## 🎉 Siguientes Pasos

Una vez que hayas completado estos pasos:

1. ✅ SQL ejecutado correctamente
2. ✅ Primer admin creado
3. ✅ Login funciona y carga userProfile

Entonces procederemos a:
- Implementar AuthContext completo
- Crear panel de gestión de usuarios
- Crear panel de asignación de emails
- Modificar vistas existentes para roles
- Testing completo

---

## 📞 Soporte

Si encuentras algún problema durante la implementación, revisa:

1. Logs de Supabase (Dashboard → Logs)
2. Políticas RLS (SQL Editor → Ver políticas)
3. Esta guía (sección Troubleshooting)

---

**¡Éxito con tu implementación!** 🚀
