import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

interface RouteMapModalProps {
  isVisible: boolean;
  onClose: () => void;
  segment: {
    from: string;
    to: string;
    type: "walk" | "train" | "bus";
  } | null;
}

const RouteMapModal: React.FC<RouteMapModalProps> = ({
  isVisible,
  onClose,
  segment,
}) => {
  if (!segment) return null;

  const getMapUrl = () => {
    return `https://www.google.com/maps/`;
  };

  const INJECTED_JAVASCRIPT = `
    const style = document.createElement('style');
    style.textContent = \`
      /* 下部のボタン類を非表示 */
      .section-action-container-end,
      .section-action-container,
      .section-layout.action-button-bar,
      [jsaction="pane.placeActions.directions"],
      [jsaction="pane.placeActions.startNavigation"],
      [jsaction="pane.placeActions.searchNearby"] { 
        display: none !important; 
      }
      .section-layout.action-button-bar { 
        display: none !important; 
      }
      
     /* 口コミ部分を非表示 */
      .section-review-action,
      .section-review,
      #pane.reviews-container {
        display: none !important;
      }
    \`;
    document.head.appendChild(style);


    // 動的に追加される要素も監視して非表示に
    const observer = new MutationObserver((mutations) => {
      document.querySelectorAll('.section-layout-button, .section-action-container, .app-bottom-nav').forEach(el => {
        el.style.display = 'none';
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  `;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>地図</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.mapContainer}>
          <WebView
            source={{
              uri: getMapUrl(),
            }}
            style={styles.webview}
            injectedJavaScript={INJECTED_JAVASCRIPT}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            onShouldStartLoadWithRequest={(request) => {
              return request.url.includes('google.com/maps');
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
    marginTop: Platform.OS === "ios" ? 40 : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    padding: 8,
  },
  mapContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default RouteMapModal;