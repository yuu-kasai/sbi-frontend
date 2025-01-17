import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Text,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "react-native-calendars";
import CustomTimePicker from "@/components/CustomTimePicker";
import AccordionItem from "@/components/AccordionItem";
import {
  GoogleMap,
  LoadScript,
  Polyline,
  Marker,
} from "@react-google-maps/api";
import Constants from "expo-constants";
import DepartureAutocomplete from "@/components/DepartureAutocomplete";
import ArrivalAutocomplete from "@/components/ArrivalAutocomplete";
import WebArrivalAutocomplete from "@/components/WebArrivalAutocomplete";
import WebDepartureAutocomplete from "@/components/WebDepartureAutocomplete";

// Types
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
  type: "walk" | "train" | "bus";
  duration: string;
  distance?: string;
  price: string;
  lineName?: string;
  departureTime?: string;
  arrivalTime?: string;
  videoUrl?: string;
  stops?: Stop[];
}

interface DetailedSearchResult {
  id: string;
  totalDuration: string;
  totalPrice: string;
  departureTime: string;
  arrivalTime: string;
  segments: RouteSegment[];
  videoUrl?: string;
}

declare global {
  namespace Constants {
    interface ManifestExtra {
      googleMapsApiKey: string;
    }
  }
}

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "http://153.127.67.155:8001"
    : "http://153.127.67.155:8001"; // 開発環境でも本番のURLを使用

