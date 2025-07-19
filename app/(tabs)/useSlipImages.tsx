import { useState, useEffect } from 'react';
import { Button, Text, SafeAreaView, ScrollView, StyleSheet, View, Platform, Alert, Linking} from 'react-native';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';

export default function ImageSlip() {
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  async function getAlbums() {
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
            } else {
              // User denied but can ask again
              Alert.alert(
                'Permission Required', 
                'Permission to access photo library is required to select images.',
                [
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }
            return;
          }
          console.log('Permission granted');
    }
    const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
      includeSmartAlbums: true,
    });
    setAlbums(fetchedAlbums);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Button onPress={getAlbums} title="Get albums" />
      <ScrollView>
        {albums && albums.map((album) => <AlbumEntry key={album.id} album={album} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function AlbumEntry({ album }: { album: MediaLibrary.Album }) {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    async function getAlbumAssets() {
      const albumAssets = await MediaLibrary.getAssetsAsync({ 
        album,
        first: 20, // Limit to first 20 assets for performance
      });
      console.log('album : ==========> ', album.title);
      // console.log('albumAssets : ==========> ', albumAssets);
      setAssets(albumAssets.assets);
    }
    getAlbumAssets();
  }, [album]);

  return (
    <View key={album.id} style={styles.albumContainer}>
      <Text>
        {album.title} - {album.assetCount ?? 'no'} assets
      </Text>
      <View style={styles.albumAssetsContainer}>
        {assets && assets.map((asset) => (
          <AssetImage key={asset.id} asset={asset} />
        ))}
      </View>
    </View>
  );
}

function AssetImage({ asset }: { asset: MediaLibrary.Asset }) {
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    async function getAssetInfo() {
      try {
        // Get asset info with local URI
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
        setImageUri(assetInfo.localUri || assetInfo.uri);
      } catch (error) {
        console.log('Error getting asset info:', error);
        // Fallback to original URI
        setImageUri(asset.uri);
      }
    }
    getAssetInfo();
  }, [asset]);

  if (!imageUri) {
    return (
      <View style={styles.placeholderImage}>
        <Text style={styles.placeholderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <Image 
      source={{ uri: imageUri }} 
      style={styles.assetImage}
      contentFit="cover"
    />
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    ...Platform.select({
      android: {
        paddingTop: 40,
      },
    }),
  },
  albumContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 4,
  },
  albumAssetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  assetImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 8,
    color: '#666',
  },
});
/* @end */
