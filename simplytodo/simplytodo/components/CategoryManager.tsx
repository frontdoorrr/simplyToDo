import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Category, CategoryColors, DefaultCategories, createCategory } from '@/types/Todo';
import { TodoColors } from '@/constants/Colors';
import { v4 as uuidv4 } from 'uuid';
import { categoriesApi } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CategoryManagerProps {
  onCategorySelect: (categoryId: string | null) => void;
  selectedCategoryId: string | null;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  onCategorySelect,
  selectedCategoryId,
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(CategoryColors.blue);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Supabase에서 카테고리 불러오기
  useEffect(() => {
    if (!userId) return;
    const loadCategories = async () => {
      try {
        const data = await categoriesApi.getCategories(userId);
        setCategories(data);
      } catch (error) {
        console.error('카테고리 불러오기 실패:', error);
      }
    };
    loadCategories();
  }, [userId]);

  // 카테고리 추가
  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') {
      Alert.alert('알림', '카테고리 이름을 입력해주세요.');
      return;
    }
    if (!userId) return;
    try {
      const newCategory = await categoriesApi.addCategory({
        name: newCategoryName.trim(),
        color: selectedColor,
        user_id: userId,
      });
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      setSelectedColor(CategoryColors.blue);
      setShowModal(false);
    } catch (error) {
      Alert.alert('카테고리 추가 실패', '카테고리 추가 중 오류가 발생했습니다.');
    }
  };

  // 카테고리 수정
  const handleEditCategory = async () => {
    if (!editingCategory || newCategoryName.trim() === '') {
      Alert.alert('알림', '카테고리 이름을 입력해주세요.');
      return;
    }
    if (!userId) return;
    try {
      const updated = await categoriesApi.updateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        color: selectedColor,
      });
      setCategories(categories.map(cat => cat.id === updated.id ? updated : cat));
      setNewCategoryName('');
      setSelectedColor(CategoryColors.blue);
      setEditingCategory(null);
      setShowModal(false);
    } catch (error) {
      Alert.alert('카테고리 수정 실패', '카테고리 수정 중 오류가 발생했습니다.');
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (categoryId: string) => {
    if (!userId) return;
    Alert.alert(
      '카테고리 삭제',
      '이 카테고리를 삭제하시겠습니까? 해당 카테고리에 속한 할 일은 카테고리가 없는 상태로 변경됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoriesApi.deleteCategory(categoryId);
              setCategories(categories.filter(cat => cat.id !== categoryId));
              if (selectedCategoryId === categoryId) {
                onCategorySelect(null);
              }
            } catch (error) {
              Alert.alert('카테고리 삭제 실패', '카테고리 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 카테고리 수정 모달 열기
  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setSelectedColor(category.color);
    setShowModal(true);
  };

  // 카테고리 선택
  const handleSelectCategory = (categoryId: string) => {
    onCategorySelect(categoryId === selectedCategoryId ? null : categoryId);
  };

  // 색상 선택 렌더링
  const renderColorPicker = () => {
    return (
      <View style={styles.colorPickerContainer}>
        <Text style={styles.colorPickerTitle}>색상 선택</Text>
        <View style={styles.colorGrid}>
          {Object.entries(CategoryColors).map(([colorName, colorValue]) => (
            <TouchableOpacity
              key={colorName}
              style={[
                styles.colorItem,
                { backgroundColor: colorValue },
                selectedColor === colorValue && styles.selectedColorItem,
              ]}
              onPress={() => setSelectedColor(colorValue)}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>카테고리</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingCategory(null);
            setNewCategoryName('');
            setSelectedColor(CategoryColors.blue);
            setShowModal(true);
          }}
        >
          <MaterialIcons name="add" size={24} color={TodoColors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              { borderColor: item.color },
              selectedCategoryId === item.id && { backgroundColor: item.color + '20' },
            ]}
            onPress={() => handleSelectCategory(item.id)}
            onLongPress={() => openEditModal(item)}
          >
            <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
            <Text style={styles.categoryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          <TouchableOpacity
            style={[
              styles.categoryItem,
              { borderColor: TodoColors.text.secondary },
              !selectedCategoryId && { backgroundColor: TodoColors.text.secondary + '20' },
            ]}
            onPress={() => onCategorySelect(null)}
          >
            <Text style={styles.categoryName}>없음</Text>
          </TouchableOpacity>
        }
      />

      {/* 카테고리 추가/수정 모달 */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <Text style={styles.modalTitle}>
              {editingCategory ? '카테고리 수정' : '새 카테고리 추가'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="카테고리 이름"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />
            
            <TouchableOpacity
              style={[styles.colorPreview, { backgroundColor: selectedColor }]}
              onPress={() => setShowColorPicker(!showColorPicker)}
            >
              <Text style={styles.colorPreviewText}>색상 선택</Text>
            </TouchableOpacity>
            
            {showColorPicker && renderColorPicker()}
            
            <View style={styles.buttonRow}>
              {editingCategory && (
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={() => {
                    setShowModal(false);
                    handleDeleteCategory(editingCategory.id);
                  }}
                >
                  <Text style={styles.buttonText}>삭제</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={editingCategory ? handleEditCategory : handleAddCategory}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  {editingCategory ? '수정' : '추가'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TodoColors.text.primary,
  },
  addButton: {
    padding: 4,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    color: TodoColors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: TodoColors.text.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  colorPreview: {
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorPreviewText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  colorPickerContainer: {
    marginBottom: 16,
  },
  colorPickerTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: TodoColors.text.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorItem: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedColorItem: {
    borderWidth: 2,
    borderColor: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    marginRight: 'auto',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: TodoColors.primary,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButtonText: {
    color: '#fff',
  },
});