// API呼び出しの実装
const fetchSearchResults = async (
  departure: string,
  arrival: string
): Promise<DetailedSearchResult[]> => {
  try {
    // クエリパラメータの構築
    const params = new URLSearchParams({
      departure_place: departure.trim(),
      arrival_place: arrival.trim(),
      date: new Date().toISOString().split("T")[0], // 必要に応じて
    });

    // URLの構築
    const url = `${API_BASE_URL}/backend/route?${params.toString()}`;
    console.log("リクエストURL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("サーバーエラー:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`HTTPエラー: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("不正なContent-Type:", contentType);
      throw new Error("サーバーからの応答が不正な形式です");
    }

    const data = await response.json();
    console.log("レスポンスデータ:", data); // デバッグ用
    return data;
  } catch (error) {
    console.error("APIリクエストエラー:", error);

    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      throw new Error(
        "サーバーに接続できません。インターネット接続を確認してください。"
      );
    }

    throw new Error(
      error instanceof Error ? error.message : "検索結果の取得に失敗しました"
    );
  }
};

export default function HomeScreen() {
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [detailedSearchResults, setDetailedSearchResults] = useState<
    DetailedSearchResult[]
  >([]);
  const [expandedItems, setExpandedItems] = useState<{
    [key: string]: boolean;
  }>({});
  const dateButtonRef = useRef<TouchableOpacity>(null);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const [isArrivalTime, setIsArrivalTime] = useState(false);
  const [timeType, setTimeType] = useState<"departure" | "arrival">(
    "departure"
  );

  const handleDateChange = useCallback((selectedDate: Date | string | null) => {
    if (selectedDate) {
      const newDate =
        typeof selectedDate === "string"
          ? new Date(selectedDate)
          : selectedDate;
      setDate(newDate);
      setShowDatePicker(false);
    }
  }, []);

  const handleTimeChange = useCallback((newTime: Date) => {
    setDate(newTime);
    setShowTimePicker(false);
  }, []);

  const toggleDatePicker = useCallback(() => {
    if (dateButtonRef.current && !isMobile) {
      dateButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setCalendarPosition({
          top: pageY + height,
          left: pageX,
        });
      });
    }
    setShowDatePicker((prevState) => !prevState);
  }, []);

  // handleSearch 関数の改善
  const handleSearch = async () => {
    setIsSearching(true);
    setDetailedSearchResults([]);

    try {
      // 入力チェック
      if (!departure || !arrival) {
        alert("出発地と到着地を入力してください。");
        return;
      }

      if (departure === arrival) {
        alert("出発地と到着地が同じです。");
        return;
      }

      const transformApiResponse = (
        apiResponse: any
      ): DetailedSearchResult[] => {
        return apiResponse.routes.map((route: any, index: number) => {
          // 時間をHH:mm形式に変換
          const departureTime = route.departure.time.substring(0, 5);
          const arrivalTime = route.arrival.time.substring(0, 5);

          // 経路情報を作成
          const segment: RouteSegment = {
            id: `${index + 1}-1`,
            from: route.departure.place,
            to: route.arrival.place,
            type: "bus", // デフォルトはバスとして設定
            duration: route.duration.replace("0:", ""), // "0:26:00" → "26分" の形式に変換
            price: route.fare.price.toString(),
            departureTime: departureTime,
            arrivalTime: arrivalTime,
            stops: route.stops, // 停留所データを追加
          };

          // 検索結果オブジェクトを作成
          return {
            id: (index + 1).toString(),
            totalDuration: route.duration.replace("0:", ""),
            totalPrice: route.fare.price.toString(),
            departureTime: departureTime,
            arrivalTime: arrivalTime,
            segments: [segment],
          };
        });
      };

      // クエリパラメータの構築
      const params = new URLSearchParams({
        departure_place: departure.trim(),
        arrival_place: arrival.trim(),
        date: date.toISOString().split("T")[0], // YYYY-MM-DD形式
        time: date.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        is_arrival_time: isArrivalTime.toString(),
      });

      // APIリクエスト
      const response = await fetch(
        `${API_BASE_URL}/backend/route?${params.toString()}`
      );
      const data = await response.json();

      if (data.status === "success") {
        const transformedResults = transformApiResponse(data);
        setDetailedSearchResults(transformedResults);
      } else {
        alert("検索結果の取得に失敗しました。");
      }
    } catch (error) {
      console.error("検索エラー:", error);
      alert(
        error instanceof Error
          ? error.message
          : "検索中にエラーが発生しました。もう一度お試しください。"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleCalendarDateChange = useCallback(
    (day: { dateString: string }) => {
      const newDate = new Date(day.dateString);
      setDate(newDate);
      setShowDatePicker(false);
    },
    []
  );

  const toggleAccordionItem = useCallback((id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const swapDepartureArrival = () => {
    const temp = departure;
    setDeparture(arrival);
    // console.log(arrival)
    setArrival(temp);
  };

  const flightPlanCoordinates =
    detailedSearchResults.length > 0
      ? detailedSearchResults[0].segments[0].stops?.map((stop) => ({
          lat: stop.location.stop_lat,
          lng: stop.location.stop_lon,
        })) || []
      : [];

  // 場所
  const DeparturePlace = {
    lat: flightPlanCoordinates[0]?.lat || 33.59519,
    lng: flightPlanCoordinates[0]?.lng || 134.21479,
  };

  const lastIndex = flightPlanCoordinates.length - 1;

  const ArrivalPlace = {
    lat: flightPlanCoordinates[lastIndex]?.lat || 33.59519,
    lng: flightPlanCoordinates[lastIndex]?.lng || 134.21479,
  };

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

  console.log(detailedSearchResults);
  // console.log(GOOGLE_MAPS_API_KEY);

  const isMobile = Platform.OS === "web" && window.innerWidth <= 768;

  const renderDatePicker = () => {
    if (!isMobile) {
      return showDatePicker ? (
        <View
          style={[
            styles.webCalendarContainer,
            { top: calendarPosition.top, left: calendarPosition.left },
          ]}
        >
          <DatePicker
            selected={date}
            onChange={handleDateChange}
            dateFormat="yyyy/MM/dd"
            inline
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      ) : null;
    } else {
      return (
        <Modal visible={showDatePicker} transparent animationType="fade">
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.modalContent}>
              <Calendar
                onDayPress={handleCalendarDateChange}
                markedDates={{
                  [date.toISOString().split("T")[0]]: {
                    selected: true,
                    marked: true,
                  },
                }}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.closeButtonText}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    }
  };

  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>検索中...</Text>
        </View>
      );
    }

    if (detailedSearchResults.length > 0) {
      if (!isMobile) {
        return (
          <>
            <Text style={styles.resultsTitle}>検索結果</Text>
            <View style={styles.mapContainer}>
              <View style={styles.resultsContainer}>
                <FlatList
                  data={detailedSearchResults}
                  renderItem={({ item }) => (
                    <View>
                      <AccordionItem
                        item={item}
                        expanded={!!expandedItems[item.id]}
                        onToggle={() => toggleAccordionItem(item.id)}
                      />
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                />
              </View>
              <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{
                    width: "100%",
                    height: "1500px",
                  }}
                  center={{
                    lat: flightPlanCoordinates[0]?.lat || 33.59519,
                    lng: flightPlanCoordinates[0]?.lng || 134.21479,
                  }}
                  zoom={15}
                >
                  <Polyline
                    path={flightPlanCoordinates}
                    options={{
                      strokeColor: "#FF0000",
                      strokeOpacity: 1.0,
                      strokeWeight: 2,
                      geodesic: true,
                    }}
                  />
                  <Marker position={DeparturePlace} />
                  <Marker position={ArrivalPlace} />
                </GoogleMap>
              </LoadScript>
            </View>
          </>
        );
      } else {
        return (
          <>
            <Text style={styles.resultsTitle}>検索結果</Text>
            <View>
              <View style={styles.mobileResultsContainer}>
                <FlatList
                  data={detailedSearchResults}
                  renderItem={({ item }) => (
                    <AccordionItem
                      item={item}
                      expanded={!!expandedItems[item.id]}
                      onToggle={() => toggleAccordionItem(item.id)}
                    />
                  )}
                  keyExtractor={(item) => item.id}
                />
              </View>
            </View>
          </>
        );
      }
    }
  };

  const renderTimePicker = () => {
    if (!isMobile) {
      return (
        <View style={styles.inputWrapper}>
          <CustomTimePicker
            onClose={() => setShowTimePicker(false)}
            isVisible={showTimePicker}
            type="hour" // この値は実際には使用しませんが、型定義のために必要
            initialTime={date}
            onSelectTime={(newDate) => {
              setDate(newDate);
            }}
          />
        </View>
      );
    } else {
      return (
        <>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.dateTimeText}>
                {date.toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* モバイル用の時間選択モーダル */}
          <CustomTimePicker
            isVisible={showTimePicker}
            onClose={() => setShowTimePicker(false)}
            type="hour"
            initialTime={date}
            onSelectTime={(newDate) => {
              setDate(newDate);
              setShowTimePicker(false);
            }}
          />
        </>
      );
    }
  };
  const placeholderColor = "rgba(102, 102, 102, 0.6)";

  if (!isMobile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>経路検索</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <View style={styles.webInputContainer}>
              <View style={styles.locationInputsContainer}>
                <WebDepartureAutocomplete onSelect={setDeparture} />
                <TouchableOpacity
                  style={styles.swapButton}
                  onPress={swapDepartureArrival}
                >
                  <View style={styles.iconWrapper}>
                    <Ionicons
                      name="swap-vertical"
                      size={24}
                      color="#007AFF"
                      style={styles.rotatedIcon}
                    />
                  </View>
                </TouchableOpacity>
                <WebArrivalAutocomplete onSelect={setArrival} />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputWrapper]}>
                  <TouchableOpacity
                    ref={dateButtonRef}
                    style={styles.inputContainer}
                    onPress={toggleDatePicker}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                    <Text style={styles.dateText}>
                      {date.toISOString().split("T")[0]}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.spacer} />
                {renderTimePicker()}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, isSearching && styles.disabledButton]}
              onPress={handleSearch}
              disabled={isSearching}
            >
              <View style={styles.buttonContent}>
                <Ionicons
                  name={isSearching ? "reload-outline" : "search-outline"}
                  size={16}
                  color="white"
                />
                <Text style={styles.buttonText}>
                  {isSearching ? "検索中..." : "検索"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {renderSearchResults()}
        </ScrollView>

        {renderDatePicker()}
      </SafeAreaView>
    );
  } else {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>経路検索</Text>
        </View>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <DepartureAutocomplete onSelect={setDeparture} />
            <TouchableOpacity
              style={styles.swapButton}
              onPress={swapDepartureArrival}
            >
              <Ionicons name="swap-vertical" size={24} color="#007AFF" />
            </TouchableOpacity>
            <ArrivalAutocomplete onSelect={setArrival} />
            <View style={styles.row}>
              <View style={[styles.inputWrapper]}>
                <TouchableOpacity
                  ref={dateButtonRef}
                  style={styles.inputContainer}
                  onPress={toggleDatePicker}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateText}>
                    {date.toISOString().split("T")[0]}
                  </Text>
                </TouchableOpacity>
              </View>
              {renderTimePicker()}
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, isSearching && styles.disabledButton]}
                onPress={handleSearch}
                disabled={isSearching}
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={isSearching ? "reload-outline" : "search-outline"}
                    size={16}
                    color="white"
                  />
                  <Text style={styles.buttonText}>
                    {isSearching ? "検索中..." : "検索"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          {renderSearchResults()}
        </ScrollView>

        {renderDatePicker()}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    position: "relative",
    ...(Platform.OS === "web" && window.innerWidth <= 768
      ? {
          overflow: "visible",
        }
      : {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  webInputContainer: {
    position: "relative",
    display: "flex",
    width: "100%",
    zIndex: 1000,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      alignItems: "center",
    }),
  },
  locationInputsContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    zIndex: 1000,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      justifyContent: "center",
      width: "94%",
    }),
  },
  webinputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 8,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      flex: 1,
      maxWidth: "45%",
    }),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 8,
    marginBottom: 12,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      paddingVertical: 8,
    }),
  },
  input: {
    flex: 1,
    fontSize: 14,
    marginLeft: 4,
    height: 40,
    color: "#333333",
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      outlineStyle: "none",
    }),
  },
  mobileSearchContainer: {
    width: "100%",
    position: "relative",
    zIndex: 3000,
    marginBottom: 16,
  },
  row: {
    position: "relative",
    zIndex: 1,
    flexDirection: "row",
    marginBottom: 12,
    width: "100%",
    ...(Platform.OS === "web" && window.innerWidth <= 768
      ? {
          gap: 8,
          marginTop: 8,
        }
      : {
          justifyContent: "center",
          alignItems: "center",
          width: "94%",
        }),
  },
  inputWrapper: {
    ...(Platform.OS === "web" && window.innerWidth <= 768
      ? {
          flex: 1,
        }
      : {
          flex: 1,
          maxWidth: "45%",
        }),
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 4,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 8,
    backgroundColor: "white",
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      width: "100%",
    }),
  },
  timePickerContainer: {
    flexDirection: "row",
    flex: 1,
  },
  timePickerWrapper: {
    flex: 1,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      flex: 1,
      maxWidth: "45%",
    }),
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 4,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      textAlign: "center",
      width: "80%",
      maxWidth: 400,
      display: "flex",
      marginLeft: "auto",
      marginRight: "auto",
    }),
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#A0A0A0",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  webCalendarContainer: {
    position: "absolute",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.1)",
      },
    }),
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  resultsContainer: {
    marginTop: 20,
    width: "30%",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  segmentIcon: {
    marginRight: 4,
  },
  segmentType: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  swapButton: {
    alignSelf: "center",
    marginVertical: 8,
  },
  departure: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 8,
  },
  webDeparture: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 8,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      flex: 1,
      maxWidth: "45%",
    }),
  },
  time: {
    width: "50%",
    height: 40,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 4,
    overflow: "hidden",
  },
  minutes: {
    width: "50%",
    height: 40,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 4,
    overflow: "hidden",
  },
  timeicon: {
    width: "6%",
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 4,
  },
  mapContainer: {
    display: "flex",
    flexDirection: "row",
  },
  mobileResultsContainer: {
    marginTop: 20,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    marginLeft: 8,
  },
  rotatedIcon: {
    transform: [{ rotate: "90deg" }],
  },
  spacer: {
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      width: 48,
      marginLeft: 8,
    }),
  },
  buttonContainer: {
    position: "relative",
    zIndex: 1,
    marginTop: 16,
    width: "100%",
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      width: "95%",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: 8,
    }),
  },
  focusedInput: {
    borderColor: "#007AFF",
    borderWidth: 2,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      boxShadow: "0 0 0 1px #007AFF",
    }),
  },
});
