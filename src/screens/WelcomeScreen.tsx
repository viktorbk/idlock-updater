import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useBle } from '../ble/BleProvider';
import DeviceList from '../components/DeviceList';
import ModalError from '../components/ModalError';
import type { BleDevice } from '../store/store';
import {
  Button as PaperButton,
  ProgressBar,
} from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const BLE_SCAN_DURATION = 15; // Should match BLE_SCAN_SEK in BleProvider

export default function WelcomeScreen({}: Props) {
  const { devices, idlockDevices, bluetoothState, isScanning, scanCountdown, startScan, setCurrentLock } = useBle();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate progress: 0 when scanCountdown = BLE_SCAN_DURATION, 1 when scanCountdown = 0
  const scanProgress = useMemo(() => {
    if (!isScanning) return 0;
    return 1 - (scanCountdown / BLE_SCAN_DURATION);
  }, [isScanning, scanCountdown]);

  const handleStartScan = useCallback(() => {
    startScan();
  }, [startScan]);

  const handleSelectLock = useCallback(async (lock: BleDevice) => {
    if (isScanning) {
      setErrorMessage('Wait til scanning is completed before selecting lock you want to update');
      setErrorModalVisible(true);
      return;
    }
    await setCurrentLock(lock);
  }, [isScanning, setCurrentLock]);

  const hideErrorModal = useCallback(() => {
    setErrorModalVisible(false);
    setErrorMessage('');
  }, []);

  const isAndroid = Platform.OS === 'android';

  return (
    <View className="flex-1 bg-gray-300 dark:bg-black px-3">
      {!bluetoothState ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl font-bold mb-2 text-blue-500">Please turn on Bluetooth in settings</Text>
        </View>
      ) : (
        <>
          {/* Fixed top section with Image and Button */}
          <View className={`items-center ${isAndroid ? 'mt-4' : 'mt-12'}`}>
            <Image source={require('../../assets/logo.png')} className="w-32 h-32 mb-4" resizeMode="contain" />
            <PaperButton mode="elevated" icon="bluetooth-audio" onPress={handleStartScan} disabled={isScanning}>
              {isScanning ? `Scanning...${scanCountdown} sek` : 'Find IDLock(s)...'}
            </PaperButton>
          </View>

          {/* Scrollable content area */}
          <View className="flex-1">
            { isScanning && (
              <View className="mt-4 mb-2 px-4">
                <ProgressBar progress={scanProgress} visible={isScanning} />
              </View>
              )
            }
            {idlockDevices.length > 0 ? (
              <Text className="text-lg font-semibold mb-2 mt-4 text-center">IDLocks found: {idlockDevices.length}</Text>
            ) : (
              <Text className="text-lg font-semibold mb-2 mt-4 text-center">Please click the find button above to scan...</Text>
            )}
            <DeviceList devices={idlockDevices} onSelect={handleSelectLock} />
            {devices.length > 0 ? (
              <Text className="text-lg font-semibold mb-8 mt-4 text-center">Other BLE devices found: {devices.length}</Text>
            ) : (
              <Text className="text-lg font-semibold mb-2 mt-4 text-center">Remember to touch the lock screen to wake up...</Text>
            )}
          </View>
          <ModalError
            visible={errorModalVisible}
            errorMessage={errorMessage}
            onDismiss={hideErrorModal}
            title="Scanning in Progress"
          />
        </>
      )}
    </View>
  );
}
