import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, Animated, ActivityIndicator, TouchableHighlight } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Appbar, Menu, ProgressBar } from 'react-native-paper';
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
import { lockStyles } from '../css/LockStyles';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function SelectLockScreen({ navigation }: Props) {
  const setType = useAppStore((state) => state.setType);

  const doNavigate = async (locktype: string) => {
    setType(locktype);
    navigation.navigate('Step1');
  };

  return (
    <View className="flex-1 justify-between mt-10">
      <View className="w-full items-center mt-10">
        <Text className="font-bold mb-1" style={lockStyles.titleText}>Let's activate Updater mode</Text>
        <Text className="font-bold mb-1" style={lockStyles.titleText}>on your ID Lock</Text>
      </View>
      <View className="items-center">
        <Text className="font-bold mb-8" style={lockStyles.titleText}>What model?</Text>
        <Animated.Image source={require('../../assets/models.png')} style={{ width: 260, height: 260 }} className="mb-4" resizeMode="contain" />
        <TouchableHighlight 
          onPress={() => doNavigate('150')}
          underlayColor="#e0e0e0"
          style={lockStyles.modelButton}
          className="mt-4 px-6 py-3 items-center justify-center"
        >
          <Text className="text-black text-xl font-bold" style={{ fontFamily: Fonts.ColabMed }}>
            150
          </Text>
        </TouchableHighlight>
        <TouchableHighlight 
          onPress={() => doNavigate('202')}
          underlayColor="#e0e0e0"
          style={lockStyles.modelButtonWithMargin}
          className="px-6 py-3 items-center justify-center"
        >
          <Text className="text-black text-xl font-bold" style={{ fontFamily: Fonts.ColabMed }}>
            202 Multi
          </Text>
        </TouchableHighlight>
      </View>
      <View className="w-full items-center mb-20">
        <Text>&nbsp;</Text>
      </View>
    </View>
  );
}

