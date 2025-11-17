# Configuración de Email en Supabase

## 🔧 Configuración Necesaria

Para que funcione la recuperación de contraseña y verificación de email, necesitas configurar lo siguiente en tu proyecto Supabase:

---

## 1️⃣ Configurar URL de Redirección

### **Ir a Dashboard de Supabase:**
1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Authentication** → **URL Configuration**

### **Agregar URLs permitidas:**

En el campo **"Redirect URLs"**, agrega:

```
http://localhost:3000
https://3000-i5s33sylkioq6bwtgesvz-c07dda5e.sandbox.novita.ai
https://*.sandbox.novita.ai
https://tu-dominio-produccion.com
```

---

## 2️⃣ Configurar Email Templates (Opcional pero Recomendado)

### **Personalizar el Email de Reset:**
1. Ve a **Authentication** → **Email Templates**
2. Selecciona **"Reset Password"**
3. Puedes personalizar el mensaje

**Template recomendado:**

```html
<h2>Restablecer tu contraseña</h2>
<p>Hola,</p>
<p>Has solicitado restablecer tu contraseña para tu cuenta en LegalAI.</p>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a></p>
<p>Si no solicitaste esto, puedes ignorar este correo de forma segura.</p>
<p>Este enlace expira en 24 horas.</p>
```

---

## 3️⃣ Configurar SMTP (Para Producción)

Por defecto, Supabase usa su propio servidor de email, pero tiene limitaciones:
- 4 emails por hora en el plan Free
- Emails pueden ir a spam

### **Configurar tu propio SMTP:**
1. Ve a **Project Settings** → **Auth** → **SMTP Settings**
2. Activa **"Enable Custom SMTP"**
3. Ingresa los datos de tu proveedor (Gmail, SendGrid, etc.)

**Ejemplo con Gmail:**
```
Host: smtp.gmail.com
Port: 587
Username: tu-email@gmail.com
Password: [App Password - no tu contraseña normal]
Sender email: tu-email@gmail.com
Sender name: LegalAI
```

> ⚠️ **Para Gmail**: Debes crear una "App Password" en tu cuenta de Google (Configuración → Seguridad → Contraseñas de aplicaciones)

---

## 4️⃣ Probar la Funcionalidad

### **Prueba de Reset de Contraseña:**
1. Ve a la pantalla de login: https://3000-i5s33sylkioq6bwtgesvz-c07dda5e.sandbox.novita.ai
2. Click en **"¿Olvidaste tu contraseña?"**
3. Ingresa tu email: `alvarolopezmeastro@gmail.com`
4. Click en **"Enviar Enlace de Recuperación"**
5. Revisa tu bandeja de entrada (y spam)
6. Click en el enlace del email
7. Serás redirigido a la app para crear una nueva contraseña

---

## 🔍 Solución de Problemas

### **No me llega el email:**
1. ✅ Verifica la carpeta de spam
2. ✅ Confirma que el email esté registrado en Supabase
3. ✅ Revisa los logs en Supabase Dashboard → Logs → Auth
4. ✅ Si usas plan Free, verifica no haber excedido el límite de 4 emails/hora

### **El enlace no funciona:**
1. ✅ Verifica que la URL esté en la lista de Redirect URLs
2. ✅ Asegúrate de que el enlace no haya expirado (24 horas)
3. ✅ Intenta copiar y pegar el enlace completo en el navegador

### **Aparece error 404:**
1. ✅ Necesitas crear la página `/reset-password` (próxima tarea)
2. ✅ Por ahora, el usuario puede usar "Magic Link" desde Supabase Dashboard

---

## 🎯 Alternativa Temporal: Magic Link desde Dashboard

Mientras configuras todo, puedes usar esta alternativa:

1. Ve a Supabase Dashboard → **Authentication** → **Users**
2. Busca `alvarolopezmeastro@gmail.com`
3. Click en los **3 puntos** → **"Send Magic Link"**
4. Revisa tu email
5. Click en el enlace del email
6. Entrarás automáticamente sin contraseña

---

## 📋 Checklist de Configuración

- [ ] URLs de redirección agregadas en Supabase
- [ ] Email template personalizado (opcional)
- [ ] SMTP configurado (para producción)
- [ ] Probado flujo de reset con email real
- [ ] Confirmado que emails no van a spam

---

## 🚀 Siguiente Paso

Para completar el flujo, necesitas crear la página de reset de contraseña (`/reset-password`), pero por ahora puedes:

1. **Usar Magic Link** desde el Dashboard de Supabase
2. **Probar la funcionalidad** de "Olvidé mi contraseña" (enviará el email)
3. **Iniciar sesión** con tu contraseña actual si la recuerdas

---

## 📞 ¿Necesitas Ayuda?

Si necesitas ayuda configurando cualquiera de estos pasos, avísame y te guío paso a paso.
