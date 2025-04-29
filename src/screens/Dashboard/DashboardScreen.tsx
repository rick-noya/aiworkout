import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, SafeAreaView } from "react-native";
import { MD3DarkTheme, Surface, Text, ActivityIndicator, Avatar } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';
import WeekCalendar from "../../components/WeekCalendar";
import TodaysWorkout from "../../components/TodayExercises";
import { supabase } from "../../lib/supabase";
import ReadinessGauge from '../../components/Dashboard/ReadinessGauge';
import VolumeBar from '../../components/Dashboard/VolumeBar';
import InsightCard from '../../components/Dashboard/InsightCard';

const INSIGHTS = [
  { key: 'streak', title: 'Streak' },
  { key: 'prs', title: 'PRs' },
  { key: 'consistency', title: 'Consistency' },
];

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      try {
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        if (!user) {
          setProfileError("Not logged in");
          setLoadingProfile(false);
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        if (error) {
          setProfileError("Failed to load profile");
          setLoadingProfile(false);
          return;
        }
        setProfile(data);
      } catch (err) {
        setProfileError("Unexpected error loading profile");
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  const handleDayPress = async (dateObj: Date) => {
    const dateMidnight = new Date(dateObj);
    dateMidnight.setHours(0, 0, 0, 0);
    const dateIso = dateMidnight.toISOString();
    try {
      const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
      const user_id = user ? user.id : null;
      if (!user_id) {
        console.error('DashboardScreen: No user_id found.');
        navigation.navigate('CreateWorkout', { date: dateIso });
        return;
      }
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user_id)
        .eq('scheduled_date', dateIso);
      if (error) {
        console.error('DashboardScreen: Error fetching workout', error);
        navigation.navigate('CreateWorkout', { date: dateIso });
        return;
      }
      if (workouts && workouts.length > 0) {
        console.log('DashboardScreen: Found workout for date', dateIso, workouts[0].id);
        navigation.navigate('WorkoutDetail', { workoutId: workouts[0].id, date: dateIso });
      } else {
        console.log('DashboardScreen: No workout found for date', dateIso);
        navigation.navigate('CreateWorkout', { date: dateIso });
      }
    } catch (err) {
      console.error('DashboardScreen: Unexpected error', err);
      navigation.navigate('CreateWorkout', { date: dateIso });
    }
  };

  const handleStartWorkout = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todayIso = today.toISOString();
    const tomorrowIso = tomorrow.toISOString();
    const { data: workouts } = await supabase
      .from('workouts')
      .select('id')
      .gte('scheduled_date', todayIso)
      .lt('scheduled_date', tomorrowIso);
    if (!workouts || workouts.length === 0) return;
    const workoutId = workouts[0].id;
    const { data: planned } = await supabase
      .from('workout_exercises')
      .select('exercise_id, exercises(name)')
      .eq('workout_id', workoutId);
    if (!planned || planned.length === 0) return;
    const first = planned[0];
    navigation.navigate('LogSet', {
      workoutId,
      exercise: { id: first.exercise_id, name: first.exercises?.name || first.exercise_id },
      date: todayIso,
    });
  };

  // Format date as e.g. "Tuesday, APR 29"
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.date}>{dateString}</Text>
      <ReadinessGauge />
      <View style={styles.volumes}>
        <VolumeBar label="Push" />
        <VolumeBar label="Pull" />
        <VolumeBar label="Legs" />
      </View>
      <FlatList
        horizontal
        data={INSIGHTS}
        keyExtractor={item => item.key}
        renderItem={({ item }) => <InsightCard title={item.title} />}
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        style={{ marginBottom: 16 }}
      />
      <WeekCalendar onDayPress={handleDayPress} />
      <TodaysWorkout onStart={handleStartWorkout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
    paddingTop: 8,
  },
  date: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 1.2,
  },
  volumes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  profileCard: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#232323',
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 80,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}); 