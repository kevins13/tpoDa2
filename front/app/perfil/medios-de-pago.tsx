import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, CreditCard, Trash2, Plus } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { apiGet, apiPost } from '@/app/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function PaymentMethods() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [tipo, setTipo] = useState<'tarjeta' | 'cheque' | 'transferencia' | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      if (!token) return;
      const res = await apiGet('/pagos', token);
      if (res && res.data) {
        setMethods(res.data);
      }
    } catch (error) {
      console.warn('Error al obtener medios de pago', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleAdd = async () => {
    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16 || expiry.length < 5 || cvc.length < 3 || cvc.length > 4) {
      Alert.alert('Error', 'Por favor, completa todos los campos correctamente.');
      return;
    }

    setSubmitting(true);
    try {
      await apiPost('/pagos', { cardNumber: cardNumber.replace(/\s/g, ''), expiry, cvc, tipo }, token || '');
      Alert.alert('Éxito', 'Método de pago añadido');
      setShowAdd(false);
      setTipo(null);
      setCardNumber('');
      setExpiry('');
      setCvc('');
      fetchMethods();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo añadir el método de pago');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.48:4000'}/api/payments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Error al eliminar');
      Alert.alert('Éxito', 'Método de pago eliminado');
      fetchMethods();
    } catch {
      Alert.alert('Error', 'No se pudo eliminar el método de pago');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6A4F99" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="pt-12 pb-4 px-4 flex-row items-center border-b border-gray-200 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="#333F48" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#333F48]">Medios de Pago</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {methods.length === 0 && !showAdd ? (
          <View className="items-center justify-center py-10">
            <CreditCard color="#A08C79" size={48} className="mb-4" />
            <Text className="text-[#A08C79] text-center mb-6">No tienes medios de pago guardados.</Text>
          </View>
        ) : (
          methods.map((m) => (
            <View key={m.identificador} className="bg-white p-4 rounded-xl border border-gray-200 mb-3 flex-row justify-between items-center shadow-sm">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#6A4F99]/10 rounded-full items-center justify-center mr-3">
                  <CreditCard color="#6A4F99" size={20} />
                </View>
                <View>
                  <Text className="font-bold text-[#333F48] capitalize">{m.tipo}</Text>
                  <Text className="text-xs text-[#A08C79]">
                    {m.numero ? `**** ${String(m.numero).slice(-4)}` : 'Sin número'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDelete(String(m.identificador))} className="p-2 bg-red-50 rounded-full">
                <Trash2 color="#ef4444" size={18} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {showAdd && !tipo ? (
          <View className="bg-white p-4 rounded-xl border border-gray-200 mt-4 shadow-sm">
            <Text className="font-bold text-[#333F48] mb-4">¿Qué tipo de medio querés agregar?</Text>
            <View className="gap-3">
              {([
                { value: 'tarjeta', label: 'Tarjeta' },
                { value: 'cheque', label: 'Cheque' },
                { value: 'transferencia', label: 'Transferencia' },
              ] as const).map((t) => (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setTipo(t.value)}
                  className="py-3 rounded-lg border border-gray-200 items-center bg-white"
                >
                  <Text className="text-sm font-semibold text-[#333F48]">{t.label}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowAdd(false)} className="py-3 items-center">
                <Text className="text-sm text-[#A08C79]">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : showAdd && tipo ? (
          <View className="bg-white p-4 rounded-xl border border-gray-200 mt-4 shadow-sm">
            <Text className="font-bold text-[#333F48] mb-4">
              {tipo === 'tarjeta' ? 'Nueva Tarjeta' : tipo === 'cheque' ? 'Nuevo Cheque' : 'Nueva Transferencia'}
            </Text>

            {tipo === 'tarjeta' ? (
              <>
                <View className="mb-3">
                  <Text className="text-xs text-[#A08C79] mb-1">Número de Tarjeta</Text>
                  <TextInput
                    value={cardNumber}
                    onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                    keyboardType="numeric"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="border border-gray-200 rounded-lg p-3 text-[#333F48]"
                  />
                </View>
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-xs text-[#A08C79] mb-1">Vencimiento</Text>
                    <TextInput
                      value={expiry}
                      onChangeText={(t) => setExpiry(formatExpiry(t))}
                      keyboardType="numeric"
                      placeholder="MM/AA"
                      maxLength={5}
                      className="border border-gray-200 rounded-lg p-3 text-[#333F48]"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-[#A08C79] mb-1">CVC</Text>
                    <TextInput
                      value={cvc}
                      onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      placeholder="123/1234"
                      maxLength={4}
                      secureTextEntry
                      className="border border-gray-200 rounded-lg p-3 text-[#333F48]"
                    />
                  </View>
                </View>
              </>
            ) : (
              <View className="mb-4">
                <Text className="text-xs text-[#A08C79] mb-1">
                  {tipo === 'cheque' ? 'Número de Cheque' : 'CBU / Alias'}
                </Text>
                <TextInput
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder={tipo === 'cheque' ? 'Ej: 00123456' : 'Ej: mi.alias o CBU'}
                  className="border border-gray-200 rounded-lg p-3 text-[#333F48]"
                />
              </View>
            )}

            <View className="flex-row gap-3">
              <Button variant="secondary" className="flex-1" onPress={() => { setTipo(null); setCardNumber(''); setExpiry(''); setCvc(''); }}>
                <Text>Cancelar</Text>
              </Button>
              <Button className="flex-1 bg-[#6A4F99]" onPress={handleAdd} disabled={submitting}>
                <Text className="text-white font-bold">{submitting ? 'Guardando...' : 'Guardar'}</Text>
              </Button>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowAdd(true)} className="mt-4 w-full bg-[#C9A063] h-12 rounded-md flex-row items-center justify-center gap-2">
            <Plus color="white" size={20} />
            <Text className="text-white font-bold">Agregar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
