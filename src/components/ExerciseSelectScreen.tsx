import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, List, Button, MD3DarkTheme, ActivityIndicator, IconButton, TextInput } from 'react-native-paper';
import { supabase } from '../lib/supabase';

export default function ExerciseSelectScreen({ route, navigation }: { route: any; navigation: any }) {
  const { date, workoutId: navWorkoutId, editMode, selectedExercises: navSelectedExercises, exerciseTargets: navExerciseTargets } = route.params;
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(navWorkoutId || null);
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string }[]>(navSelectedExercises || []);
  const [exerciseTargets, setExerciseTargets] = useState<Record<string, any>>(navExerciseTargets || {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAllExercises = async () => {
      const { data: exercisesData, error: exercisesError } = await supabase.from('exercises').select('id, name');
      if (exercisesError) {
        setError('Failed to load exercises');
        setExercises([]);
        console.error('ExerciseSelectScreen: Exercises fetch error', exercisesError);
      } else {
        setExercises(exercisesData || []);
        console.log('ExerciseSelectScreen: Loaded exercises', exercisesData);
      }
    };
    if (editMode) {
      setWorkoutId(navWorkoutId || null);
      setSelectedExercises(navSelectedExercises || []);
      setExerciseTargets(navExerciseTargets || {});
      fetchAllExercises();
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch workout for this date and user
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        const user_id = user ? user.id : null;
        if (!user_id) {
          setError('User not logged in.');
          setLoading(false);
          console.error('ExerciseSelectScreen: No user_id found.');
          return;
        }
        const { data: workouts, error: workoutError } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user_id)
          .eq('scheduled_date', date);
        if (workoutError) {
          setError('Failed to fetch workout.');
          setLoading(false);
          console.error('ExerciseSelectScreen: Workout fetch error', workoutError);
          return;
        }
        if (!workouts || workouts.length === 0) {
          setError('No workout found for this date.');
          setLoading(false);
          console.error('ExerciseSelectScreen: No workout found for date', date);
          return;
        }
        setWorkoutId(workouts[0].id);
        console.log('ExerciseSelectScreen: Found workout', workouts[0].id);
        // Fetch exercises
        const { data: exercisesData, error: exercisesError } = await supabase.from('exercises').select('id, name');
        if (exercisesError) {
          setError('Failed to load exercises');
          setExercises([]);
          console.error('ExerciseSelectScreen: Exercises fetch error', exercisesError);
        } else {
          setExercises(exercisesData || []);
          console.log('ExerciseSelectScreen: Loaded exercises', exercisesData);
        }
      } catch (err) {
        setError('Unexpected error loading data.');
        console.error('ExerciseSelectScreen: Unexpected error', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [date]);

  const toggleExercise = (exercise: { id: string; name: string }) => {
    setSelectedExercises((prev) => {
      const exists = prev.find((ex) => ex.id === exercise.id);
      if (exists) {
        // Remove targets for deselected exercise
        setExerciseTargets((targets) => {
          const newTargets = { ...targets };
          delete newTargets[exercise.id];
          return newTargets;
        });
        console.log('ExerciseSelectScreen: Deselecting exercise', exercise);
        return prev.filter((ex) => ex.id !== exercise.id);
      } else {
        // Add default targets for new exercise
        setExerciseTargets((targets) => ({
          ...targets,
          [exercise.id]: {
            target_reps_min: '',
            target_reps_max: '',
            target_weight: '',
            target_rpe_min: '',
            target_rpe_max: '',
          },
        }));
        console.log('ExerciseSelectScreen: Selecting exercise', exercise);
        return [...prev, exercise];
      }
    });
  };

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
    setExerciseTargets((targets) => {
      const newTargets = { ...targets };
      delete newTargets[exerciseId];
      return newTargets;
    });
    console.log('ExerciseSelectScreen: Removed exercise', exerciseId);
  };

  const handleTargetChange = (exerciseId: string, field: string, value: string) => {
    setExerciseTargets((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
      },
    }));
  };

  const handleEditTargets = (exercise: { id: string; name: string }) => {
    navigation.navigate('EditTargets', {
      exercise,
      targets: exerciseTargets[exercise.id] || {},
      onSave: (updatedTargets: any) => {
        setExerciseTargets((prev) => ({
          ...prev,
          [exercise.id]: updatedTargets,
        }));
      },
    });
  };

  const handleSaveWorkout = async () => {
    if (!workoutId) {
      setError('No workout found for this date.');
      console.error('ExerciseSelectScreen: No workoutId on save');
      return;
    }
    if (selectedExercises.length === 0) {
      setError('Please select at least one exercise.');
      return;
    }
    if (editMode) {
      setSaving(true);
      setError(null);
      try {
        // Delete old workout_exercises for this workout
        await supabase.from('workout_exercises').delete().eq('workout_id', workoutId);
        // Insert new
        const inserts = selectedExercises.map((exercise) => {
          const t = exerciseTargets[exercise.id] || {};
          return {
            workout_id: workoutId,
            exercise_id: exercise.id,
            target_reps_min: t.target_reps_min ? parseInt(t.target_reps_min, 10) : null,
            target_reps_max: t.target_reps_max ? parseInt(t.target_reps_max, 10) : null,
            target_weight: t.target_weight ? parseFloat(t.target_weight) : null,
            target_rpe_min: t.target_rpe_min ? parseFloat(t.target_rpe_min) : null,
            target_rpe_max: t.target_rpe_max ? parseFloat(t.target_rpe_max) : null,
          };
        });
        console.log('ExerciseSelectScreen: Updating workout_exercises', inserts);
        const { error: insertError } = await supabase.from('workout_exercises').insert(inserts);
        if (insertError) {
          setError('Failed to update workout exercises.');
          setSaving(false);
          console.error('ExerciseSelectScreen: Insert error', insertError);
          return;
        }
        console.log('ExerciseSelectScreen: Successfully updated workout_exercises');
        navigation.replace('WorkoutDetail', { workoutId, date });
      } catch (err) {
        setError('Unexpected error updating workout exercises.');
        setSaving(false);
        console.error('ExerciseSelectScreen: Unexpected error', err);
        return;
      }
      setSaving(false);
      return;
    }
    navigation.navigate('WorkoutSummary', {
      selectedExercises,
      exerciseTargets,
      workoutId,
      date,
    });
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Select Exercises</Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#BB86FC' }}>{date}</Text>
      {loading ? (
        <ActivityIndicator animating={true} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>
      ) : (
        <>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Available Exercises</Text>
          {exercises.map((exercise) => {
            const selected = selectedExercises.some((ex) => ex.id === exercise.id);
            return (
              <List.Item
                key={exercise.id}
                title={exercise.name}
                left={props => <List.Icon {...props} icon={selected ? 'check-circle' : 'dumbbell'} color={selected ? '#4CAF50' : undefined} />}
                onPress={() => toggleExercise(exercise)}
                style={selected ? { backgroundColor: '#232323' } : undefined}
              />
            );
          })}
          <Text variant="titleMedium" style={{ marginTop: 24, marginBottom: 8 }}>Selected Exercises & Targets</Text>
          <FlatList
            data={selectedExercises}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.selectedExerciseRow}>
                <Text style={{ flex: 1 }}>{item.name}</Text>
                <IconButton icon="close" onPress={() => removeExercise(item.id)} accessibilityLabel="Remove exercise" />
                <Button mode="outlined" onPress={() => handleEditTargets(item)} style={{ marginLeft: 8 }}>
                  Edit Targets
                </Button>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: '#888' }}>No exercises selected.</Text>}
          />
          <Button mode="contained" style={{ marginTop: 24 }} onPress={handleSaveWorkout} loading={saving} disabled={saving}>
            Save Workout
          </Button>
        </>
      )}
      <Button mode="outlined" style={{ marginTop: 24 }} onPress={() => navigation.goBack()}>
        Back to Calendar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  exerciseContainer: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
    padding: 24,
    alignItems: 'center',
  },
  selectedExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 4,
    width: 340,
  },
  targetInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginLeft: 8,
  },
  targetInput: {
    width: 70,
    marginHorizontal: 2,
    backgroundColor: '#232323',
  },
}); 