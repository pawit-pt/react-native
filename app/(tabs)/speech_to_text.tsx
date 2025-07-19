import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { 
  useAudioRecorder, 
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync 
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { styles } from '../styles/voice.styles';

// Web Speech API types
interface WebSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: WebSpeechRecognitionEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: any) => void) | null;
}

interface WebSpeechRecognitionEvent extends Event {
  results: WebSpeechRecognitionResultList;
  resultIndex: number;
}

interface WebSpeechRecognitionResultList {
  length: number;
  item(index: number): WebSpeechRecognitionResult;
  [index: number]: WebSpeechRecognitionResult;
}

interface WebSpeechRecognitionResult {
  length: number;
  item(index: number): WebSpeechRecognitionAlternative;
  [index: number]: WebSpeechRecognitionAlternative;
  isFinal: boolean;
}

interface WebSpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new(): WebSpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): WebSpeechRecognition;
    };
  }
}

export default function SpeechToTextButton() {
  const [transcribedText, setTranscribedText] = useState('');
  const [isWebListening, setIsWebListening] = useState(false);
  const [webRecognition, setWebRecognition] = useState<WebSpeechRecognition | null>(null);
  
  // Mobile audio recorder (only used on mobile platforms)
  const audioRecorder = Platform.OS !== 'web' ? useAudioRecorder(RecordingPresets.HIGH_QUALITY) : null;
  const recorderState = Platform.OS !== 'web' ? useAudioRecorderState(audioRecorder!) : null;

  // Initialize Web Speech API or mobile audio recorder
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Initialize Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'th-TH';

        recognition.onresult = (event: WebSpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setTranscribedText(finalTranscript);
          } else if (interimTranscript) {
            setTranscribedText(`Listening... "${interimTranscript}"`);
          }
        };

        recognition.onstart = () => {
          setIsWebListening(true);
          setTranscribedText('Listening...');
        };

        recognition.onend = () => {
          setIsWebListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsWebListening(false);
          if (event.error === 'not-allowed') {
            Alert.alert('Permission Denied', 'Microphone access is required for speech recognition');
          } else if (event.error === 'no-speech') {
            setTranscribedText('No speech detected. Please try again.');
          } else {
            setTranscribedText(`Error: ${event.error}`);
          }
        };

        setWebRecognition(recognition);
      } else {
        Alert.alert('Not Supported', 'Speech recognition is not supported in this browser');
      }
    } else {
      // Mobile setup
      (async () => {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert('Permission denied', 'Audio recording permission is required');
          return;
        }

        // Set audio mode for recording
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        });
      })();
    }
  }, []);

  const startListening = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web Speech API
        if (webRecognition) {
          webRecognition.start();
          
          // Auto-stop after 10 seconds for web
          setTimeout(() => {
            if (isWebListening) {
              stopListening();
            }
          }, 10000);
        }
      } else {
        // Mobile recording
        setTranscribedText('Listening...');
        
        // Prepare and start recording
        await audioRecorder!.prepareToRecordAsync();
        audioRecorder!.record();

        // Auto-stop after 5 seconds
        setTimeout(() => {
          if (recorderState!.isRecording) {
            stopListening();
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
      setTranscribedText('');
    }
  };

  const stopListening = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web Speech API
        if (webRecognition && isWebListening) {
          webRecognition.stop();
        }
      } else {
        // Mobile recording
        if (recorderState!.isRecording) {
          await audioRecorder!.stop();
          
          // Note: For mobile, you'll need to integrate with a speech-to-text service
          // like Google Speech-to-Text API, Azure Speech, or AWS Transcribe
          setTranscribedText('Speech recognition for mobile requires a cloud service integration (Google Speech-to-Text, Azure Speech, etc.)');
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setTranscribedText('Error occurred while stopping recording');
    }
  };

  // Text-to-speech function
  const speakText = () => {
    if (transcribedText && transcribedText !== 'Listening...' && !transcribedText.startsWith('Listening...')) {
      if (Platform.OS === 'web') {
        // Web Speech Synthesis API
        const utterance = new SpeechSynthesisUtterance(transcribedText);
        utterance.lang = 'th-TH';
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
      } else {
        // Mobile expo-speech
        Speech.speak(transcribedText, {
          language: 'th-TH',
          pitch: 1.0,
          rate: 1.0,
        });
      }
    }
  };

  const isListening = Platform.OS === 'web' ? isWebListening : recorderState?.isRecording || false;
  const recordingDuration = Platform.OS === 'web' ? 0 : recorderState?.durationMillis || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Speech to Text</Text>
      
      {Platform.OS === 'web' && (
        <Text style={styles.platformText}>Using Web Speech API</Text>
      )}
      
      {Platform.OS !== 'web' && (
        <Text style={styles.platformText}>Using Expo Audio (Mobile)</Text>
      )}
      
      <TouchableOpacity
        style={[styles.button, isListening && styles.listeningButton]}
        onPress={isListening ? stopListening : startListening}
        disabled={false}
      >
        <Text style={styles.buttonText}>
          {isListening ? '🎤 Listening...' : '🎤 Start Recording'}
        </Text>
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.label}>Transcribed Text:</Text>
        <Text style={styles.transcribedText}>{transcribedText || 'No speech detected yet'}</Text>
      </View>

      {transcribedText && transcribedText !== 'Listening...' && !transcribedText.startsWith('Listening...') && (
        <TouchableOpacity style={styles.speakButton} onPress={speakText}>
          <Text style={styles.buttonText}>🔊 Read Text Aloud</Text>
        </TouchableOpacity>
      )}

      {isListening && Platform.OS !== 'web' && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Recording: {Math.round(recordingDuration / 1000)}s
          </Text>
        </View>
      )}

      {isListening && Platform.OS === 'web' && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            🌐 Web Speech Recognition Active
          </Text>
        </View>
      )}
    </View>
  );
}

