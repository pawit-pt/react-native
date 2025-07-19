import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';


export default function PhotoScreen() {

  const [ image, setImage ] = useState<string | null>(null);
  const pickImage = async () => {
    try {
      if (Platform.OS === 'ios') {
        // First check current permission status
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        console.log(ImagePicker);
        console.log(status);
        if (status === 'denied') {
          // Permission was denied permanently, direct to settings
          Alert.alert(
            'Photo Access Required', 
            'Photo library access was denied. Please enable it in Settings:\n\n1. Go to Settings\n2. Find this app\n3. Enable Photos access',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }
        if (status !== 'granted') {
          // Request permission if not granted
          const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
          
          if (permissionResult.granted === false) {
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
            } else {
              // User denied but can ask again
              Alert.alert(
                'Permission Required', 
                'Permission to access photo library is required to select images.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Try Again', onPress: pickImage } // Recursively call the function
                ]
              );
            }
            return;
          }
          console.log('Permission granted');
        }
      }
  
      // Launch image library
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Note: this should be ImagePicker.MediaTypeOptions.Images in newer versions
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
  
      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'An error occurred while accessing photos.');
    }
  };
  // let result = await ImagePicker.launchImageLibraryAsync({
  //   mediaTypes: ['images'],
  //   allowsEditing: true,
  //   aspect: [4, 3],
  //   quality: 1,
  // });
  // if (!result.canceled && result.assets[0]) {
  //   setImage(result.assets[0].uri);
  // }
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Try open photo</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
        </ThemedText>
      </ThemedView>
      <View style={styles.photoButton}> 
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            <Ionicons name="camera" size={24} color="white" />
            <ThemedText style={styles.buttonText}>Select Photo</ThemedText>
        </TouchableOpacity>
      </View>
      {image && <Image source={{ uri: image }} style={styles.selectedImage} />}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  photoButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
});
