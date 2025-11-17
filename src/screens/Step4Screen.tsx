import React from 'react';
import { View, Text, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { lockStyles } from '../css/LockStyles';
import ScreenButton from '../components/ScreenButton';
import { useAppStore } from '../store/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Step4Screen({ navigation }: Props) {
  const type = useAppStore((state: any) => state.type);

  const imagePath = ():any => {
    return  type === '150' ? require('../../assets/press3-star-1.png') : require('../../assets/press8-star-1.png');
  };

  return (
    <View className="flex-1 justify-between mt-10">
      <View className="w-full items-center mt-10">
        <Text className="font-bold mb-2" style={{fontSize: 14}}>{`Step 4`}</Text>
        <Text className="font-bold mb-1" style={lockStyles.titleText}>{`Press ${type === '150' ? '3' : '8'}, *`},</Text>
        <Text className="font-bold mb-0" style={lockStyles.titleText}>followed by 1</Text>
      </View>
      <View className="items-center">
        <Animated.Image source={imagePath()} style={{ marginLeft: -40, width: 260, height: 260 }} resizeMode="contain" />
      </View>
      <View className="w-full items-center mb-20">
        <ScreenButton 
          onPress={() => navigation.navigate('First')}
          label="Next"
        />
      </View>
    </View>
  );
}

