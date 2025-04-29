import * as React from 'react';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator, MD3DarkTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';

export default function CreateWorkoutScreen({ route, navigation }: { route: any; navigation: any }) {
  const { date } = route.params;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkout = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual user ID from auth context if available
      const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
      const user_id = user ? user.id : null;
      if (!user_id) {
        setError('User not logged in.');
        setLoading(false);
        console.error('CreateWorkoutScreen: No user_id found.');
        return;
      }
      console.log('CreateWorkoutScreen: Creating workout for', { user_id, date });
      const { data, error: insertError } = await supabase
        .from('workouts')
        .insert([{ user_id, scheduled_date: date }])
        .select();
      if (insertError) {
        setError('Failed to create workout.');
        setLoading(false);
        console.error('CreateWorkoutScreen: Insert error', insertError);
        return;
      }
      console.log('CreateWorkoutScreen: Workout created', data);
      navigation.replace('ExerciseSelect', { date });
    } catch (err) {
      setError('Unexpected error creating workout.');
      setLoading(false);
      console.error('CreateWorkoutScreen: Unexpected error', err);
      return;
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Create Workout</Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#BB86FC' }}>{date}</Text>
      <Button mode="contained" onPress={handleCreateWorkout} disabled={loading} style={{ marginBottom: 16 }}>
        Create Workout
      </Button>
      {loading && <ActivityIndicator animating={true} style={{ marginBottom: 16 }} />}
      {error && <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>}
      <Button mode="outlined" onPress={() => navigation.goBack()}>
        Cancel
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 