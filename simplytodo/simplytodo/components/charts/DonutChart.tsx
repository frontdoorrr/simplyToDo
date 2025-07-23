import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  centerText?: string;
  centerSubText?: string;
  size?: number;
}

const screenWidth = Dimensions.get('window').width;

export default function DonutChart({ 
  data, 
  centerText, 
  centerSubText, 
  size = 120 
}: DonutChartProps) {
  const chartData = data.map(item => ({
    name: item.name,
    population: item.value,
    color: item.color,
    legendFontColor: '#666',
    legendFontSize: 12,
  }));

  const chartConfig = {
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          width={size * 2}
          height={size * 2}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          absolute={false}
          hasLegend={false}
        />
        
        {/* 중앙 텍스트 오버레이 */}
        {(centerText || centerSubText) && (
          <View style={[styles.centerTextContainer, { 
            width: size, 
            height: size,
            top: size / 2,
            left: size / 2 + 15
          }]}>
            {centerText && (
              <Text style={styles.centerText}>{centerText}</Text>
            )}
            {centerSubText && (
              <Text style={styles.centerSubText}>{centerSubText}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    textAlign: 'center',
  },
  centerSubText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
});