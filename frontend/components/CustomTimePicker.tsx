import React, { useState, useEffect } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { Clock } from 'lucide-react';

interface CustomTimePickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectTime: (date: Date) => void;
  initialTime: Date;
  type: "hour" | "minute";
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  isVisible,
  onClose,
  onSelectTime,
  initialTime,
}) => {
  const [selectedHour, setSelectedHour] = useState(initialTime.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    initialTime.getMinutes()
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

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

  useEffect(() => {
    setSelectedHour(initialTime.getHours());
    setSelectedMinute(initialTime.getMinutes());
  }, [initialTime]);


  if (Platform.OS === "web") {
    return (
      <div style={webStyles.container}>
        <div style={webStyles.leftSection}>
          <Clock style={webStyles.icon} />
          <div style={webStyles.separator} />
          <select
            value={selectedHour}
            onChange={(e) => {
              const newHour = Number(e.target.value);
              setSelectedHour(newHour);
              const newDate = new Date(initialTime);
              newDate.setHours(newHour, selectedMinute);
              onSelectTime(newDate);
            }}
            style={webStyles.select}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, "0")}時
              </option>
            ))}
          </select>
        </div>
        <div style={webStyles.minuteContainer}>
          <div style={webStyles.separator} />
          <select
            value={selectedMinute}
            onChange={(e) => {
              const newMinute = Number(e.target.value);
              setSelectedMinute(newMinute);
              const newDate = new Date(initialTime);
              newDate.setHours(selectedHour, newMinute);
              onSelectTime(newDate);
            }}
            style={webStyles.select}
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, "0")}分
              </option>
            ))}
          </select>
        </div>
      </div>
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
  separator: {
    width: '1px' as const,
    height: '20px' as const,
    backgroundColor: '#E5E7EB' as const,
    flexShrink: 0 as const,
    margin: '0 8px' as const,
  },
  select: {
    height: '100%' as const,
    minWidth: '70px' as const,
    backgroundColor: 'transparent' as const,
    border: 'none' as const,
    padding: '0 8px' as const,
    fontSize: '14px' as const,
    color: '#333333' as const,
    cursor: 'pointer' as const,
    outline: 'none' as const,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    textAlign: 'center' as const,
  },
  container: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    height: '40px' as const,
    backgroundColor: 'white' as const,
    border: '1px solid #ccc' as const,
    borderRadius: '4px' as const,
    padding: '0 8px' as const,
  },
  icon: {
    width: '20px' as const,
    height: '20px' as const,
    color: '#9CA3AF' as const,
    marginRight: '8px' as const,
    flexShrink: 0 as const,
  },
  timeContainer: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1 as const,
    gap: '8px' as const,
  },
  leftSection: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    height: '100%' as const,
    flexShrink: 0 as const,
  },
  minuteContainer: {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flex: 1 as const,
  },
 
} as const;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
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
  timeItem: {
    alignItems: "center",
    padding: 10,
  },
  selectedTimeItem: {
    backgroundColor: "#e6e6e6",
  },
  timeItemText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    width: "100%",
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
});

export default CustomTimePicker;