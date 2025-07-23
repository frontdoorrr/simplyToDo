import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart as RNLineChart } from 'react-native-chart-kit';

interface LineChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      color?: string;
      strokeWidth?: number;
    }>;
  };
  title?: string;
  height?: number;
  showDots?: boolean;
  bezier?: boolean;
  yAxisSuffix?: string;
}

const screenWidth = Dimensions.get('window').width;

export default function LineChart({ 
  data, 
  title, 
  height = 200, 
  showDots = true, 
  bezier = true,
  yAxisSuffix = '%'
}: LineChartProps) {
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: showDots ? '4' : '0',
      strokeWidth: '2',
      stroke: '#2196F3',
      fill: '#ffffff',
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#E0E0E0',
      strokeDasharray: '',
    },
    propsForLabels: {
      fontSize: 11,
    },
    strokeWidth: 3,
    useShadowColorFromDataset: false,
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartContainer}>
        <RNLineChart
          data={data}
          width={screenWidth - 60}
          height={height}
          chartConfig={chartConfig}
          bezier={bezier}
          yAxisSuffix={yAxisSuffix}
          yAxisInterval={1}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={true}
          withHorizontalLines={true}
          style={styles.chart}
          transparent={true}
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