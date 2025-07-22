import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MessageTemplate } from '@/types/Notification';

interface MessageTemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (template: MessageTemplate) => void;
  initialTemplate: MessageTemplate;
}

const TEMPLATE_PRESETS = [
  {
    type: 'motivational' as const,
    name: '동기부여형',
    description: '에너지 넘치는 격려 메시지',
    examples: [
      '🎯 목표 달성을 위한 한 걸음! "{title}"을 완료해보세요!',
      '💪 화이팅! "{title}"으로 오늘도 성공적인 하루 만들기!',
      '🌟 훌륭한 선택! "{title}"을 지금 시작해보세요!',
    ],
    prefix: ['🎯 ', '💪 ', '🌟 ', '🚀 ', '⭐ '],
    suffixes: [
      '을 완료해보세요!',
      '로 오늘도 성공적인 하루 만들기!',
      '을 지금 시작해보세요!',
      '로 한 단계 더 발전하세요!',
    ]
  },
  {
    type: 'formal' as const,
    name: '정중형',
    description: '정중하고 예의바른 알림',
    examples: [
      '안녕하세요. "{title}" 작업을 확인해주시기 바랍니다.',
      '"{title}" 일정이 다가왔습니다. 검토 부탁드립니다.',
      '할 일 알림: "{title}"을 처리해주세요.',
    ],
    prefix: ['', '안녕하세요. ', '알림: '],
    suffixes: [
      '을 확인해주시기 바랍니다.',
      ' 일정이 다가왔습니다.',
      '을 처리해주세요.',
      '을 검토 부탁드립니다.',
    ]
  },
  {
    type: 'simple' as const,
    name: '간단형',
    description: '간결하고 명확한 메시지',
    examples: [
      '할 일: {title}',
      '{title} 시간입니다',
      '알림: {title}',
    ],
    prefix: ['할 일: ', '알림: ', ''],
    suffixes: [
      '',
      ' 시간입니다',
      ' 확인하세요',
    ]
  },
];

