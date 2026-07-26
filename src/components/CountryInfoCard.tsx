import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import type { Country } from '@/types/country';

interface CountryInfoCardProps {
  country: Country;
}

export const CountryInfoCard = memo(function CountryInfoCard({ country }: CountryInfoCardProps) {
  const theme = useTheme();
  const details = [
    ['Capital', country.capital],
    ['Continent', country.continent],
    ['Population', new Intl.NumberFormat().format(country.population)],
    ['Languages', country.languages.join(', ')],
    ['Currency', country.currency],
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text variant="titleMedium">{country.name}</Text>
      <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodyMedium">{country.fact}</Text>
      <View style={styles.details}>
        {details.map(([label, value]) => (
          <Text key={label} style={{ color: theme.colors.onSurfaceVariant }} variant="bodySmall">
            <Text style={{ fontWeight: '800' }}>{label}: </Text>{value}
          </Text>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: 20, gap: 8, marginTop: 14, padding: 16 },
  details: { gap: 3, marginTop: 4 },
});
