import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { MD3DarkTheme } from 'react-native-paper';
import WeekCalendar from './WeekCalendar';

export default function MainScreen({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <WeekCalendar navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 