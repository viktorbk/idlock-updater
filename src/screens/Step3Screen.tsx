import React from 'react';
import { View, Text, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { lockStyles } from '../css/LockStyles';
import ScreenButton from '../components/ScreenButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Step3Screen({ navigation }: Props) {

  return (
    <View className="flex-1 justify-between mt-10">
      <View className="w-full items-center mt-10">
        <Text className="font-bold mb-2" style={{fontSize: 14}}>Step 3</Text>
        <Text className="font-bold mb-1" style={lockStyles.titleText}>Type MASTER PIN</Text>
        <Text className="font-bold mb-0" style={lockStyles.titleText}>followed by *</Text>
      </View>
      <View className="items-center">
        <Animated.Image source={require('../../assets/master_pin.png')} style={{ borderRadius: 20, marginLeft: -40, width: 260, height: 260 }} resizeMode="contain" />
      </View>
      <View className="w-full items-center mb-20">
        <ScreenButton 
          onPress={() => navigation.navigate('Step4')}
          label="Next"
        />
      </View>
    </View>
  );
}

