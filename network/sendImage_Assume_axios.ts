interface SendImageOptions {
  imageUri: string;
  pageNum?: number;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function sendImageToApi({ imageUri, pageNum = 2 }: SendImageOptions): Promise<ApiResponse> {
  try {
    const formData = new FormData();
    
    // For React Native, append the file with proper format
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'image.jpg',
    } as any);
    
    formData.append('page-num', pageNum.toString());
    // Send request to API - don't set Content-Type header manually for FormData
    const apiResponse = await fetch('http://localhost:9092/process/fast', {
      method: 'POST',
      body: formData,
    });

    if (!apiResponse.ok) {
      throw new Error(`HTTP error! status: ${apiResponse.status}`);
    }

    const result = await apiResponse.json();
    
    return {
      success: true,
      data: result,
    };

  } catch (error) {
    console.error('Error sending image to API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Function to send multiple images concurrently
export async function sendMultipleImagesToApi(requests: SendImageOptions[]): Promise<ApiResponse[]> {
  try {
    // Send all requests at the same time using Promise.all
    const results = await Promise.all(
      requests.map(request => sendImageToApi(request))
    );
    
    return results;
  } catch (error) {
    console.error('Error sending multiple images:', error);
    // Return error for all requests if Promise.all fails
    return requests.map(() => ({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}

// Function to send exactly 2 images concurrently
export async function sendTwoImagesToApi(
  firstImage: SendImageOptions,
  secondImage: SendImageOptions
): Promise<{ first: ApiResponse; second: ApiResponse }> {
  try {
    // Send both requests at the same time
    const [firstResult, secondResult] = await Promise.all([
      sendImageToApi(firstImage),
      sendImageToApi(secondImage)
    ]);
    
    return {
      first: firstResult,
      second: secondResult
    };
  } catch (error) {
    console.error('Error sending two images:', error);
    const errorResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    return {
      first: errorResponse,
      second: errorResponse
    };
  }
}
