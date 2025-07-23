import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as RNBarChart } from 'react-native-chart-kit';

interface BarChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: string;
    }>;
  };
  title?: string;
  height?: number;
  showYAxisLabel?: boolean;
  yAxisSuffix?: string;
}

const screenWidth = Dimensions.get('window').width;

export default function BarChart({ 
  data, 
  title, 
  height = 200, 
  showYAxisLabel = true,
  yAxisSuffix = ''
}: BarChartProps) {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#E0E0E0',
      strokeDasharray: '',
    },
    propsForLabels: {
      fontSize: 12,
    },
    barPercentage: 0.7,
    fillShadowGradient: '#4CAF50',
    fillShadowGradientOpacity: 1,
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartContainer}>
        <RNBarChart
          data={data}
          width={screenWidth - 60}
          height={height}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          yAxisLabel=""
          yAxisSuffix={yAxisSuffix}
          showValuesOnTopOfBars={true}
          withInnerLines={true}
          style={styles.chart}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chart: {
    borderRadius: 12,
  },
});