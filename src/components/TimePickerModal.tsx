import { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

interface TimePickerModalProps {
  visible: boolean;
  hour: number;
  minute: number;
  onConfirm: (hour: number, minute: number) => void;
  onDismiss: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function TimePickerModal({ visible, hour, minute, onConfirm, onDismiss }: TimePickerModalProps) {
  const theme = useTheme();
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(
    MINUTES.includes(minute) ? minute : 0,
  );

  const handleConfirm = useCallback(() => {
    onConfirm(selectedHour, selectedMinute);
  }, [selectedHour, selectedMinute, onConfirm]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <Text style={styles.title} variant="titleLarge">Set reminder time</Text>

          <View style={styles.pickers}>
            {/* Hour picker */}
            <View style={styles.pickerCol}>
              <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelMedium">HOUR</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setSelectedHour(h)}
                    style={[
                      styles.item,
                      selectedHour === h && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <Text
                      style={selectedHour === h ? { color: theme.colors.primary, fontWeight: '800' } : { color: theme.colors.onSurface }}
                      variant="titleMedium"
                    >
                      {pad(h)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={[styles.colon, { color: theme.colors.onSurface }]} variant="headlineMedium">:</Text>

            {/* Minute picker */}
            <View style={styles.pickerCol}>
              <Text style={{ color: theme.colors.onSurfaceVariant }} variant="labelMedium">MIN</Text>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelectedMinute(m)}
                    style={[
                      styles.item,
                      selectedMinute === m && { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <Text
                      style={selectedMinute === m ? { color: theme.colors.primary, fontWeight: '800' } : { color: theme.colors.onSurface }}
                      variant="titleMedium"
                    >
                      {pad(m)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onDismiss}>Cancel</Button>
            <Button mode="contained" onPress={handleConfirm}>Set time</Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 16 },
  backdrop: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'center', padding: 32 },
  colon: { alignSelf: 'center', marginTop: 20, paddingHorizontal: 8 },
  item: { alignItems: 'center', borderRadius: 10, marginVertical: 2, paddingHorizontal: 20, paddingVertical: 10 },
  pickerCol: { alignItems: 'center', flex: 1, gap: 8 },
  pickers: { flexDirection: 'row', marginVertical: 16 },
  scroll: { height: 200 },
  sheet: { borderRadius: 28, elevation: 8, padding: 24, width: '100%' },
  title: { fontWeight: '700', textAlign: 'center' },
});
