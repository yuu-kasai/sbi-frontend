import React, { useRef, useEffect, useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
  ActivityIndicator,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system';

interface MobileVideoModalProps {
  isVisible: boolean;
  onClose: () => void;
  videoSource: string;
}

const MobileVideoModal: React.FC<MobileVideoModalProps> = ({
  isVisible,
  onClose,
  videoSource,
}) => {
  const videoRef = useRef<Video>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isVisible && videoSource) {
      const loadVideo = async () => {
        try {
          console.log("MobileVideoModal - Loading video with source:", videoSource);
          setIsLoading(true);
          setError(null);

          // assets/videos/ ディレクトリからの相対パスを取得
          const videoFileName = videoSource.split('/').pop(); // harbis_osaka.mp4
          const assetUri = `${FileSystem.documentDirectory}assets/videos/${videoFileName}`;
          
          console.log("Attempting to load video from:", assetUri);

          if (videoRef.current) {
            console.log("MobileVideoModal - Starting video load");
            await videoRef.current.loadAsync(
              { uri: assetUri },
              { shouldPlay: true }
            );
            console.log("MobileVideoModal - Video loaded successfully");
          }
        } catch (err: unknown) {
          console.error("MobileVideoModal - Video loading error:", err);
          let errorMessage = "動画の読み込みに失敗しました";
          
          if (err instanceof Error) {
            errorMessage = `${errorMessage}: ${err.message}`;
          } else if (typeof err === "string") {
            errorMessage = `${errorMessage}: ${err}`;
          } else if (err && typeof err === "object") {
            errorMessage = `${errorMessage}: ${JSON.stringify(err)}`;
          }
          
          setError(errorMessage);
          setIsLoading(false);
        }
      };

      loadVideo();
    }

    return () => {
      if (videoRef.current) {
        console.log("MobileVideoModal - Unloading video");
        videoRef.current.unloadAsync();
      }
    };
  }, [isVisible, videoSource]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.videoContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.errorText}>Video path: {videoSource}</Text>
              </View>
            ) : (
              <>
                <Video
                  ref={videoRef}
                  source={require('../assets/videos/harbis_osaka.mp4')}
                  rate={1.0}
                  volume={1.0}
                  isMuted={false}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={isVisible}
                  useNativeControls
                  onError={(error) => {
                    console.error("Video error:", error);
                    setError(`動画の再生エラー: ${error}`);
                    setIsLoading(false);
                  }}
                  onPlaybackStatusUpdate={(status) => {
                    console.log("Playback status:", status);
                    if (!status.isLoaded) {
                      if (status.error) {
                        setError(`再生エラー: ${status.error}`);
                      }
                      return;
                    }
                    if (status.isLoaded && status.isPlaying) {
                      setIsLoading(false);
                    }
                  }}
                  style={[styles.video, isLoading && styles.hiddenVideo]}
                />
                {isLoading && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>動画を読み込み中...</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: Platform.OS === "ios" ? 50 : 10,
    zIndex: 2,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  hiddenVideo: {
    opacity: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1,
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 10,
  },
});

export default MobileVideoModal;