import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Package, Clock, XCircle, CheckCircle, MapPin, Shield, Check, X } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { apiGet } from '@/app/lib/api';
import { useAuth } from '@/context/AuthContext';

type SaleItem = {
  id: number;
  title: string;
  status: string;
  rejectReason?: string;
  basePrice?: number;
  commission?: number;
  depositLocation?: string;
  insurancePolicy?: string;
  userAccepted?: boolean;
};

export default function MySales() {
  const router = useRouter();

  const { token } = useAuth();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySales();
  }, []);

  const fetchMySales = async () => {
    try {
      if (!token) return;
      const response = await apiGet('/articulos/mis-articulos', token);
      
      const mappedSales = response.data.map((item: any) => {
        let status = 'inspecting';
        let basePrice = undefined;
        let commission = undefined;
        
        if (item.disponible === 'si') {
           status = 'accepted';
        } else if (item.disponible === 'no') {
           status = 'inspecting';
        } else if (item.disponible === 'rechazado') {
           status = 'rejected';
        }

        if (item.itemsCatalogo && item.itemsCatalogo.length > 0) {
           status = 'accepted';
           basePrice = item.itemsCatalogo[0].precioBase;
           commission = item.itemsCatalogo[0].comision;
        }

        return {
          id: item.identificador,
          title: item.descripcionCatalogo,
          status: status,
          rejectReason: "El artículo no cumple con nuestros estándares mínimos.",
          basePrice: basePrice,
          commission: commission,
          depositLocation: "Depósito Central, Sector B",
          insurancePolicy: item.seguro || "Sin seguro",
          userAccepted: false,
        };
      });
      setSales(mappedSales);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar tus ventas");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = (id: number) => {
    Alert.alert(
      "Aceptar Cotización",
      "Al aceptar, autorizas a la empresa a subastar tu artículo con el precio base y comisiones informadas. El dinero de la venta se depositará en tu cuenta a la vista configurada.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Aceptar Términos", 
          onPress: () => {
            setSales(sales.map(s => s.id === id ? { ...s, userAccepted: true } : s));
            Alert.alert("¡Éxito!", "El artículo ya se subió a la subasta.");
          }
        }
      ]
    );
  };

  const handleRejectOffer = (id: number) => {
    Alert.alert(
      "Rechazar Cotización",
      "Al rechazar, procederemos con la devolución del artículo. Los gastos de envío de devolución correrán por tu cuenta.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, Rechazar y Devolver", 
          style: "destructive",
          onPress: () => {
            setSales(sales.filter(s => s.id !== id));
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-12 pb-4 px-4 border-b border-gray-200 z-10">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] ml-1 font-medium">Volver al Perfil</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Mis Ventas</Text>
        <Text className="text-[#A08C79]">Seguimiento de artículos consignados</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="p-4 pb-12">
        <Text className="text-xs text-[#A08C79] mb-4 text-center px-4">
          {'El dinero de las ventas completadas se enviará a tu cuenta a la vista declarada en "Medios de Pago".'}
        </Text>

        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#6A4F99" />
            <Text className="text-[#A08C79] mt-4">Cargando tus ventas...</Text>
          </View>
        ) : sales.length === 0 ? (
          <View className="py-12 items-center justify-center">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Package color="#A08C79" size={32} />
            </View>
            <Text className="text-[#333F48] font-bold text-lg mb-2">Aún no tienes ventas</Text>
            <Text className="text-[#A08C79] text-center">Tus artículos enviados aparecerán aquí.</Text>
          </View>
        ) : (
          sales.map(sale => (
            <View key={sale.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
              <View className="p-4 border-b border-gray-100 flex-row justify-between items-center bg-gray-50">
                <Text className="font-bold text-lg text-[#333F48] flex-1 mr-2">{sale.title}</Text>
                
                {sale.status === 'inspecting' && (
                  <View className="bg-blue-100 px-2 py-1 rounded-md flex-row items-center">
                    <Clock color="#2563eb" size={12} className="mr-1" />
                    <Text className="text-blue-800 text-[10px] font-bold uppercase">En Inspección</Text>
                  </View>
                )}
                {sale.status === 'rejected' && (
                  <View className="bg-red-100 px-2 py-1 rounded-md flex-row items-center">
                    <XCircle color="#ef4444" size={12} className="mr-1" />
                    <Text className="text-red-800 text-[10px] font-bold uppercase">Rechazado</Text>
                  </View>
                )}
                {sale.status === 'accepted' && (
                  <View className="bg-green-100 px-2 py-1 rounded-md flex-row items-center">
                    <CheckCircle color="#16a34a" size={12} className="mr-1" />
                    <Text className="text-green-800 text-[10px] font-bold uppercase">Aprobado</Text>
                  </View>
                )}
              </View>

              <View className="p-4">
                {sale.status === 'inspecting' && (
                  <Text className="text-[#A08C79] text-sm">
                    Nuestro equipo de expertos está evaluando tu artículo. Este proceso puede demorar hasta 72 horas.
                  </Text>
                )}

                {sale.status === 'rejected' && (
                  <View>
                    <Text className="text-sm font-bold text-[#333F48] mb-1">Motivo del rechazo:</Text>
                    <Text className="text-[#A08C79] text-sm mb-4">{sale.rejectReason}</Text>
                    <Text className="text-xs text-red-600 mb-2">El artículo será devuelto. Los gastos de envío se cargarán a tu cuenta.</Text>
                  </View>
                )}

                {sale.status === 'accepted' && (
                  <View>
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-[#A08C79]">Precio Base Propuesto</Text>
                      <Text className="font-bold text-[#6A4F99]">${sale.basePrice}</Text>
                    </View>
                    <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-100">
                      <Text className="text-[#A08C79]">Comisión por Venta</Text>
                      <Text className="font-bold text-[#333F48]">{sale.commission}%</Text>
                    </View>

                    <Text className="text-sm font-bold text-[#333F48] mb-3">Información del Bien:</Text>
                    
                    <View className="flex-row items-center mb-2">
                      <MapPin color="#A08C79" size={16} className="mr-2" />
                      <Text className="text-sm text-[#333F48] flex-1">Ubicación: <Text className="font-semibold">{sale.depositLocation}</Text></Text>
                    </View>
                    
                    <View className="flex-row items-center mb-4">
                      <Shield color="#16a34a" size={16} className="mr-2" />
                      <Text className="text-sm text-[#333F48] flex-1">Seguro: <Text className="font-semibold">{sale.insurancePolicy}</Text></Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => Alert.alert("Seguro", "Comunícate al 0800-ZURICH para gestionar una ampliación de la póliza de tu artículo.")}
                      className="mb-6"
                    >
                      <Text className="text-[#6A4F99] text-xs font-semibold underline">Contactar para aumentar valor de la póliza</Text>
                    </TouchableOpacity>

                    {!sale.userAccepted ? (
                      <View className="flex-row gap-3">
                        <Button 
                          onPress={() => handleRejectOffer(sale.id)} 
                          variant="secondary" 
                          className="flex-1 border-red-200 bg-red-50"
                        >
                          <View className="flex-row items-center justify-center">
                            <X color="#ef4444" size={16} className="mr-1" />
                            <Text className="text-red-700 font-bold text-xs">Rechazar</Text>
                          </View>
                        </Button>
                        <Button 
                          onPress={() => handleAcceptOffer(sale.id)} 
                          className="flex-1 bg-green-600"
                        >
                          <View className="flex-row items-center justify-center">
                            <Check color="white" size={16} className="mr-1" />
                            <Text className="text-white font-bold text-xs">Aceptar</Text>
                          </View>
                        </Button>
                      </View>
                    ) : (
                      <View className="bg-green-50 border border-green-200 p-3 rounded-lg items-center">
                        <Text className="text-green-800 font-bold">¡Cotización Aceptada!</Text>
                        <Text className="text-green-700 text-xs mt-1 text-center">Ya se subió el artículo. ¡Pronto será subastado!</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
