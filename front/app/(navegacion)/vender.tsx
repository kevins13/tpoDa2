import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Upload, X, CheckCircle, Info, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { apiPost } from '@/app/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function SellItem() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    agreedToTerms: false,
    artistOrDesigner: "",
    date: "",
    history: "",
  });

  const { token } = useAuth();
  const [uploadedImages, setUploadedImages] = useState<{uri: string, base64: string}[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleStep1Submit = () => {
    if (uploadedImages.length < 6) {
      Alert.alert("Atención", "Debes subir al menos 6 imágenes del artículo");
      return;
    }
    if (!formData.agreedToTerms) {
      Alert.alert("Atención", "Debes aceptar los términos y condiciones");
      return;
    }
    if (!formData.title || !formData.description) {
      Alert.alert("Atención", "Por favor completa el título y la descripción");
      return;
    }
    setStep(2);
  };

  const handleImageUpload = async () => {
    if (uploadedImages.length < 10) {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0].base64) {
        setUploadedImages([...uploadedImages, { uri: result.assets[0].uri, base64: result.assets[0].base64 }]);
      }
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const submitToBackend = async () => {
    if (!token) {
      Alert.alert("Error", "Debes iniciar sesión para consignar un artículo.");
      router.push("/(autenticacion)/iniciar-sesion");
      return;
    }

    setIsSubmitting(true);
    try {
      const extraInfo = `
Artista/Diseñador: ${formData.artistOrDesigner || 'No especificado'}
Fecha/Época: ${formData.date || 'No especificada'}
Historia: ${formData.history || 'No especificada'}
      `.trim();

      const descCompleta = `${formData.description}\n\n${extraInfo}`;

      await apiPost('/articulos/enviar', {
        descripcionCatalogo: formData.title,
        descripcionCompleta: descCompleta,
        fotosBase64: uploadedImages.map(img => img.base64)
      }, token);

      setShowConfirmModal(false);
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el artículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 bg-gray-50 justify-center px-6">
        <View className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 items-center">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
            <CheckCircle color="#16a34a" size={48} />
          </View>
          <Text className="text-2xl font-bold text-[#333F48] mb-4 text-center">¡Solicitud Enviada!</Text>
          <Text className="text-[#A08C79] text-center mb-6 leading-relaxed">
            Tu artículo ha sido enviado para revisión. Nuestro equipo te contactará en 48-72 horas.
          </Text>
          <Button 
            className="w-full bg-[#6A4F99] h-12 rounded-xl"
            onPress={() => router.replace('/perfil/mis-ventas')}
          >
            Ir a Mis Ventas
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-4 border-b border-gray-200 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="#333F48" size={28} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#333F48]">Vender un Artículo</Text>
      </View>

      <View className="px-4 py-6">
        {/* Progress */}
        <View className="flex-row items-center justify-center mb-8">
          <View className="items-center flex-row">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 1 ? 'bg-[#6A4F99]' : 'bg-gray-300'}`}>
              <Text className="text-white font-bold">1</Text>
            </View>
            <Text className={`ml-2 text-sm font-medium ${step >= 1 ? 'text-[#333F48]' : 'text-gray-400'}`}>Básica</Text>
          </View>
          <View className={`h-1 w-12 mx-2 ${step >= 2 ? 'bg-[#6A4F99]' : 'bg-gray-300'}`} />
          <View className="items-center flex-row">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= 2 ? 'bg-[#6A4F99]' : 'bg-gray-300'}`}>
              <Text className="text-white font-bold">2</Text>
            </View>
            <Text className={`ml-2 text-sm font-medium ${step >= 2 ? 'text-[#333F48]' : 'text-gray-400'}`}>Adicional</Text>
          </View>
        </View>

        {/* Info Banner */}
        <TouchableOpacity 
          onPress={() => setShowInfoBanner(!showInfoBanner)}
          className={`flex-row items-center justify-between p-4 bg-[#C9A063]/10 border border-[#C9A063]/30 ${showInfoBanner ? 'rounded-t-lg border-b-0' : 'rounded-lg mb-4'}`}
        >
          <View className="flex-row items-center gap-2">
            <Info color="#C9A063" size={20} />
            <Text className="font-semibold text-[#C9A063]">Información Importante</Text>
          </View>
          {showInfoBanner ? <ChevronUp color="#C9A063" size={20} /> : <ChevronDown color="#C9A063" size={20} />}
        </TouchableOpacity>

        {showInfoBanner && (
          <View className="bg-[#C9A063]/5 border border-[#C9A063]/30 border-t-0 rounded-b-lg p-4 mb-4">
            <Text className="text-xs text-[#A08C79] mb-2">• Mínimo 6 imágenes de alta calidad.</Text>
            <Text className="text-xs text-[#A08C79] mb-2">• El artículo debe ser de tu propiedad.</Text>
            <Text className="text-xs text-[#A08C79] mb-2">• Los costos de envío corren por tu cuenta.</Text>
            <Text className="text-xs text-[#A08C79]">• Expertos determinan el valor base.</Text>
          </View>
        )}

        <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          {step === 1 ? (
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Título del Artículo *</Text>
                <TextInput
                  value={formData.title}
                  onChangeText={(t) => updateFormData("title", t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                  placeholder="Ej: Reloj Omega Vintage"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2 mt-4">Descripción Detallada *</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(t) => updateFormData("description", t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                  placeholder="Describe el artículo..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-medium text-[#333F48] mb-2">Imágenes ({uploadedImages.length}/10) *</Text>
                
                {uploadedImages.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {uploadedImages.map((img, i) => (
                      <View key={i} className="bg-gray-100 rounded-md p-1 flex-row items-center border border-gray-200">
                        <View className="w-10 h-10 bg-gray-200 rounded mr-2 overflow-hidden">
                          <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} />
                        </View>
                        <Text className="text-xs text-gray-600 mr-2 max-w-[80px]" numberOfLines={1}>img-{i+1}</Text>
                        <TouchableOpacity onPress={() => removeImage(i)}>
                          <X color="#ef4444" size={14} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {uploadedImages.length < 10 && (
                  <TouchableOpacity 
                    onPress={handleImageUpload}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center justify-center bg-gray-50"
                  >
                    <Upload color="#A08C79" size={24} className="mb-2" />
                    <Text className="text-sm text-[#A08C79] font-medium">Toca para subir imagen</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="flex-row items-center mt-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <TouchableOpacity 
                  onPress={() => updateFormData("agreedToTerms", !formData.agreedToTerms)}
                  className={`w-6 h-6 rounded border items-center justify-center mr-3 ${formData.agreedToTerms ? 'bg-[#6A4F99] border-[#6A4F99]' : 'border-gray-300 bg-white'}`}
                >
                  {formData.agreedToTerms && <CheckCircle color="white" size={16} />}
                </TouchableOpacity>
                <Text className="text-sm text-[#333F48] flex-1">
                  Acepto los <Text onPress={() => setShowTermsModal(true)} className="text-[#6A4F99] font-bold">términos y condiciones</Text>
                </Text>
              </View>

              <Button 
                onPress={handleStep1Submit} 
                className={`w-full mt-6 h-12 rounded-xl ${(!formData.title || !formData.description || !formData.agreedToTerms || uploadedImages.length < 6) ? 'bg-gray-400' : 'bg-[#6A4F99]'}`}
                disabled={!formData.title || !formData.description || !formData.agreedToTerms || uploadedImages.length < 6}
              >
                Continuar
              </Button>
            </View>
          ) : (
            <View className="space-y-4">
              <View className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <Text className="text-xs text-blue-800">
                  <Text className="font-bold">Opcional:</Text> Esta información ayuda a nuestros expertos.
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2">Artista o Diseñador</Text>
                <TextInput
                  value={formData.artistOrDesigner}
                  onChangeText={(t) => updateFormData("artistOrDesigner", t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                  placeholder="Ej: Pablo Picasso"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2 mt-4">Fecha o Época</Text>
                <TextInput
                  value={formData.date}
                  onChangeText={(t) => updateFormData("date", t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                  placeholder="Ej: Siglo XVIII"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-[#333F48] mb-2 mt-4">Historia del Objeto</Text>
                <TextInput
                  value={formData.history}
                  onChangeText={(t) => updateFormData("history", t)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[#333F48]"
                  placeholder="Contexto, dueños anteriores..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View className="mt-4">
                <Text className="text-sm font-medium text-[#333F48] mb-2">Comprobante de Origen Lícito (Opcional)</Text>
                <Text className="text-xs text-[#A08C79] mb-3">Requerido por la empresa para sumas altas.</Text>
                <TouchableOpacity 
                  onPress={() => Alert.alert("Cargar Documento", "Funcionalidad simulada: documento subido exitosamente.")}
                  className="border-2 border-dashed border-[#6A4F99]/50 rounded-lg p-4 items-center justify-center bg-[#6A4F99]/5 flex-row"
                >
                  <Upload color="#6A4F99" size={20} className="mr-2" />
                  <Text className="text-sm text-[#6A4F99] font-medium">Adjuntar Archivo o Foto</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row gap-3 mt-6">
                <Button 
                  variant="secondary"
                  onPress={() => setStep(1)} 
                  className="flex-1 h-12 rounded-xl"
                >
                  Volver
                </Button>
                <Button 
                  onPress={() => setShowConfirmModal(true)} 
                  className="flex-1 bg-[#6A4F99] h-12 rounded-xl"
                >
                  Enviar
                </Button>
              </View>
            </View>
          )}
        </View>
        <View className="h-10" />
      </View>

      {/* Modal Confirmación */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-2xl p-6 shadow-xl">
            <Text className="text-xl font-bold text-[#333F48] mb-3">Confirmar Envío</Text>
            <Text className="text-sm text-[#A08C79] mb-4">
              Una vez enviada, la solicitud será revisada por nuestros expertos. Te contactaremos en 24-48 horas.
            </Text>
            <View className="flex-row gap-3">
              <Button 
                variant="secondary"
                onPress={() => setShowConfirmModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onPress={submitToBackend}
                disabled={isSubmitting}
                className="flex-1 bg-[#6A4F99]"
              >
                {isSubmitting ? "Enviando..." : "Confirmar"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Términos */}
      <Modal visible={showTermsModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-[#333F48]">Términos y Condiciones</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <X color="#333F48" size={24} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="font-bold text-[#333F48] mb-1">1. Propiedad del Artículo</Text>
              <Text className="text-sm text-[#A08C79] mb-4">Declaro que el artículo es de mi propiedad.</Text>
              <Text className="font-bold text-[#333F48] mb-1">2. Costos de Envío</Text>
              <Text className="text-sm text-[#A08C79] mb-4">Los costos de envío para inspección corren por mi cuenta.</Text>
              <Text className="font-bold text-[#333F48] mb-1">3. Valoración</Text>
              <Text className="text-sm text-[#A08C79] mb-4">El valor será determinado exclusivamente por los expertos de HAMMER.</Text>
              <View className="h-10" />
            </ScrollView>
            <Button onPress={() => setShowTermsModal(false)} className="w-full bg-[#6A4F99] h-12 rounded-xl mt-4">
              Cerrar
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
