import * as React from 'react';
import { Surface, Text } from 'react-native-paper';
import { View, StyleSheet, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekCalendar({ onDayPress }: { onDayPress: (date: Date) => void }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <Surface style={styles.calendarSurface} elevation={2}>
      <View style={styles.calendarRow}>
        {daysOfWeek.map((day, i) => {
          const isToday = weekDates[i].toDateString() === today.toDateString();
          return (
            <Pressable
              key={day}
              style={({ pressed }) => [styles.dayCell, pressed && { opacity: 0.7 }]}
              onPress={() => onDayPress(weekDates[i])}
            >
              <Text variant="labelSmall" style={{ textAlign: 'center' }}>{day}</Text>
              <Text
                variant="titleMedium"
                style={{
                  textAlign: 'center',
                  color: isToday ? '#BB86FC' : undefined,
                  fontWeight: isToday ? 'bold' : undefined,
                }}
              >
                {weekDates[i].getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  calendarSurface: {
    borderRadius: 16,
    padding: 16,
    margin: 0,
    marginHorizontal: 0,
    alignSelf: 'stretch',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
}); 