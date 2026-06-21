import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShoppingBag, Truck, MapPin, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/app/lib/api';

export default function MyPurchases() {
  const router = useRouter();
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { token } = useAuth();

  React.useEffect(() => {
    if (!token) return;
    const fetchPurchases = async () => {
      try {
        const res = await apiGet('/usuarios/yo/compras', token);
        if (res && Array.isArray(res)) {
          setPurchases(res.map((r: any) => ({
            id: r.identificador,
            title: r.productos?.descripcionCatalogo || `Subasta #${r.subasta}`,
            bidAmount: Number(r.importe),
            commission: Number(r.comision) || (Number(r.importe) * 0.1),
            shippingCost: 200,
            status: "pending_payment", 
            shippingMethod: "delivery",
          })));
        }
      } catch (e) {
        console.warn("Error fetching purchases:", e);
      }
    };
    fetchPurchases();
  }, [token]);

  const handleToggleShipping = (id: number, method: "delivery" | "pickup") => {
    if (method === "pickup") {
      Alert.alert(
        "Aviso Importante", 
        "Al retirar personalmente la pieza, pierdes la cobertura del seguro contratado por la empresa. ¿Deseas continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Sí, retirar en persona", 
            onPress: () => {
              setPurchases(purchases.map(p => p.id === id ? { ...p, shippingMethod: "pickup" } : p));
            }
          }
        ]
      );
    } else {
      setPurchases(purchases.map(p => p.id === id ? { ...p, shippingMethod: "delivery" } : p));
    }
  };

  const openPayment = (purchase: any) => {
    setSelectedPurchase(purchase);
    setShowPaymentModal(true);
  };

  const handlePaySuccess = () => {
    setPurchases(purchases.map(p => p.id === selectedPurchase?.id ? { ...p, status: "paid" } : p));
    setShowPaymentModal(false);
    Alert.alert("Pago Exitoso", "El pago se ha realizado correctamente. Se preparará tu artículo.");
  };

  const handlePayInsufficient = () => {
    setShowPaymentModal(false);
    const fineAmount = (selectedPurchase?.bidAmount || 0) * 0.10;
    Alert.alert(
      "Fondos Insuficientes", 
      `No tienes fondos suficientes en tu medio de pago (ej. cheque agotado). Se te ha aplicado una multa del 10% ($${fineAmount}). Tienes 72 horas para regularizar tu situación antes de que se derive a legales. Tu cuenta está restringida temporalmente para nuevas subastas.`,
      [{ text: "Entendido", style: "destructive" }]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-200 z-10">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] ml-1 font-medium">Volver al Perfil</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Mis Compras</Text>
        <Text className="text-[#A08C79]">Historial de artículos adquiridos</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="p-4 pb-12">
        {purchases.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <ShoppingBag color="#A08C79" size={32} />
            </View>
            <Text className="text-[#333F48] font-bold text-lg mb-2">Aún no tienes compras</Text>
            <Text className="text-[#A08C79] text-center">Cuando ganes una subasta, aparecerá aquí.</Text>
          </View>
        ) : (
          purchases.map(purchase => {
            const isDelivery = purchase.shippingMethod === "delivery";
            const total = purchase.bidAmount + purchase.commission + (isDelivery ? purchase.shippingCost : 0);
            const isPaid = purchase.status === "paid";

            return (
              <View key={purchase.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
                <View className="p-4 border-b border-gray-100 bg-gray-50 flex-row justify-between items-center">
                  <Text className="font-bold text-lg text-[#333F48]">{purchase.title}</Text>
                  {isPaid ? (
                    <View className="bg-green-100 px-2 py-1 rounded-md flex-row items-center">
                      <CheckCircle color="#16a34a" size={12} className="mr-1" />
                      <Text className="text-green-800 text-xs font-bold">Pagado</Text>
                    </View>
                  ) : (
                    <View className="bg-orange-100 px-2 py-1 rounded-md flex-row items-center">
                      <AlertTriangle color="#ea580c" size={12} className="mr-1" />
                      <Text className="text-orange-800 text-xs font-bold">Pendiente</Text>
                    </View>
                  )}
                </View>

                <View className="p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#A08C79]">Puja ganadora</Text>
                    <Text className="text-[#333F48]">${purchase.bidAmount}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-[#A08C79]">Comisión empresa (10%)</Text>
                    <Text className="text-[#333F48]">${purchase.commission}</Text>
                  </View>
                  
                  {!isPaid && (
                    <View className="mt-4 mb-4">
                      <Text className="text-sm font-bold text-[#333F48] mb-2">Método de entrega:</Text>
                      <View className="flex-row gap-2">
                        <TouchableOpacity 
                          onPress={() => handleToggleShipping(purchase.id, "delivery")}
                          className={`flex-1 p-3 border rounded-xl items-center flex-row justify-center ${isDelivery ? 'border-[#6A4F99] bg-[#6A4F99]/10' : 'border-gray-200 bg-white'}`}
                        >
                          <Truck color={isDelivery ? "#6A4F99" : "#9CA3AF"} size={16} className="mr-2" />
                          <Text className={`text-xs font-medium ${isDelivery ? 'text-[#6A4F99]' : 'text-gray-500'}`}>Envío ($200)</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={() => handleToggleShipping(purchase.id, "pickup")}
                          className={`flex-1 p-3 border rounded-xl items-center flex-row justify-center ${!isDelivery ? 'border-[#6A4F99] bg-[#6A4F99]/10' : 'border-gray-200 bg-white'}`}
                        >
                          <MapPin color={!isDelivery ? "#6A4F99" : "#9CA3AF"} size={16} className="mr-2" />
                          <Text className={`text-xs font-medium ${!isDelivery ? 'text-[#6A4F99]' : 'text-gray-500'}`}>Retiro (Gratis)</Text>
                        </TouchableOpacity>
                      </View>
                      {!isDelivery && (
                        <Text className="text-orange-600 text-[10px] mt-2 text-center">⚠ Has renunciado al seguro de la pieza.</Text>
                      )}
                    </View>
                  )}

                  {isDelivery && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-[#A08C79]">Costo de envío</Text>
                      <Text className="text-[#333F48]">${purchase.shippingCost}</Text>
                    </View>
                  )}

                  <View className="border-t border-gray-100 mt-2 pt-3 flex-row justify-between items-center">
                    <Text className="font-bold text-lg text-[#333F48]">Total a pagar</Text>
                    <Text className="font-bold text-xl text-[#6A4F99]">${total}</Text>
                  </View>

                  {!isPaid && (
                    <Button onPress={() => openPayment(purchase)} className="w-full bg-[#6A4F99] mt-4">
                      Proceder al Pago
                    </Button>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Pago */}
      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-12">
            <Text className="text-xl font-bold text-[#333F48] mb-2">Confirmar Pago</Text>
            <Text className="text-[#A08C79] mb-6">Selecciona el método para abonar tu compra.</Text>
            
            <View className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 items-center">
              <Text className="text-gray-500 mb-1">Total</Text>
              <Text className="text-3xl font-bold text-[#6A4F99]">
                ${selectedPurchase ? selectedPurchase.bidAmount + selectedPurchase.commission + (selectedPurchase.shippingMethod === 'delivery' ? selectedPurchase.shippingCost : 0) : 0}
              </Text>
            </View>

            <View className="space-y-3">
              <Button onPress={handlePaySuccess} className="w-full bg-green-600 h-12">
                Pagar con Tarjeta/Banco (Éxito)
              </Button>
              <Button onPress={handlePayInsufficient} variant="secondary" className="w-full border-red-300 bg-red-50 h-12">
                <Text className="text-red-700 font-medium">Pagar con Cheque (Sin Fondos - Multa)</Text>
              </Button>
              <Button onPress={() => setShowPaymentModal(false)} variant="secondary" className="w-full mt-4 border-transparent h-12">
                Cancelar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
