import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

interface VideoModalProps {
  isVisible: boolean;
  onClose: () => void;
  videoSource: string;
}

const VideoModal: React.FC<VideoModalProps> = ({
  isVisible,
  onClose,
  videoSource,
}) => {
  const renderVideoPlayer = () => {
    if (Platform.OS === "web") {
      return (
        <video
          controls
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "80vh",
            backgroundColor: "#000",
          }}
          src={videoSource}
        >
          お使いのブラウザは動画再生に対応していません。
        </video>
      );
    } else {
      return (
        <Video
          source={{ uri: videoSource }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={true}
          useNativeControls
          style={styles.video}
        />
      );
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.videoContainer}>{renderVideoPlayer()}</View>
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
    width: Platform.OS === "web" ? "80%" : "100%",
    height: Platform.OS === "web" ? "80%" : "100%",
    backgroundColor: "transparent",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 2,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});

export default VideoModal;
