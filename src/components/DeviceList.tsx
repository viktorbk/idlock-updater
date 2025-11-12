import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import type { BleDevice } from '../store/store';
import { Icon } from 'react-native-paper';

type Props = {
  devices: BleDevice[];
  onSelect: (device: BleDevice) => void;
};

export default function DeviceList({ devices, onSelect }: Props) {
  const [perItemHeight, setPerItemHeight] = React.useState(0);
  const getSignalIconName = (rssi: number | undefined): string => {
    const value = typeof rssi === 'number' ? rssi : -127;
    if (value <= -66) return 'signal-cellular-3';
    if (value <= -33) return 'signal-cellular-2';
    if (value <= -1) return 'signal-cellular-1';
    return 'signal-cellular-3';
  };

  return (
    <View className="w-full">
      {devices.map((device: BleDevice, index: number) => (
        <TouchableOpacity
          key={device.id}
          className="mb-2 p-4 bg-gray-100 rounded-lg border border-gray-300 w-full"
          onLayout={index === 0 && perItemHeight === 0 ? (e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0) setPerItemHeight(h);
          } : undefined}
          onPress={() => onSelect(device)}
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-base">{device.name}</Text>
            <Icon source={getSignalIconName(device.rssi)} size={20} />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}


