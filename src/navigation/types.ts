import { BleDevice } from "../store/store";

export type RootStackParamList = {
  Welcome: undefined;
  Home:  { peripheral: BleDevice };
  First: undefined;
  SelectLock: undefined;
  Step1: undefined;
  Step2: undefined;
  Step3: undefined;
  Step4: undefined;
  Final: undefined;
  Details: { itemId: number };
};

