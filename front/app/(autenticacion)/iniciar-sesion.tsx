import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
// Importamos ambos componentes desde authComponents
import { FormField, PasswordField } from './_components/authComponents'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor, ingrese todos los datos');
      return;
    }
    try {
      await login(email, password);
      router.replace('/(navegacion)');
    } catch (error: any) {
      if (error.message?.includes('completar el registro')) {
        if (Platform.OS === 'web') {
          window.alert('Registro incompleto. Debés establecer tu propia contraseña para continuar.');
          router.push('/(autenticacion)/completar-registro');
        } else {
          Alert.alert(
            'Registro incompleto',
            'Debés establecer tu propia contraseña para continuar.',
            [{ text: 'Continuar', onPress: () => router.push('/(autenticacion)/completar-registro') }]
          );
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert(error.message || 'No se pudo iniciar sesión');
        } else {
          Alert.alert('Error', error.message || 'No se pudo iniciar sesión');
        }
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="flex-grow justify-center px-4 py-12" keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-md self-center">
          
          
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-gray-600 mb-2">Ingrese sus datos</Text>
          </View>

          <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            
            {/* Input común para Email */}
            <FormField 
              label="Correo Electrónico" 
              icon={<Mail color="#A08C79" size={18} />} 
              value={email} 
              onChangeText={setEmail} 
              placeholder="tu@email.com" 
              keyboardType="email-address" 
            />

            {/* Nuevo componente especializado para Contraseña */}
            <PasswordField 
              label="Contraseña" 
              value={password} 
              onChangeText={setPassword} 
            />

            <View className="flex-row items-center justify-center mb-6 mt-2">
              <Link href="/(autenticacion)/olvide-contrasena" asChild>
                <Text className="text-sm text-[#6A4F99] font-medium">¿Olvidaste tu contraseña?</Text>
              </Link>
            </View>

            <Button onPress={handleSubmit} className="w-full bg-[#6A4F99] rounded-lg h-12">
              Iniciar Sesión
            </Button>

            <View className="mt-6 flex-row justify-center">
              <Text className="text-[#A08C79]">¿No tienes una cuenta? </Text>
              <Link href="/(autenticacion)/registro" replace asChild>
                <Text className="text-[#6A4F99] font-semibold">Regístrate aquí</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}