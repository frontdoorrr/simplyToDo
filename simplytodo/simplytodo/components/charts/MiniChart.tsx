import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MiniChartProps {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  width?: number;
  showValues?: boolean;
}

export default function MiniChart({
  data,
  labels = [],
  color = '#4CAF50',
  height = 40,
  width = 200,
  showValues = false
}: MiniChartProps) {
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;

  return (
    <View style={[styles.container, { width, height: height + 20 }]}>
      <View style={[styles.chartContainer, { height }]}>
        {data.map((value, index) => {
          const normalizedHeight = ((value - minValue) / range) * height;
          const barHeight = Math.max(normalizedHeight, 2);
          
          return (
            <View key={index} style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: barHeight, 
                    backgroundColor: color,
                    width: (width - 20) / data.length - 2
                  }
                ]} 
              />
              {showValues && value > 0 && (
                <Text style={styles.barValue}>{value}</Text>
              )}
              {labels[index] && (
                <Text style={styles.barLabel}>{labels[index]}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    borderRadius: 2,
    marginHorizontal: 1,
  },
  barValue: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
});