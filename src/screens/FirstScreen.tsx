import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, Animated, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Appbar, Menu, Button, ProgressBar } from 'react-native-paper';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/store';
/*import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';*/
import { useBle } from '../ble/BleProvider';
import { useSnackbar } from '../components/SnackbarProvider';
import { Fonts } from '../utils/fonts';

type Props = NativeStackScreenProps<RootStackParamList, 'First'>;

const BLE_SCAN_SEK = 10;

export default function FirstScreen({ navigation }: Props) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { updatePanel, startScan, scanCountdown, isScanning } = useBle();
  const selectedLock = useAppStore((state) => state.selectedLock);
  const { showSnackbar } = useSnackbar();
  
  // Calculate progress from scanCountdown (counts down from BLE_SCAN_SEK to 0)
  const progress = (BLE_SCAN_SEK - scanCountdown) / BLE_SCAN_SEK;
  
  const handleStartScan = useCallback(async () => {
    await startScan();
  }, [startScan]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
    handleStartScan();
  }, [rotateAnim, handleStartScan]);
  
  /*const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });*/

  const doUpdating = (innOrOut: number) => {
    if (!selectedLock) {
      showSnackbar('No lock selected');
      return;
    }
    updatePanel(selectedLock, innOrOut, showSnackbar);
  };

  return (
    <View className="flex-1 mt-10 justify-between">
      <View className="items-center">
        <Text style={{ fontFamily: Fonts.ColabMed }} className="text-lg font-bold text-gray-400 mb-1">{`Version 1.5.0`}</Text>
      </View>
      <View className="items-center">
        <Animated.Image source={require('../../assets/logo.png')} className="w-32 h-32 mb-4" resizeMode="contain" />
      </View>
      <View className="items-center mb-14">
        <ProgressBar progress={progress} visible={isScanning} className="w-96 h-2" />
      </View>
    </View>
  );
}

