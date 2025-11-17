# 🔧 Solución para Enlaces de Recuperación

## ❌ Problema Actual

Los enlaces de recuperación apuntan a `localhost:3000` en lugar de la URL del sandbox, causando error ERR_CONNECTION_REFUSED.

---

## ✅ Solución 1: Configurar URL en Supabase (PERMANENTE)

### **Paso 1: Ir a Supabase Dashboard**
1. Abre tu proyecto en https://supabase.com/dashboard
2. Ve a **Authentication** → **URL Configuration**

### **Paso 2: Configurar Site URL**
En el campo **"Site URL"**, cambia de:
```
http://localhost:3000
```

A:
```
https://3000-i5s33sylkioq6bwtgesvz-c07dda5e.sandbox.novita.ai
```

### **Paso 3: Agregar Redirect URLs**
En **"Redirect URLs"**, agrega (una por línea):
```
http://localhost:3000/**
https://3000-i5s33sylkioq6bwtgesvz-c07dda5e.sandbox.novita.ai/**
https://*.sandbox.novita.ai/**
```

### **Paso 4: Guardar**
Click en **"Save"**

### **Paso 5: Solicitar nuevo enlace**
1. Ve a la app y solicita otro enlace de recuperación
2. Ahora llegará con la URL correcta del sandbox

---

## ✅ Solución 2: Usar el Token Manualmente (INMEDIATO)

Si ya tienes un enlace de recuperación, puedes extraer el token y usarlo:

### **Tu enlace actual:**
```
http://localhost:3000/#access_token=eyJhbGc...&type=recovery
```

### **Cambiar localhost por la URL del sandbox:**

**Copia y pega este enlace corregido en tu navegador:**

```
https://3000-i5s33sylkioq6bwtgesvz-c07dda5e.sandbox.novita.ai/#access_token=eyJhbGciOiJIUzI1NiIsImtpZCI6IlBseXo4MERzY3F3MUpDQXYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2p6emt2YWFrZnp3ZnRud3Vrb2RqLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI1Mjc4OTE5ZS00NzdmLTQyMzktYjcwMC04NmRjNTYxMGRlMzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzYzNDA5NjIzLCJpYXQiOjE3NjM0MDYwMjMsImVtYWlsIjoib2ZpbWF0aWNhZGlnaXRhbEBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoib2ZpbWF0aWNhZGlnaXRhbEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfdmVyaWZpZWQiOmZhbHNlLCJzdWIiOiI1Mjc4OTE5ZS00NzdmLTQyMzktYjcwMC04NmRjNTYxMGRlMzUifSwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJvdHAiLCJ0aW1lc3RhbXAiOjE3NjM0MDYwMjN9XSwic2Vzc2lvbl9pZCI6IjAzNTcxNDM1LTMyMmEtNDAzOC04ZGVjLTQzYWExZDBjYWUzNyIsImlzX2Fub255bW91cyI6ZmFsc2V9.RGo7-1HeGeN1KXGAjOr1SPc8kRVBo3SwpgAHZ2COZFc&expires_at=1763409623&expires_in=3600&refresh_token=zdzz7jm2zzc6&token_type=bearer&type=recovery
```

---

## ✅ Solución 3: Usar Magic Link (MÁS FÁCIL)

**Si ninguna de las anteriores funciona:**

1. Ve a **Supabase Dashboard** → **Authentication** → **Users**
2. Busca tu email
3. Click en **3 puntos** → **"Send Magic Link"**
4. **ANTES** de hacer click en el enlace del email:
   - Configura la Site URL (Solución 1)
5. Luego click en el enlace del email
6. Deberías entrar directamente

---

## 🎯 Orden Recomendado

1. ✅ **Primero**: Configurar Site URL en Supabase (Solución 1)
2. ✅ **Segundo**: Solicitar nuevo Magic Link desde Dashboard
3. ✅ **Alternativa**: Usar el enlace corregido (Solución 2)

---

## 📊 Información del Token que pegaste

Del enlace que proporcionaste, veo que:
- ✅ Usuario: `ofimaticadigital@gmail.com`
- ✅ Token válido por: 1 hora (expires_in=3600)
- ✅ Tipo: recovery (para reset de contraseña)
- ⚠️ Este NO es el usuario admin (`alvarolopezmeastro@gmail.com`)

---

## ⚠️ IMPORTANTE

El token del enlace es para `ofimaticadigital@gmail.com`, NO para `alvarolopezmeastro@gmail.com`.

**Para el usuario admin correcto:**
1. Solicita Magic Link para `alvarolopezmeastro@gmail.com`
2. O configura ese usuario en Supabase primero (ejecuta el SQL del paso anterior)

---

## 📝 Siguiente Paso

¿Qué prefieres hacer?
1. Configurar Site URL en Supabase y solicitar nuevo enlace
2. Usar el enlace corregido que te di arriba
3. Usar Magic Link desde Dashboard de Supabase
