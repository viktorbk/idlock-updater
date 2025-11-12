import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Appbar, Menu } from 'react-native-paper';
import { RootStackParamList } from '../navigation/types';
import { useAppStore } from '../store/store';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const selectedLock = useAppStore((state) => state.selectedLock);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleMenuItemPress = (action: string) => {
    console.log('Menu item pressed:', action);
    closeMenu();
    // TODO: Implement menu actions
  };

  return (
    <View className="flex-1">
      <Appbar.Header>
        <Appbar.Content title={selectedLock?.name || 'No Lock Selected'} />
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
      <View className="flex-1 items-center justify-center p-5">
        <Text className="text-2xl font-bold mb-5">{selectedLock?.name}</Text>
        <Button
          title="Go to Details"
          onPress={() => navigation.navigate('Details', { itemId: 42 })}
        />
      </View>
    </View>
  );
}

