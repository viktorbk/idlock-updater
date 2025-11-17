import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, Image, Animated, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProgressBar } from 'react-native-paper';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/store';
import { useBle } from '../ble/BleProvider';
//import { useSnackbar } from '../components/SnackbarProvider';
import { Fonts } from '../utils/fonts';
import ScreenButton from '../components/ScreenButton';
import { PanelType } from '../utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ route }: Props) {
  const state = useAppStore((state: any) => state);
  const { peripheral } = route.params;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingFirmware, setIsUpdatingFirmware] = useState(false);
  //const [firmwareProgress, setFirmwareProgress] = useState(0);
  const { updatePanel, setCurrentLock, nrOfChunks, indexOfChunk } = useBle();
  const selectedLock = useAppStore((state) => state.selectedLock);
  //const { showSnackbar } = useSnackbar();
  
  const progress = (indexOfChunk / nrOfChunks);

  const handleSetCurrentLock = useCallback(async () => {
    try {
      await setCurrentLock(peripheral);
    } catch (error) {
      console.error('Error setting current lock:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [peripheral, setCurrentLock]);

  useEffect(() => {
    setIsUpdating(true);
    handleSetCurrentLock();
  }, [handleSetCurrentLock]);

  const doUpdating = async (innOrOut: number) => {
    setIsUpdatingFirmware(true);
    try {
      await updatePanel(state.selectedLock, innOrOut);
    } catch (error) {
      console.error('Error updating firmware:', error);
    } finally {
      setIsUpdatingFirmware(false);
    }
  };

  return (
    <View className="flex-1 justify-between mt-10">
      <View className="w-full items-center mt-10">
        <Text className="text-xl font-bold mb-1 text-gray-400" style={{ fontFamily: Fonts.ColabMed }}>Connected to</Text>
        <Text className="text-xl font-bold mb-1" style={{ fontFamily: Fonts.ColabMed }}>{`ID Lock ${state.type}`}</Text>
      </View>
      <View className="items-center">
        <Animated.Image source={require('../../assets/connected_logo.png')} className="w-40 h-40 mb-4" resizeMode="contain" />
      </View>
      <View className="w-full items-center mb-20">
        {
          isUpdating ? 
          <>
            <ActivityIndicator size="large" className="mb-4 text-gray-500"/>
            <Text className="text-sm text-gray-400 font-bold mb-1">Getting current version...</Text>
          </>
          : (
            <>
              <Text className="text-sm text-gray-400 font-bold mb-1">{`Your current version is: ${selectedLock?.inVersion || 'Unknown'}`}</Text>
              <Text className="text-smg font-bold mb-2">{`Firmware version ${selectedLock?.inVersion || 'Unknown'} is available`}</Text>
            </>
          )
        }
        {
          isUpdatingFirmware ?
            <View className="items-center mb-14">
              <ProgressBar progress={progress} visible={true} className="w-96 mt-2" />
            </View>
          :
            <ScreenButton onPress={() => doUpdating(PanelType.INSIDE_PANEL)} label="Update..." />
        }
      </View>
    </View>
  );
}

