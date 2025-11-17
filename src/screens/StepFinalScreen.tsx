import React from 'react';
import { View, Text, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { lockStyles } from '../css/LockStyles';
import ScreenButton from '../components/ScreenButton';
import { useAppStore } from '../store/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function StepFinalScreen({ navigation }: Props) {
  const type = useAppStore((state: any) => state.type);

  return (
    <View className="flex-1 justify-between mt-10">
      <View className="w-full items-center mt-10">
        <Text className="font-bold mb-2" style={{fontSize: 14}}>{`Final`}</Text>
        <Text className="font-bold mb-0" style={lockStyles.titleText}>Update finished successfully!</Text>
      </View>
      <View className="items-center">
        <Animated.Image source={require('../../assets/done_logo.png')} style={{ marginLeft: 0, width: 260, height: 260 }} resizeMode="contain" />
      </View>
      <View className="w-full items-center mb-20">
{/*         <ScreenButton 
          onPress={() => navigation.navigate('First')}
          label="Next"
        /> */}
      </View>
    </View>
  );
}

