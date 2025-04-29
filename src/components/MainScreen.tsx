import * as React from "react";
import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { MD3DarkTheme, Surface, Text, ActivityIndicator, Avatar } from "react-native-paper";
import WeekCalendar from "./WeekCalendar";
import TodaysWorkout from "./TodayExercises";
import { supabase } from "../lib/supabase";

export default function MainScreen({ navigation }: { navigation: any }) {
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

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
        <Surface style={styles.profileCard} elevation={2}>
          {loadingProfile ? (
            <ActivityIndicator animating={true} />
          ) : profileError ? (
            <Text style={{ color: "red" }}>{profileError}</Text>
          ) : profile ? (
            <View style={styles.profileRow}>
              <Avatar.Text size={48} label={profile.username ? profile.username[0].toUpperCase() : "U"} style={{ marginRight: 16 }} />
              <View>
                <Text variant="titleMedium">{profile.username}</Text>
                <Text variant="bodySmall" style={{ color: '#BB86FC' }}>Welcome back!</Text>
              </View>
            </View>
          ) : null}
        </Surface>
      </TouchableOpacity>
      <WeekCalendar navigation={navigation} />
      <TodaysWorkout navigation={navigation} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MD3DarkTheme.colors.background,
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