export const MessageTemplateModal: React.FC<MessageTemplateModalProps> = ({
  visible,
  onClose,
  onSave,
  initialTemplate
}) => {
  const [selectedType, setSelectedType] = useState(initialTemplate.type);
  const [customMessage, setCustomMessage] = useState(initialTemplate.customMessage || '');
  const [includeEmoji, setIncludeEmoji] = useState(initialTemplate.includeEmoji || false);
  const [includeDueTime, setIncludeDueTime] = useState(initialTemplate.includeDueTime || false);
  const [includeCategory, setIncludeCategory] = useState(initialTemplate.includeCategory || false);

  const handleSave = () => {
    if (selectedType === 'custom' && !customMessage.trim()) {
      Alert.alert('입력 오류', '사용자 정의 메시지를 입력해주세요.');
      return;
    }

    const template: MessageTemplate = {
      type: selectedType,
      customMessage: selectedType === 'custom' ? customMessage.trim() : undefined,
      includeEmoji,
      includeDueTime,
      includeCategory
    };

    onSave(template);
    onClose();
  };

  const getPreviewMessage = () => {
    const mockTitle = "프로젝트 보고서 작성";
    const mockCategory = "업무";
    const mockDueTime = "14:00";

    let message = '';

    if (selectedType === 'custom' && customMessage) {
      message = customMessage
        .replace('{title}', mockTitle)
        .replace('{category}', mockCategory)
        .replace('{time}', mockDueTime);
    } else {
      const preset = TEMPLATE_PRESETS.find(p => p.type === selectedType);
      if (preset) {
        const example = preset.examples[0];
        message = example.replace('{title}', mockTitle);
      }
    }

    // Add emoji if enabled
    if (includeEmoji && selectedType !== 'custom') {
      const categoryEmojis: { [key: string]: string } = {
        '업무': '💼',
        '개인': '🏠',
        '건강': '🏃‍♂️',
        '학습': '📚'
      };
      const emoji = categoryEmojis[mockCategory] || '📌';
      if (!message.includes(emoji)) {
        message = `${emoji} ${message}`;
      }
    }

    // Add category info
    if (includeCategory) {
      message = `[${mockCategory}] ${message}`;
    }

    // Add due time info
    if (includeDueTime) {
      message += ` (${mockDueTime}까지)`;
    }

    return message;
  };

  const generateRandomExample = () => {
    const preset = TEMPLATE_PRESETS.find(p => p.type === selectedType);
    if (!preset) return '';

    const prefix = preset.prefix[Math.floor(Math.random() * preset.prefix.length)];
    const suffix = preset.suffixes[Math.floor(Math.random() * preset.suffixes.length)];
    
    return `${prefix}{title}${suffix}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>취소</Text>
          </TouchableOpacity>
          <Text style={styles.title}>메시지 템플릿</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveButton}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Preview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>미리보기</Text>
            <View style={styles.previewContainer}>
              <Ionicons name="notifications" size={20} color="#4CAF50" />
              <Text style={styles.previewText}>{getPreviewMessage()}</Text>
            </View>
          </View>

          {/* Template Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메시지 스타일</Text>
            {TEMPLATE_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.type}
                style={[
                  styles.templateOption,
                  selectedType === preset.type && styles.selectedTemplateOption
                ]}
                onPress={() => setSelectedType(preset.type)}
              >
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{preset.name}</Text>
                    <Text style={styles.templateDescription}>{preset.description}</Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedType === preset.type && styles.selectedRadioButton
                  ]}>
                    {selectedType === preset.type && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
                <View style={styles.examplesContainer}>
                  {preset.examples.slice(0, 2).map((example, index) => (
                    <Text key={index} style={styles.exampleText}>
                      • {example.replace('{title}', '프로젝트 보고서 작성')}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))}

            {/* Custom Template Option */}
            <TouchableOpacity
              style={[
                styles.templateOption,
                selectedType === 'custom' && styles.selectedTemplateOption
              ]}
              onPress={() => setSelectedType('custom')}
            >
              <View style={styles.templateHeader}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>사용자 정의</Text>
                  <Text style={styles.templateDescription}>직접 메시지를 작성하세요</Text>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedType === 'custom' && styles.selectedRadioButton
                ]}>
                  {selectedType === 'custom' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Custom Message Input */}
          {selectedType === 'custom' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>사용자 정의 메시지</Text>
              <TextInput
                style={styles.customMessageInput}
                value={customMessage}
                onChangeText={setCustomMessage}
                placeholder="예: 📋 {title}을 확인해주세요!"
                multiline
                numberOfLines={3}
                maxLength={100}
              />
              <Text style={styles.helpText}>
                사용 가능한 변수: {'{title}'}, {'{category}'}, {'{time}'}
              </Text>
            </View>
          )}

          {/* Additional Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>추가 옵션</Text>
            
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setIncludeEmoji(!includeEmoji)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>카테고리 이모지 포함</Text>
                <Text style={styles.optionDescription}>
                  각 카테고리에 맞는 이모지를 자동으로 추가합니다
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                includeEmoji && styles.checkedCheckbox
              ]}>
                {includeEmoji && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setIncludeDueTime(!includeDueTime)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>마감 시간 표시</Text>
                <Text style={styles.optionDescription}>
                  알림 메시지에 마감 시간을 함께 표시합니다
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                includeDueTime && styles.checkedCheckbox
              ]}>
                {includeDueTime && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => setIncludeCategory(!includeCategory)}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>카테고리 표시</Text>
                <Text style={styles.optionDescription}>
                  알림 메시지에 카테고리명을 함께 표시합니다
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                includeCategory && styles.checkedCheckbox
              ]}>
                {includeCategory && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Random Example Generator */}
          {selectedType !== 'custom' && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => {
                  const example = generateRandomExample();
                  Alert.alert(
                    '새로운 예시',
                    example.replace('{title}', '프로젝트 보고서 작성'),
                    [{ text: '확인', style: 'default' }]
                  );
                }}
              >
                <Ionicons name="shuffle" size={20} color="#4CAF50" />
                <Text style={styles.generateButtonText}>다른 예시 보기</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    lineHeight: 20,
  },
  templateOption: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  selectedTemplateOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 13,
    color: '#666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: '#4CAF50',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  examplesContainer: {
    marginTop: 8,
  },
  exampleText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 2,
  },
  customMessageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  generateButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 8,
  },
});