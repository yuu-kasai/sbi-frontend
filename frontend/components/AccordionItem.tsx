import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import "react-datepicker/dist/react-datepicker.css";
import RouteMapModal from "./RouteMapModal";
import VideoModal from "@/components/VideoModal";
import MobileVideoModal from "./MobileVideoModal";

interface Location {
  stop_lat: number;
  stop_lon: number;
}

interface Station {
  name: string;
  stop_id: string;
  location: Location;
}

interface Stop {
  sequence: number;
  time: string;
  stop_id: string;
  stop_name: string;
  location: {
    stop_lat: number;
    stop_lon: number;
  };
}

interface RouteSegment {
  id: string;
  from: string;
  to: string;
  type: "walk" | "bus";
  duration: string;
  distance?: string;
  price: string;
  departureTime?: string;
  arrivalTime?: string;
  stops?: Stop[];
  from_location?: Location;
  to_location?: Location;
  videoUrl?: string;
}

interface Walking {
  from_station: Station;
  to_station: Station;
  duration_minutes: number;
  video?: string;
}

interface DetailedSearchResult {
  id: string;
  totalDuration: string;
  totalPrice: string;
  departureTime: string;
  arrivalTime: string;
  segments: RouteSegment[];
  walking?: Walking;
  transferStation?: string;
}

const getSegmentIcon = (type: "walk" | "bus") => {
  switch (type) {
    case "walk":
      return <Ionicons name="walk-outline" size={24} color="#007AFF" />;
    case "bus":
      return <Ionicons name="bus-outline" size={24} color="#007AFF" />;
  }
};

const getSegmentTypeName = (type: "bus" | "walk") => {
  switch (type) {
    case "bus":
      return "バス";
    case "walk":
      return "徒歩";
  }
};

const AccordionItem: React.FC<{
  item: DetailedSearchResult;
  expanded: boolean;
  onToggle: () => void;
}> = ({ item, expanded, onToggle }) => {
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<RouteSegment | null>(
    null
  );

  const isWeb = Platform.OS === "web";
  const isTransferRoute = item.segments.length > 1;

  const handleOpenVideo = (videoUrl: string) => {
    setSelectedVideo(videoUrl);
    setIsVideoModalVisible(true);
  };

  const handleCloseVideo = () => {
    setIsVideoModalVisible(false);
    setSelectedVideo(null);
  };

  const handleMapClose = () => {
    setIsMapVisible(false);
    setSelectedSegment(null);
  };

  const handleMapOpen = (segment: RouteSegment) => {
    setSelectedSegment(segment);
    setIsMapVisible(true);
  };


  const renderHeader = () => (
    <TouchableOpacity onPress={onToggle} style={styles.accordionHeader}>
      <View>
        <Text style={styles.headerText}>
          {item.departureTime} → {item.arrivalTime}
        </Text>
        <View style={styles.routeOverview}>
          <Text>
            {item.segments[0].from}
            {isTransferRoute ? (
              <>
                <Text style={styles.transferText}> →</Text>
                {item.segments[item.segments.length - 1].to}
              </>
            ) : (
              <> → {item.segments[0].to}</>
            )}
          </Text>
        </View>
        <Text style={styles.subHeaderText}>
          所要時間: {item.totalDuration} / 料金: ¥{item.totalPrice}
        </Text>
      </View>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={24}
        color="#007AFF"
      />
    </TouchableOpacity>
  );

  const renderStops = (stops?: Stop[]) => {
    if (!stops || stops.length === 0) return null;
  };

  const renderSegment = (
    segment: RouteSegment,
    index: number,
    isMobile: boolean
  ) => {
    return (
      <View key={segment.id} style={styles.segmentContainer}>
        <View style={styles.timeLineContainer}>
          <View style={styles.timeColumn}>
            <Text style={styles.timeText}>{segment.departureTime}</Text>
            {segment.arrivalTime && (
              <Text style={styles.timeText}>{segment.arrivalTime}</Text>
            )}
          </View>
          <View style={styles.verticalLine} />
          <View style={styles.mainContent}>
            <View style={styles.segmentHeader}>
              {getSegmentIcon(segment.type)}
              <Text style={styles.segmentType}>
                {getSegmentTypeName(segment.type)}
              </Text>
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeText}>
                {segment.from} → {segment.to}
              </Text>
              <Text style={styles.durationText}>
                所要時間: {segment.duration}
              </Text>
              <Text style={styles.fareText}>運賃: ¥{segment.price}</Text>
              {segment.distance && (
                <Text style={styles.distanceText}>
                  距離: {segment.distance}
                </Text>
              )}

              {segment.type === "walk" && segment.videoUrl && (
                <TouchableOpacity
                  style={styles.videoButton}
                  onPress={() => handleOpenVideo(segment.videoUrl!)}
                  >
                  <Ionicons
                    name="play-circle-outline"
                    size={24}
                    color="#007AFF"
                  />
                  <Text style={styles.videoButtonText}>ルート動画を再生</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {isMobile && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.selectButton]}
              onPress={() => handleMapOpen(segment)}
            >
              <Ionicons name="navigate-outline" size={20} color="white" />
              <Text style={styles.buttonText}>地図表示</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={[styles.accordionItem, !expanded && styles.collapsedItem]}>
        {renderHeader()}
        {expanded && (
          <View style={styles.accordionBody}>
            {item.segments.map((segment, index) =>
              renderSegment(segment, index, Platform.OS !== "web")
            )}
          </View>
        )}
      </View>

      <RouteMapModal
        isVisible={isMapVisible}
        onClose={handleMapClose}
        segment={selectedSegment}
      />

      {isVideoModalVisible &&
        selectedVideo &&
        (Platform.OS === "web" ? (
          <VideoModal
            isVisible={isVideoModalVisible}
            onClose={handleCloseVideo}
            videoSource={selectedVideo}
          />
        ) : (
          <MobileVideoModal
            isVisible={isVideoModalVisible}
            onClose={handleCloseVideo}
            videoSource={selectedVideo}
          />
        ))}
    </>
  );
};

const styles = StyleSheet.create({
  accordionItem: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  collapsedItem: {
    height: 100,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f8f8",
    minHeight: 100,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  routeOverview: {
    marginTop: 4,
    marginBottom: 4,
  },
  transferText: {
    fontWeight: "500",
  },
  subHeaderText: {
    fontSize: 14,
    color: "#666",
  },
  accordionBody: {
    padding: 16,
  },
  timeLineContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timeColumn: {
    width: 60,
    marginRight: 12,
  },
  timeText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  verticalLine: {
    width: 2,
    backgroundColor: "#e0e0e0",
    marginRight: 12,
  },
  mainContent: {
    flex: 1,
  },
  segmentContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 16,
  },
  transferInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  transferInfoText: {
    marginLeft: 8,
    color: "#007AFF",
    fontSize: 15,
    fontWeight: "500",
  },
  segmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  segmentType: {
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 15,
  },
  routeDetails: {
    marginLeft: 32,
  },
  routeText: {
    fontSize: 15,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  fareText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  distanceText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  lineText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  platformText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  stopsContainer: {
    marginTop: 8,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  stopItem: {
    flexDirection: "row",
    marginTop: 4,
  },
  stopTime: {
    width: 50,
    fontSize: 13,
    color: "#666",
  },
  stopName: {
    fontSize: 13,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 40,
  },
  selectButton: {
    backgroundColor: "#20B2AA",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginLeft: 8,
  },
  videoButtonText: {
    marginLeft: 8,
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AccordionItem;
