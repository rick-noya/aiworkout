import * as React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { MD3DarkTheme } from 'react-native-paper';
import WeekCalendar from './WeekCalendar';
import TodayExercises from './TodayExercises';

export default function MainScreen({ navigation }: { navigation: any }) {
  return (
    <ScrollView style={styles.container}>
      <WeekCalendar navigation={navigation} />
      <TodayExercises navigation={navigation} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
  },
}); 