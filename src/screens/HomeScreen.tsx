import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Image, Animated } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [progress, setProgress] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [isUpdating, setIsUpdating] = useState(false);

  const { updatePanel } = useBle();

  /*const rotation = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });*/

  const selectedLock = useAppStore((state) => state.selectedLock);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleMenuItemPress = (action: string) => {
    console.log('Menu item pressed:', action);
    closeMenu();
    // TODO: Implement menu actions
  };

  /*eact.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000 }),
      -1, // infinite
      false
    );
  }, [rotation]);*/
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);
  
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const doUpdating = (innOrOut: number) => {
    updatePanel(selectedLock, innOrOut);

    /*setIsUpdating(true);
    setProgress(0);
    setInterval(() => {
      setProgress(progress + 0.1);
    }, 1000);*/
  };

  return (
    <View className="flex-1">
      <Appbar.Header>
        <Appbar.Content titleStyle={{ fontSize: 20, fontWeight: 'bold', color: 'blue' }} title={selectedLock?.name || 'No Lock Selected'} />
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={<Appbar.Action icon="dots-vertical" onPress={openMenu} />}
          anchorPosition="bottom"
        >
          <Menu.Item
            onPress={() => handleMenuItemPress('settings')}
            title="Settings"
            leadingIcon="cog"
          />
          <Menu.Item
            onPress={() => handleMenuItemPress('disconnect')}
            title="Disconnect"
            leadingIcon="bluetooth-off"
          />
          <Menu.Item
            onPress={() => handleMenuItemPress('about')}
            title="About"
            leadingIcon="information"
          />
        </Menu>
      </Appbar.Header>
      <View className="flex-1 items-start p-5">
        <View className="flex-row justify-between w-full">
          <Text className="text-lg font-bold mb-1">{`Current Inside panel version`}</Text>
          <Text className="text-lg font-bold mb-1">{`${selectedLock?.version}`}</Text>
        </View>
        <View className="flex-row justify-between w-full">
          <Text className="text-lg font-bold mb-1">{`Available Inside panel version`}</Text>
          <Text className="text-lg font-bold mb-1">{`${selectedLock?.inVersion || 'Unknown'}`}</Text>
        </View>
        <View className="flex-row justify-between w-full">
          <Text className="text-lg font-bold mb-1">{`Current Outside panel version`}</Text>
          <Text className="text-lg font-bold mb-1">{`Unknown`}</Text>
        </View>
        <View className="flex-row justify-between w-full">
          <Text className="text-lg font-bold mb-1">{`Available Outside panel version`}</Text>
          <Text className="text-lg font-bold mb-1">{`${selectedLock?.outVersion || 'Unknown'}`}</Text>
        </View>
        <View className="flex-row justify-center w-full mt-4">
          <Button mode="elevated" icon="bluetooth-audio" onPress={() => doUpdating(0)} >
            Update Outside panel
          </Button>
        </View>
        <View className="flex-row justify-center w-full mt-4">
          <Button mode="elevated" icon="bluetooth-audio" onPress={() => doUpdating(1)} >
            Update Inside panel
          </Button>
        </View>
        <View className="flex-row justify-center w-full mt-4">
          <ProgressBar progress={progress} visible={isUpdating} className="w-96 h-2 mt-4" />
{/*           <Animated.Image source={require('../../assets/updating_logo.png')} className="w-96 h-96 mb-4" resizeMode="contain" 
          style={{transform: [{rotate: spin}]}}/> */}
        </View>
      </View>
    </View>
  );
}

