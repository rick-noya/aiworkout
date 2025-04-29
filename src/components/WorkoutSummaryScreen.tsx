import * as React from 'react';
import { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Button, MD3DarkTheme, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../lib/supabase';

export default function WorkoutSummaryScreen({ route, navigation }: { route: any; navigation: any }) {
  const { selectedExercises, exerciseTargets, workoutId, date } = route.params;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);
    try {
      const inserts = selectedExercises.map((exercise: any) => {
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
      console.log('WorkoutSummaryScreen: Saving workout_exercises', inserts);
      const { error: insertError } = await supabase.from('workout_exercises').insert(inserts);
      if (insertError) {
        setError('Failed to save workout exercises.');
        setSaving(false);
        console.error('WorkoutSummaryScreen: Insert error', insertError);
        return;
      }
      console.log('WorkoutSummaryScreen: Successfully saved workout_exercises');
      navigation.replace('Main');
    } catch (err) {
      setError('Unexpected error saving workout exercises.');
      setSaving(false);
      console.error('WorkoutSummaryScreen: Unexpected error', err);
      return;
    }
    setSaving(false);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Workout Summary</Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#BB86FC' }}>{date}</Text>
      <FlatList
        data={selectedExercises}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const t = exerciseTargets[item.id] || {};
          return (
            <View style={styles.exerciseRow}>
              <Text style={{ fontWeight: 'bold' }}>{item.name}</Text>
              <Text>Reps: {t.target_reps_min} - {t.target_reps_max}</Text>
              <Text>Weight: {t.target_weight} kg</Text>
              <Text>RPE: {t.target_rpe_min} - {t.target_rpe_max}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text>No exercises selected.</Text>}
      />
      {error && <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>}
      <Button mode="contained" style={{ marginTop: 24 }} onPress={handleConfirm} loading={saving} disabled={saving}>
        Confirm & Save
      </Button>
      <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => navigation.goBack()}>
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