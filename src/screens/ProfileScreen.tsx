import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { MD3DarkTheme, Surface, Text, ActivityIndicator, Avatar } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    console.log('ProfileScreen: Navigating directly to Settings on mount');
    navigation.navigate('Settings');
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError(null);
      console.log('ProfileScreen: Fetching profile...');
      try {
        const user = supabase.auth.getUser ? (await supabase.auth.getUser()).data.user : null;
        console.log('ProfileScreen: User fetched', user);
        if (!user) {
          setProfileError("Not logged in");
          setLoadingProfile(false);
          console.warn('ProfileScreen: Not logged in');
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
          console.error('ProfileScreen: Failed to load profile', error);
          return;
        }
        setProfile(data);
        console.log('ProfileScreen: Profile loaded', data);
      } catch (err) {
        setProfileError("Unexpected error loading profile");
        console.error('ProfileScreen: Unexpected error', err);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  const handleSettingsNavigation = () => {
    console.log('ProfileScreen: Navigating to Settings');
    navigation.navigate('Settings');
  };

  return null;
}

const styles = StyleSheet.create({
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