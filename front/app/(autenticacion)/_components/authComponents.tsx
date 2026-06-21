import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, Eye, EyeOff } from 'lucide-react-native'; // <-- Importamos los íconos acá

// 1. FormField (Para textos normales: Nombre, Email, DNI, etc.)
interface FormFieldProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  [key: string]: any; 
}

export const FormField = ({ label, icon, value, onChangeText, placeholder, ...props }: FormFieldProps) => (
  <View className="mb-4">
    <Text className="text-sm font-medium text-slate-700 mb-2">{label}</Text>
    <View className="relative justify-center">
      <View className="absolute left-3 z-10">{icon}</View>
      <Input
        className="pl-9"
        containerClassName="mb-0"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        {...props}
      />
    </View>
  </View>
);

// 2. PasswordField (Especializado para contraseñas con el ojo integrado)
interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showToggle?: boolean; 
}

export const PasswordField = ({ label, value, onChangeText, placeholder = '••••••••', showToggle = true }: PasswordFieldProps) => {
  const [securePassword, setSecurePassword] = useState(true);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-slate-700 mb-2">{label}</Text>
      <View className="relative justify-center">
        <View className="absolute left-3 z-10">
          <Lock color="#A08C79" size={18} />
        </View>

        <Input
          className={`pl-9 ${showToggle ? 'pr-10' : ''}`} // Si no hay ojo, no necesita padding extra a la derecha
          containerClassName="mb-0"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={securePassword}
          autoCapitalize="none"
        />

        {/* Solo renderiza el ojo si showToggle es true */}
        {showToggle && (
          <TouchableOpacity 
            className="absolute right-3 z-10 p-1" 
            onPress={() => setSecurePassword(!securePassword)}
            accessibilityRole="button"
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            {securePassword ? (
              <EyeOff color="#A08C79" size={18} />
            ) : (
              <Eye color="#A08C79" size={18} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// 3. CountryPickerModal: Limpia el modal del selector de países
interface Pais { id: number; name: string; }
interface CountryModalProps {
  visible: boolean;
  onClose: () => void;
  paises: Pais[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export const CountryPickerModal = ({ visible, onClose, paises, selectedId, onSelect }: CountryModalProps) => (
  <Modal visible={visible} transparent animationType="slide">
    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={onClose} />
    <View style={{ backgroundColor: 'white', maxHeight: 360, borderTopLeftRadius: 16, borderTopRightRadius: 16, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
        <Text className="text-base font-semibold text-[#333F48]">Seleccioná un país</Text>
        <TouchableOpacity onPress={onClose}>
          <Text className="text-[#6A4F99] font-semibold">Listo</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={paises}
        keyExtractor={(p) => String(p.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            className="px-4 py-3 border-b border-gray-50 flex-row justify-between items-center"
          >
            <Text style={{ color: selectedId === item.id ? '#6A4F99' : '#333F48', fontWeight: selectedId === item.id ? '600' : '400' }}>
              {item.name}
            </Text>
            {selectedId === item.id && <Text className="text-[#6A4F99]">✓</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  </Modal>
);

// 4. ConfirmModal: Aligera el final del archivo principal
interface ConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal = ({ visible, onClose, onConfirm }: ConfirmModalProps) => (
  <Modal visible={visible} transparent animationType="fade">
    <View className="flex-1 bg-black/50 justify-center px-4">
      <View className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm self-center">
        <Text className="text-xl font-bold text-[#333F48] mb-4">Confirmar Envío</Text>
        <Text className="text-sm text-[#A08C79] mb-6 leading-relaxed">
          ¿Estás seguro de que deseas enviar estos datos? Una vez enviados, no podrás modificarlos hasta que un empleado revise tu solicitud.
        </Text>
        <View className="flex-row gap-3">
          <Button variant="secondary" onPress={onClose} className="flex-1 h-12">Revisar</Button>
          <Button onPress={onConfirm} className="flex-1 h-12 bg-[#6A4F99]">Confirmar</Button>
        </View>
      </View>
    </View>
  </Modal>
);

export default function AuthComponents() { return null; }