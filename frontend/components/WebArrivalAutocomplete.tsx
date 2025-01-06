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
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Station {
  id: string;
  name: string;
}

interface WebArrivalAutocompleteProps {
  onSelect?: (stationName: string) => void;
}

const WebArrivalAutocomplete: React.FC<WebArrivalAutocompleteProps> = ({
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Station[]>([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // APIからのデータ取得をシミュレート
  const fetchStations = async (text: string): Promise<Station[]> => {
    const dummyData: Station[] = [
      { id: "1", name: "徳島駅" },
      { id: "2", name: "鮎喰駅" },
      { id: "3", name: "阿波富田駅" },
      { id: "4", name: "阿波池田駅" },
    ];

    return dummyData.filter((item) =>
      item.name.toLowerCase().includes(text.toLowerCase())
    );
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
        setQuery(item.name);
        if (onSelect) {
          onSelect(item.name);
        }
        setShowResults(false);
        setData([]);
        inputRef.current?.blur();
      }}
      style={styles.suggestionItem}
    >
      <Ionicons name="location-outline" size={20} color="#666" />
      <Text style={styles.suggestionText}>{item.name}</Text>
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
    width: "45%", // コンテナの幅を制限（この値は必要に応じて調整可能）
    alignSelf: "center", // 中央寄せ
  },
  inputContainer: {
    borderColor: "#ccc",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 4,
    height: 40,
    paddingLeft: 8,
    ...(!(Platform.OS === "web" && window.innerWidth <= 768) && {
      flex: 1,
      maxWidth: "100%",
    }),
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
    maxHeight: 200,
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

export default WebArrivalAutocomplete;
