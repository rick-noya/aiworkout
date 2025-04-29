import * as React from 'react';
import { Surface, Text } from 'react-native-paper';
import { View, StyleSheet, Pressable } from 'react-native';
import { supabase } from '../lib/supabase';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeekCalendar({ navigation }: { navigation: any }) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const handleDayPress = async (dateObj: Date) => {
    // Always use ISO string for midnight UTC
    const dateMidnight = new Date(dateObj);
    dateMidnight.setHours(0, 0, 0, 0);
    const dateIso = dateMidnight.toISOString();
    try {
      // Try to find a workout for this date
      const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
      const user_id = user ? user.id : null;
      if (!user_id) {
        console.error('WeekCalendar: No user_id found.');
        navigation.navigate('CreateWorkout', { date: dateIso });
        return;
      }
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user_id)
        .eq('scheduled_date', dateIso);
      if (error) {
        console.error('WeekCalendar: Error fetching workout', error);
        navigation.navigate('CreateWorkout', { date: dateIso });
        return;
      }
      if (workouts && workouts.length > 0) {
        console.log('WeekCalendar: Found workout for date', dateIso, workouts[0].id);
        navigation.navigate('WorkoutDetail', { workoutId: workouts[0].id, date: dateIso });
      } else {
        console.log('WeekCalendar: No workout found for date', dateIso);
        navigation.navigate('CreateWorkout', { date: dateIso });
      }
    } catch (err) {
      console.error('WeekCalendar: Unexpected error', err);
      navigation.navigate('CreateWorkout', { date: dateIso });
    }
  };

  return (
    <Surface style={styles.calendarSurface} elevation={2}>
      <View style={styles.calendarRow}>
        {daysOfWeek.map((day, i) => {
          const isToday = weekDates[i].toDateString() === today.toDateString();
          return (
            <Pressable
              key={day}
              style={({ pressed }) => [styles.dayCell, pressed && { opacity: 0.7 }]}
              onPress={() => handleDayPress(weekDates[i])}
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