import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { Calendar, Users, DollarSign, Lock } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Card } from '@/components/ui/Card';

// Cambiamos el require por una URL de internet directa
const IMAGEN_PLACEHOLDER_URL = "https://images.unsplash.com/photo-1609166816663-3dff820fc5fa?auto=format&fit=crop&w=800&q=80";

interface TarjetaSubastaProps {
  subasta: {
    id: string | number;
    titulo: string;
    fecha: string;
    hora: string;
    categoria: string;
    moneda: string;
    articulos: number;
    pujaInicial: string;
    estado: 'en_vivo' | 'proxima' | string;
    imagen?: string | null;
  };
  estaAutenticado: boolean;
}

export const TarjetaSubasta = ({ subasta, estaAutenticado }: TarjetaSubastaProps) => {
  // Evaluamos si el backend no mandó nada o si mandó un texto vacío
  const usarFallback = 
    !subasta.imagen || 
    subasta.imagen.trim() === "" || 
    subasta.imagen.includes("placeholder");

  // IMPORTANTE: Al ser un link de internet, SIEMPRE se pasa estructurado como { uri: string }
  const fuenteImagen = usarFallback 
    ? { uri: IMAGEN_PLACEHOLDER_URL } 
    : { uri: subasta.imagen || ""};

  return (
    <Card className="overflow-hidden border-gray-200 bg-white rounded-xl mb-6 shadow-sm">
      {/* Contenedor de Imagen */}
      <View className="w-full h-48 bg-gray-100 justify-center items-center">
        <Image 
          source={fuenteImagen} 
          contentFit="cover" // Se estira de forma uniforme cubriendo todo el recuadro
          className="w-full h-full"
          transition={200}
        />
      </View>

      {/* Cuerpo de la Tarjeta */}
      <View className="p-5">
        {/* Etiquetas / Badges */}
        <View className="flex-row items-center gap-2 mb-3 flex-wrap">
          {subasta.estado === "en_vivo" && (
            <View className="px-2 py-1 bg-[#EE3B3B] rounded-full flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 bg-white rounded-full" />
              <Text className="text-white text-[10px] font-bold">● EN VIVO</Text>
            </View>
          )}
          <View className="px-2 py-1 bg-[#6A4F99]/10 rounded-full">
            <Text className="text-[#6A4F99] text-[10px] font-medium">{subasta.categoria}</Text>
          </View>
          <View className="px-2 py-1 bg-[#C9A063]/10 rounded-full">
            <Text className="text-[#C9A063] text-[10px] font-medium">{subasta.moneda}</Text>
          </View>
        </View>

        {/* Título */}
        <Text className="text-xl font-bold text-[#333F48] mb-3">{subasta.titulo}</Text>

        {/* Detalles con Iconos */}
        <View className="space-y-2 mb-4">
          <View className="flex-row items-center gap-2 mb-1">
            <Calendar size={16} color="#A08C79" />
            <Text className="text-sm text-[#A08C79]">{subasta.fecha} • {subasta.hora}</Text>
          </View>
          
          <View className="flex-row items-center gap-2 mb-1">
            <Users size={16} color="#A08C79" />
            <Text className="text-sm text-[#A08C79]">{subasta.articulos} artículos</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <DollarSign size={16} color="#A08C79" />
            {estaAutenticado ? (
              <Text className="text-sm text-[#A08C79]">Desde {subasta.pujaInicial}</Text>
            ) : (
              <View className="flex-row items-center">
                <Lock size={14} color="#A08C79" className="mr-1" />
                <Link href="/(autenticacion)/iniciar-sesion" asChild>
                  <TouchableOpacity>
                    <Text className="text-[#6A4F99] text-sm underline">Inicia sesión</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            )}
          </View>
        </View>

        {/* Botones de Acción */}
        <View className="flex-row gap-3 mt-2">
          <Link href={`/subastas/${subasta.id}`} asChild>
            <TouchableOpacity className="flex-1 bg-[#6A4F99] py-3 rounded-lg items-center justify-center">
              <Text className="text-white font-semibold text-sm">Ver Catálogo</Text>
            </TouchableOpacity>
          </Link>
          
          {estaAutenticado && subasta.estado === "en_vivo" && (
            <Link href={`/subastas/en-vivo/${subasta.id}`} asChild>
              <TouchableOpacity className="flex-1 bg-[#EE3B3B] py-3 rounded-lg flex-row justify-center items-center gap-2">
                <Text className="text-white font-semibold text-sm">Participar</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      </View>
    </Card>
  );
};