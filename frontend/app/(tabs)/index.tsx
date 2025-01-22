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

interface Location {
  stop_lat: number;
  stop_lon: number;
}

interface Station {
  name: string;
  stop_id: string;
  location: Location;
}

interface WalkingSegment {
  from_station: Station;
  to_station: Station;
  duration_minutes: number;
  video?: string;
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
  videoUrl?: string;
  stops?: Stop[];
  from_location?: Location; // 追加
  to_location?: Location; // 追加
}

interface DetailedSearchResult {
  id: string;
  totalDuration: string;
  totalPrice: string;
  departureTime: string;
  arrivalTime: string;
  segments: RouteSegment[];
  walking?: WalkingSegment;
}

interface TransferRoute {
  first_leg: {
    departure: {
      time: string;
      place: string;
    };
    arrival: {
      time: string;
      place: string;
    };
    duration: string;
    stops: Stop[];
  };
  second_leg: {
    departure: {
      time: string;
      place: string;
    };
    arrival: {
      time: string;
      place: string;
    };
    duration: string;
    stops: Stop[];
  };
  walking: {
    video?: string;
    from_station: {
      name: string;
      stop_id: string;
      location: {
        stop_lat: number;
        stop_lon: number;
      };
    };
    to_station: {
      name: string;
      stop_id: string;
      location: {
        stop_lat: number;
        stop_lon: number;
      };
    };
    duration_minutes: number;
  };
  transfer_station: string;
  total_fare: {
    price: number;
    currency: string;
    payment_method: string;
    breakdown: {
      price: number;
      currency: string;
      payment_method: string;
    }[];
  };
  duration: string;
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
    console.log("レスポンスデータ:", data);
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
        // noritugi ari
        if (apiResponse.routes[0].first_leg) {
          //if toho ari
          //if toho douga ari
          return apiResponse.routes.map(
            (route: TransferRoute, index: number) => {
              const firstLeg = route.first_leg;
              const secondLeg = route.second_leg;
              const walking = route.walking;
              // walking.video = "harbis_osaka.mp4"
              // 経路情報を作成（バス→徒歩→バスの3区間）
              const segments: RouteSegment[] = [
                {
                  id: `${index + 1}-1`,
                  from: firstLeg.departure.place,
                  to: firstLeg.arrival.place,
                  type: "bus",
                  duration: firstLeg.duration,
                  price: route.total_fare.breakdown[0].price.toString(),
                  departureTime: firstLeg.departure.time.substring(
                    0,
                    firstLeg.departure.time.lastIndexOf(":")
                  ),
                  arrivalTime: firstLeg.arrival.time.substring(
                    0,
                    firstLeg.arrival.time.lastIndexOf(":")
                  ),
                  stops: firstLeg.stops,
                  from_location: firstLeg.stops[0].location,
                  to_location:
                    firstLeg.stops[firstLeg.stops.length - 1].location,
                },
                {
                  id: `${index + 1}-2`,
                  from: firstLeg.arrival.place,
                  to: secondLeg.departure.place,
                  type: "walk",
                  duration: `${walking.duration_minutes}分`,
                  distance: `約${(walking.duration_minutes * 80).toFixed(0)}m`,
                  price: "0",
                  departureTime: firstLeg.arrival.time.substring(
                    0,
                    firstLeg.arrival.time.lastIndexOf(":")
                  ),
                  arrivalTime: secondLeg.departure.time.substring(
                    0,
                    secondLeg.departure.time.lastIndexOf(":")
                  ),
                  from_location: walking.from_station.location,
                  to_location: walking.to_station.location,
                  videoUrl: walking.video,
                },
                {
                  id: `${index + 1}-3`,
                  from: secondLeg.departure.place,
                  to: secondLeg.arrival.place,
                  type: "bus",
                  duration: secondLeg.duration,
                  price: route.total_fare.breakdown[1]?.price.toString() || "0",
                  departureTime: secondLeg.departure.time.substring(
                    0,
                    secondLeg.departure.time.lastIndexOf(":")
                  ),
                  arrivalTime: secondLeg.arrival.time.substring(
                    0,
                    secondLeg.arrival.time.lastIndexOf(":")
                  ),
                  stops: secondLeg.stops,
                  from_location: secondLeg.stops[0].location,
                  to_location:
                    secondLeg.stops[secondLeg.stops.length - 1].location,
                },
              ];

              return {
                id: (index + 1).toString(),
                totalDuration: route.duration,
                totalPrice: route.total_fare.price.toString(),
                departureTime: firstLeg.departure.time.substring(
                  0,
                  firstLeg.departure.time.lastIndexOf(":")
                ),
                arrivalTime: secondLeg.arrival.time.substring(
                  0,
                  secondLeg.arrival.time.lastIndexOf(":")
                ),
                segments: segments,
                transferStation: route.transfer_station,
              };
            }
          );
        } else {
          // 直通経路の場合（既存の実装）
          return apiResponse.routes.map((route: any, index: number) => {
            const departureTime = route.departure.time.substring(
              0,
              route.departure.time.lastIndexOf(":")
            );
            const arrivalTime = route.arrival.time.substring(
              0,
              route.arrival.time.lastIndexOf(":")
            );

            const segment: RouteSegment = {
              id: `${index + 1}-1`,
              from: route.departure.place,
              to: route.arrival.place,
              type: "bus",
              duration: route.duration.replace("0:", ""),
              price: route.fare.price.toString(),
              departureTime: departureTime,
              arrivalTime: arrivalTime,
              stops: route.stops,
            };

            return {
              id: (index + 1).toString(),
              totalDuration: route.duration.replace("0:", ""),
              totalPrice: route.fare.price.toString(),
              departureTime: departureTime,
              arrivalTime: arrivalTime,
              segments: [segment],
            };
          });
        }
      };

      // クエリパラメータの構築
      const params = new URLSearchParams({
        departure_place: departure.trim(),
        arrival_place: arrival.trim(),
        date: date.toISOString().split("T")[0],
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

  // console.log(detailedSearchResults);
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
        const firstResult = detailedSearchResults[0];

        // first_leg（最初のバス区間）の処理
        const firstLegStops = firstResult.segments[0]?.stops || [];

        // second_leg（2番目のバス区間）の処理
        const secondLegStops = firstResult.segments[2]?.stops || [];

        // walking（徒歩区間）の処理
        const walkingSegment = firstResult.segments[1];
        const walkingPoints =
          walkingSegment?.type === "walk"
            ? [
                {
                  lat: walkingSegment.from_location?.stop_lat || 0,
                  lng: walkingSegment.from_location?.stop_lon || 0,
                },
                {
                  lat: walkingSegment.to_location?.stop_lat || 0,
                  lng: walkingSegment.to_location?.stop_lon || 0,
                },
              ].filter((point) => point.lat !== 0 && point.lng !== 0)
            : [];

        const firstLegPoints = firstLegStops.map((stop) => ({
          lat: stop.location.stop_lat,
          lng: stop.location.stop_lon,
        }));

        const secondLegPoints = secondLegStops.map((stop) => ({
          lat: stop.location.stop_lat,
          lng: stop.location.stop_lon,
        }));

        return (
          <>
            <Text style={styles.resultsTitle}>検索結果</Text>
            <View style={styles.mapContainer}>
              <View style={styles.resultsContainer}>
                <FlatList
                  data={detailedSearchResults.slice(0, 3)}
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
                    lat: firstLegPoints[0]?.lat || 34.003572, // 小松島の緯度
                    lng: firstLegPoints[0]?.lng || 134.572368, // 小松島の経度
                  }}
                  zoom={7}
                >
                  {/* 最初のバス区間 */}
                  {firstLegPoints.length > 0 && (
                    <Polyline
                      path={firstLegPoints}
                      options={{
                        strokeColor: "#0088FF",
                        strokeOpacity: 1.0,
                        strokeWeight: 3,
                        geodesic: true,
                      }}
                    />
                  )}

                  {/* 徒歩区間 */}
                  {/* {walkingPoints.length === 2 && (
                    <Polyline
                      path={walkingPoints}
                      options={{
                        strokeColor: "#00FF00",
                        strokeOpacity: 0.8,
                        strokeWeight: 3,
                        geodesic: true,
                        icons: [
                          {
                            icon: {
                              path: 0, // 0 は CIRCLE に相当
                              fillOpacity: 1,
                              scale: 2,
                            },
                            offset: "0",
                            repeat: "10px",
                          },
                        ],
                      }}
                    />
                  )} */}

                  {/* 次のバス区間 */}
                  {secondLegPoints.length > 0 && (
                    <Polyline
                      path={secondLegPoints}
                      options={{
                        strokeColor: "#0088FF",
                        strokeOpacity: 1.0,
                        strokeWeight: 3,
                        geodesic: true,
                      }}
                    />
                  )}

                  {/* バス停のマーカー */}
                  {firstLegStops.length > 0 && (
                    <Marker
                      key={`first-start-${firstLegStops[0].stop_id}`}
                      position={{
                        lat: firstLegStops[0].location.stop_lat,
                        lng: firstLegStops[0].location.stop_lon,
                      }}
                      title={firstLegStops[0].stop_name}
                    />
                  )}

                  {/* 乗り継ぎがある場合の第1区間終点と第2区間始点 */}
                  {secondLegStops.length > 0 ? (
                    <>
                      <Marker
                        key={`first-end-${firstLegStops[firstLegStops.length - 1].stop_id}`}
                        position={{
                          lat: firstLegStops[firstLegStops.length - 1].location
                            .stop_lat,
                          lng: firstLegStops[firstLegStops.length - 1].location
                            .stop_lon,
                        }}
                        title={
                          firstLegStops[firstLegStops.length - 1].stop_name
                        }
                      />
                      <Marker
                        key={`second-start-${secondLegStops[0].stop_id}`}
                        position={{
                          lat: secondLegStops[0].location.stop_lat,
                          lng: secondLegStops[0].location.stop_lon,
                        }}
                        title={secondLegStops[0].stop_name}
                      />
                    </>
                  ) : null}

                  {/* 最終目的地のマーカー */}
                  {secondLegStops.length > 0 ? (
                    <Marker
                      key={`second-end-${secondLegStops[secondLegStops.length - 1].stop_id}`}
                      position={{
                        lat: secondLegStops[secondLegStops.length - 1].location
                          .stop_lat,
                        lng: secondLegStops[secondLegStops.length - 1].location
                          .stop_lon,
                      }}
                      title={
                        secondLegStops[secondLegStops.length - 1].stop_name
                      }
                    />
                  ) : (
                    firstLegStops.length > 0 && (
                      <Marker
                        key={`first-end-${firstLegStops[firstLegStops.length - 1].stop_id}`}
                        position={{
                          lat: firstLegStops[firstLegStops.length - 1].location
                            .stop_lat,
                          lng: firstLegStops[firstLegStops.length - 1].location
                            .stop_lon,
                        }}
                        title={
                          firstLegStops[firstLegStops.length - 1].stop_name
                        }
                      />
                    )
                  )}
                </GoogleMap>
              </LoadScript>
            </View>
          </>
        );
      } else {
        // モバイル表示（変更なし）
        return (
          <>
            <Text style={styles.resultsTitle}>検索結果</Text>
            <View>
              <View style={styles.mobileResultsContainer}>
                <FlatList
                  data={detailedSearchResults.slice(0, 3)}
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
    return null;
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
                <WebDepartureAutocomplete
                  onSelect={setDeparture}
                  value={departure}
                />
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
                <WebArrivalAutocomplete onSelect={setArrival} value={arrival} />
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
            <DepartureAutocomplete onSelect={setDeparture} value={departure} />
            <TouchableOpacity
              style={styles.swapButton}
              onPress={swapDepartureArrival}
            >
              <Ionicons name="swap-vertical" size={24} color="#007AFF" />
            </TouchableOpacity>
            <ArrivalAutocomplete onSelect={setArrival} value={arrival} />
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
