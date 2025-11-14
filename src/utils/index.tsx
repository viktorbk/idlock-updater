import { BleDevice } from "../store/store";
import RNBlobUtil from 'react-native-blob-util';
import { Buffer } from 'buffer';
/**
 * Sleep utility function that waits for a specified number of seconds
 * @param seconds - The number of seconds to wait
 * @returns A Promise that resolves after the specified delay
 */
export function sleep(seconds: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(() => resolve(), seconds * 1000));
}

export const fetchVersion = async (lockSeries: string, innOrOut: number): Promise<string> => {
  const headers = {'Content-Type': 'text/plain'};

  const basicUrl =
    innOrOut === 0
      ? 'https://idl150fw.idlock.cloud/idlXXXfw/current/release.txt'
      : 'https://idl150fw.idlock.cloud/idlXXXfw/current/OUT/release.txt';

  let url = basicUrl.replace('XXX', lockSeries);

  try {
    const response = await fetch(url, {method: 'GET', headers});
    const responseTxt = await response.text();
    const updateVersion = responseTxt.match(/\w*.\w*.\w*/)?.[0] ?? null;
    if (!updateVersion) {
      throw new Error('Invalid response format');
    }
    return updateVersion;
  } catch (error: any) {
    return error?.message ?? 'Unknown error';
  }
};

const calculateChecksum = (fileData: Buffer) => {
  let checksum = fileData.readUInt8(0);
  for (let i = 1; i < fileData.length; i++) {
    checksum += fileData.readUInt8(i);
    checksum %= 255;
  }
  return checksum;
};

const chopFile = (data, chunkSize) => {
  const temporal = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    temporal.push(data.slice(i, i + chunkSize));
  }
  return temporal;
};

export const getFirmwareBlob = async (lock: BleDevice, innOrOut: number): Promise<Buffer[]> => {
  let baseUrl = `https://idl150fw.idlock.cloud/idl${lock.series}fw/YYY/FILE.bin`;
  if(innOrOut) {
    baseUrl = baseUrl.replace('YYY', 'current/OUT');
    baseUrl = baseUrl.replace('FILE', 'IDLock202_MULTI_OUT_' + lock.outVersion.replace(/\./gi, '_'));
  } else {
    baseUrl = baseUrl.replace('YYY', 'current');
    baseUrl = baseUrl.replace('FILE', 'IDLock202_MULTI_IN_' + lock.inVersion.replace(/\./gi, '_'));
  }
    try {
      const res = await RNBlobUtil.config({ fileCache: true }).fetch('GET', baseUrl);
      const path = res.path();
      const base64 = await RNBlobUtil.fs.readFile(path, 'base64');     
      const firmwareBuffer = Buffer.from(base64, 'base64');
      console.log('Binary length:', firmwareBuffer.length);
      console.log('Binary:', firmwareBuffer);
      const firmwareLength = firmwareBuffer.length;
      const firmwareChecksum = calculateChecksum(firmwareBuffer);
      const firmwareParts = chopFile(firmwareBuffer, 128);
      console.log('Firmware parts:', firmwareParts);
      // const intPanel = isOutsidePanel ? 1 : 0;
      const upgradeData: Buffer[] = [
        Buffer.from(
          `FW_Start,${firmwareLength},${firmwareChecksum},${innOrOut === 1 ? 1 : 0}`,
        ),
        ...firmwareParts,
        Buffer.from('FW_End'),
      ];
      return upgradeData;
  } catch (error) {
    console.error('Error fetching firmware blob:', error);
    return [];
  }
};