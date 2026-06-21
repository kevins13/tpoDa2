import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/app/lib/api';

export default function Bids() {
  const { token, isAuthenticated } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      try {
        if (!token) return;
        const res = await apiGet('/pujos/mis-pujos', token);
        if (res && Array.isArray(res)) {
          // Agrupamos por catalogItem para no mostrar duplicados si el usuario pujó varias veces en el mismo artículo
          const uniqueItems = new Map();
          res.forEach(bid => {
            const item = bid.catalogItem;
            if (!item) return;
            
            if (!uniqueItems.has(item.id)) {
              uniqueItems.set(item.id, {
                id: item.auctionId, // Link to auction details or live view
                title: item.title,
                currentBid: item.currentPrice,
                myBid: bid.amount,
                status: bid.amount >= item.currentPrice ? 'winning' : 'outbid',
                timeLeft: 'Termina pronto',
                image: bid.catalogItem.image || 'https://images.unsplash.com/photo-1742240439165-60790db1ee93?auto=format&fit=crop&w=500&q=60',
              });
            } else {
              // If we already have it, keep the highest of our bids
              const existing = uniqueItems.get(item.id);
              if (bid.amount > existing.myBid) {
                existing.myBid = bid.amount;
                existing.status = bid.amount >= item.currentPrice ? 'winning' : 'outbid';
              }
            }
          });
          setBids(Array.from(uniqueItems.values()));
        }
      } catch (error) {
        console.warn("Error al obtener pujas", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBids();
  }, [token]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6A4F99" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-[#333F48]">Mis Pujas Activas</Text>
        <Text className="text-sm text-[#A08C79] mt-1">Seguimiento de las subastas en las que participás</Text>
      </View>

      <View className="gap-4 mb-8">
        {bids.map((bid, index) => (
          <Link key={index} href={`/subastas/${bid.id}`} asChild>
            <TouchableOpacity className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-row h-32">
              <Image source={{ uri: bid.image }} className="w-1/3 h-full" contentFit="cover" />
              <View className="p-3 flex-1 justify-between">
                <View>
                  <Text className="font-semibold text-base text-[#333F48] mb-1" numberOfLines={1}>
                    {bid.title}
                  </Text>
                  <View className="flex-row items-center">
                    <Clock size={12} color="#A08C79" />
                    <Text className="text-xs text-[#A08C79] ml-1">Faltan {bid.timeLeft}</Text>
                  </View>
                </View>
                <View>
                  <View className="flex-row justify-between items-end mb-1">
                    <Text className="text-xs text-slate-500">Puja actual:</Text>
                    <Text className="text-sm font-bold text-[#333F48]">${bid.currentBid}</Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-slate-500">Mi puja:</Text>
                    <View className={`px-2 py-1 rounded-full ${bid.status === 'winning' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Text className={`text-xs font-medium ${bid.status === 'winning' ? 'text-green-700' : 'text-red-700'}`}>
                        ${bid.myBid} {bid.status === 'winning' ? '(Ganando)' : '(Superada)'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
        {!isAuthenticated ? (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500 mb-4 text-center">Iniciá sesión para ver tu historial de pujas.</Text>
            <Link href="/(autenticacion)/iniciar-sesion" asChild>
              <TouchableOpacity className="bg-[#6A4F99] px-6 py-3 rounded-xl">
                <Text className="text-white font-bold">Iniciar Sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>
        ) : bids.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500">No tenés pujas activas.</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
