import React from 'react';
import { View, Text, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { lockStyles } from '../css/LockStyles';
import ScreenButton from '../components/ScreenButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Step1Screen({ navigation }: Props) {

  return (
    <View className="flex-1 justify-between mt-10">
      <View className="w-full items-center mt-10">
        <Text className="font-bold mb-1" style={{fontSize: 14}}>Step 1</Text>
        <Text className="font-bold mb-1" style={lockStyles.titleText}>Open your door</Text>
      </View>
      <View className="items-center">
        <Animated.Image source={require('../../assets/step_01.png')} style={{ marginLeft: 60, width: 260, height: 260 }} resizeMode="contain" />
      </View>
      <View className="w-full items-center mb-20">
        <ScreenButton 
          onPress={() => navigation.navigate('Step2')}
          label="Next"
        />
      </View>
    </View>
  );
}

