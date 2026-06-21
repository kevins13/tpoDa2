import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Key, Mail } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { apiPost } from '@/app/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FormField, PasswordField } from './_components/authComponents';

export default function CompleteRegistration() {
  const router = useRouter();
  const { pendingEmail, clearPendingEmail } = useAuth();

  useEffect(() => {
    if (!pendingEmail) {
      router.replace('/(autenticacion)/iniciar-sesion');
    }
  }, [pendingEmail]);

  const [email, setEmail] = useState(pendingEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleComplete = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      await apiPost('/autenticacion/completar-registro', { email, newPassword: password });
      clearPendingEmail();
      Alert.alert(
        '¡Registro Completado!',
        'Tu contraseña fue guardada. Ya podés iniciar sesión.',
        [{ text: 'Ir al Login', onPress: () => router.replace('/(autenticacion)/iniciar-sesion') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar el registro');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        className="flex-1 bg-gray-50" 
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => router.push('/(autenticacion)/iniciar-sesion')}
          className="absolute top-14 left-6 flex-row items-center"
        >
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] font-medium ml-1">Volver al Login</Text>
        </TouchableOpacity>

        <View className="items-center mb-8 mt-10">
          <View className="w-16 h-16 bg-[#6A4F99]/10 rounded-full items-center justify-center mb-4">
            <Key color="#6A4F99" size={32} />
          </View>
          <Text className="text-3xl font-bold text-[#333F48] mb-2 text-center">Elegí tu Contraseña</Text>
          <Text className="text-sm text-[#A08C79] text-center px-4">
            Tu cuenta fue aprobada. Ingresá tu email y elegí una contraseña para acceder.
          </Text>
        </View>

        <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <FormField 
            label="Correo Electrónico" 
            icon={<Mail color="#A08C79" size={18} />} 
            value={email} 
            onChangeText={setEmail} 
            placeholder="tu@email.com" 
            keyboardType="email-address" 
            editable={!pendingEmail}
          />

          {/* Contraseña Normal (Tiene el Ojo) */}
          <PasswordField 
            label="Nueva Contraseña" 
            value={password} 
            onChangeText={setPassword} 
          />

          {/* Confirmar Contraseña (Ojo Oculto) */}
          <PasswordField 
            label="Confirmar Contraseña" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            showToggle={false} 
          />

          <Button
            onPress={handleComplete}
            className="w-full bg-[#6A4F99] h-12 rounded-xl"
          >
            Guardar y Finalizar
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}