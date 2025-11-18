# 🚀 Desplegar Edge Function para Invitación de Usuarios

## ✅ Solución Definitiva Implementada

He implementado una **solución profesional y completa** para la invitación de usuarios usando Supabase Edge Functions con permisos de administrador (service_role key).

---

## 📋 ¿Qué se ha implementado?

1. ✅ **Edge Function `invite-user`** - Crea usuarios con permisos de admin
2. ✅ **Código actualizado** - El frontend ahora llama a la Edge Function
3. ✅ **Manejo de errores** - Mensajes claros y específicos
4. ✅ **Validación de permisos** - Solo admins pueden invitar
5. ✅ **Email de invitación** - Se envía automáticamente al nuevo usuario

---

## 🎯 Para que Funcione - Debes Desplegar la Edge Function

### Paso 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

### Paso 2: Iniciar Sesión

```bash
supabase login
```

Se abrirá tu navegador para autenticarte.

### Paso 3: Vincular tu Proyecto

```bash
cd /home/user/webapp
supabase link --project-ref [TU-PROJECT-REF]
```

**¿Dónde encontrar tu project-ref?**
- Ve a tu dashboard de Supabase
- La URL es: `https://supabase.com/dashboard/project/[project-ref]`
- Ejemplo: Si tu URL es `https://supabase.com/dashboard/project/jzzkvaakfzwftnwukodj`
- Tu project-ref es: `jzzkvaakfzwftnwukodj`

### Paso 4: Desplegar la Edge Function

```bash
supabase functions deploy invite-user
```

### Paso 5: ¡Listo! Probar

1. Ve a la aplicación
2. Login como admin (ofimaticadigital@gmail.com)
3. Click en "Usuarios"
4. Click en "Invitar Usuario"
5. Completa el formulario
6. ¡Debería funcionar perfectamente!

---

## 🔍 Verificar que se Desplegó Correctamente

Después de ejecutar `supabase functions deploy invite-user`, deberías ver:

```
Deploying invite-user (project ref: jzzkvaakfzwftnwukodj)
✓ Deployed function invite-user
Function URL: https://jzzkvaakfzwftnwukodj.supabase.co/functions/v1/invite-user
```

---

## ❌ Si No Quieres Desplegar Edge Function (Temporal)

Si por alguna razón no puedes desplegar la Edge Function ahora mismo, puedes seguir usando el **método SQL** que te proporcioné anteriormente:

### Usar script SQL para crear usuarios:

1. Ve a Supabase SQL Editor
2. Ejecuta el script `database/create_user_AUTOMATIC.sql`
3. Cambia los valores (email, password, nombre, rol)
4. Ejecuta

**Este método funciona pero:**
- ❌ No es automático desde la UI
- ❌ Tienes que ir a SQL cada vez
- ❌ No escala bien para muchos usuarios

---

## 🎯 Ventajas de la Edge Function (Solución Definitiva)

✅ **Desde la UI** - Invitar usuarios directamente desde la interfaz  
✅ **Email automático** - El usuario recibe invitación por correo  
✅ **Seguro** - Usa permisos de service_role (solo en servidor)  
✅ **Validaciones** - Verifica permisos, duplicados, campos requeridos  
✅ **Profesional** - Método estándar de producción  
✅ **Escalable** - Puede invitar muchos usuarios fácilmente  

---

## 🐛 Errores Comunes

### Error: "supabase: command not found"
**Solución:** Instala Supabase CLI con `npm install -g supabase`

### Error: "Not logged in"
**Solución:** Ejecuta `supabase login`

### Error: "Project not linked"
**Solución:** Ejecuta `supabase link --project-ref [tu-project-ref]`

### Error: "FunctionsRelayError" en la UI
**Solución:** La función no está desplegada. Ejecuta `supabase functions deploy invite-user`

---

## 📞 Necesitas Ayuda?

Si tienes problemas desplegando, avísame y te ayudo paso a paso.

---

## 🎉 Una Vez Desplegado

Después de desplegar la Edge Function, la invitación de usuarios funcionará **perfectamente** desde la interfaz:

1. Admin hace click en "Invitar Usuario"
2. Completa el formulario
3. Click en "Enviar Invitación"
4. ✅ Usuario creado
5. 📧 Email enviado al nuevo usuario
6. 🔑 Usuario configura su contraseña
7. 🎯 ¡Todo listo!

---

**¿Listo para desplegar? Sigue los pasos y avísame si necesitas ayuda.** 🚀
