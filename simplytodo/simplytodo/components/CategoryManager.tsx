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
import { logger } from '@/lib/logger';

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
        logger.error('카테고리 불러오기 실패:', error);
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
      <View style={styles.horizontalContainer}>
        <Text style={styles.title}>Category :</Text>
        
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
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
          /* 카테고리 추가 버튼 */
          <TouchableOpacity
            style={[
              styles.categoryItem,
              styles.addCategoryButton,
              { borderColor: TodoColors.primary },
            ]}
            onPress={() => {
              setEditingCategory(null);
              setNewCategoryName('');
              setSelectedColor(CategoryColors.blue);
              setShowModal(true);
            }}
          >
            <MaterialIcons name="add" size={16} color={TodoColors.primary} />
            <Text style={[styles.categoryName, { color: TodoColors.primary, marginLeft: 4 }]}>
              카테고리 추가
            </Text>
          </TouchableOpacity>
        }
        />
      </View>

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
  // 카테고리 매니저 전체 컨테이너 (Priority와의 간격을 위한 패딩 추가)
  container: {
    marginBottom: 10,
    paddingVertical: 12,
  },
  
  // "카테고리" 라벨과 카테고리 목록을 수평 배치하는 컨테이너 (Priority와 동일한 패딩 적용)
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
  },
  
  // "카테고리" 라벨 스타일 (Priority 라벨과 동일한 스타일)
  title: {
    fontSize: 14,
    marginRight: 10,
    color: '#555',
    minWidth: 60,
  },
  
  // 카테고리 목록 FlatList 스타일
  categoryList: {
    flex: 1,
  },
  
  // 개별 카테고리 아이템 (버튼 형태)
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  
  // 카테고리 색상 점 표시
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  // 카테고리 이름 텍스트
  categoryName: {
    fontSize: 14,
    color: TodoColors.text.primary,
  },
  // 모달 배경 오버레이 (반투명 검은색 배경)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 모달 메인 컨테이너 (흰색 카드 스타일)
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
  
  // 모달 제목 텍스트 ("카테고리 추가" 또는 "카테고리 수정")
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: TodoColors.text.primary,
  },
  
  // 카테고리 이름 입력 필드
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  
  // 색상 미리보기 버튼 (선택된 색상으로 배경이 칠해짐)
  colorPreview: {
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // 색상 미리보기 버튼 내부의 "색상 선택" 텍스트
  colorPreviewText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // 색상 선택 영역 전체 컨테이너
  colorPickerContainer: {
    marginBottom: 16,
  },
  
  // "색상 선택" 제목 텍스트
  colorPickerTitle: {
    fontSize: 14,
    marginBottom: 8,
    color: TodoColors.text.primary,
  },
  
  // 색상 옵션들이 배치되는 그리드 레이아웃
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // 개별 색상 선택 아이템 (사각형 색상 버튼)
  colorItem: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  
  // 현재 선택된 색상 아이템 (진한 검은색 테두리)
  selectedColorItem: {
    borderWidth: 2,
    borderColor: '#000',
  },
  
  // 모달 하단 버튼들이 배치되는 가로 컨테이너
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  
  // 모든 버튼의 공통 스타일
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 8,
  },
  
  // 삭제 버튼 (빨간색 배경, 왼쪽 정렬)
  deleteButton: {
    backgroundColor: '#f44336',
    marginRight: 'auto',
  },
  
  // 취소 버튼 (회색 배경)
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  
  // 저장/수정 버튼 (앱 테마 색상)
  saveButton: {
    backgroundColor: TodoColors.primary,
  },
  
  // 버튼 내부 텍스트 스타일
  buttonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // 저장 버튼 텍스트 (흰색)
  saveButtonText: {
    color: '#fff',
  },
  
  // "카테고리 추가" 버튼 (점선 테두리, 카드 배경색)
  addCategoryButton: {
    backgroundColor: TodoColors.background.card,
    borderStyle: 'dashed',
  },
});
