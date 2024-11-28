import React from "react";
import {
  ScrollView,
  View,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Text,
  StyleSheet,
} from "react-native";
import "react-datepicker/dist/react-datepicker.css";
import { Ionicons } from "@expo/vector-icons";

interface RouteSegment {
  id: string;
  from: string;
  to: string;
  type: "walk" | "train" | "bus";
  duration: string;
  distance?: string;
  price: string;
  lineName?: string;
  departureTime?: string;
  arrivalTime?: string;
}

interface DetailedSearchResult {
  id: string;
  totalDuration: string;
  totalPrice: string;
  departureTime: string;
  arrivalTime: string;
  segments: RouteSegment[];
}

const getSegmentTypeIcon = (type: "train" | "bus" | "walk") => {
  switch (type) {
    case "train":
      return <Ionicons name="train-outline" size={24} color="#007AFF" />;
    case "bus":
      return <Ionicons name="bus-outline" size={24} color="#4CAF50" />;
    case "walk":
      return <Ionicons name="walk-outline" size={24} color="#FF9800" />;
  }
};

const getSegmentTypeName = (type: "train" | "bus" | "walk") => {
  switch (type) {
    case "train":
      return "電車";
    case "bus":
      return "バス";
    case "walk":
      return "徒歩";
  }
};

const RouteDetailModal: React.FC<{
  isVisible: boolean;
  onClose: () => void;
  route: DetailedSearchResult;
}> = ({ isVisible, onClose, route }) => (
  <Modal visible={isVisible} transparent animationType="slide">
    <SafeAreaView style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>経路詳細</Text>
        <ScrollView>
          <View style={styles.routeSummary}>
            <Text style={styles.summaryText}>
              {route.departureTime} → {route.arrivalTime}
            </Text>
            <Text style={styles.summaryText}>
              所要時間: {route.totalDuration}
            </Text>
            <Text style={styles.summaryText}>料金: ¥{route.totalPrice}</Text>
          </View>
          {route.segments.map((segment, index) => (
            <View key={segment.id} style={styles.segmentContainer}>
              <View style={styles.segmentHeader}>
                {getSegmentTypeIcon(segment.type)}
                <Text style={styles.segmentType}>
                  {getSegmentTypeName(segment.type)}
                </Text>
                <Text style={styles.segmentDuration}>{segment.duration}</Text>
              </View>
              <View style={styles.segmentDetails}>
                <Text style={styles.segmentTime}>{segment.departureTime}</Text>
                <Text style={styles.segmentStation}>{segment.from}</Text>
              </View>
              {segment.type !== "walk" && (
                <View style={styles.segmentTransport}>
                  <Text style={styles.segmentLine}>{segment.lineName}</Text>
                  <Text style={styles.segmentDirection}>{segment.to}方面</Text>
                </View>
              )}
              <View style={styles.segmentDetails}>
                <Text style={styles.segmentTime}>{segment.arrivalTime}</Text>
                <Text style={styles.segmentStation}>{segment.to}</Text>
              </View>
              {segment.distance && (
                <Text style={styles.segmentDistance}>{segment.distance}</Text>
              )}
              {index < route.segments.length - 1 && (
                <View style={styles.separator} />
              )}
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>閉じる</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </Modal>
);

const styles = StyleSheet.create({
  closeButton: {
    marginTop: 10,
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  segmentDistance: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  segmentStation: {
    fontSize: 14,
  },
  segmentTime: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
    width: 50,
  },
  segmentDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  segmentDirection: {
    fontSize: 12,
    color: "#666",
  },
  segmentLine: {
    fontSize: 14,
    fontWeight: "bold",
  },
  segmentTransport: {
    backgroundColor: "#e6f2ff",
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  segmentDuration: {
    fontSize: 14,
    color: "#666",
    marginLeft: "auto",
  },
  segmentType: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  segmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 4,
  },
  routeSummary: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    // alignItems: "center",
    shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "90%",
    // maxWidth: 350,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  segmentContainer: {
    marginBottom: 16,
  },
});

export default RouteDetailModal;
