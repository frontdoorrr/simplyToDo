import React, { useState } from 'react';
import { StyleSheet, TextInput, View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TodoColors } from '@/constants/Colors';

interface AddTodoProps {
  onAddTodo: (text: string, importance: number) => void;
}

export const AddTodo: React.FC<AddTodoProps> = ({ onAddTodo }) => {
  const [text, setText] = useState('');
  const [importance, setImportance] = useState(3); // Default importance level (1-5)

  const handleAddTodo = () => {
    if (text.trim()) {
      onAddTodo(text.trim(), importance);
      setText('');
    }
  };

  const handleImportanceChange = (level: number) => {
    setImportance(level);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Add a task"
        placeholderTextColor="#999999"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleAddTodo}
        returnKeyType="done"
      />
      
      <View style={styles.importanceContainer}>
        <Text style={styles.importanceLabel}>Priority:</Text>
        <View style={styles.importanceLevels}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.importanceButton,
                importance === level && styles.selectedImportance,
              ]}
              onPress={() => handleImportanceChange(level)}>
              <Text 
                style={[
                  styles.importanceText,
                  importance === level && styles.selectedImportanceText
                ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton} 
        onPress={handleAddTodo}
        disabled={!text.trim()}>
        <MaterialIcons name="add" size={24} color={TodoColors.text.light} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: TodoColors.background.app,
    marginBottom: 8,
  },
  input: {
    backgroundColor: TodoColors.background.input,
    padding: 12,
    borderRadius: 0,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  importanceContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  importanceLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#555',
  },
  importanceLevels: {
    flexDirection: 'row',
    flex: 1,
  },
  importanceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  selectedImportance: {
    backgroundColor: TodoColors.primary,
  },
  importanceText: {
    fontSize: 14,
    color: '#555',
  },
  selectedImportanceText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: TodoColors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
});
