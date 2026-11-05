import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';

import { injectPharmacyCss, webData } from '../../components/pharmacy/pharmacyUi';
import { COLORS } from '../../constants/theme';

// Pharmacy screens (Japanese only): setup, login, plan choice, home (inbox / walk-in check by plan), intake detail, walk-in check. Used in a browser on the reception PC or
// tablet -- never on the レセコン PC.
export default function PharmacyLayout() {
  useEffect(() => {
    injectPharmacyCss();
  }, []);
  return (
    <View style={{ flex: 1 }} {...webData({ pharmacyRoot: 'true' })}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }} />
    </View>
  );
}
