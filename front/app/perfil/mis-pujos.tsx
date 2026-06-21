import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Gavel } from 'lucide-react-native';
import { apiGet } from '@/app/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function MyBids() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/pujos/mis-pujos', token);
      setBids(data || []);
    } catch (e) {
      console.warn("Error al obtener pujas", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] ml-1 font-medium">Volver al Perfil</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Mis Pujas</Text>
        <Text className="text-[#A08C79]">Historial de todas tus ofertas</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6A4F99" />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="p-4 pb-12">
          {bids.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Gavel color="#A08C79" size={32} />
              </View>
              <Text className="text-[#333F48] font-bold text-lg mb-2">Aún no tienes pujas</Text>
              <Text className="text-[#A08C79] text-center">Tus ofertas aparecerán aquí cuando participes en subastas.</Text>
            </View>
          ) : (
            bids.map((bid) => (
              <View key={bid.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="font-bold text-lg text-[#333F48] flex-1 mr-2" numberOfLines={1}>
                    {bid.item?.title || 'Artículo Desconocido'}
                  </Text>
                  <Text className="font-bold text-lg text-[#6A4F99]">${bid.amount}</Text>
                </View>
                <View className="flex-row justify-between items-center mt-2">
                  <Text className="text-sm text-[#A08C79]">Precio Base: ${bid.item?.basePrice}</Text>
                  <Text className="text-xs text-gray-400">ID: {bid.id}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
