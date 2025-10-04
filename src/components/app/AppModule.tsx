import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import RootNavigator from './navigation';



LogBox.ignoreLogs([
  'Warning: ...',
  'Remote debugger',
]);

const AppModule: React.FC = () => {
  useEffect(() => {
    // Any app-level initialization can go here
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
      <Toast />
    </>
  );
};

export default AppModule;
