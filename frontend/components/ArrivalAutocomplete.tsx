import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  FlatList,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Station {
  id: string;
  stopName: string;
}

interface ArrivalAutocompleteProps {
  onSelect?: (stationName: string) => void;
}

const ArrivalAutocomplete: React.FC<ArrivalAutocompleteProps> = ({
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Station[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // APIからのデータ取得をシミュレート
  const fetchStations = async (text: string): Promise<Station[]> => {
    if (text.length < 2) return [];
    try {
      //qに入力値が入る
      const response = await fetch(
        "http://153.127.67.155:8001/backend/stops/search/?q=" + text,
        {
          method: "GET",
          mode: "cors",
        }
      );
      //json形式に変換
      const data = await response.json();

      //json形式を整形
      // 最大10件に制限して返す
      return data.stops
        .slice(0, 3)
        .map((stop: { stop_name: string }, index: number) => ({
          stopName: stop.stop_name,
          id: String(index + 1),
        }));
    } catch (error) {
      console.error("Error fetching stations:", error);
      return [];
    }
  };

  const onChangeText = async (text: string) => {
    setQuery(text);
    if (text.length > 0) {
      const results = await fetchStations(text);
      setData(results);
      setShowResults(true);
    } else {
      setData([]);
      setShowResults(false);
    }
  };

  const renderItem = ({ item }: { item: Station }) => (
    <TouchableOpacity
      onPress={() => {
        setQuery(item.stopName);
        if (onSelect) {
          onSelect(item.stopName);
        }
        setShowResults(false);
        setData([]);
        inputRef.current?.blur();
      }}
      style={styles.suggestionItem}
    >
      <Ionicons name="location-outline" size={20} color="#666" />
      <Text style={styles.suggestionText}>{item.stopName}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Ionicons name="location-outline" size={20} color={"#666"} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChangeText}
          placeholder="到着地を入力"
          style={styles.input}
          onFocus={() => {
            if (query.length > 0) {
              setShowResults(true);
            }
          }}
        />
      </View>
      {showResults && data.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  input: {
    height: 40,
    paddingHorizontal: 8,
    width: "100%",
  },
  resultsContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginTop: 1,
    maxHeight: 100,
    zIndex: 9999,
    
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
});

export default ArrivalAutocomplete;
