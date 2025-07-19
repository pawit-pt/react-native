import { Alert, Linking} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useState, useEffect } from 'react';

export default function usePermissionImages() {
  const [permissionResponse] = MediaLibrary.usePermissions();
  const [permissionState, setPermissionState] = useState(false);
  
  // Check initial permission state
  useEffect(() => {
    if (permissionResponse?.status === 'granted' && permissionResponse?.accessPrivileges === 'all') {
      setPermissionState(true);
    }
  }, [permissionResponse]);
  
  async function getPermission() {
    if (permissionResponse?.status !== 'granted' || permissionResponse?.accessPrivileges !== 'all') {
      const permissionResult = await MediaLibrary.requestPermissionsAsync();
          if (permissionResult.status === 'denied') {
            if (permissionResult.canAskAgain === false) {
              // User selected "Don't Allow" - direct to settings
              Alert.alert(
                'Photo Access Required', 
                'Photo library access is required. Please enable it in Settings:\n\n1. Go to Settings\n2. Find this app\n3. Enable Photos access',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() }
                ]
              );
              setPermissionState(false);
            } else {
              // User denied but can ask again
              Alert.alert(
                'Permission Required', 
                'Permission to access photo library is required to select images.',
                [
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
              setPermissionState(false);
            }
            return false;
          }
          setPermissionState(true);
          console.log('Permission granted');
          return true;
    } else {
      setPermissionState(true);
      return true;
    }
  }

  return {
    permissionState,
    getPermission
  }
}

