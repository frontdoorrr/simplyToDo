import React, { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { RecurringRule } from '@/types/RecurringRule';
import { Picker } from '@react-native-picker/picker';

interface RecurringRuleFormProps {
  initialRule: RecurringRule | null;
  onSave: (rule: Partial<RecurringRule>) => void;
  onCancel: () => void;
}

const recurringTypes = [
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '매월', value: 'monthly' },
];

export default function RecurringRuleForm({ initialRule, onSave, onCancel }: RecurringRuleFormProps) {
  const [title, setTitle] = useState(initialRule?.name || '');
  const [recurringType, setRecurringType] = useState(initialRule?.recurring_type || 'daily');
  const [startDate, setStartDate] = useState(initialRule?.start_date || '');

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        {initialRule ? '반복 규칙 수정' : '반복 규칙 추가'}
      </Text>
      <Text>제목</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="할 일 제목"
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 16, padding: 8 }}
      />
      <Text>반복 유형</Text>
      <Picker
        selectedValue={recurringType}
        onValueChange={setRecurringType}
        style={{ marginBottom: 16 }}
      >
        {recurringTypes.map(opt => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>
      <Text>시작일(YYYY-MM-DD)</Text>
      <TextInput
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2024-06-01"
        style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 16, padding: 8 }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button title="취소" onPress={onCancel} />
        <Button
          title="저장"
          onPress={() => onSave({
            name: title,
            recurring_type: recurringType,
            start_date: startDate,
            is_active: true,
            // 필요한 필드 추가 가능
          })}
          disabled={!title || !startDate}
        />
      </View>
    </View>
  );
} 