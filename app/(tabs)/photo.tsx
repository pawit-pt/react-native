import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { use, useState } from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles/photo.styles';
import usePermissionImages from '../../hooks/usePermissionImages.web';

export default function PhotoScreen() {

  const [ image, setImage ] = useState<string | null>(null);
  const { permissionState, getPermission } = usePermissionImages();
  
  const pickImage = async () => {
    try {
      if (!permissionState) {
        console.log("permissionState", permissionState);
        const hasPermission = await getPermission();
        if (!hasPermission) {
          return;
        }
      }
      // Launch image library
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Note: this should be ImagePicker.MediaTypeOptions.Images in newer versions
        allowsEditing: true,
        // aspect: [5, 5],
        quality: 1,
      });
  
      if (!result.canceled && result.assets[0]) {
        console.log("result.assets[0].uri", result.assets[0].uri);
        console.log("result", result);
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'An error occurred while accessing photos.');
    }
  };
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

