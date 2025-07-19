import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#f5f5f5',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#333',
    },
    platformText: {
      fontSize: 14,
      color: '#666',
      marginBottom: 20,
      fontStyle: 'italic',
    },
    button: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
      marginBottom: 20,
    },
    listeningButton: {
      backgroundColor: '#FF3B30',
    },
    speakButton: {
      backgroundColor: '#34C759',
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
      marginTop: 10,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    textContainer: {
      width: '100%',
      minHeight: 100,
      backgroundColor: 'white',
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 10,
      color: '#333',
    },
    transcribedText: {
      fontSize: 14,
      color: '#666',
      lineHeight: 20,
    },
    statusContainer: {
      marginTop: 10,
      padding: 10,
      backgroundColor: '#E8F4FD',
      borderRadius: 8,
    },
    statusText: {
      fontSize: 14,
      color: '#007AFF',
      textAlign: 'center',
    },
  });

export { styles };
export default styles;