// import { Platform } from 'react-native';
// import * as MediaLibrary from 'expo-media-library';
// import * as TaskManager from 'expo-task-manager';
// import * as BackgroundFetch from 'expo-background-fetch';

// // Types for image data
// interface ImageAsset {
//   uri: string;
//   filename: string;
//   width: number;
//   height: number;
//   fileSize: number;
//   type: string;
//   timestamp: number;
//   id: string;
// }

// interface AlbumImageResponse {
//   images: ImageAsset[];
//   hasNextPage: boolean;
//   endCursor?: string;
//   totalCount: number;
// }

// interface GetImageOptions {
//   first?: number;
//   after?: string;
//   albumName?: string;
//   mediaType?: typeof MediaLibrary.MediaType;
//   sortBy?: typeof MediaLibrary.SortBy;
//   createdAfter?: Date;
//   createdBefore?: Date;
// }

// // Background task name
// const BACKGROUND_FETCH_TASK = 'kbank-image-fetch';

// // Define background task
// TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
//   try {
//     // Background image processing logic here
//     console.log('Background image fetch completed');
//     return BackgroundFetch.BackgroundFetchResult.NewData;
//   } catch (error) {
//     console.error('Background fetch failed:', error);
//     return BackgroundFetch.BackgroundFetchResult.Failed;
//   }
// });

// class KBankImageService {
//   private static instance: KBankImageService;
//   private isBackgroundTaskRegistered = false;

//   public static getInstance(): KBankImageService {
//     if (!KBankImageService.instance) {
//       KBankImageService.instance = new KBankImageService();
//     }
//     return KBankImageService.instance;
//   }

//   /**
//    * Request necessary permissions for accessing media library
//    */
//   private async requestPermissions(): Promise<boolean> {
//     try {
//       const { status } = await MediaLibrary.requestPermissionsAsync();
//       return status === 'granted';
//     } catch (error) {
//       console.error('Permission request failed:', error);
//       return false;
//     }
//   }

//   /**
//    * Register background task for image processing
//    */
//   private async registerBackgroundTask(): Promise<void> {
//     if (this.isBackgroundTaskRegistered) return;

//     try {
//       await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
//         minimumInterval: 60000, // 1 minute
//         stopOnTerminate: false,
//         startOnBoot: true,
//       });
//       this.isBackgroundTaskRegistered = true;
//     } catch (error) {
//       console.error('Background task registration failed:', error);
//     }
//   }

//   /**
//    * Get images from device album with background processing
//    */
//   public async getImagesFromAlbum(
//     options: GetImageOptions = {}
//   ): Promise<AlbumImageResponse> {
//     const {
//       first = 20,
//       after,
//       albumName,
//       mediaType = MediaLibrary.MediaType.photo,
//       sortBy = MediaLibrary.SortBy.creationTime,
//       createdAfter,
//       createdBefore,
//     } = options;

//     try {
//       // Check permissions first
//       const hasPermission = await this.requestPermissions();
//       if (!hasPermission) {
//         throw new Error('Media library permission denied');
//       }

//       // Register background task
//       await this.registerBackgroundTask();

//       let album: MediaLibrary.Album | null = null;
      
//       // Get specific album if albumName is provided
//       if (albumName) {
//         const albums = await MediaLibrary.getAlbumsAsync();
//         album = albums.find(a => a.title === albumName) || null;
//       }

//       // Get assets from album or all assets
//       const assetsResult = await MediaLibrary.getAssetsAsync({
//         first,
//         after,
//         album: album || undefined,
//         mediaType: mediaType as MediaLibrary.MediaTypeValue,
//         sortBy: [sortBy as MediaLibrary.SortByObject, MediaLibrary.SortBy.modificationTime],
//         createdAfter,
//         createdBefore,
//       });

//       // Get detailed asset info for each asset
//       const detailedAssets = await Promise.all(
//         assetsResult.assets.map(async (asset) => {
//           const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
//           return this.transformAssetInfo(asset, assetInfo);
//         })
//       );

//       return {
//         images: detailedAssets,
//         hasNextPage: assetsResult.hasNextPage,
//         endCursor: assetsResult.endCursor,
//         totalCount: assetsResult.totalCount,
//       };
//     } catch (error) {
//       console.error('Failed to get images from album:', error);
//       throw error;
//     }
//   }

//   /**
//    * Transform MediaLibrary asset to our ImageAsset format
//    */
//   private transformAssetInfo(
//     asset: MediaLibrary.Asset,
//     assetInfo: MediaLibrary.AssetInfo
//   ): ImageAsset {
//     return {
//       uri: assetInfo.localUri || asset.uri,
//       filename: asset.filename,
//       width: asset.width,
//       height: asset.height,
//       fileSize: assetInfo.fileSize || 0,
//       type: asset.mediaType,
//       timestamp: asset.creationTime,
//       id: asset.id,
//     };
//   }

//   /**
//    * Get images specifically for K Bank document processing
//    * Filters images based on K Bank requirements
//    */
//   public async getKBankDocumentImages(
//     options: GetImageOptions = {}
//   ): Promise<AlbumImageResponse> {
//     const kbankOptions: GetImageOptions = {
//       ...options,
//       mediaType: MediaLibrary.MediaType.photo,
//     };

