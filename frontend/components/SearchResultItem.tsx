import React from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import "react-datepicker/dist/react-datepicker.css";

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

const SearchResultItem: React.FC<{
  result: DetailedSearchResult;
  onPress: () => void;
}> = ({ result, onPress }) => (
  <TouchableOpacity style={styles.resultItem} onPress={onPress}>
    <View style={styles.resultHeader}>
      <Text style={styles.resultTime}>{result.departureTime}</Text>
      <Text style={styles.resultDuration}>{result.totalDuration}</Text>
      <Text style={styles.resultTime}>{result.arrivalTime}</Text>
    </View>
    <Text style={styles.resultPrice}>¥{result.totalPrice}</Text>
    <View style={styles.resultRoute}>
      {result.segments.map((segment, index) => (
        <View key={segment.id} style={styles.segmentIcon}>
          {getSegmentTypeIcon(segment.type)}
          {index < result.segments.length - 1 && (
            <View style={styles.segmentConnector} />
          )}
        </View>
      ))}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  resultItem: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultTime: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultDuration: {
    fontSize: 14,
    color: "#666",
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  resultRoute: {
    flexDirection: "row",
    alignItems: "center",
  },
  segmentIcon: {
    alignItems: "center",
    marginRight: 4,
  },
  segmentConnector: {
    width: 2,
    height: 16,
    backgroundColor: "#666",
    marginVertical: 2,
  },
});

export default SearchResultItem;
