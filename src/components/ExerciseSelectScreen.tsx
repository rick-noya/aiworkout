import * as React from 'react';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, List, Button, MD3DarkTheme, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../lib/supabase';

export default function ExerciseSelectScreen({ route, navigation }: { route: any; navigation: any }) {
  const { date } = route.params;
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('exercises').select('id, name');
      if (error) {
        setError('Failed to load exercises');
        setExercises([]);
      } else {
        setExercises(data || []);
      }
      setLoading(false);
    };
    fetchExercises();
  }, []);

  return (
    <View style={styles.exerciseContainer}>
      <Text variant="titleLarge" style={{ marginBottom: 16 }}>Select Exercise</Text>
      <Text variant="bodyMedium" style={{ marginBottom: 16, color: '#BB86FC' }}>{date}</Text>
      {loading ? (
        <ActivityIndicator animating={true} style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={{ color: 'red', marginTop: 16 }}>{error}</Text>
      ) : (
        exercises.map((exercise) => (
          <List.Item
            key={exercise.id}
            title={exercise.name}
            left={props => <List.Icon {...props} icon="dumbbell" />}
            onPress={() => navigation.navigate('LogSet', { exercise, date })}
          />
        ))
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
}); 