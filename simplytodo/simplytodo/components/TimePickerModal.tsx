import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (time: string) => void;
  initialTime?: string;
  title: string;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onSave,
  initialTime = "09:00",
  title
}) => {
  const [selectedHour, setSelectedHour] = useState(
    parseInt(initialTime.split(':')[0])
  );
  const [selectedMinute, setSelectedMinute] = useState(
    parseInt(initialTime.split(':')[1])
  );

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSave = () => {
    const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onSave(formattedTime);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Time Display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>
              {selectedHour.toString().padStart(2, '0')}:
              {selectedMinute.toString().padStart(2, '0')}
            </Text>
          </View>

          {/* Time Pickers */}
          <View style={styles.pickersContainer}>
            {/* Hour Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>시</Text>
              <ScrollView
                style={styles.picker}
                contentContainerStyle={styles.pickerContent}
                showsVerticalScrollIndicator={false}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      selectedHour === hour && styles.selectedPickerItem
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedHour === hour && styles.selectedPickerItemText
                      ]}
                    >
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Separator */}
            <View style={styles.separator}>
              <Text style={styles.separatorText}>:</Text>
            </View>

            {/* Minute Picker */}
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>분</Text>
              <ScrollView
                style={styles.picker}
                contentContainerStyle={styles.pickerContent}
                showsVerticalScrollIndicator={false}
              >
                {minutes.filter(m => m % 5 === 0).map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.pickerItem,
                      selectedMinute === minute && styles.selectedPickerItem
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        selectedMinute === minute && styles.selectedPickerItemText
                      ]}
                    >
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Quick Time Presets */}
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsTitle}>빠른 설정</Text>
            <View style={styles.presetsGrid}>
              {[
                { label: '오전 7시', time: '07:00' },
                { label: '오전 9시', time: '09:00' },
                { label: '오후 12시', time: '12:00' },
                { label: '오후 2시', time: '14:00' },
                { label: '오후 6시', time: '18:00' },
                { label: '오후 8시', time: '20:00' },
              ].map((preset) => (
                <TouchableOpacity
                  key={preset.time}
                  style={styles.presetButton}
                  onPress={() => {
                    const [hour, minute] = preset.time.split(':').map(Number);
                    setSelectedHour(hour);
                    setSelectedMinute(minute);
                  }}
                >
                  <Text style={styles.presetButtonText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  timeText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#000',
    fontVariant: ['tabular-nums'],
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  pickerColumn: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
  },
  picker: {
    height: 200,
    width: 80,
  },
  pickerContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#4CAF50',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  selectedPickerItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  separator: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  separatorText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#333',
  },
  presetsContainer: {
    marginTop: 20,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  presetButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});