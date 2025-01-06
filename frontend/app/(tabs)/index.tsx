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
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import Constants from "expo-constants";
import axios from "axios";
import DepartureAutocomplete from "@/components/DepartureAutocomplete";
import ArrivalAutocomplete from "@/components/ArrivalAutocomplete";

// Types
interface SearchParams {
departure: string;
arrival: string;
date: string;
time: string;
isArrivalTime: boolean;
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
? "https://あなたの本番ドメイン.com/api"
: "http://localhost:8081";

// const fetchSearchResults = async (
//   params: SearchParams
// ): Promise<DetailedSearchResult[]> => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/search`, params);
//     return response.data;
//   } catch (error) {
//     console.error("API request failed:", error);
//     throw new Error("検索結果の取得に失敗しました");
//   }
// };

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
const [isDepartureFocused, setIsDepartureFocused] = useState(false);
const [isArrivalFocused, setIsArrivalFocused] = useState(false);

useEffect(() => {
const fetchData = async () => {
try {
// バックエンドのURLがポート8000で起動していると仮定
const response = await axios.get("http://localhost:8000/api/get-data/");
setDate(response.data.message);
} catch (error) {
console.error("Error fetching data:", error);
}
};

fetchData();
}, []);

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

const handleSearch = async () => {
setIsSearching(true);
setDetailedSearchResults([]);

try {
await new Promise((resolve) => setTimeout(resolve, 2000));

const mockDetailedResults: DetailedSearchResult[] = [
{
id: "1",
totalDuration: "11時間35分",
totalPrice: "14,300",
departureTime: "19:00",
arrivalTime: "06:35",
videoUrl: "../../assets/videos/harbis_osaka.mp4",
segments: [
// {
//   id: "1-1",
//   from: "出発駅",
//   to: "到着駅",
//   type: "bus",
//   duration: "40分",
//   price: "500",
//   lineName: "山手線",
//   departureTime: "10:00",
//   arrivalTime: "10:40",
// },
// {
//   id: "1-2",
//   from: "乗換駅",
//   to: "到着駅",
//   type: "bus",
//   duration: "35分",
//   price: "500",
//   lineName: "急行バス",
//   departureTime: "10:40",
//   arrivalTime: "11:15",
// },
{
id: "1-1",
from: "徳島駅前",
to: "大阪（阪神三番街）",
type: "bus",
duration: "2時間25分",
price: "4,100",
lineName: "鳴門徳島大阪線",
departureTime: "19:00",
arrivalTime: "21:25",
},
{
id: "1-2",
from: "大阪（阪神三番街）",
to: "ハービス大阪",
type: "walk",
duration: "12分",
distance: "850m",
price: "0",
departureTime: "21:25",
arrivalTime: "22:37",
videoUrl: "../../assets/videos/harbis_osaka.mp4",
},
{
id: "1-3",
from: "ハービス大阪",
to: "バスターミナル東京八重洲",
type: "bus",
duration: "7時間30分",
price: "10,200",
departureTime: "21:37",
arrivalTime: "06:35",
},
],
},
{
id: "2",
totalDuration: "9時間30分",
totalPrice: "9640",
departureTime: "20:30",
arrivalTime: "6:15",
segments: [
{
id: "2-1",
from: "徳島駅前",
to: "阪神三宮",
type: "bus",
duration: "2時間",
price: "3040",
lineName: "阪神線",
departureTime: "20:30",
arrivalTime: "22:30",
},
{
id: "2-2",
from: "阪神三宮",
to: "神戸三宮",
type: "walk",
duration: "1分",
distance: "140m",
price: "0",
departureTime: "22:30",
arrivalTime: "22:31",
},
{
id: "2-3",
from: "神戸三宮",
to: "HEARTSバスステーション博多",
type: "bus",
duration: "7時間30分",
price: "6600",
departureTime: "22:45",
arrivalTime: "6:15",
},
],
},
{
id: "3",
totalDuration: "40分",
totalPrice: "800",
departureTime: "10:25",
arrivalTime: "11:05",
segments: [
{
id: "3-1",
from: "出発駅",
to: "中間駅",
type: "train",
duration: "40分",
price: "600",
lineName: "山手線",
departureTime: "10:25",
arrivalTime: "11:05",
},
// {
//   id: "2-2",
//   from: "中間駅",
//   to: "到着駅",
//   type: "walk",
//   duration: "40分",
//   distance: "3km",
//   price: "200",
//   departureTime: "11:05",
//   arrivalTime: "11:45",
// },
],
},
];

setDetailedSearchResults(mockDetailedResults);

const searchParams: SearchParams = {
departure,
arrival,
date: date.toISOString().split("T")[0],
time: date.toLocaleTimeString("ja-JP", {
hour: "2-digit",
minute: "2-digit",
}),
isArrivalTime,
};

// const results = await fetchSearchResults(searchParams);
// setDetailedSearchResults(results);
} catch (error) {
console.error("検索に失敗しました:", error);
alert("検索中にエラーが発生しました。もう一度お試しください。");
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
setArrival(temp);
};

const containerStyle = {};

// 初期表示位置（駅）
const center = {
lat: 34.0744223,
lng: 134.5514588,
};

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";
  console.log(GOOGLE_MAPS_API_KEY);

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
center={center}
zoom={15}
/>
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
<View
style={[
styles.webDeparture,
isDepartureFocused && styles.focusedInput,
]}
>
<Ionicons name="location-outline" size={20} color={"#666"} />
<TextInput
style={styles.input}
placeholder="出発地を入力"
placeholderTextColor={placeholderColor}
value={departure}
onChangeText={setDeparture}
onFocus={() => setIsDepartureFocused(true)}
onBlur={() => setIsDepartureFocused(false)}
/>
</View>
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

<View
style={[
styles.webinputContainer,
isArrivalFocused && styles.focusedInput,
]}
>
<Ionicons name="flag-outline" size={20} color={"#666"} />
<TextInput
style={styles.input}
placeholder="到着地を入力"
placeholderTextColor={placeholderColor}
value={arrival}
onChangeText={setArrival}
onFocus={() => setIsArrivalFocused(true)}
onBlur={() => setIsArrivalFocused(false)}
/>
</View>
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
<DepartureAutocomplete />
<TouchableOpacity
style={styles.swapButton}
onPress={swapDepartureArrival}
>
<Ionicons name="swap-vertical" size={24} color="#007AFF" />
</TouchableOpacity>
<ArrivalAutocomplete />
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
...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
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
display: "flex",
width: "100%",
...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
alignItems: "center",
}),
},
locationInputsContainer: {
flexDirection: "row",
alignItems: "center",
marginBottom: 12,
...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
justifyContent: "center",
width: "100%",
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
row: {
  flexDirection: "row",
  marginBottom: 12,
  ...(Platform.OS === "web" && window.innerWidth <= 768 ? {
    gap: 8,
  } : {
    justifyContent: "center",
    width: "100%",
  }),
},
inputWrapper: {
flex: 1,
...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
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
width: "100%",
backgroundColor: "white",
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