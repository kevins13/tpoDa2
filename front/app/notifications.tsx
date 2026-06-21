import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Bell, MessageSquare } from 'lucide-react-native';
import { apiGet, apiPut } from '@/app/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function Notifications() {
  const router = useRouter();
  const { token } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiGet('/notificaciones', token);
      setNotifications(data);
    } catch (e) {
      console.warn("Error al obtener notificaciones", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    if (!token) return;
    // Actualización optimista de la UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    try {
      await apiPut(`/notificaciones/${id}/leida`, {}, token);
    } catch (e) {
      console.warn("Error marcando como leída", e);
      // Revertimos si falló
      fetchNotifications();
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white pt-14 pb-4 px-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] ml-1 font-medium">Volver</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Notificaciones</Text>
        <Text className="text-[#A08C79]">Tus mensajes y avisos privados</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6A4F99" />
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Bell color="#CBD5E1" size={48} className="mb-4" />
              <Text className="text-[#333F48] text-lg font-bold">No tienes notificaciones</Text>
              <Text className="text-[#A08C79] mt-1 text-center">Te avisaremos cuando haya actualizaciones sobre tus subastas o artículos.</Text>
            </View>
          ) : (
            <View className="p-4 space-y-3">
              {notifications.map((notif) => (
                <TouchableOpacity 
                  key={notif.id} 
                  onPress={() => !notif.leido && markAsRead(notif.id)}
                  className={`p-4 rounded-xl flex-row shadow-sm border mb-3 ${notif.leido ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-200'}`}
                >
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${notif.leido ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    <MessageSquare color={notif.leido ? "#9CA3AF" : "#2563eb"} size={24} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className={`font-bold text-base ${notif.leido ? 'text-[#333F48]' : 'text-blue-900'}`}>
                        {notif.leido ? 'Aviso' : 'Nuevo Aviso'}
                      </Text>
                      <Text className="text-xs text-[#A08C79]">
                        {new Date(notif.fecha).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className={`text-sm leading-relaxed ${notif.leido ? 'text-gray-600' : 'text-blue-800'}`}>
                      {notif.mensaje}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
