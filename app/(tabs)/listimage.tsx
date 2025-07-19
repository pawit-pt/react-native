import { useState, useEffect } from 'react';
import { Button, Text, SafeAreaView, StyleSheet, View, Platform, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { sendImageToApi } from '../../network/sendImage_Assume_axios';

export default function ImageSlip() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);

  async function processKPlusAlbum() {
    try {
      setIsProcessing(true);
      setProcessedCount(0);
      
      // Request media library permissions
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        Alert.alert('Permission denied', 'Need media library permission to access images');
        setIsProcessing(false);
        return;
      }

      // Get all albums
      const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });


      // Find "K plus" album (case insensitive)
      const kPlusAlbum = fetchedAlbums.find(album => 
        album.title.toLowerCase().includes('k plus') || 
        album.title.toLowerCase() === 'k plus'
      );

      if (!kPlusAlbum) {
        Alert.alert('Album not found', 'Could not find "K plus" album');
        setIsProcessing(false);
        return;
      }
      console.log('Found K plus album:', kPlusAlbum.title, 'with', kPlusAlbum.assetCount, 'assets');

      // Get all assets from K plus album
      const albumAssets = await MediaLibrary.getAssetsAsync({
        album: kPlusAlbum,
        mediaType: 'photo', // Only get photos
        first: 1000, // Increase limit to get more assets
      });

      const assets = albumAssets.assets;
      setTotalCount(assets.length);
      console.log('Processing', assets.length, 'images from K plus album');

      // Process each asset and save to media library
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        await processAndSaveAsset(asset);
        setProcessedCount(i + 1);
      }

      Alert.alert(
        'Processing Complete', 
        `Successfully processed ${assets.length} images from K plus album and saved to Photos/Assets folder`
      );

    } catch (error) {
      console.error('Error processing K plus album:', error);
      Alert.alert('Error', 'Failed to process images: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsProcessing(false);
    }
  }

  async function processAllImagesForPDF() {
    try {
      setIsPdfProcessing(true);
      setProcessedCount(0);
      
      // Request media library permissions
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        Alert.alert('Permission denied', 'Need media library permission to access images');
        setIsPdfProcessing(false);
        return;
      }

      // Get all albums
      const fetchedAlbums = await MediaLibrary.getAlbumsAsync({
        includeSmartAlbums: true,
      });

      // Find "K plus" album (case insensitive)
      const kPlusAlbum = fetchedAlbums.find(album => 
        album.title.toLowerCase().includes('k plus') || 
        album.title.toLowerCase() === 'k plus'
      );

      if (!kPlusAlbum) {
        Alert.alert('Album not found', 'Could not find "K plus" album');
        setIsPdfProcessing(false);
        return;
      }

      console.log('Found K plus album:', kPlusAlbum.title, 'with', kPlusAlbum.assetCount, 'assets');

      // Get all assets from K plus album
      const albumAssets = await MediaLibrary.getAssetsAsync({
        album: kPlusAlbum,
        mediaType: 'photo',
        first: 1000,
      });

      const assets = albumAssets.assets;
      setTotalCount(assets.length);
      console.log('Processing', assets.length, 'images for PDF generation');

      // Process each asset and send to API
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        await processImageForPDF(asset, i + 1);
        setProcessedCount(i + 1);
      }

      Alert.alert(
        'PDF Processing Complete', 
        `Successfully processed ${assets.length} images and sent to API for PDF generation`
      );

    } catch (error) {
      console.error('Error processing images for PDF:', error);
      Alert.alert('Error', 'Failed to process images for PDF: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsPdfProcessing(false);
    }
  }

  async function processImageForPDF(asset: MediaLibrary.Asset, pageNum: number) {
    try {
      console.log(`Processing image ${pageNum} for PDF:`, asset.filename || asset.id);
      
      // Get asset info with local URI
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      const sourceUri = assetInfo.localUri || assetInfo.uri;

      if (!sourceUri) {
        console.log('No URI available for asset:', asset.id);
        return;
      }

      // Optimize/manipulate the image
      const manipulatedImage = await manipulateAsync(
        sourceUri,
        [
          { resize: { width: 300, height: 300 } },
        ],
        {
          compress: 0.1,
          format: SaveFormat.JPEG,
        }
      );
      
      console.log(`Sending image ${pageNum} to API for PDF processing`);
      
      // Send to API with page number
      const apiResult = await sendImageToApi({ 
        imageUri: manipulatedImage.uri, 
        pageNum: pageNum 
      });

      if (apiResult.success) {
        console.log(`Image ${pageNum} sent successfully for PDF:`, apiResult.data);
      } else {
        console.error(`Failed to send image ${pageNum} for PDF:`, apiResult.error);
      }

      // Clean up temporary file
      try {
        await FileSystem.deleteAsync(manipulatedImage.uri, { idempotent: true });
      } catch (deleteError) {
        console.log('Could not delete temp file:', deleteError);
      }

    } catch (error) {
      console.error(`Error processing image ${pageNum} for PDF:`, asset.id, error);
    }
  }

  async function processAndSaveAsset(asset: MediaLibrary.Asset) {
    try {
      // Log the original asset object
      console.log('Original asset object:', JSON.stringify(asset, null, 2));
      
      // Get asset info with local URI
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      console.log('Asset info object:', JSON.stringify(assetInfo, null, 2));
      
      const sourceUri = assetInfo.localUri || assetInfo.uri;

      if (!sourceUri) {
        console.log('No URI available for asset:', asset.id);
        return;
      }

      // Optimize/manipulate the image
      const manipulatedImage = await manipulateAsync(
        sourceUri,
        [
          // Add your optimization operations here
          { resize: { width: 1000 , height: 1000 } }, // Resize to max width 1920px (maintains aspect ratio)
        ],
        {
          compress: 0.1, // 80% quality
          format: SaveFormat.JPEG, // Convert to JPEG for better compression
        }
      );
      
      // Log the manipulated image object
      console.log('Manipulated image object:', JSON.stringify(manipulatedImage, null, 2));
      
      // Create or get the "Assets" album in the device's photo library
      let assetsAlbum;
      try {
        // Try to get existing Assets album
        const albums = await MediaLibrary.getAlbumsAsync();
        assetsAlbum = albums.find(album => album.title === 'Assets');
        
        if (!assetsAlbum) {
          // Create Assets album if it doesn't exist
          const tempAsset = await MediaLibrary.createAssetAsync(manipulatedImage.uri);
          console.log('Created temp asset object:', JSON.stringify(tempAsset, null, 2));
          assetsAlbum = await MediaLibrary.createAlbumAsync('Assets', tempAsset, false);
          console.log('Created Assets album object:', JSON.stringify(assetsAlbum, null, 2));
        } else {
          // Add to existing Assets album
          const newAsset = await MediaLibrary.createAssetAsync(manipulatedImage.uri);
          console.log('New asset object:', JSON.stringify(newAsset, null, 2));
          await MediaLibrary.addAssetsToAlbumAsync([newAsset], assetsAlbum, false);
        }
      } catch (albumError) {
        console.error('Error with album operations:', albumError);
        // Fallback: just save to camera roll
        const fallbackAsset = await MediaLibrary.createAssetAsync(manipulatedImage.uri);
        console.log('Fallback asset object:', JSON.stringify(fallbackAsset, null, 2));
      }

      console.log(`Saved optimized image for asset: ${asset.filename || asset.id}`);

      // Send to API before cleaning up the temporary file
      const apiResult = await sendImageToApi({ 
        imageUri: manipulatedImage.uri, 
        pageNum: 1 
      });

      if (apiResult.success) {
        console.log('Image sent successfully:', apiResult.data);
      } else {
        console.error('Failed to send image:', apiResult.error);
      }

      // Clean up temporary file after API call
      try {
        await FileSystem.deleteAsync(manipulatedImage.uri, { idempotent: true });
      } catch (deleteError) {
        console.log('Could not delete temp file:', deleteError);
      }

    } catch (error) {
      console.error('Error processing asset:', asset.id, error);
      
      // Log more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      if (typeof error === 'object' && error !== null && 'code' in error) {
        console.error('Error code:', (error as any).code);
      }
    }
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>K Plus Image Processor</Text>
        
        {!isProcessing && !isPdfProcessing && (
          <View style={styles.buttonContainer}>
            <Button 
              onPress={processKPlusAlbum} 
              title="Process K Plus Album" 
            />
            <Button 
              onPress={processAllImagesForPDF} 
              title="Process All Images for PDF" 
            />
          </View>
        )}
        
        {isProcessing && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Processing images... {processedCount}/{totalCount}
            </Text>
            <Text style={styles.statusText}>
              Please wait, optimizing and saving images to Photos {'>'} Assets album
            </Text>
          </View>
        )}
        
        {isPdfProcessing && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Processing images for PDF... {processedCount}/{totalCount}
            </Text>
            <Text style={styles.statusText}>
              Please wait, sending images to API for PDF generation
            </Text>
          </View>
        )}
        
        {!isProcessing && !isPdfProcessing && processedCount > 0 && (
          <Text style={styles.completedText}>
            Last operation completed: {processedCount} images processed
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      android: {
        paddingTop: 40,
      },
    }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  buttonContainer: {
    gap: 15,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
  },
});