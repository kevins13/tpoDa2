import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Upload } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';

export default function MyDocuments() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="bg-white pt-14 pb-4 px-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] ml-1 font-medium">Volver al Perfil</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Mis Documentos</Text>
        <Text className="text-[#A08C79]">Documentación de identidad</Text>
      </View>

      <View className="px-4 py-6">
        <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <FileText color="#6A4F99" size={24} />
              <View>
                <Text className="font-bold text-[#333F48]">Documento de Identidad</Text>
                <Text className="text-xs text-green-600 font-medium mt-0.5">Verificado</Text>
              </View>
            </View>
          </View>
          <Text className="text-sm text-[#A08C79] leading-relaxed">
            Tu identidad ha sido verificada con éxito. Esto te permite participar en subastas de hasta categoría Oro.
          </Text>
        </View>

        <Button 
          onPress={() => Alert.alert('Actualizar', 'Funcionalidad para adjuntar nuevos documentos en proceso de habilitación.')}
          className="w-full bg-[#6A4F99] h-12 rounded-xl flex-row items-center justify-center"
        >
          <Upload color="white" size={20} className="mr-2" />
          <Text className="text-white font-bold">Actualizar Documentos</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
