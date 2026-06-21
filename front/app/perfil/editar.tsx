import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, Mail, MapPin, Save } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

export default function EditProfile() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "Juan",
    lastName: "Pérez",
    email: "juan.perez@email.com",
    phone: "+54 11 1234-5678",
    country: "Argentina",
    address: "Av. Corrientes 1234, CABA",
    city: "Buenos Aires",
  });

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    Alert.alert("Éxito", "Perfil actualizado exitosamente", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] ml-1 font-medium">Volver al Perfil</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Editar Perfil</Text>
        <Text className="text-[#A08C79]">Actualiza tu información personal</Text>
      </View>

      <View className="px-4 py-6">
        <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          
          {/* Información Personal */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <User color="#6A4F99" size={20} />
              <Text className="text-lg font-bold text-[#333F48]">Información Personal</Text>
            </View>
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Nombre</Text>
                <TextInput
                  value={formData.firstName}
                  onChangeText={(t) => handleChange('firstName', t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Apellido</Text>
                <TextInput
                  value={formData.lastName}
                  onChangeText={(t) => handleChange('lastName', t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                />
              </View>
            </View>
          </View>

          {/* Contacto */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <Mail color="#6A4F99" size={20} />
              <Text className="text-lg font-bold text-[#333F48]">Contacto</Text>
            </View>
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Email</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(t) => handleChange('email', t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text className="text-xs text-[#A08C79] mt-1">Este email se usa para notificaciones importantes</Text>
              </View>
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Teléfono</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(t) => handleChange('phone', t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Ubicación */}
          <View className="mb-6">
            <View className="flex-row items-center gap-2 mb-4">
              <MapPin color="#6A4F99" size={20} />
              <Text className="text-lg font-bold text-[#333F48]">Ubicación</Text>
            </View>
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">País</Text>
                <TextInput
                  value={formData.country}
                  onChangeText={(t) => handleChange('country', t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Ciudad</Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(t) => handleChange('city', t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                />
              </View>
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Dirección</Text>
                <TextInput
                  value={formData.address}
                  onChangeText={(t) => handleChange('address', t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                />
              </View>
            </View>
          </View>

          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <Text className="text-xs text-blue-800 leading-relaxed">
              <Text className="font-bold">Nota:</Text> Los cambios en tu email o país pueden requerir verificación adicional. Recibirás un correo de confirmación.
            </Text>
          </View>

          <View className="flex-col gap-3">
            <Button onPress={handleSubmit} className="w-full bg-[#6A4F99] h-12 rounded-xl flex-row items-center justify-center">
              <Save color="white" size={20} className="mr-2" />
              <Text className="text-white font-bold text-base">Guardar Cambios</Text>
            </Button>
            <Button variant="secondary" onPress={() => router.back()} className="w-full h-12 rounded-xl">
              Cancelar
            </Button>
          </View>
        </View>
        <View className="h-10" />
      </View>
    </ScrollView>
  );
}
