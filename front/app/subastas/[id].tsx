import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Calendar, MapPin, Users, Package, ChevronLeft, Play, Lock } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { apiPost, apiGet } from '@/app/lib/api';

export default function AuctionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuth();
  const [registering, setRegistering] = useState(false);

  const categoryRank: Record<string, number> = {
    "Común": 1,
    "Especial": 2,
    "Plata": 3,
    "Oro": 4,
    "Platino": 5
  };
  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<any>(null);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await apiGet(`/subastas/${id}`);
        if (res) {
          setAuction(res);
        }
      } catch (e) {
        console.warn("Error fetching auction details", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAuction();
  }, [id]);

  const handleJoinAuction = async () => {
    if (!token) return;
    setRegistering(true);
    try {
      await apiPost(`/subastas/${auction.id}/registrar`, {}, token);
      router.push(`/subastas/en-vivo/${auction.id}`);
    } catch (error: any) {
      if (error.message?.includes('already registered') || error.error?.includes('already registered')) { // ya registrado
         router.push(`/subastas/en-vivo/${auction.id}`);
      } else {
         Alert.alert('Error', error.message || error.error || 'No se pudo registrar a la subasta');
      }
    } finally {
      setRegistering(false);
    }
  };

  const catalogItems = [
    {
      id: 1,
      itemNumber: "001",
      title: "Anillo de Diamantes Art Déco",
      description: "Exquisito anillo de platino con diamante central de 3.5 quilates, rodeado de diamantes más pequeños. Circa 1925.",
      artist: "Cartier",
      startingBid: "$45,000",
      images: ["https://images.unsplash.com/photo-1742240439165-60790db1ee93?auto=format&fit=crop&w=800&q=80"],
    },
    {
      id: 2,
      itemNumber: "002",
      title: "Set de Copas de Cristal Bohemio",
      description: "Juego completo de 12 copas de cristal tallado a mano.",
      startingBid: "$3,200",
      images: ["https://images.unsplash.com/photo-1695901741829-7a9cc23d32ac?auto=format&fit=crop&w=800&q=80"],
    },
  ];

    if (loading || !auction) {
      return (
        <View className="flex-1 justify-center items-center bg-gray-50">
          <ActivityIndicator size="large" color="#6A4F99" />
        </View>
      );
    }

    return (
      <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="bg-[#6A4F99] pt-12 pb-8 px-4">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-row items-center gap-2 mb-6"
        >
          <ChevronLeft color="white" size={24} />
          <Text className="text-white text-base">Volver</Text>
        </TouchableOpacity>

        <View className="flex-row items-center gap-2 mb-4">
          <View className="px-3 py-1 bg-white/20 rounded-full">
            <Text className="text-white text-xs">{auction.category}</Text>
          </View>
          <View className="px-3 py-1 bg-white/20 rounded-full">
            <Text className="text-white text-xs">{auction.currency}</Text>
          </View>
        </View>

        <Text className="text-3xl font-bold text-white mb-4">{auction.title}</Text>
        
        <View className="space-y-3 mb-6">
          <View className="flex-row items-center gap-2">
            <Calendar color="white" size={18} />
            <Text className="text-white">{auction.date} • {auction.time}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <MapPin color="white" size={18} />
            <Text className="text-white">{auction.location}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Users color="white" size={18} />
            <Text className="text-white">Rematador: {auction.auctioneer}</Text>
          </View>
        </View>

        {auction.status === "cerrada" ? (
          <View className="mt-4 bg-gray-800 p-4 rounded-xl border border-gray-600">
             <Text className="text-white font-bold text-center text-lg">Subasta Terminada</Text>
             {auction.catalogItems && auction.catalogItems.length > 0 && auction.catalogItems[0].status === 'vendido' && (
                <Text className="text-green-400 font-bold text-center mt-2">
                   Vendido por ${auction.catalogItems[0].currentPrice}
                </Text>
             )}
          </View>
        ) : isAuthenticated ? (
          <View className="mt-4">
            {(!user?.hasPaymentMethods || categoryRank[auction.category || "Común"] > categoryRank[user?.category || "Común"]) ? (
              <View className="bg-red-50 p-4 rounded-xl border border-red-200">
                <Text className="text-red-800 text-sm font-semibold mb-1">No puedes participar en esta subasta</Text>
                {categoryRank[auction.category || "Común"] > categoryRank[user?.category || "Común"] && (
                  <Text className="text-red-700 text-xs">• Requieres nivel {auction.category || "Común"} o superior (Tienes {user?.category}).</Text>
                )}
                {!user?.hasPaymentMethods && (
                  <Text className="text-red-700 text-xs">• Necesitas al menos un medio de pago verificado.</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity 
                onPress={handleJoinAuction} 
                disabled={registering}
                className={`flex-row items-center justify-center gap-2 py-4 rounded-xl ${auction.status === "pendiente" ? 'bg-[#6A4F99] border-2 border-white' : 'bg-red-500'}`}>
                {registering ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Play color="white" size={20} />
                    <Text className="text-white font-bold text-lg">
                      {auction.status === "pendiente" ? 'Participar en Subasta' : 'Unirse a la Subasta EN VIVO'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View className="mt-4">
            <Link href="/(autenticacion)/iniciar-sesion" asChild>
              <TouchableOpacity 
                className="flex-row items-center justify-center gap-2 py-4 rounded-xl bg-gray-600/80 border border-gray-400"
              >
                <Lock color="white" size={20} />
                <Text className="text-white font-bold text-lg">Iniciar sesión para participar</Text>
              </TouchableOpacity>
            </Link>
            <Text className="text-white/70 text-xs text-center mt-2">Debes iniciar sesión para ver precios y pujar.</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <View className="p-4 bg-white mb-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-[#333F48] mb-2">Descripción</Text>
        <Text className="text-[#A08C79] leading-6">{auction.description}</Text>
      </View>

      {/* Catalog */}
      <View className="px-4 pb-8">
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <Text className="text-xl font-bold text-[#333F48]">Catálogo de Artículos</Text>
          <View className="flex-row items-center gap-1">
            <Package color="#A08C79" size={18} />
            <Text className="text-[#A08C79]">{auction.catalogItems?.length || 0} art.</Text>
          </View>
        </View>

        <View className="gap-6">
          {(auction.catalogItems || []).map((item: any) => (
            <Card key={item.id} className="overflow-hidden border-gray-200">
              <Image source={{ uri: item.image || "https://images.unsplash.com/photo-1742240439165-60790db1ee93?auto=format&fit=crop&w=800&q=80" }} className="w-full h-56" contentFit="cover" />
              <View className="p-5">
                <Text className="text-xl font-bold text-[#333F48] mb-1">{item.title}</Text>
                
                <View className="flex-row justify-between mb-4">
                  <View>
                    <Text className="text-sm text-[#A08C79] mb-1">Precio Base</Text>
                    {isAuthenticated ? (
                      <Text className="text-xl font-bold text-[#C9A063]">${item.startingPrice}</Text>
                    ) : (
                      <View className="flex-row items-center gap-1">
                        <Lock color="#A08C79" size={14} />
                        <Link href="/(autenticacion)/iniciar-sesion" asChild>
                          <TouchableOpacity><Text className="text-[#6A4F99] underline text-sm">Inicia sesión</Text></TouchableOpacity>
                        </Link>
                      </View>
                    )}
                  </View>
                </View>

                <Text className="text-[#A08C79] mb-2 leading-5">{item.description}</Text>
              </View>
            </Card>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
