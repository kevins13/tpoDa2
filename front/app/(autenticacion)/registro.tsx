import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { User, Mail, MapPin, FileText, Upload, ChevronDown } from 'lucide-react-native';
import { apiGet, apiPostFormData } from '@/app/lib/api';
import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { FormField, CountryPickerModal, ConfirmModal } from './_components/authComponents'; 

interface Pais { id: number; name: string; }

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', address: '', numeroPais: 0, documento: '',
  });

  const [paises, setPaises] = useState<Pais[]>([]);
  const [cargandoPaises, setCargandoPaises] = useState(true);
  const [documentFront, setDocumentFront] = useState<string | null>(null);
  const [documentBack, setDocumentBack] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPaisModal, setShowPaisModal] = useState(false);

  useEffect(() => {
    apiGet('/paises')
      .then((resp) => setPaises(resp?.data ?? resp ?? []))
      .catch(() => setPaises([]))
      .finally(() => setCargandoPaises(false));
  }, []);

  const updateFormData = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDocumentPick = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (result && !result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      side === 'front' ? setDocumentFront(uri) : setDocumentBack(uri);
    }
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => fd.append(key, String(val)));
      
      if (documentFront) {
        if (Platform.OS === 'web') {
          const res = await fetch(documentFront);
          const blob = await res.blob();
          fd.append('fotoFrente', blob, 'frente.jpg');
        } else {
          fd.append('fotoFrente', { uri: documentFront, name: 'frente.jpg', type: 'image/jpeg' } as any);
        }
      }
      if (documentBack) {
        if (Platform.OS === 'web') {
          const res = await fetch(documentBack);
          const blob = await res.blob();
          fd.append('fotoDorso', blob, 'dorso.jpg');
        } else {
          fd.append('fotoDorso', { uri: documentBack, name: 'dorso.jpg', type: 'image/jpeg' } as any);
        }
      }

      await apiPostFormData('/autenticacion/registrar', fd);
      if (Platform.OS === 'web') {
        window.alert('Tu solicitud de registro fue recibida. En breve recibirás un correo con tu contraseña temporal.');
        router.replace('/(autenticacion)/iniciar-sesion');
      } else {
        Alert.alert(
          'Solicitud enviada',
          'Tu solicitud de registro fue recibida. En breve recibirás un correo con tu contraseña temporal.',
          [{ text: 'OK', onPress: () => router.replace('/(autenticacion)/iniciar-sesion') }]
        );
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Ocurrió un error al registrarse');
      } else {
        Alert.alert('Error en el registro', error.message || 'Ocurrió un error al registrarse');
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="flex-grow justify-center px-4 py-8" keyboardShouldPersistTaps="handled">
        <View className="w-full max-w-lg self-center">
          
          {/* Header */}
          <View className="items-center mb-6">
            <Text className="text-3xl font-bold text-[#333F48] mb-2">Crear Cuenta</Text>
            <Text className="text-sm text-[#A08C79]">Completa tus datos para registrarte</Text>
          </View>

          {/* Card Formulario */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <View className="flex-row gap-4">
              <View className="flex-1">
                <FormField 
                  label="Nombre" 
                  icon={<User color="#A08C79" size={18} />} 
                  value={formData.firstName} onChangeText={(t) => updateFormData('firstName', t)} 
                  placeholder="Juan" />
              </View>
              <View className="flex-1">
                <FormField 
                label="Apellido" 
                icon={<User color="#A08C79" size={18} />} 
                value={formData.lastName} onChangeText={(t) => updateFormData('lastName', t)} 
                placeholder="Pérez" />
              </View>
            </View>

            <FormField 
              label="Correo Electrónico" 
              icon={<Mail color="#A08C79" size={18} />} 
              value={formData.email} onChangeText={(t) => updateFormData('email', t)} 
              placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" 
            />
            <FormField 
              label="DNI" 
              icon={<FileText color="#A08C79" size={18} />} 
              value={formData.documento} onChangeText={(t) => updateFormData('documento', t.replace(/\D/g, '').slice(0, 8))} 
              placeholder="12345678" 
              keyboardType="numeric" 
              maxLength={8} 
            />
            <FormField 
              label="Domicilio Legal" 
              icon={<MapPin 
                color="#A08C79" 
              size={18} />} 
              value={formData.address} onChangeText={(t) => updateFormData('address', t)} 
              placeholder="Calle, número, ciudad" 
            />

            {/* Selector de País */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-slate-700 mb-2">País de Origen</Text>
              <TouchableOpacity onPress={() => !cargandoPaises && setShowPaisModal(true)} className="border border-slate-200 rounded-lg bg-white h-12 flex-row items-center px-3">
                <FileText color="#A08C79" size={18} />
                {cargandoPaises ? (
                  <ActivityIndicator size="small" color="#A08C79" style={{ marginLeft: 8, flex: 1 }} />
                ) : (
                  <>
                    <Text className="flex-1 ml-2" style={{ color: formData.numeroPais ? '#333F48' : '#9CA3AF' }}>
                      {formData.numeroPais ? paises.find(p => p.id === formData.numeroPais)?.name : 'Seleccioná un país'}
                    </Text>
                    <ChevronDown color="#A08C79" size={18} />
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Carga de Documentos */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-slate-700 mb-2">Foto del Documento</Text>
              <View className="flex-row gap-4">
                {/* Botón Frente */}
                <TouchableOpacity onPress={() => handleDocumentPick('front')} className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-3 items-center justify-center">
                  <Upload color="#A08C79" size={20} className="mb-1" />
                  <Text className={`text-xs ${documentFront ? 'text-green-600 font-medium' : 'text-[#A08C79]'}`}>{documentFront ? 'Frente cargado' : 'Frente DNI'}</Text>
                </TouchableOpacity>
                {/* Botón Dorso */}
                <TouchableOpacity onPress={() => handleDocumentPick('back')} className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-3 items-center justify-center">
                  <Upload color="#A08C79" size={20} className="mb-1" />
                  <Text className={`text-xs ${documentBack ? 'text-green-600 font-medium' : 'text-[#A08C79]'}`}>{documentBack ? 'Dorso cargado' : 'Dorso DNI'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button onPress={() => setShowConfirmModal(true)} className="w-full bg-[#6A4F99] rounded-lg h-12">Crear Cuenta</Button>

            <View className="mt-4 flex-row justify-center">
              <Text className="text-sm text-[#A08C79]">¿Ya tienes una cuenta? </Text>
              <Link href="/(autenticacion)/iniciar-sesion" replace asChild>
                <Text className="text-[#6A4F99] font-semibold">Inicia sesión aquí</Text>
              </Link>
            </View>
          </View>

          {/* Modales Extraídos */}
          <CountryPickerModal visible={showPaisModal} onClose={() => setShowPaisModal(false)} paises={paises} selectedId={formData.numeroPais} onSelect={(id) => { updateFormData('numeroPais', id); setShowPaisModal(false); }} />
          <ConfirmModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={handleConfirm} />

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}