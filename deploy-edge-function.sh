#!/bin/bash

# Script para desplegar la Edge Function de invitación de usuarios
# Uso: ./deploy-edge-function.sh

set -e

echo "🚀 Desplegando Edge Function para Invitación de Usuarios"
echo "=========================================================="
echo ""

# Verificar que Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ ERROR: Supabase CLI no está instalado"
    echo ""
    echo "📦 Para instalar, ejecuta:"
    echo "   npm install -g supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI encontrado"
echo ""

# Verificar que el usuario está logueado
echo "🔐 Verificando autenticación..."
if ! supabase projects list &> /dev/null; then
    echo "❌ ERROR: No estás logueado en Supabase"
    echo ""
    echo "🔑 Para iniciar sesión, ejecuta:"
    echo "   supabase login"
    echo ""
    exit 1
fi

echo "✅ Usuario autenticado"
echo ""

# Preguntar por el project-ref si no está vinculado
echo "🔗 Verificando vinculación del proyecto..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Proyecto no vinculado"
    echo ""
    read -p "📝 Ingresa tu project-ref (ejemplo: jzzkvaakfzwftnwukodj): " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        echo "❌ ERROR: Debes proporcionar un project-ref"
        exit 1
    fi
    
    echo ""
    echo "🔗 Vinculando proyecto..."
    supabase link --project-ref "$PROJECT_REF"
    echo ""
fi

echo "✅ Proyecto vinculado"
echo ""

# Desplegar la Edge Function
echo "📤 Desplegando Edge Function 'invite-user'..."
echo ""

supabase functions deploy invite-user

echo ""
echo "=========================================================="
echo "✅ ¡Despliegue Completado Exitosamente!"
echo "=========================================================="
echo ""
echo "🎉 La Edge Function 'invite-user' está ahora disponible."
echo ""
echo "📝 Próximos pasos:"
echo "   1. Ve a tu aplicación"
echo "   2. Login como admin"
echo "   3. Click en 'Usuarios' → 'Invitar Usuario'"
echo "   4. Completa el formulario"
echo "   5. ¡Funciona! El usuario recibirá un email de invitación"
echo ""
echo "🔍 Para ver los logs de la función:"
echo "   supabase functions logs invite-user"
echo ""
