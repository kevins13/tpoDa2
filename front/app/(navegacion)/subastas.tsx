import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Search } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/app/lib/api';
import { TarjetaSubasta } from '@/components/TarjetaSubasta';

export default function Auctions() {
  const [terminoBusqueda, setTermoBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState(""); // "" significa "Todas"
  const [filtroMoneda, setFiltroMoneda] = useState("");       // "" significa "Todas"
  
  const { isAuthenticated } = useAuth();
  const [subastas, setSubastas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerSubastas = async () => {
      try {
        const res = await apiGet('/subastas');
        if (res && Array.isArray(res)) {
          const subastasFormateadas = res.map((a: any) => ({
            id: a.id,
            titulo: a.title,
            fecha: new Date(a.startDate).toLocaleDateString(),
            hora: new Date(a.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            categoria: a.category || "comun",
            moneda: a.currency || "USD",
            articulos: a.itemsCount || a.items?.length || 0,
            pujaInicial: `$${a.startingPrice}`,
            estado: a.status === 'ACTIVE' ? 'en_vivo' : 'proxima',
            imagen: a.image || null,
          }));
          setSubastas(subastasFormateadas);
        }
      } catch (error) {
        console.warn("Error al obtener subastas:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerSubastas();
  }, []);

  // Multi-filtro optimizado con condicionales para la opción vacía "Todas"
  const subastasFiltradas = subastas.filter((subasta) => {
    const coincideBusqueda = subasta.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase());
    const coincideCategoria = filtroCategoria === "" || subasta.categoria.toLowerCase() === filtroCategoria.toLowerCase();
    const coincideMoneda = filtroMoneda === "" || subasta.moneda.toLowerCase() === filtroMoneda.toLowerCase();
    
    return coincideBusqueda && coincideCategoria && coincideMoneda;
  });

  if (cargando) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6A4F99" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 py-4" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Subastas Disponibles</Text>
        <Text className="text-[#A08C79]">Explora todas las subastas activas y próximas</Text>
      </View>

      {/* Formulario de Filtros Mejorado con Desplegables */}
      <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        {/* Campo Buscar */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-slate-700 mb-1">Buscar</Text>
          <View className="relative justify-center">
            <View className="absolute left-3 z-10"><Search color="#A08C79" size={18} /></View>
            <TextInput
              className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              placeholder="Buscar subastas..."
              placeholderTextColor="#94a3b8"
              value={terminoBusqueda}
              onChangeText={setTermoBusqueda}
            />
          </View>
        </View>

        {/* Desplegable Categoría */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-slate-700 mb-1">Categoría</Text>
          <View className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg justify-center overflow-hidden">
            <Picker
              selectedValue={filtroCategoria}
              onValueChange={(itemValue) => setFiltroCategoria(itemValue)}
              style={{ width: '100%', color: '#0f172a' }}
              dropdownIconColor="#A08C79"
            >
              <Picker.Item label="Todas las categorías" value="" />
              <Picker.Item label="Común" value="comun" />
              <Picker.Item label="Especial" value="especial" />
              <Picker.Item label="Plata" value="plata" />
              <Picker.Item label="Oro" value="oro" />
              <Picker.Item label="Platino" value="platino" />
            </Picker>
          </View>
        </View>

        {/* Desplegable Moneda */}
        <View className="mb-1">
          <Text className="text-sm font-medium text-slate-700 mb-1">Moneda</Text>
          <View className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg justify-center overflow-hidden">
            <Picker
              selectedValue={filtroMoneda}
              onValueChange={(itemValue) => setFiltroMoneda(itemValue)}
              style={{ width: '100%', color: '#0f172a' }}
              dropdownIconColor="#A08C79"
            >
              <Picker.Item label="Todas las monedas" value="" />
              <Picker.Item label="ARG (Pesos)" value="pesos" />
              <Picker.Item label="USD (Dólares)" value="USD" />
            </Picker>
          </View>
        </View>
      </View>

      <Text className="text-[#A08C79] mb-4">
        Mostrando <Text className="font-semibold text-[#333F48]">{subastasFiltradas.length}</Text> subastas
      </Text>

      {subastasFiltradas.length === 0 ? (
        <View className="items-center justify-center py-10">
          <Text className="text-[#A08C79] text-lg">No se encontraron subastas</Text>
        </View>
      ) : (
        <View className="mb-8">
          {subastasFiltradas.map((subasta) => (
            <TarjetaSubasta 
              key={subasta.id} 
              subasta={subasta} 
              estaAutenticado={isAuthenticated} 
            />
          ))}
        </View>
      )}
      <View className="h-10" />
    </ScrollView>
  );
}