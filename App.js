// App.js
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Alert, Dimensions, Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import { OPENAI_KEY } from '@env';

const phoneScreenWidth = Dimensions.get("window").width;
const phoneScreenHeight = Dimensions.get("screen").height;

export default function App() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraRef, setCameraRef] = useState(null);
  const [imageUri, setImageUri] = useState(null);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    console.log("Switched camera");
  }

  async function getImageDescription(base64Image, OPENAI_KEY) {
    try {
        const payload = {                     
            "messages": [
              {
                "content": [
                  {
                    "type": "text",
                    "text": "Describe what you see in the image"
                  } 
                ], 
                "role": "system"  
              },                                                               
              {                       
                "content": [
                  {
                    "image_url": {
                        "url": `data:image/jpeg;base64,${base64Image}`,
                        "detail": "high"
                      },
                    "type": "image_url"
                  }                                                               
                ],
                "role": "user"
              }
            ],                                                                                                                                                                    
            "model": "gpt-4-vision-preview",
            "max_tokens": 64
          };

        const headers = {
            Authorization: `Bearer ${OPENAI_KEY}`,
            "Content-Type": "application/json"
        };

        const startTime = new Date(); // Start time

        const response = await axios.post("https://api.openai.com/v1/chat/completions", payload, { headers });
        const endTime = new Date(); // End time
        const duration = endTime - startTime; // Duration in milliseconds

        console.log(`API call took ${duration} ms`);

        if (response.data.choices && response.data.choices.length > 0) {
            const content = response.data.choices[0].message.content;
            console.log("Response received:", content);
            return content;
        } else {
            throw new Error('No response from OpenAI API');
        }
    } catch (error) {
        console.error('Error getting image description:', error.response ? error.response.data : error.message);

        let errorMessage = "Sorry, I couldn't analyze the image. Please try again later.";
        if (error.message.includes('Unsupported image type')) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
    }
  }

  const handleSubmit = async (base64Image) => {
    try {
      const description = await getImageDescription(base64Image, OPENAI_KEY);
      Alert.alert('Image Description', description);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'There was an error processing the image.');
    }
  };

  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setImageUri(photo.uri);
      console.log(photo.uri);

      const base64Image = await FileSystem.readAsStringAsync(photo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      handleSubmit(base64Image);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={ref => setCameraRef(ref)}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>Take Picture</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});