//     const result = await this.getImagesFromAlbum(kbankOptions);

//     // Filter images that meet K Bank document requirements
//     const filteredImages = result.images.filter((image) => {
//       // Minimum resolution for document scanning
//       const minWidth = 800;
//       const minHeight = 600;
      
//       // Maximum file size (e.g., 10MB)
//       const maxFileSize = 10 * 1024 * 1024;

//       // Check if it's a supported format
//       const supportedFormats = ['jpg', 'jpeg', 'png'];
//       const fileExtension = image.filename.split('.').pop()?.toLowerCase();
//       const isSupportedFormat = supportedFormats.includes(fileExtension || '');

//       return (
//         image.width >= minWidth &&
//         image.height >= minHeight &&
//         image.fileSize <= maxFileSize &&
//         isSupportedFormat
//       );
//     });

//     return {
//       ...result,
//       images: filteredImages,
//       totalCount: filteredImages.length,
//     };
//   }

//   /**
//    * Get recent images (useful for K Bank quick document capture)
//    */
//   public async getRecentImages(count: number = 10): Promise<ImageAsset[]> {
//     const result = await this.getKBankDocumentImages({ 
//       first: count,
//       sortBy: MediaLibrary.SortBy.creationTime 
//     });
    
//     return result.images;
//   }

//   /**
//    * Search for images by date range (useful for K Bank transaction documentation)
//    */
//   public async getImagesByDateRange(
//     startDate: Date,
//     endDate: Date
//   ): Promise<ImageAsset[]> {
//     const result = await this.getKBankDocumentImages({
//       first: 1000,
//       createdAfter: startDate,
//       createdBefore: endDate,
//     });

//     return result.images;
//   }

//   /**
//    * Get all albums available on the device
//    */
//   public async getAvailableAlbums(): Promise<MediaLibrary.Album[]> {
//     try {
//       const hasPermission = await this.requestPermissions();
//       if (!hasPermission) {
//         throw new Error('Media library permission denied');
//       }

//       return await MediaLibrary.getAlbumsAsync();
//     } catch (error) {
//       console.error('Failed to get albums:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create album for K Bank documents
//    */
//   public async createKBankAlbum(albumName: string = 'K Bank Documents'): Promise<MediaLibrary.Album> {
//     try {
//       const hasPermission = await this.requestPermissions();
//       if (!hasPermission) {
//         throw new Error('Media library permission denied');
//       }

//       return await MediaLibrary.createAlbumAsync(albumName);
//     } catch (error) {
//       console.error('Failed to create album:', error);
//       throw error;
//     }
//   }

//   /**
//    * Save image to K Bank album
//    */
//   public async saveToKBankAlbum(
//     assetId: string, 
//     albumName: string = 'K Bank Documents'
//   ): Promise<boolean> {
//     try {
//       const albums = await this.getAvailableAlbums();
//       let album = albums.find(a => a.title === albumName);

//       if (!album) {
//         album = await this.createKBankAlbum(albumName);
//       }

//       await MediaLibrary.addAssetsToAlbumAsync([assetId], album, false);
//       return true;
//     } catch (error) {
//       console.error('Failed to save to album:', error);
//       return false;
//     }
//   }

//   /**
//    * Clean up background tasks
//    */
//   public async cleanup(): Promise<void> {
//     try {
//       if (this.isBackgroundTaskRegistered) {
//         await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
//         this.isBackgroundTaskRegistered = false;
//       }
//     } catch (error) {
//       console.error('Cleanup failed:', error);
//     }
//   }
// }

// // Export singleton instance
// export const kbankImageService = KBankImageService.getInstance();

// // Custom hook for using the service
// export const useKBankImageService = () => {
//   const getImages = async (albumName?: string) => {
//     try {
//       const images = await kbankImageService.getKBankDocumentImages({
//         first: 50,
//         albumName,
//       });
      
//       console.log('Retrieved images:', images.totalCount);
//       return images;
//     } catch (error) {
//       console.error('Error getting images:', error);
//       throw error;
//     }
//   };

//   const getRecentDocuments = async (count: number = 20) => {
//     try {
//       const recentImages = await kbankImageService.getRecentImages(count);
//       return recentImages;
//     } catch (error) {
//       console.error('Error getting recent images:', error);
//       throw error;
//     }
//   };

//   const getAlbums = async () => {
//     try {
//       const albums = await kbankImageService.getAvailableAlbums();
//       return albums;
//     } catch (error) {
//       console.error('Error getting albums:', error);
//       throw error;
//     }
//   };

//   const getImagesByDate = async (startDate: Date, endDate: Date) => {
//     try {
//       const images = await kbankImageService.getImagesByDateRange(startDate, endDate);
//       return images;
//     } catch (error) {
//       console.error('Error getting images by date:', error);
//       throw error;
//     }
//   };

//   const saveToAlbum = async (assetId: string, albumName?: string) => {
//     try {
//       return await kbankImageService.saveToKBankAlbum(assetId, albumName);
//     } catch (error) {
//       console.error('Error saving to album:', error);
//       return false;
//     }
//   };

//   return {
//     getImages,
//     getRecentDocuments,
//     getAlbums,
//     getImagesByDate,
//     saveToAlbum,
//     cleanup: () => kbankImageService.cleanup(),
//   };
// };