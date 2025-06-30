# SimplyToDo 애플리케이션 에러 로그

## 에러 1: Cannot read property 'find' of undefined

### 에러 설명
TodoList 컴포넌트에서 할 일 항목을 렌더링하는 과정에서 카테고리 데이터를 찾을 때 발생하는 에러입니다. 스크린샷에 표시된 에러 메시지는 "Cannot read property 'find' of undefined"로, `categories` 배열이 undefined일 때 `find` 메서드를 호출하여 발생했습니다.

### 에러 발생 위치
1. `types/Todo.ts` 파일의 `findCategoryById` 함수
2. `components/TodoList.tsx` 파일에서 `TodoItem` 컴포넌트에 카테고리 정보를 전달하는 부분

### 근본 원인
1. `findCategoryById` 함수가 `categories` 파라미터가 undefined인 경우를 적절히 처리하지 못함
2. TodoList에서 TodoItem으로 카테고리 데이터를 전달하는 과정에서 불필요한 변환 작업 발생
3. TodoItem 컴포넌트가 직접 카테고리 ID를 처리하는 로직이 부재

### 해결 방법

#### 1. Todo.ts의 findCategoryById 함수 수정
```typescript
// 수정 전
export const findCategoryById = (categories: Category[], id: string | null): Category | undefined => {
  if (!id) return undefined;
  return categories.find(category => category.id === id);
};

// 수정 후
export const findCategoryById = (categories: Category[] | undefined, id: string | null): Category | undefined => {
  if (!id || !categories || !Array.isArray(categories)) return undefined;
  return categories.find(category => category.id === id);
};
```

#### 2. TodoList.tsx 수정 - 카테고리 객체 대신 ID 전달
```tsx
// 수정 전
<TodoItem
  id={item.id}
  text={item.text}
  completed={item.completed}
  importance={item.importance}
  dueDate={item.dueDate}
  category={findCategoryById(categories, item.categoryId)}
  onComplete={onToggle}
  onDelete={onDelete}
/>

// 수정 후
<TodoItem
  id={item.id}
  text={item.text}
  completed={item.completed}
  importance={item.importance}
  dueDate={item.dueDate}
  categoryId={item.categoryId}
  onComplete={onToggle}
  onDelete={onDelete}
/>
```

#### 3. TodoItem.tsx 수정 - 카테고리 ID 처리 로직 추가
TodoItem 컴포넌트에 categoryId를 처리하는 로직을 추가하여, 직접 categoryId를 받고 AsyncStorage에서 해당 카테고리 정보를 로드하도록 수정했습니다. 이렇게 하면 컴포넌트 간 데이터 의존성이 줄어들고 각 컴포넌트가 자신이 필요한 데이터를 직접 관리하게 됩니다.

```tsx
// 수정된 인터페이스
interface TodoItemProps {
  id: string;
  text: string;
  completed: boolean;
  importance: number;
  dueDate: number | null;
  categoryId?: string | null;  // 카테고리 ID 사용
  category?: Category;  // 직접 카테고리 객체를 전달받는 경우 (옵셔널)
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

// 카테고리 로드 로직 추가
const [resolvedCategory, setResolvedCategory] = useState<Category | undefined>(category);

useEffect(() => {
  // 이미 category 객체가 전달되었으면 그것을 사용
  if (category) {
    setResolvedCategory(category);
    return;
  }
  
  // categoryId가 있으면 해당 ID로 카테고리 찾기
  if (categoryId) {
    const loadCategory = async () => {
      try {
        const storedCategories = await AsyncStorage.getItem('categories');
        if (storedCategories) {
          const parsedCategories = JSON.parse(storedCategories);
          const found = parsedCategories.find((c: Category) => c.id === categoryId);
          setResolvedCategory(found || undefined);
        } else {
          // 저장된 카테고리가 없으면 기본 카테고리에서 찾기
          const found = DefaultCategories.find(c => c.id === categoryId);
          setResolvedCategory(found || undefined);
        }
      } catch (error) {
        console.error('Error loading category:', error);
      }
    };
    
    loadCategory();
  } else {
    setResolvedCategory(undefined);
  }
}, [categoryId, category]);
```

### 개선 효과
1. 카테고리 데이터 관련 에러가 발생하지 않음
2. 컴포넌트 간 결합도 감소
3. 데이터 흐름 개선 - 각 컴포넌트가 자신에게 필요한 데이터만 직접 처리
4. null/undefined 체크를 통한 안정성 향상

### 추가 고려사항
카테고리 데이터 관리를 위한 Context API나 Redux와 같은 상태 관리 라이브러리를 도입하면 컴포넌트 간 데이터 공유를 더 효율적으로 관리할 수 있을 것입니다.
