import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Users, HandCoins } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { socketService } from '@/services/socket';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.11:4000';

export default function LiveAuction() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentBids, setRecentBids] = useState<{user: string, amount: number, id: string}[]>([
    { user: 'User***89', amount: 45000, id: '1' },
    { user: 'User***21', amount: 44500, id: '2' },
    { user: 'User***55', amount: 43000, id: '3' },
  ]);

  const [currentItem, setCurrentItem] = useState({
    title: "Anillo de Diamantes Art Déco",
    currentBid: 45000,
    basePrice: 40000,
    highestBidder: "User***89",
    image: "https://images.unsplash.com/photo-1742240439165-60790db1ee93?auto=format&fit=crop&w=800&q=80",
    timeRemaining: "03:00:00"
  });

  const [activeItem, setActiveItem] = useState<any>(null);

  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    // Cronómetro que actualiza el state cada 1 segundo
    const interval = setInterval(() => {
      if (!endTime) {
        setCurrentItem(prev => ({ ...prev, timeRemaining: "Esperando..." }));
        return;
      }
      
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        clearInterval(interval);
        setCurrentItem(prev => ({ ...prev, timeRemaining: "Finalizada" }));
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const formatted = 
        String(hours).padStart(2, '0') + ":" +
        String(minutes).padStart(2, '0') + ":" +
        String(seconds).padStart(2, '0');

      setCurrentItem(prev => ({ ...prev, timeRemaining: formatted }));
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  useEffect(() => {
    const fetchAuction = async () => {
      try {
        const res = await fetch(`${API_URL}/api/subastas/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.catalogItems && data.catalogItems.length > 0) {
            const firstItem = data.catalogItems[0];
            setActiveItem(firstItem);
            
            setCurrentItem(prev => ({
              ...prev,
              title: firstItem.title,
              currentBid: firstItem.currentPrice,
              basePrice: firstItem.startingPrice,
              image: firstItem.image || "https://images.unsplash.com/photo-1742240439165-60790db1ee93?auto=format&fit=crop&w=800&q=80"
            }));

            // Obtenemos las pujas de este artículo
            const bidsRes = await fetch(`${API_URL}/api/pujos/item/${firstItem.id}`, {
              headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (bidsRes.ok) {
              const bidsData = await bidsRes.json();
              if (bidsData.length > 0) {
                setCurrentItem(prev => ({
                  ...prev,
                  highestBidder: bidsData[0].user?.firstName ? `${bidsData[0].user.firstName}***` : 'Desconocido',
                }));
                setRecentBids(bidsData.slice(0, 5).map((b: any) => ({
                  user: b.user?.firstName ? `${b.user.firstName}***` : 'Desconocido',
                  amount: b.amount,
                  id: b.id
                })));
              } else {
                 setRecentBids([]);
                 setCurrentItem(prev => ({ ...prev, highestBidder: 'Nadie (Sé el primero)' }));
              }
              // Simulamos que si hay pujas ya hay un timer de 60s
              if (bidsData.length > 0) {
                 setEndTime(new Date(Date.now() + 60000));
              }
            }

            // Registro automático a la subasta por si acaso
            if (token) {
              await fetch(`${API_URL}/api/subastas/${id}/registrar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
              }).catch(() => {}); // ignoramos errores (ej: ya registrado)
            }

            // Conectamos el socket para este artículo
            socketService.connect();
            socketService.joinAuction(firstItem.id);
          }
        }
      } catch (e) {
        console.warn("Error al obtener subasta", e);
      }
    };
    if (id) fetchAuction();

    const handleNewBid = (bid: any) => {
      // Actualizamos el artículo con la nueva puja más alta
      setCurrentItem(prev => ({
        ...prev,
        currentBid: bid.amount,
        highestBidder: bid.user?.firstName ? `${bid.user.firstName}***` : 'Desconocido'
      }));

      // Agregamos al historial de pujas recientes
      setRecentBids(prev => {
        const newBids = [
          {
            user: bid.user?.firstName ? `${bid.user.firstName}***` : 'Desconocido',
            amount: bid.amount,
            id: bid.id || Date.now().toString()
          },
          ...prev
        ];
        return newBids.slice(0, 5); // Mantenemos solo las últimas 5
      });
    };

    const handleTimerUpdate = (data: any) => {
      if (data.endTime) {
        setEndTime(new Date(data.endTime));
      }
    };
    
    const handleAuctionEnded = (data: any) => {
      setEndTime(new Date(Date.now() - 1000)); // forzar cerrado
      setCurrentItem(prev => ({ 
         ...prev, 
         timeRemaining: "Finalizada",
         currentBid: data.amount || prev.currentBid 
      }));
    };

    socketService.onNewBid(handleNewBid);
    socketService.socket?.on('timer_update', handleTimerUpdate);
    socketService.socket?.on('auction_ended', handleAuctionEnded);

    return () => {
      socketService.offNewBid(handleNewBid);
      socketService.socket?.off('timer_update', handleTimerUpdate);
      socketService.socket?.off('auction_ended', handleAuctionEnded);
      if (activeItem) {
        socketService.leaveAuction(activeItem.id);
      }
      socketService.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const isExempt = user?.category === 'Oro' || user?.category === 'Platino';
  const minBid = currentItem.currentBid + (currentItem.basePrice * 0.01);
  const maxBid = currentItem.currentBid + (currentItem.basePrice * 0.20);

  const handleBid = async () => {
    const amount = Number(bidAmount);
    if (!amount || amount <= currentItem.currentBid) {
      setErrorMsg("La puja debe ser mayor a la actual.");
      return;
    }
    
    if (!isExempt) {
      if (amount < minBid) {
        setErrorMsg(`Mínimo permitido: $${minBid}`);
        return;
      }
      if (amount > maxBid) {
        setErrorMsg(`Máximo permitido: $${maxBid}`);
        return;
      }
    }

    setErrorMsg('');
    setIsSubmitting(true);
    
    try {
      if (!activeItem) throw new Error("Item no cargado");
      const response = await fetch(`${API_URL}/api/pujos/item/${activeItem.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar puja');
      }

      setBidAmount('');
      // Refrescamos las pujas inmediatamente (fallback ante fallas del socket)
      if (activeItem) {
        const bidsRes = await fetch(`${API_URL}/api/pujos/item/${activeItem.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (bidsRes.ok) {
          const bidsData = await bidsRes.json();
          if (bidsData.length > 0) {
            setCurrentItem(prev => ({
              ...prev,
              currentBid: bidsData[0].amount,
              highestBidder: bidsData[0].user?.firstName ? `${bidsData[0].user.firstName}***` : 'Desconocido',
            }));
            setRecentBids(bidsData.slice(0, 5).map((b: any) => ({
              user: b.user?.firstName ? `${b.user.firstName}***` : 'Desconocido',
              amount: b.amount,
              id: b.id
            })));
          }
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Error de red al pujar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      {/* Header */}
      <View className="pt-12 pb-4 px-4 flex-row items-center justify-between border-b border-gray-800 bg-gray-900 z-10">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-gray-800 rounded-full">
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <View className="items-center">
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <Text className="text-white font-bold tracking-widest">EN VIVO</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Users color="#9CA3AF" size={14} />
            <Text className="text-gray-400 text-xs">1,240 espectadores</Text>
          </View>
        </View>
        <View className="w-10 h-10" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-32">
        <Image source={{ uri: currentItem.image }} className="w-full h-72" contentFit="cover" />
        
        <View className="p-6 -mt-6 bg-gray-900 rounded-t-3xl">
          <Text className="text-2xl font-bold text-white mb-4">{currentItem.title}</Text>
          
          <View className="bg-gray-800 rounded-2xl p-6 mb-6 items-center">
            {isAuthenticated ? (
              <>
                <Text className="text-gray-400 mb-2">Puja Actual</Text>
                <Text className="text-5xl font-bold text-green-400 mb-1">${currentItem.currentBid}</Text>
                <Text className="text-gray-500 text-xs mb-3">Precio Base: ${currentItem.basePrice}</Text>
                <Text className="text-gray-400">Por: <Text className="font-bold text-white">{currentItem.highestBidder}</Text></Text>
              </>
            ) : (
              <View className="items-center py-2">
                <Text className="text-gray-400 mb-2">Puja Oculta</Text>
                <Text className="text-xl font-bold text-white mb-2 text-center">Iniciá sesión para ver los precios de esta subasta</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-center gap-2 mb-6">
            <Text className="text-red-400 font-bold text-xl">{currentItem.timeRemaining}</Text>
            {currentItem.timeRemaining !== "Esperando..." && currentItem.timeRemaining !== "Finalizada" && (
              <Text className="text-gray-400">restantes</Text>
            )}
          </View>

          {isAuthenticated && (
            <>
              <Text className="text-white font-bold mb-4">Actividad Reciente</Text>
              <View className="space-y-3 mb-8">
                {recentBids.map((bid) => (
                  <View key={bid.id} className="flex-row items-center justify-between">
                    <Text className="text-gray-300">{bid.user}</Text>
                    <Text className="text-green-400 font-bold">${bid.amount}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Bid Actions */}
      <View className="absolute bottom-0 w-full bg-gray-900 border-t border-gray-800 p-4 pb-8">
        {currentItem.timeRemaining === "Finalizada" ? (
          <View className="items-center py-4 bg-gray-800 rounded-xl border border-gray-700">
             <Text className="text-white font-bold text-xl mb-1">¡Subasta Finalizada!</Text>
             <Text className="text-green-400 font-bold">Vendido por ${currentItem.currentBid}</Text>
          </View>
        ) : isAuthenticated ? (
          <>
            {!isExempt && (
              <Text className="text-gray-400 text-xs mb-3 text-center">
                Límites de puja para tu categoría: ${minBid} - ${maxBid}
              </Text>
            )}
            <View className="flex-row gap-3 mb-4">
              <Button 
                variant="secondary" 
                className="flex-1 bg-gray-800 border-gray-700 h-12"
                disabled={isSubmitting}
                onPress={() => setBidAmount((currentItem.currentBid + 500).toString())}
              >
                <Text className="text-white font-bold">+ $500</Text>
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 bg-gray-800 border-gray-700 h-12"
                disabled={isSubmitting}
                onPress={() => setBidAmount((currentItem.currentBid + 1000).toString())}
              >
                <Text className="text-white font-bold">+ $1000</Text>
              </Button>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 flex-row items-center bg-gray-800 rounded-xl px-4 h-14 border border-gray-700">
                <Text className="text-gray-400 text-lg mr-2">$</Text>
                <TextInput
                  value={bidAmount}
                  onChangeText={(t) => { setBidAmount(t); setErrorMsg(''); }}
                  placeholder="Monto a pujar"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  className="flex-1 text-white text-lg h-full"
                  editable={!isSubmitting}
                />
              </View>
              <TouchableOpacity 
                onPress={handleBid}
                disabled={isSubmitting}
                className={`w-14 h-14 rounded-xl items-center justify-center ${isSubmitting ? 'bg-gray-600' : 'bg-[#6A4F99]'}`}
              >
                {isSubmitting ? <ActivityIndicator color="white" /> : <HandCoins color="white" size={24} />}
              </TouchableOpacity>
            </View>
            {errorMsg ? <Text className="text-red-400 text-xs mt-2 text-center">{errorMsg}</Text> : null}
          </>
        ) : (
          <View className="items-center py-2">
            <Button onPress={() => router.push('/(autenticacion)/iniciar-sesion')} className="w-full bg-[#6A4F99] h-12">
              Iniciar Sesión para Pujar
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
