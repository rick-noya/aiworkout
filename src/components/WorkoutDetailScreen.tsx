import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, MD3DarkTheme, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useUnits } from './UnitsContext';

export default function WorkoutDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { workoutId, date } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const { units, loading: unitsLoading } = useUnits();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    console.log('WorkoutDetailScreen: units context', { units, unitsLoading });
  }, [units, unitsLoading]);

  useEffect(() => {
    const fetchWorkoutExercises = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('workout_exercises')
          .select('exercise_id, target_reps_min, target_reps_max, target_weight, target_rpe, exercises(name)')
          .eq('workout_id', workoutId);
        if (fetchError) {
          setError('Failed to fetch workout exercises.');
          setLoading(false);
          console.error('WorkoutDetailScreen: Fetch error', fetchError);
          return;
        }
        setExercises(data || []);
        console.log('WorkoutDetailScreen: Loaded exercises', data);
      } catch (err) {
        setError('Unexpected error loading workout exercises.');
        console.error('WorkoutDetailScreen: Unexpected error', err);
      }
      setLoading(false);
    };
    fetchWorkoutExercises();
  }, [workoutId]);

  const handleDeleteWorkout = async () => {
    setDeleting(true);
    try {
      // Delete the workout and all related workout_exercises and sets
      await supabase.from('workout_exercises').delete().eq('workout_id', workoutId);
      await supabase.from('sets').delete().eq('workout_id', workoutId);
      const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
      if (error) {
        console.error('WorkoutDetailScreen: Failed to delete workout', error);
      } else {
        console.log('WorkoutDetailScreen: Workout deleted', workoutId);
        navigation.goBack();
      }
    } catch (err) {
      console.error('WorkoutDetailScreen: Unexpected error deleting workout', err);
    }
    setDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Workout Details</Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#BB86FC' }}>{date}</Text>
      <Button mode="contained" style={{ marginBottom: 16 }} onPress={() => {
        // Prepare selectedExercises and exerciseTargets for edit mode
        const selectedExercises = exercises.map(e => ({ id: e.exercise_id, name: e.exercises?.name || e.exercise_id }));
        const exerciseTargets: Record<string, any> = {};
        exercises.forEach(e => {
          exerciseTargets[e.exercise_id] = {
            target_reps_min: e.target_reps_min?.toString() || '',
            target_reps_max: e.target_reps_max?.toString() || '',
            target_weight: e.target_weight?.toString() || '',
            target_rpe_min: e.target_rpe_min?.toString() || '',
            target_rpe_max: e.target_rpe_max?.toString() || '',
          };
        });
        navigation.navigate('ExerciseSelect', {
          date,
          workoutId,
          editMode: true,
          selectedExercises,
          exerciseTargets,
        });
      }}>
        Edit Workout
      </Button>
      {loading ? (
        <ActivityIndicator animating={true} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={item => item.exercise_id}
          renderItem={({ item }) => (
            <View style={styles.exerciseRow}>
              <Text style={{ fontWeight: 'bold' }}>{item.exercises?.name || item.exercise_id}</Text>
              <Text>Reps: {item.target_reps_min} - {item.target_reps_max}</Text>
              <Text>Weight: {units === 'lb' ? (parseFloat(item.target_weight) / 0.45359237).toFixed(1) : item.target_weight} {units}</Text>
              <Text>Target RPE: {item.target_rpe}</Text>
              <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => navigation.navigate('LogSet', { workoutId, exercise: { id: item.exercise_id, name: item.exercises?.name }, date })}>
                Log Sets
              </Button>
            </View>
          )}
          ListEmptyComponent={<Text>No exercises in this workout.</Text>}
        />
      )}
      <Button mode="outlined" style={{ marginTop: 24 }} onPress={() => navigation.goBack()}>
        Back
      </Button>
      <Button mode="contained" style={{ marginTop: 8, backgroundColor: 'red' }} onPress={() => setShowDeleteDialog(true)}>
        Delete Workout
      </Button>
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Workout</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this workout? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteWorkout} loading={deleting} color="red">Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
    padding: 24,
    alignItems: 'center',
  },
  exerciseRow: {
    marginBottom: 16,
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 12,
    width: 300,
  },
}); 