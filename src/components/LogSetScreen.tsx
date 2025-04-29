import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, TextInput, Button, MD3DarkTheme, List, ActivityIndicator, Dialog, Portal } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useUnits } from './UnitsContext';

export default function LogSetScreen({ route, navigation }: { route: any; navigation: any }) {
  const { exercise, date, workoutId: navWorkoutId } = route.params;
  const [reps, setReps] = useState('');
  const [partialReps, setPartialReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [loading, setLoading] = useState(false);
  const [sets, setSets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(navWorkoutId || null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editReps, setEditReps] = useState('');
  const [editPartialReps, setEditPartialReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editRpe, setEditRpe] = useState('');
  const [rpeError, setRpeError] = useState<string | null>(null);
  const [editRpeError, setEditRpeError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [setIdToDelete, setSetIdToDelete] = useState<string | null>(null);
  const { units, setUnits, loading: unitsLoading } = useUnits();

  React.useEffect(() => {
    console.log('LogSetScreen: units context', { units, unitsLoading });
  }, [units, unitsLoading]);

  useEffect(() => {
    if (navWorkoutId) {
      setWorkoutId(navWorkoutId);
      return;
    }
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
  }, [date, navWorkoutId]);

  useEffect(() => {
    if (!workoutId) return;
    const fetchSets = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('sets')
        .select('id, reps, partial_reps, weight_kg, rpe, created_at')
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

  const validateRpe = (value: string) => {
    if (!value) return null;
    const n = Number(value);
    if (!Number.isInteger(n)) return 'RPE must be a whole number';
    return null;
  };

  const handleAddSet = async () => {
    setRpeError(null);
    if (!workoutId || !reps || !weight) return;
    if (rpe) {
      const err = validateRpe(rpe);
      if (err) {
        setRpeError(err);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const repsInt = parseInt(reps, 10);
      const partialRepsInt = partialReps ? parseInt(partialReps, 10) : 0;
      const weightFloat = parseFloat(weight);
      const weightKg = units === 'lb' ? weightFloat * 0.45359237 : weightFloat;
      console.log('LogSetScreen: Saving set with weight', { input: weight, units, weightKg });
      const rpeInt = rpe ? parseInt(rpe, 10) : null;
      const { error } = await supabase.from('sets').insert([
        {
          workout_id: workoutId,
          exercise_id: exercise.id,
          reps: repsInt,
          partial_reps: partialRepsInt,
          weight_kg: weightKg,
          rpe: rpeInt,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        setError('Failed to add set');
        console.error('LogSetScreen: Failed to add set', error);
      } else {
        setReps('');
        setPartialReps('');
        setWeight('');
        setRpe('');
        // Refresh sets
        const { data } = await supabase
          .from('sets')
          .select('id, reps, partial_reps, weight_kg, rpe, created_at')
          .eq('workout_id', workoutId)
          .eq('exercise_id', exercise.id)
          .order('created_at', { ascending: false });
        setSets(data || []);
        console.log('LogSetScreen: Set added successfully');
      }
    } catch (err) {
      setError('Unexpected error adding set');
      console.error('LogSetScreen: Unexpected error', err);
    }
    setLoading(false);
  };

  const startEditSet = (set: any) => {
    setEditingSetId(set.id);
    setEditReps(set.reps?.toString() || '');
    setEditPartialReps(set.partial_reps?.toString() || '');
    const displayWeight = units === 'lb'
      ? (set.weight_kg / 0.45359237).toFixed(1)
      : set.weight_kg?.toString() || '';
    setEditWeight(displayWeight);
    setEditRpe(set.rpe?.toString() || '');
  };

  const cancelEditSet = () => {
    setEditingSetId(null);
    setEditReps('');
    setEditPartialReps('');
    setEditWeight('');
    setEditRpe('');
  };

  const handleUpdateSet = async (setId: string) => {
    setEditRpeError(null);
    setLoading(true);
    setError(null);
    if (editRpe) {
      const err = validateRpe(editRpe);
      if (err) {
        setEditRpeError(err);
        setLoading(false);
        return;
      }
    }
    try {
      const repsInt = parseInt(editReps, 10);
      const partialRepsInt = editPartialReps ? parseInt(editPartialReps, 10) : 0;
      const weightFloat = parseFloat(editWeight);
      const weightKg = units === 'lb' ? weightFloat * 0.45359237 : weightFloat;
      console.log('LogSetScreen: Updating set with weight', { input: editWeight, units, weightKg });
      const rpeInt = editRpe ? parseInt(editRpe, 10) : null;
      const { error } = await supabase.from('sets').update({
        reps: repsInt,
        partial_reps: partialRepsInt,
        weight_kg: weightKg,
        rpe: rpeInt,
      }).eq('id', setId);
      if (error) {
        setError('Failed to update set');
        console.error('LogSetScreen: Failed to update set', error);
      } else {
        cancelEditSet();
        // Refresh sets
        const { data } = await supabase
          .from('sets')
          .select('id, reps, partial_reps, weight_kg, rpe, created_at')
          .eq('workout_id', workoutId)
          .eq('exercise_id', exercise.id)
          .order('created_at', { ascending: false });
        setSets(data || []);
        console.log('LogSetScreen: Set updated successfully');
      }
    } catch (err) {
      setError('Unexpected error updating set');
      console.error('LogSetScreen: Unexpected error', err);
    }
    setLoading(false);
  };

  const confirmDeleteSet = (setId: string) => {
    setSetIdToDelete(setId);
    setShowDeleteDialog(true);
  };

  const handleDeleteSet = async () => {
    if (!setIdToDelete) return;
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('sets').delete().eq('id', setIdToDelete);
      if (error) {
        setError('Failed to delete set');
        console.error('LogSetScreen: Failed to delete set', error);
      } else {
        // Refresh sets
        const { data } = await supabase
          .from('sets')
          .select('id, reps, partial_reps, weight_kg, rpe, created_at')
          .eq('workout_id', workoutId)
          .eq('exercise_id', exercise.id)
          .order('created_at', { ascending: false });
        setSets(data || []);
        console.log('LogSetScreen: Set deleted successfully');
      }
    } catch (err) {
      setError('Unexpected error deleting set');
      console.error('LogSetScreen: Unexpected error', err);
    }
    setShowDeleteDialog(false);
    setSetIdToDelete(null);
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
        keyboardType="number-pad"
        style={{ marginBottom: 8 }}
        placeholder="e.g. 8"
      />
      <TextInput
        label="Partial Reps"
        value={partialReps}
        onChangeText={setPartialReps}
        keyboardType="number-pad"
        style={{ marginBottom: 8 }}
        placeholder="e.g. 1"
      />
      <TextInput
        label={`Weight (${units})`}
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
      {rpeError && <Text style={{ color: 'red', marginBottom: 8 }}>{rpeError}</Text>}
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
          editingSetId === item.id ? (
            <View style={{ padding: 8, backgroundColor: '#232323', borderRadius: 8, marginBottom: 8 }}>
              <TextInput
                label="Reps"
                value={editReps}
                onChangeText={setEditReps}
                keyboardType="number-pad"
                style={{ marginBottom: 4 }}
              />
              <TextInput
                label="Partial Reps"
                value={editPartialReps}
                onChangeText={setEditPartialReps}
                keyboardType="number-pad"
                style={{ marginBottom: 4 }}
              />
              <TextInput
                label={`Weight (${units})`}
                value={editWeight}
                onChangeText={setEditWeight}
                keyboardType="numeric"
                style={{ marginBottom: 4 }}
              />
              <TextInput
                label="RPE (optional)"
                value={editRpe}
                onChangeText={setEditRpe}
                keyboardType="numeric"
                style={{ marginBottom: 4 }}
              />
              {editRpeError && <Text style={{ color: 'red', marginBottom: 4 }}>{editRpeError}</Text>}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Button mode="outlined" onPress={cancelEditSet}>Cancel</Button>
                <Button mode="contained" onPress={() => handleUpdateSet(item.id)} loading={loading}>Save</Button>
              </View>
            </View>
          ) : (
            (() => {
              const displayWeight = units === 'lb'
                ? (item.weight_kg / 0.45359237).toFixed(1)
                : item.weight_kg.toFixed(1);
              return (
                <List.Item
                  title={`Reps: ${item.reps}${item.partial_reps ? ` + ${item.partial_reps} partial` : ''}, Weight: ${displayWeight}${units}${item.rpe ? `, RPE: ${item.rpe}` : ''}`}
                  description={item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
                  left={props => <List.Icon {...props} icon="check" />}
                  right={props => (
                    <View style={{ flexDirection: 'row' }}>
                      <Button mode="text" onPress={() => startEditSet(item)}>Edit</Button>
                      <Button mode="text" onPress={() => confirmDeleteSet(item.id)} color="red">Delete</Button>
                    </View>
                  )}
                />
              );
            })()
          )
        )}
        ListEmptyComponent={<Text>No sets logged yet.</Text>}
      />
      <Button mode="outlined" style={{ marginTop: 24 }} onPress={() => navigation.goBack()}>
        Back
      </Button>
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Set</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this set? This action cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={handleDeleteSet} color="red">Delete</Button>
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
    alignItems: 'stretch',
  },
}); 