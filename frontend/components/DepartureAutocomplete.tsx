import React, { useState, useRef, useEffect } from "react";
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

interface DepartureAutocompleteProps {
  onSelect: (stationName: string) => void;
  value: string;
}

const DepartureAutocomplete: React.FC<DepartureAutocompleteProps> = ({
  onSelect,
  value,
}) => {
  const [query, setQuery] = useState(value ||"");
  const [data, setData] = useState<Station[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const handleSelect = (selectedValue: string) => {
    setQuery(selectedValue);
    onSelect(selectedValue);
  };
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
          stopName: stop.stop_name, // デコード処理を削除
          id: String(index + 1), // 1から始まる連番のidを付与
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
    <View style={styles.mainContainer}>
    <View style={styles.container}>
    <View style={styles.inputWrapper}>
      <View style={styles.inputContainer}>
        <Ionicons name="location-outline" size={20} color={"#666"} />
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={onChangeText}
          placeholder="出発地を入力"
          style={styles.input}
          onFocus={() => {
            if (query.length > 0) {
              setShowResults(true);
            }
          }}
        />
      </View>
      </View>
      {showResults && data.length > 0 && (
        <View style={styles.modalOverlay}>
        <View style={styles.resultsContainer}>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            style={styles.resultsList}
          />
        </View>
        </View>
      )}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    marginBottom: 16,
    position: 'relative',
    width: '100%',
    height: 40,
    zIndex: 4000, 
  },
  container: {
    position: "relative",
    width: "100%",
    zIndex: 4000,
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
    zIndex: 4001,
  },
  inputContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    paddingLeft: 8,
    zIndex: 4001,
  },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    zIndex: 4002,
  },
  resultsContainer: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginTop: 1,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultsList: {
    width: "100%",
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

export default DepartureAutocomplete;
