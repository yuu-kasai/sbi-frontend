import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

interface CustomTimePickerProps {
  isVisible: boolean;
  onClose: () => void;
  type: "hour" | "minute";
  onSelectTime: (date: Date) => void;
  initialTime: Date;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  isVisible,
  onClose,
  type,
  onSelectTime,
  initialTime,
}) => {
  const [selectedHour, setSelectedHour] = useState(initialTime.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    initialTime.getMinutes()
  );

  const values = Array.from({ length: type === "hour" ? 24 : 60 }, (_, i) => i);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const currentValue =
    type === "hour" ? initialTime.getHours() : initialTime.getMinutes();
  const renderItem = ({
    item,
    type,
  }: {
    item: number;
    type: "hour" | "minute";
  }) => (
    <TouchableOpacity
      style={[
        styles.timeItem,
        (type === "hour" ? selectedHour : selectedMinute) === item &&
          styles.selectedTimeItem,
      ]}
      onPress={() =>
        type === "hour" ? setSelectedHour(item) : setSelectedMinute(item)
      }
    >
      <Text style={styles.timeItemText}>
        {item.toString().padStart(2, "0")}
      </Text>
    </TouchableOpacity>
  );

  const handleConfirm = () => {
    const newDate = new Date(initialTime);
    newDate.setHours(selectedHour, selectedMinute);
    onSelectTime(newDate);
    onClose();
  };

  const handleChange = (value: number) => {
    const newDate = new Date(initialTime);
    if (type === "hour") {
      newDate.setHours(value);
    } else {
      newDate.setMinutes(value);
    }
    onSelectTime(newDate);
  };

  if (Platform.OS === "web") {
    return (
      <select
        value={currentValue}
        onChange={(e) => handleChange(Number(e.target.value))}
        style={webStyles.select}
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {value.toString().padStart(2, "0")}
            {type === "hour" ? "時" : "分"}
          </option>
        ))}
      </select>
    );
  } else {
    return (
      <Modal visible={isVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModalContent}>
            <Text style={styles.modalTitle}>時間を選択</Text>
            <View style={styles.timePickerContainer}>
              <FlatList
                data={hours}
                renderItem={({ item }) => renderItem({ item, type: "hour" })}
                keyExtractor={(item) => `hour-${item}`}
                style={styles.timeList}
              />
              <Text style={styles.timeSeparator}>:</Text>
              <FlatList
                data={minutes}
                renderItem={({ item }) => renderItem({ item, type: "minute" })}
                keyExtractor={(item) => `minute-${item}`}
                style={styles.timeList}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={onClose} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>確定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
};

const webStyles = {
  select: {
    height: "100%",
    border: "none",
    backgroundColor: "transparent",
    paddingLeft: 8,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 8px center",
    backgroundSize: "8px auto",
  } as const,
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
    padding: 0,
  },
  picker: {
    width: "100%",
    height: "100%",
  },
  modalButton: {
    padding: 10,
    minWidth: 80,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    width: "100%",
  },
  timeList: {
    height: 200,
    width: 80,
  },
  timeSeparator: {
    fontSize: 24,
    marginHorizontal: 20,
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    ...(Platform.OS === "web" && {
      justifyContent: "space-between",
      paddingHorizontal: 20,
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },

  timePickerModalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: "90%",
    maxWidth: 350,
    ...(Platform.OS === "web" && {
      minWidth: 300,
      maxWidth: 400,
      width: "95%",
    }),
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  timeItemText: {
    fontSize: 16,
  },
  selectedTimeItem: {
    backgroundColor: "#e6e6e6",
  },
  timeItem: {
    alignItems: "center",
    padding: 10,
  },
});

export default CustomTimePicker;
