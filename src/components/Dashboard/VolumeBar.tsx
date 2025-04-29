import React from 'react';
import { View, Text } from 'react-native';

export default function VolumeBar({ label = 'Label' }) {
  return (
    <View style={{ marginVertical: 8, width: '90%' }}>
      <Text style={{ color: '#BB86FC', marginBottom: 4 }}>{label}</Text>
      <View style={{ height: 16, backgroundColor: '#232323', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ width: '60%', height: '100%', backgroundColor: '#BB86FC' }} />
      </View>
      <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>1234 kg</Text>
    </View>
  );
} 