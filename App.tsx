import './styles/global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-lg font-semibold text-slate-900">
        Pockets — ready to build.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
