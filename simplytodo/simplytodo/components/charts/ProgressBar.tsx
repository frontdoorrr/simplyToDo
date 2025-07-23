import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
  backgroundColor?: string;
  height?: number;
  showPercentage?: boolean;
  animated?: boolean;
}

export default function ProgressBar({
  progress,
  label,
  color = '#4CAF50',
  backgroundColor = '#E0E0E0',
  height = 8,
  showPercentage = true,
  animated = true
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {showPercentage && (
            <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
          )}
        </View>
      )}
      
      <View style={[styles.progressContainer, { height, backgroundColor }]}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${clampedProgress}%`, 
              backgroundColor: color,
              height: height - 2,
            }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  progressContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  progressBar: {
    borderRadius: 4,
    minWidth: 2,
  },
});