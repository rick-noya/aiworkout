import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Text, List, Button, MD3DarkTheme, ActivityIndicator, IconButton, TextInput, Chip, Menu } from 'react-native-paper';
import { supabase } from '../lib/supabase';
import { useUnits } from './UnitsContext';
import { Picker } from '@react-native-picker/picker';

type ExerciseType = {
  id: string;
  name: string;
  movement_pattern?: string;
  mechanics?: string;
  plane_of_motion?: string;
  skill_level?: string;
  exercise_type?: string;
  is_unilateral?: boolean;
  muscle_group?: string;
  primary_equipment?: string;
};

export default function ExerciseSelectScreen({ route, navigation }: { route: any; navigation: any }) {
  const { date, workoutId: navWorkoutId, editMode, selectedExercises: navSelectedExercises, exerciseTargets: navExerciseTargets } = route.params;
  const [exercises, setExercises] = useState<ExerciseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(navWorkoutId || null);
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string }[]>(navSelectedExercises || []);
  const [exerciseTargets, setExerciseTargets] = useState<Record<string, any>>(navExerciseTargets || {});
  const [saving, setSaving] = useState(false);
  const { units, loading: unitsLoading } = useUnits();
  const [filters, setFilters] = useState({
    movement_pattern: '',
    mechanics: '',
    plane_of_motion: '',
    skill_level: '',
    exercise_type: '',
    is_unilateral: '',
  });

  // Dropdown filter state for muscle_group and primary_equipment
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [muscleMenuVisible, setMuscleMenuVisible] = useState(false);
  const [equipmentMenuVisible, setEquipmentMenuVisible] = useState(false);

  // Extract unique values for dropdowns (filter out undefined)
  const muscleGroups = Array.from(new Set(exercises.map(e => e.muscle_group).filter((v): v is string => typeof v === 'string')));
  const equipmentOptions = Array.from(new Set(exercises.map(e => e.primary_equipment).filter((v): v is string => typeof v === 'string')));

  const [search, setSearch] = useState('');

  React.useEffect(() => {
    console.log('ExerciseSelectScreen: units context', { units, unitsLoading });
  }, [units, unitsLoading]);

  useEffect(() => {
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
        // Always use ISO string for midnight UTC
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const dateIso = dateObj.toISOString();
        const { data: workouts, error: workoutError } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user_id)
          .eq('scheduled_date', dateIso);
        if (workoutError) {
          setError('Failed to fetch workout.');
          setLoading(false);
          console.error('ExerciseSelectScreen: Workout fetch error', workoutError);
          return;
        }
        if (!workouts || workouts.length === 0) {
          setError('No workout found for this date.');
          setLoading(false);
          console.error('ExerciseSelectScreen: No workout found for date', dateIso);
          return;
        }
        setWorkoutId(workouts[0].id);
        console.log('ExerciseSelectScreen: Found workout', workouts[0].id);
        // Fetch exercises
        const { data: exercisesData, error: exercisesError } = await supabase.from('exercises').select('id, name, muscle_group, primary_equipment');
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
          const weightFloat = t.target_weight ? parseFloat(t.target_weight) : null;
          const weightKg = weightFloat && units === 'lb' ? weightFloat * 0.45359237 : weightFloat;
          const insertObj = {
            workout_id: workoutId,
            exercise_id: exercise.id,
            target_reps_min: t.target_reps_min ? parseInt(t.target_reps_min, 10) : null,
            target_reps_max: t.target_reps_max ? parseInt(t.target_reps_max, 10) : null,
            target_weight: weightKg,
            target_rpe: t.target_rpe ? parseFloat(t.target_rpe) : null,
          };
          console.log('ExerciseSelectScreen: Insert object for workout_exercises', { input: t.target_weight, units, weightKg, insertObj });
          return insertObj;
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
        // Always use ISO string for midnight UTC for navigation
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const dateIso = dateObj.toISOString();
        navigation.replace('WorkoutDetail', { workoutId, date: dateIso });
      } catch (err) {
        setError('Unexpected error updating workout exercises.');
        setSaving(false);
        console.error('ExerciseSelectScreen: Unexpected error', err);
        return;
      }
      setSaving(false);
    } else {
      navigation.navigate('WorkoutSummary', {
        selectedExercises,
        exerciseTargets,
        workoutId,
        date,
      });
    }
  };

  // Filtering logic for muscle_group, primary_equipment, and search
  const filteredExercises = exercises.filter(ex => {
    const muscleMatch = !selectedMuscleGroup || (ex.muscle_group && ex.muscle_group === selectedMuscleGroup);
    const equipMatch = !selectedEquipment || (ex.primary_equipment && ex.primary_equipment === selectedEquipment);
    const searchMatch = !search || (ex.name && ex.name.toLowerCase().includes(search.toLowerCase()));
    return muscleMatch && equipMatch && searchMatch;
  });

  return (
    <View style={styles.exerciseContainer}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Select Exercises</Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#BB86FC' }}>{date}</Text>
      {/* Search Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
        <TextInput
          value={search}
          onChangeText={v => { setSearch(v); console.log('Exercise search:', v); }}
          placeholder="Search exercises..."
          style={{
            width: 220,
            borderRadius: 24,
            backgroundColor: '#232323',
            paddingHorizontal: 16,
            marginBottom: 4,
            alignSelf: 'center',
            fontSize: 14,
          }}
          mode="outlined"
          dense
          left={<TextInput.Icon icon="magnify" />}
          right={search ? <TextInput.Icon icon="close" onPress={() => { setSearch(''); console.log('Exercise search cleared'); }} /> : null}
        />
      </View>
      {/* Pill-style Dropdown Filter Controls */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16, alignItems: 'center' }}>
        <Menu
          visible={muscleMenuVisible}
          onDismiss={() => setMuscleMenuVisible(false)}
          anchor={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Button
                mode={selectedMuscleGroup ? 'contained' : 'outlined'}
                style={{ borderRadius: 24, paddingHorizontal: 16, marginRight: 0 }}
                onPress={() => setMuscleMenuVisible(true)}
              >
                {selectedMuscleGroup ? selectedMuscleGroup : 'Muscle Group'}
              </Button>
              {selectedMuscleGroup ? (
                <IconButton
                  icon="close"
                  size={18}
                  style={{ marginLeft: -8, marginRight: 8, backgroundColor: 'transparent' }}
                  onPress={() => { setSelectedMuscleGroup(''); setMuscleMenuVisible(false); console.log('Filter: muscle_group cleared'); }}
                />
              ) : null}
            </View>
          }
        >
          <Menu.Item onPress={() => { setSelectedMuscleGroup(''); setMuscleMenuVisible(false); console.log('Filter: muscle_group', ''); }} title="All" />
          {muscleGroups.map(opt => (
            <Menu.Item key={opt} onPress={() => { setSelectedMuscleGroup(opt); setMuscleMenuVisible(false); console.log('Filter: muscle_group', opt); }} title={opt} />
          ))}
        </Menu>
        <Menu
          visible={equipmentMenuVisible}
          onDismiss={() => setEquipmentMenuVisible(false)}
          anchor={
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Button
                mode={selectedEquipment ? 'contained' : 'outlined'}
                style={{ borderRadius: 24, paddingHorizontal: 16 }}
                onPress={() => setEquipmentMenuVisible(true)}
              >
                {selectedEquipment ? selectedEquipment : 'Equipment'}
              </Button>
              {selectedEquipment ? (
                <IconButton
                  icon="close"
                  size={18}
                  style={{ marginLeft: -8, marginRight: 8, backgroundColor: 'transparent' }}
                  onPress={() => { setSelectedEquipment(''); setEquipmentMenuVisible(false); console.log('Filter: equipment cleared'); }}
                />
              ) : null}
            </View>
          }
        >
          <Menu.Item onPress={() => { setSelectedEquipment(''); setEquipmentMenuVisible(false); console.log('Filter: equipment', ''); }} title="All" />
          {equipmentOptions.map(opt => (
            <Menu.Item key={opt} onPress={() => { setSelectedEquipment(opt); setEquipmentMenuVisible(false); console.log('Filter: equipment', opt); }} title={opt} />
          ))}
        </Menu>
      </View>
      {loading ? (
        <ActivityIndicator animating={true} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>
      ) : (
        <>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>Available Exercises</Text>
          <ScrollView style={{ maxHeight: 320, marginBottom: 8, width: '100%' }}>
            {filteredExercises.map((exercise) => {
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
          </ScrollView>
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