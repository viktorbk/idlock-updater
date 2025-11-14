import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import BleManager from 'react-native-ble-manager';
import type { BleDevice } from '../store/store';
import { useAppStore } from '../store/store';
import type { RootStackParamList } from '../navigation/types';
import { sleep, fetchVersion, getFirmwareBlob } from '../utils';
import ModalError from '../components/ModalError';
import { Buffer } from 'buffer';

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
const SERVICE_UUID = '11020304-0506-0708-0900-0a0b0c0d0e0f';
const CHARACTERISTIC_UUID = '11223344-5566-7788-9900-aabbccddeeff';

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
      await BleManager.start({ showAlert: true, forceLegacy: false });
      setBleMangerStarted(true);  
      console.log('BleManager started');
    } catch (err: any) {
      console.error(err);
      // ignore
    }
  }, [bleMangerStarted]);

  const waitForResponseAndContinue = async (info: any, chunks: any, index: number) => {
    setTimeout(() => {
      if (index === 1) {
        /*setTimeout(() => {
          try {
            BleManager.disconnect(info.peripheralId);
          } catch (e) {
            console.log(e);
          }
        }, 10000);*/
      }
    }, 100);

    try {
      const data:any = await BleManager.read(
        info.peripheralId,
        info.serviceUUID,
        info.characteristicUUID,
      )
      if (index === 1) {
        // clearTimeout(this.fpTimerID);
      }

      const response = Buffer.from(data, 'binary').toString('ascii');
      const request = Buffer.from(chunks[index], 'binary').toString('ascii');
      console.log('read data', data, response, request.length);

      if (response.indexOf('ACK') === 0) {
        //this.setState({
        //  progress: ((index / chunks.length) * 100).toFixed(2),
        //});

        await writeData(info, chunks, index + 1);
      } else if (request.indexOf(response) >= 0) {
        await waitForResponseAndContinue(info, chunks, index);
      } else {
        console.log('ERROR', response, data);
        //this.navigateToFailureScreen();
      }
    } catch (error) {
      console.log('ERROR: ', error);
      BleManager.disconnect(info.peripheralId);
    }
  };

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

  const writeData = async (info: any, chunks: any, index = 0) => {
    let data: any = [...chunks[index]];

    if (Buffer.from(data, 'binary').toString('ascii').indexOf('FW_End') >= 0) {
      /*this.setState({
        progress: 100,
        complete: true,
      });*/
      //return;
    }
    try {
      await BleManager.write(
        info.peripheralId,
        info.serviceUUID,
        info.characteristicUUID,
        data,
        Platform.OS === 'ios' ? data.length : 128,
      )
      await waitForResponseAndContinue(info, chunks, index);
    } catch (error) {
      console.log('ERROR: ', error);
      BleManager.disconnect(info.peripheralId);
    }
  };

  const updatePanel = useCallback(async (lock: BleDevice, innOrOut: number) => {
    try {
      const peripheralId = lock.id;
      const upgradeData: Buffer[] | null = await getFirmwareBlob(lock, innOrOut);
      //console.log('firmwareBlob', upgradeData);
      await BleManager.connect(peripheralId);
      sleep(0.5);
      const peripheralInfo = await BleManager.retrieveServices(peripheralId)
      console.log('retrieveServices OK...');
      const characteristic = peripheralInfo?.characteristics?.find(
        char =>
          char.service?.toLowerCase() === SERVICE_UUID &&
          char.characteristic?.toLowerCase() === CHARACTERISTIC_UUID,
      );

      if (characteristic?.service && characteristic?.characteristic) {
        console.log('Got characteristic ', characteristic);
        const info = {
          peripheralId: peripheralInfo.id,
          serviceUUID: characteristic.service,
          characteristicUUID: characteristic.characteristic,
        };

        await BleManager.startNotification(
          info.peripheralId,
          info.serviceUUID,
          info.characteristicUUID,
        );
        console.log('startNotification OK...');
        if (Platform.OS === 'android') {
          const mtu = await BleManager.requestMTU(info.peripheralId, 256);
          console.log('requestMTU OK...', mtu);
        }
        await writeData(info, upgradeData);
      } else {
        console.log('No characteristic found ', peripheralInfo);
      }
    } catch (error: any) {
      console.error('Error updating inside panel:', error);
    }
    finally {
      await BleManager.disconnect(lock.id);
    }
  }, [requestBluetoothPermissions, stopScan]);

  const fullUuid = (short: string) =>
    short.length === 4
      ? `0000${short.toLowerCase()}-0000-1000-8000-00805f9b34fb`
      : short.toLowerCase();

  const setCurrentLock = useCallback(async (lock: BleDevice): Promise<boolean> => {
    const id = lock.id;
    //try { await BleManager.stopScan(); } catch {}

    try {
      // Alert.alert('Connecting to lock', lock.name);
      if (await isLockConnected(id)) {
        await BleManager.disconnect(id)
        //await BleManager.refreshCache(id) // Android only
        await BleManager.connect(id);
        //await BleManager.retrieveServices(id)
      } else {  
        await BleManager.connect(id);
      }
      
      // Wait a bit for connection to stabilize, especially on Android
      if (Platform.OS === 'android') {
        //try { await BleManager.requestMTU(id, 185); } catch {}
        //try { await BleManager.refreshCache(id); } catch {}
        await sleep(1); // Android needs more time after connection
      } else {
        await sleep(0.5);
      }
      
      // On Android, retrieveServices may not return characteristics immediately
      // We'll call retrieveServices and then try reading directly with retries
      let services: any = null;
      
      if (Platform.OS === 'android') {
        // Call retrieveServices to start discovery
        try {
          services = await BleManager.retrieveServices(id);
          console.log('Android retrieveServices (initial):', JSON.stringify(services, null, 2));
        } catch (err: any) {
          console.error('Error retrieving services:', err);
        }
        
        // Wait a bit for Android to process
        await sleep(0.5);
        
        // On Android, try reading the characteristic directly with retries
        // Sometimes characteristics aren't in the services object but are still accessible
        let readData: number[] | null = null;
        let readRetries = 0;
        const maxReadRetries = 10;
        
        while (readRetries < maxReadRetries && !readData) {
          try {
            readData = await BleManager.read(id, '180A', '2A26');
            console.log(`Android read successful on attempt ${readRetries + 1}`);
            break;
          } catch (readErr: any) {
            readRetries++;
            console.log(`Android read attempt ${readRetries} failed:`, readErr?.message || readErr);
            
            if (readRetries < maxReadRetries) {
              // Retry retrieveServices every few attempts
              if (readRetries % 3 === 0) {
                try {
                  services = await BleManager.retrieveServices(id);
                  console.log(`Android retrieveServices (retry ${readRetries / 3}):`, JSON.stringify(services, null, 2));
                } catch (err: any) {
                  console.log('Error on retrieveServices retry:', err);
                }
              }
              await sleep(0.5);
            }
          }
        }
        
        if (!readData) {
          // Final attempt to get services info for debugging
          try {
            services = await BleManager.retrieveServices(id);
            console.log('Android final services state:', JSON.stringify(services, null, 2));
          } catch (err: any) {
            console.error('Final retrieveServices failed:', err);
          }
          
          throw new Error(`Failed to read characteristic after ${maxReadRetries} attempts. Services: ${JSON.stringify(services)}`);
        }     
      } else {
        // iOS - simpler flow
        try {
          services = await BleManager.retrieveServices(id);
          console.log('iOS services:', JSON.stringify(services, null, 2));
        } catch (err: any) {
          console.error('Error retrieving services on iOS:', err);
          // Retry once
          await sleep(0.5);
          services = await BleManager.retrieveServices(id);
        }
        await sleep(0.5);
        console.log('retrieveServices finished');
      }
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
    } finally {
      let readData: number[];
      try {
        readData = await BleManager.read(id, '180A', '2A26');
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
      
      const seriesArr = lock.name.match(/IDLock(\d{1,6})(_V_(\d_\d_\d{1,2}))?/);
      const series = seriesArr ? seriesArr[1] : 'Unknown';
      const inVersion = await fetchVersion(series, 0);
      const outVersion = await fetchVersion(series, 1);
      // Update lock with version and save to store
      const updatedLock: BleDevice = {
        ...lock,
        version: lockVersion,
        inVersion,
        outVersion,
        series: series,
      };
      setSelectedLock(updatedLock);
      
      await BleManager.disconnect(id);
      
      // Navigate to HomeScreen on success
      if (navigationRef?.isReady()) {
        navigationRef.navigate('Home');
      }
      return true;
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
      console.log('Discovered peripheral:', peripheral);
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
    const lockDisconnected = bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', (peripheral) => {
      let status = 1;
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
    updatePanel,  
  }), [devices, idlockDevices, isScanning, scanCountdown, startScan, stopScan, clearDevices, bluetoothState, checkBleState, setCurrentLock, getCurrentLock, isLockConnected, getConnectedPeripherals, updatePanel]);

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


