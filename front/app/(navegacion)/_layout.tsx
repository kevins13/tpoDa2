import { Tabs, useRouter } from 'expo-router';
import { Home, Gavel, User, Tag, Bell, HandCoins } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6A4F99',
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity onPress={() => router.push('/notifications')} style={{ marginRight: 15 }}>
            <Bell color="#333F48" size={24} />
          </TouchableOpacity>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="subastas"
        options={{
          title: 'Subastas',
          tabBarIcon: ({ color }) => <Gavel color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="vender"
        options={{
          title: 'Vender',
          tabBarIcon: ({ color }) => <Tag color={color} size={24} />,
          href: isAuthenticated ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="pujas"
        options={{
          title: 'Mis Pujas',
          tabBarIcon: ({ color }) => <HandCoins color={color} size={24} />,
          href: isAuthenticated ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
          href: isAuthenticated ? undefined : null,
        }}
      />
    </Tabs>
  );
}
