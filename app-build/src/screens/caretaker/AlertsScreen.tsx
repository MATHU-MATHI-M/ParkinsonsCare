import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '../../theme';
import { useData } from '../../context/DataContext';
import AppHeader from '../../components/AppHeader';
import AlertCard from '../../components/AlertCard';

interface Props {
  onBack: () => void;
}

export const AlertsScreen: React.FC<Props> = ({ onBack }) => {
  const { alerts, acknowledgeAlert } = useData();

  return (
    <View style={styles.container}>
      <AppHeader
        title="Clinical Alerts"
        subtitle="Automated Non-Motor Threshold Violations"
        showBack
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No alerts active. All parameters within expected thresholds.</Text>
          </View>
        ) : (
          alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={acknowledgeAlert}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  emptyBox: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textTertiary,
  },
});

export default AlertsScreen;
