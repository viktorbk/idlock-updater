import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import BleManager from 'react-native-ble-manager';
import type { BleDevice } from '../store/store';
import { useAppStore } from '../store/store';
import type { RootStackParamList } from '../navigation/types';
import { sleep } from '../utils';
import ModalError from '../components/ModalError';

type BleContextValue = {
  devices: BleDevice[];
  idlockDevices: BleDevice[];
  isScanning: boolean;
  scanCountdown: number;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  clearDevices: () => void;
  bluetoothState: boolean;
  setCurrentLock: (lock: BleDevice) => Promise<boolean>;
  getCurrentLock: () => Promise<BleDevice>;
  isLockConnected: (lockId: string) => Promise<boolean>;
  getConnectedPeripherals: () => Promise<string[]>;
};

const BLE_SCAN_SEK = 10;
const BleContext = createContext<BleContextValue | undefined>(undefined);

type BleProviderProps = {
  children: React.ReactNode;
  navigationRef?: NavigationContainerRefWithCurrent<RootStackParamList>;
};

export function BleProvider({ children, navigationRef }: BleProviderProps) {
  // Store
  const setSelectedLock = useAppStore((state) => state.setSelectedLock);
  const selectedLock = useAppStore((state) => state.selectedLock);
  // State
  const [devices, setDevices] = useState<BleDevice[]>([]);
  const [idlockDevices, setIdlockDevices] = useState<BleDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothState, setBluetoothState] = useState<boolean>(false);
  const [bleMangerStarted, setBleMangerStarted] = useState<boolean>(false);
  const [scanCountdown, setScanCountdown] = useState(BLE_SCAN_SEK);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bleManagerModule = useMemo(() => NativeModules.BleManager, []);
  const bleManagerEmitter = useMemo(() => {
    if (
      bleManagerModule &&
      typeof bleManagerModule.addListener === 'function' &&
      typeof bleManagerModule.removeListeners === 'function'
    ) {
      return new NativeEventEmitter(bleManagerModule);
    }
    return new NativeEventEmitter();
  }, [bleManagerModule]);

  const checkBleState = useCallback(() => {
    BleManager.checkState();
  }, []);

  const clearDevices = useCallback(() => {
    setDevices([]);
  }, []);

  const stopScan = useCallback(async () => {
    try {
      await BleManager.stopScan();
    } catch {
      // ignore
    } finally {
      setIsScanning(false);
      setScanCountdown(BLE_SCAN_SEK);
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    }
  }, []);

  const requestBluetoothPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const permissions: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS][] = [];
      if (Platform.Version >= 23 && Platform.Version <= 30) {
        permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      } else if (Platform.Version >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        );
      }
      if (permissions.length === 0) return true;
      const granted = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(granted).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );
      if (!allGranted) return false;
      try {
        await BleManager.enableBluetooth();
      } catch {
        return false;
      }
    }
    // iOS prompts via BleManager.start
    return true;
  }, []);

  const startBleManager = useCallback(async () => {
    if (bleMangerStarted) return; 
    try {
      await BleManager.start({ showAlert: false, forceLegacy: false });
      setBleMangerStarted(true);  
      console.log('BleManager started');
    } catch (err: any) {
      console.error(err);
      // ignore
    }
  }, [bleMangerStarted]);

  const startScan = useCallback(async () => {
    try {
      // await BleManager.start({ showAlert: true, forceLegacy: false });
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        setIsScanning(false);
        setScanCountdown(BLE_SCAN_SEK);
        return;
      }
      setIsScanning(true);
      setScanCountdown(BLE_SCAN_SEK);
      setDevices([]);
      setTimeout(async () => {
        await BleManager.scan([], BLE_SCAN_SEK, false);
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
        }
        stopTimerRef.current = setTimeout(() => {
          stopScan();
        }, BLE_SCAN_SEK * 1000);
      }, 500);
    } catch {
      setIsScanning(false);
      setScanCountdown(BLE_SCAN_SEK);
    }
  }, [requestBluetoothPermissions, stopScan]);

  const setCurrentLock = useCallback(async (lock: BleDevice): Promise<boolean> => {
    try {
      if (await isLockConnected(lock.id)) {
        await BleManager.disconnect(lock.id)
        //await BleManager.refreshCache(lock.id) // Android only
        await BleManager.connect(lock.id)
        await BleManager.retrieveServices(lock.id)
      } else {  
        await BleManager.connect(lock.id);
      }
      
      // Wait a bit for connection to stabilize, especially on Android
      await sleep(1);
      
      let services: any;
      try {
        services = await BleManager.retrieveServices(lock.id);
      } catch (err: any) {
        console.error('Error retrieving services:', err);
        // Retry once
        await sleep(0.5);
        services = await BleManager.retrieveServices(lock.id);
      }
      console.log(JSON.stringify(services, null, 2))

      // On Android, wait a bit longer for services to be fully discovered
      if (Platform.OS === 'android') {
        await sleep(1);
      }
      
      console.log('retrieveServices finished');
      
      // Try to read the characteristic
      let readData: number[];
      // const DIS   = '0000180a-0000-1000-8000-00805f9b34fb';
      //const FWREV = '00002a26-0000-1000-8000-00805f9b34fb';
      try {
        readData = await BleManager.read(lock.id, '180A', '2A26');
      } catch (readErr: any) {
        console.error('Error reading characteristic 2A26:', readErr);
        // Characteristic not found - provide helpful error message
        const errorMsg = readErr?.message?.includes('not found') 
          ? 'Firmware version characteristic not available on this device. The lock may not support version reading.'
          : `Failed to read device version: ${readErr?.message || 'Unknown error'}`;
        throw new Error(errorMsg);
      }
      console.log('read finished 180A 2A26', readData);
      const version = String.fromCharCode(...readData);
      console.log('version', version);
      let lockVersion = version;
      if (lockVersion.indexOf('-') > 0) {
        const arr = lockVersion.split('-');
        lockVersion = arr[0];
      }
      console.log('Lock version is ', lockVersion);
      
      // Update lock with version and save to store
      const updatedLock: BleDevice = {
        ...lock,
        version: lockVersion,
      };
      setSelectedLock(updatedLock);
      
      await BleManager.disconnect(lock.id);
      
      // Navigate to HomeScreen on success
      if (navigationRef?.isReady()) {
        navigationRef.navigate('Home');
      }
      
      return true;
    }
    catch (err: any) {
      console.error(err);
      console.log('Error connecting to ', lock.id);
      // Still set the lock even if version read fails, but return false to indicate failure
      setSelectedLock(lock);
      
      // Show error modal
      const errorMsg = err?.message || 'Failed to connect to lock or read version information. Please try again.';
      setErrorMessage(errorMsg);
      setErrorModalVisible(true);
      
      return false;
    }
  }, [setSelectedLock, navigationRef]);

  const getCurrentLock = useCallback(async (): Promise<BleDevice> => {
    if (!selectedLock) {
      throw new Error('No lock selected');
    }
    return selectedLock;
  }, [selectedLock]);

  const getConnectedPeripherals = useCallback(async (): Promise<string[]> => {
    try {
      const connected = await BleManager.getConnectedPeripherals([]);
      // getConnectedPeripherals returns an array of Peripheral objects, extract IDs
      return connected.map((peripheral: any) => peripheral.id || peripheral);
    } catch (error) {
      console.error('Error getting connected peripherals:', error);
      return [];
    }
  }, []);

  const isLockConnected = useCallback(async (lockId: string): Promise<boolean> => {
    try {
      const connected = await getConnectedPeripherals();
      return connected.includes(lockId);
    } catch (error) {
      console.error('Error checking lock connection:', error);
      return false;
    }
  }, [getConnectedPeripherals]);

  // countdown
  useEffect(() => {
    startBleManager();
    if (!isScanning || scanCountdown <= 0) {
      BleManager.checkState();
      return;
    }
    const timer = setTimeout(() => {
      BleManager.checkState();
      setScanCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isScanning, scanCountdown, startBleManager]);

  // discovery listener
  useEffect(() => {
    const discover = bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', (peripheral: any) => {
      const { localName } = peripheral.advertising;
      if (!localName || !peripheral?.name) return;
      if (peripheral.name?.includes('IDLock') || peripheral.name?.includes('Bose')) {
        setIdlockDevices(prev => {
          const exists = prev.find(d => d.id === peripheral.id);
          if (exists) {
            return prev.map(d => (d.id === peripheral.id ? { id: peripheral.id, name: peripheral.name, rssi: peripheral.rssi, idlock: true, version: d.version || '' } : d));
          }
          return [...prev, { id: peripheral.id, name: peripheral.name, rssi: peripheral.rssi, idlock: true, version: '' }]
        });
      } else {
        setDevices(prev => {
          const exists = prev.find(d => d.id === peripheral.id);
          if (exists) {
            return prev.map(d => (d.id === peripheral.id ? { id: peripheral.id, name: peripheral.name, rssi: peripheral.rssi, idlock: false, version: d.version || '' } : d));
          }
          return [...prev, { id: peripheral.id, name: peripheral.name, rssi: peripheral.rssi, idlock: false, version: '' }]
        });
      }
    });
    const updateState = bleManagerEmitter.addListener('BleManagerDidUpdateState', (param: any) => {
      setBluetoothState(param.state === 'on');
    });
    const lockDisconnected = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', ({ peripheral, status }) => {
      console.log('Disconnected from:', peripheral, 'status:', status);
      if (peripheral.name?.includes('IDLock') || peripheral.name?.includes('Bose')) {
        console.log('Lock changed status', peripheral);
      }
      //setIdlockDevices(prev => prev.filter(d => d.id !== peripheral.id));
    });

    BleManager.checkState();
    return () => {
      discover.remove();
      updateState.remove();
      lockDisconnected.remove();
    };
  }, [bleManagerEmitter]);

  const value: BleContextValue = useMemo(() => ({
    devices,
    idlockDevices,
    isScanning,
    scanCountdown,
    startScan,
    stopScan,
    clearDevices,
    bluetoothState,
    checkBleState,
    setCurrentLock,
    getCurrentLock,
    isLockConnected,
    getConnectedPeripherals,
  }), [devices, idlockDevices, isScanning, scanCountdown, startScan, stopScan, clearDevices, bluetoothState, checkBleState, setCurrentLock, getCurrentLock, isLockConnected, getConnectedPeripherals]);

  const hideErrorModal = useCallback(() => {
    setErrorModalVisible(false);
    setErrorMessage('');
  }, []);

  return (
    <>
      <BleContext.Provider value={value}>{children}</BleContext.Provider>
      <ModalError
        visible={errorModalVisible}
        errorMessage={errorMessage}
        onDismiss={hideErrorModal}
      />
    </>
  );
}

export function useBle() {
  const ctx = useContext(BleContext);
  if (!ctx) throw new Error('useBle must be used within a BleProvider');
  return ctx;
}


