import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp, Award, BarChart3, Clock } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiGet } from '@/app/lib/api';

export default function Metrics() {
  const router = useRouter();

  const { token } = useAuth();
  const [metrics, setMetrics] = React.useState({
    winRate: "0%",
    totalSpent: "$0",
    totalEarned: "$0",
    totalBidded: "$0", // Este lo simularemos o dejaremos igual si no hay endpoint para total pujado
    auctionsAttended: 0,
    auctionsWon: 0,
    itemsSold: 0,
  });
  const [recentBids, setRecentBids] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (!token) return;
    const fetchStats = async () => {
      try {
        const stats = await apiGet('/usuarios/yo/estadisticas', token);
        if (stats) {
          const winRate = stats.totalBids > 0 ? Math.round((stats.auctionsWon / stats.totalBids) * 100) + "%" : "0%";
          setMetrics({
            winRate,
            totalSpent: `$${stats.totalSpent}`,
            totalEarned: `$${stats.totalEarned}`,
            totalBidded: `$${stats.totalSpent}`, // Simplified
            auctionsAttended: stats.totalBids,
            auctionsWon: stats.auctionsWon,
            itemsSold: stats.itemsSold
          });
        }
        
        const bids = await apiGet('/pujos/mis-pujos', token);
        if (bids && Array.isArray(bids)) {
          setRecentBids(bids.slice(0, 5).map((b: any) => ({
            id: b.id,
            item: b.catalogItem?.title || `Lote #${b.catalogItem?.id}`,
            amount: b.amount,
            date: new Date().toLocaleDateString(), // Mock date as backend might not have it
            status: b.isWinner ? "Ganada" : "Perdida"
          })));
        }
      } catch (e) {
        console.warn("Error fetching stats:", e);
      }
    };
    fetchStats();
  }, [token]);

  const categoryParticipation = [
    { category: "Común", count: metrics.auctionsAttended, color: "#A08C79" }, // Simplified categories
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="bg-white pt-14 pb-4 px-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="flex-row items-center mb-4">
          <ChevronLeft color="#A08C79" size={24} />
          <Text className="text-[#A08C79] ml-1 font-medium">Volver al Perfil</Text>
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-[#333F48] mb-1">Mis Métricas</Text>
        <Text className="text-[#A08C79]">Análisis de tu participación en subastas</Text>
      </View>

      <View className="p-4 space-y-6">
        
        {/* Main Stats Grid */}
        <View className="flex-row gap-4">
          <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <View className="w-10 h-10 bg-[#6A4F99]/10 rounded-full items-center justify-center mb-3">
              <Award color="#6A4F99" size={20} />
            </View>
            <Text className="text-[#A08C79] text-xs font-medium mb-1">Tasa de Victorias</Text>
            <Text className="text-2xl font-bold text-[#333F48]">{metrics.winRate}</Text>
          </View>
          
          <View className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-3">
              <TrendingUp color="#16a34a" size={20} />
            </View>
            <Text className="text-[#A08C79] text-xs font-medium mb-1">Asistencias</Text>
            <Text className="text-2xl font-bold text-[#333F48]">{metrics.auctionsAttended}</Text>
          </View>
        </View>

        {/* Financials */}
        <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <Text className="text-lg font-bold text-[#333F48] mb-4 flex-row items-center">
            <BarChart3 color="#333F48" size={20} className="mr-2" /> Resumen Financiero
          </Text>
          <View className="flex-row justify-between border-b border-gray-100 pb-3 mb-3">
            <Text className="text-[#A08C79]">Total Ofertado (Histórico)</Text>
            <Text className="font-bold text-[#333F48]">{metrics.totalBidded}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[#A08C79]">Total Adjudicado (A Pagar)</Text>
            <Text className="font-bold text-[#6A4F99]">{metrics.totalSpent}</Text>
          </View>
        </View>

        {/* Participation by Category */}
        <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <Text className="text-lg font-bold text-[#333F48] mb-4">Participación por Categoría</Text>
          <View className="space-y-3">
            {categoryParticipation.map((cat, i) => (
              <View key={i}>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-sm font-medium text-[#333F48]">{cat.category}</Text>
                  <Text className="text-sm text-[#A08C79]">{cat.count} subastas</Text>
                </View>
                <View className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full" 
                    style={{ width: `${(cat.count / metrics.auctionsAttended) * 100}%`, backgroundColor: cat.color }} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Bids History */}
        <View className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-8">
          <Text className="text-lg font-bold text-[#333F48] mb-4 flex-row items-center">
            <Clock color="#333F48" size={20} className="mr-2" /> Historial de Pujas Recientes
          </Text>
          <View className="space-y-4">
            {recentBids.map(bid => (
              <View key={bid.id} className="border-b border-gray-100 pb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className="font-semibold text-[#333F48] flex-1 mr-2" numberOfLines={1}>{bid.item}</Text>
                  <Text className="font-bold text-[#333F48]">${bid.amount}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-[#A08C79]">{bid.date}</Text>
                  <View className={`px-2 py-1 rounded-md ${bid.status === 'Ganada' ? 'bg-green-100' : 'bg-red-50'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${bid.status === 'Ganada' ? 'text-green-800' : 'text-red-800'}`}>
                      {bid.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
