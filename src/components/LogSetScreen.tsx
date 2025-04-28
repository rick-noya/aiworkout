import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, Button, MD3DarkTheme, List, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function LogSetScreen({ route, navigation }: { route: any; navigation: any }) {
  const { exercise, date } = route.params;
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Find or create a workout for this date (for now, use date as unique key)
  const [workoutId, setWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrCreateWorkout = async () => {
      setLoading(true);
      setError(null);
      // Try to find a workout for this date
      const { data: workouts, error: workoutError } = await supabase
        .from('workouts')
        .select('id, created_at')
        .eq('created_at', date);
      if (workoutError) {
        setError('Failed to fetch workout');
        setLoading(false);
        return;
      }
      let workout_id = workouts && workouts.length > 0 ? workouts[0].id : null;
      // If not found, create one
      if (!workout_id) {
        const { data: newWorkout, error: createError } = await supabase
          .from('workouts')
          .insert([{ created_at: date }])
          .select();
        if (createError || !newWorkout || newWorkout.length === 0) {
          setError('Failed to create workout');
          setLoading(false);
          return;
        }
        workout_id = newWorkout[0].id;
      }
      setWorkoutId(workout_id);
      setLoading(false);
    };
    fetchOrCreateWorkout();
  }, [date]);

  useEffect(() => {
    if (!workoutId) return;
    const fetchSets = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('sets')
        .select('id, reps, weight_kg, rpe, created_at')
        .eq('workout_id', workoutId)
        .eq('exercise_id', exercise.id)
        .order('created_at', { ascending: false });
      if (error) {
        setError('Failed to fetch sets');
        setSets([]);
      } else {
        setSets(data || []);
      }
      setLoading(false);
    };
    fetchSets();
  }, [workoutId, exercise.id]);

  const handleAddSet = async () => {
    if (!workoutId || !reps || !weight) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.from('sets').insert([
      {
        id: uuidv4(),
        workout_id: workoutId,
        exercise_id: exercise.id,
        reps: parseInt(reps, 10),
        weight_kg: parseFloat(weight),
        rpe: rpe ? parseFloat(rpe) : null,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      setError('Failed to add set');
    } else {
      setReps('');
      setWeight('');
      setRpe('');
      // Refresh sets
      const { data } = await supabase
        .from('sets')
        .select('id, reps, weight_kg, rpe, created_at')
        .eq('workout_id', workoutId)
        .eq('exercise_id', exercise.id)
        .order('created_at', { ascending: false });
      setSets(data || []);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>{exercise.name}</Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#BB86FC' }}>{date}</Text>
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>Log a Set</Text>
      <TextInput
        label="Reps"
        value={reps}
        onChangeText={setReps}
        keyboardType="numeric"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
        style={{ marginBottom: 8 }}
      />
      <TextInput
        label="RPE (optional)"
        value={rpe}
        onChangeText={setRpe}
        keyboardType="numeric"
        style={{ marginBottom: 8 }}
      />
      <Button mode="contained" onPress={handleAddSet} disabled={loading || !reps || !weight} style={{ marginBottom: 16 }}>
        Add Set
      </Button>
      {loading && <ActivityIndicator animating={true} style={{ marginBottom: 16 }} />}
      {error && <Text style={{ color: 'red', marginBottom: 16 }}>{error}</Text>}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>Logged Sets</Text>
      <FlatList
        data={sets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={`Reps: ${item.reps}, Weight: ${item.weight_kg}kg${item.rpe ? `, RPE: ${item.rpe}` : ''}`}
            description={item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
            left={props => <List.Icon {...props} icon="check" />}
          />
        )}
        ListEmptyComponent={<Text>No sets logged yet.</Text>}
      />
      <Button mode="outlined" style={{ marginTop: 24 }} onPress={() => navigation.goBack()}>
        Back
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
    padding: 24,
    alignItems: 'stretch',
  },
}); 