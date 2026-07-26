import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import type { Country } from '@/types/country';

interface CountryInfoCardProps {
  country: Country;
}

const DETAIL_ROWS: { icon: string; label: string; key: keyof Country }[] = [
  { icon: 'city-variant-outline', label: 'Capital', key: 'capital' },
  { icon: 'earth', label: 'Continent', key: 'continent' },
  { icon: 'account-group-outline', label: 'Population', key: 'population' },
  { icon: 'translate', label: 'Languages', key: 'languages' },
  { icon: 'cash', label: 'Currency', key: 'currency' },
];

function formatValue(key: keyof Country, country: Country): string {
  if (key === 'population') return new Intl.NumberFormat().format(country.population);
  if (key === 'languages') return (country.languages as string[]).join(', ');
  return String(country[key]);
}

export const CountryInfoCard = memo(function CountryInfoCard({ country }: CountryInfoCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      {/* Gradient header */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerName}>{country.name}</Text>
        <Text style={styles.headerOfficial}>{country.officialName}</Text>
      </LinearGradient>

      {/* Fun fact */}
      <View style={styles.factRow}>
        <MaterialCommunityIcons color="#F59E0B" name="lightbulb-outline" size={18} />
        <Text style={[styles.fact, { color: theme.colors.onSurfaceVariant }]} variant="bodyMedium">
          {country.fact}
        </Text>
      </View>

      {/* Detail rows */}
      <View style={[styles.details, { borderTopColor: theme.colors.outline }]}>
        {DETAIL_ROWS.map(({ icon, label, key }) => (
          <View key={label} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons color={theme.colors.primary} name={icon as any} size={15} />
            </View>
            <Text style={[styles.rowLabel, { color: theme.colors.onSurfaceVariant }]} variant="labelMedium">
              {label}
            </Text>
            <Text style={[styles.rowValue, { color: theme.colors.onSurface }]} variant="bodyMedium">
              {formatValue(key, country)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, marginTop: 14, overflow: 'hidden', elevation: 2 },
  details: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  fact: { flex: 1, lineHeight: 20 },
  factRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  header: { paddingHorizontal: 18, paddingVertical: 14 },
  headerName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  headerOfficial: { color: '#C7D2FE', fontSize: 12, marginTop: 2 },
  iconWrap: { alignItems: 'center', borderRadius: 8, height: 26, justifyContent: 'center', width: 26 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  rowLabel: { width: 80 },
  rowValue: { flex: 1, fontWeight: '600' },
});
