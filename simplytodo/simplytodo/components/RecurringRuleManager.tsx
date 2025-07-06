import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, Modal, TouchableOpacity } from 'react-native';
import { recurringRulesApi } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { RecurringRule } from '@/types/RecurringRule';
import RecurringRuleForm from './RecurringRuleForm';

export default function RecurringRuleManager() {
  const { user } = useAuth();
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);

  useEffect(() => {
    if (!user) return;
    recurringRulesApi.getRecurringRules(user.id).then(setRules);
  }, [user]);

  const handleAdd = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const handleEdit = (rule: RecurringRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await recurringRulesApi.deleteRecurringRule(id);
    setRules(rules.filter(r => r.id !== id));
  };

  const handleSave = async (rule: Partial<RecurringRule>) => {
    if (!user) return;
    if (editingRule) {
      const updated = await recurringRulesApi.updateRecurringRule(editingRule.id, rule);
      setRules(rules.map(r => r.id === updated.id ? updated : r));
    } else {
      const created = await recurringRulesApi.addRecurringRule({ ...rule, user_id: user.id } as any);
      setRules([...rules, created]);
    }
    setShowForm(false);
  };

  return (
    <View>
      <Button title="반복 규칙 추가" onPress={handleAdd} />
      <FlatList
        data={rules}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
            <Text style={{ flex: 1 }}>{item.title} ({item.recurring_type})</Text>
            <TouchableOpacity onPress={() => handleEdit(item)}><Text>수정</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)}><Text>삭제</Text></TouchableOpacity>
          </View>
        )}
      />
      <Modal visible={showForm} animationType="slide">
        <RecurringRuleForm
          initialRule={editingRule}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </View>
  );
} 