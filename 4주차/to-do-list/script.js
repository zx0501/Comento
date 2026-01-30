class TodoApp {
    // Private 필드로 상태 캡슐화
    #currentDate;
    #selectedDate;
    #todos;
    #observers; // 옵저버 패턴을 위한 리스너 배열열

    constructor() {
        // 상태 초기화
        this.#currentDate = new Date();
        this.#selectedDate = new Date();
        this.#todos = {};
        this.#observers = [];

        // 초기화
        this.init();
    }

    // 초기화 메서드
    init() {
        this.loadTodos();
        this.setupEventListeners();
        this.notifyObservers('init');
    }

    // 옵저버 패턴: 상태 변경 알림 구독
    subscribe(callback) {
        this.#observers.push(callback);
    }

    // 옵저버 패턴: 상태 변경 시 모든 구독자에게 알림
    notifyObservers(event, data = {}) {
        this.#observers.forEach(callback => {
            callback(event, {
                currentDate: this.#currentDate,
                selectedDate: this.#selectedDate,
                todos: this.#todos,
                ...data
            });
        });
    }

    // 상태 접근자 (읽기 전용)
    getCurrentDate() {
        return new Date(this.#currentDate);
    }

    getSelectedDate() {
        return new Date(this.#selectedDate);
    }

    getTodos() {
        return JSON.parse(JSON.stringify(this.#todos)); // 깊은 복사로 외부 수정 방지
    }

    getTodosByDate(dateStr) {
        return this.#todos[dateStr] || [];
    }

    // 상태 변경 메서드 (단방향 흐름)
    setCurrentDate(date) {
        this.#currentDate = new Date(date);
        this.notifyObservers('currentDateChanged');
    }

    setSelectedDate(date) {
        this.#selectedDate = new Date(date);

        // 선택한 날짜가 다른 월이면 현재 월도 변경
        if (this.#currentDate.getMonth() !== this.#selectedDate.getMonth() || this.#currentDate.getFullYear() !== this.#selectedDate.getFullYear()) {
            this.setCurrentDate(this.#selectedDate);
        } else {
            this.notifyObservers('selectedDateChanged');
        }
    }

    // 일정 추가 (상태 변경 통제)
    addTodo(dateStr, text) {
        if (!text || text.trim()) {
            throw new Error('할 일을 입력해주세요.');
        }

        if (!this.#todos[dateStr]) {
            this.#todos[dateStr] = [];
        }

        if (this.#todos[dateStr].length >= 5) {
            throw new Error('최대 5개의 일정만 추가할 수 있습니다.');
        }

        const newTodo = {
            id: Date.now(),
            text: text.trim(),
            completed: false
        };

        this.#todos[dateStr].push(newTodo);
        this.saveTodos();
        this.notifyObservers('todoAdded', { dateStr, todo: newTodo });
    }

    // 일정 삭제
    deleteTodo(dateStr, todoId) {
        if (!this.#todos[dateStr]) return;

        this.#todos[dateStr] = this.#todos[dateStr].filter(todo => todo.id !== todoId);

        if (this.#todos[dateStr].length === 0) {
            delete this.#todos[dateStr];
        }

        this.saveTodos();
        this.notifyObservers('todoDeleted', { dateStr, todoId });

    }

      // 일정 완료 토글
      toggleTodo(dateStr, todoId) {
        if (!this.#todos[dateStr]) return;

        const todo = this.#todos[dateStr].find(t => t.id === todoId);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.notifyObservers('todoToggled', { dateStr, todoId, completed: todo.completed });
        }
    }

    // 로컬 스토리지 저장
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.#todos));
    }

    // 로컬 스토리지 불러오기
    loadTodos() {
        const saved = localStorage.getItem('todos');
        if (saved) {
            this.#todos = JSON.parse(saved);
        }
    }
}

// UI 렌더링 클래스
class TodoUI {
    constructor(todoApp) {
        this.todoApp = todoApp;
        this.elements = this.getElements();
        this.setupObservers();
    }

    // DOM 요소 참조 가져오기
    getElements() {
        return {
            prevMonth: document.getElementById('prevMonth'),
            nextMonth: document.getElementById('nextMonth'),
            monthYear: document.getElementById('monthYear'),
            calendarDays: document.getElementById('calendarDays'),
            selectedDate: document.getElementById('selectedDate'),
            todoList: document.getElementById('todoList'),
            floatingBtn: document.getElementById('floatingBtn'),
            modalOverlay: document.getElementById('modalOverlay'),
            modalClose: document.getElementById('modalClose'),
            btnCancel: document.getElementById('btnCancel'),
            btnAdd: document.getElementById('btnAdd'),
            todoInput: document.getElementById('todoInput')
        };
    }

    // 옵저버 구독 설정
    setupObservers() {
        this.todoApp.subscribe((event, data) => {
            switch (event) {
                case 'init':
                case 'currentDateChanged':
                    this.renderCalendar();
                    this.renderTodos();
                    break;
                case 'selectedDateChanged':
                    this.renderCalendar();
                    this.renderTodos();
                    break;
                case 'todoAdded':
                case 'todoDeleted':
                case 'todoToggled':
                    this.renderCalendar();
                    this.renderTodos();
                    break;
            }
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 월 이동 버튼
        this.elements.prevMonth.addEventListener('click', () => {
            const currentDate = this.todoApp.getCurrentDate();
            currentDate.setMonth(currentDate.getMonth() - 1);
            this.todoApp.setCurrentDate(currentDate);
        });

        this.elements.nextMonth.addEventListener('click', () => {
            const currentDate = this.todoApp.getCurrentDate();
            currentDate.setMonth(currentDate.getMonth() + 1);
            this.todoApp.setCurrentDate(currentDate);
        });

        // 플로팅 버튼
        this.elements.floatingBtn.addEventListener('click', () => this.openModal());

        // 모달 닫기
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.btnCancel.addEventListener('click', () => this.closeModal());
        this.elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'modalOverlay') {
                this.closeModal();
            }
        });

        // 일정 추가
        this.elements.btnAdd.addEventListener('click', () => this.handleAddTodo());
        this.elements.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTodo();
            }
        });
    }

    // 캘린더 렌더링
    renderCalendar() {
        const currentDate = this.todoApp.getCurrentDate();
        const selectedDate = this.todoApp.getSelectedDate();
        const todos = this.todoApp.getTodos();
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // 월/년도 표시
        this.elements.monthYear.textContent = `${year}년 ${month + 1}월`;

        // 첫 번째 날짜와 마지막 날짜
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        this.elements.calendarDays.innerHTML = '';

        // 이전 달 날짜들
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = prevMonthLastDay - i;
            const date = new Date(year, month - 1, day);
            const dayElement = this.createDayElement(date, true, selectedDate, todos);
            this.elements.calendarDays.appendChild(dayElement);
        }

        // 현재 달 날짜들
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = this.createDayElement(date, false, selectedDate, todos);
            this.elements.calendarDays.appendChild(dayElement);
        }

        // 다음 달 날짜들
        const totalCells = this.elements.calendarDays.children.length;
        const remainingCells = 42 - totalCells;
        for (let day = 1; day <= remainingCells; day++) {
            const date = new Date(year, month + 1, day);
            const dayElement = this.createDayElement(date, true, selectedDate, todos);
            this.elements.calendarDays.appendChild(dayElement);
        }
    }

    // 날짜 요소 생성
    createDayElement(date, isOtherMonth, selectedDate, todos) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }

        const dateStr = this.formatDate(date);
        const day = date.getDate();

        // 오늘 날짜 체크
        const today = new Date();
        if (this.isSameDate(date, today)) {
            dayElement.classList.add('today');
        }

        // 선택된 날짜 체크
        if (this.isSameDate(date, selectedDate)) {
            dayElement.classList.add('selected');
        }

        // 일정이 있는 날짜 체크
        if (todos[dateStr] && todos[dateStr].length > 0) {
            dayElement.classList.add('has-todos');
        }

        dayElement.textContent = day;
        dayElement.addEventListener('click', () => {
            this.todoApp.setSelectedDate(date);
        });

        return dayElement;
    }

    // 일정 목록 렌더링
    renderTodos() {
        const selectedDate = this.todoApp.getSelectedDate();
        const dateStr = this.formatDate(selectedDate);
        const dateTodos = this.todoApp.getTodosByDate(dateStr);

        // 선택된 날짜 표시
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        this.elements.selectedDate.textContent = 
            selectedDate.toLocaleDateString('ko-KR', dateOptions);

        // 일정 목록 렌더링
        this.elements.todoList.innerHTML = '';

        if (dateTodos.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'todo-item';
            emptyMessage.style.justifyContent = 'center';
            emptyMessage.style.color = '#999';
            emptyMessage.textContent = '일정이 없습니다.';
            this.elements.todoList.appendChild(emptyMessage);
        } else {
            dateTodos.forEach(todo => {
                const todoItem = this.createTodoItem(todo, dateStr);
                this.elements.todoList.appendChild(todoItem);
            });
        }
    }

    // 일정 아이템 생성
    createTodoItem(todo, dateStr) {
        const li = document.createElement('li');
        li.className = 'todo-item';

        const checkbox = document.createElement('div');
        checkbox.className = 'todo-checkbox';
        if (todo.completed) {
            checkbox.classList.add('completed');
        }
        checkbox.addEventListener('click', () => {
            this.todoApp.toggleTodo(dateStr, todo.id);
        });

        const text = document.createElement('span');
        text.className = 'todo-text';
        if (todo.completed) {
            text.classList.add('completed');
        }
        text.textContent = todo.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'todo-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => {
            this.todoApp.deleteTodo(dateStr, todo.id);
        });

        li.appendChild(checkbox);
        li.appendChild(text);
        li.appendChild(deleteBtn);

        return li;
    }

    // 모달 열기
    openModal() {
        const selectedDate = this.todoApp.getSelectedDate();
        const dateStr = this.formatDate(selectedDate);
        const dateTodos = this.todoApp.getTodosByDate(dateStr);

        if (dateTodos.length >= 5) {
            alert('최대 5개의 일정만 추가할 수 있습니다.');
            return;
        }

        this.elements.modalOverlay.classList.add('active');
        this.elements.todoInput.value = '';
        this.elements.todoInput.focus();
    }

    // 모달 닫기
    closeModal() {
        this.elements.modalOverlay.classList.remove('active');
        this.elements.todoInput.value = '';
    }

    // 일정 추가 처리
    handleAddTodo() {
        const text = this.elements.todoInput.value;
        const selectedDate = this.todoApp.getSelectedDate();
        const dateStr = this.formatDate(selectedDate);

        try {
            this.todoApp.addTodo(dateStr, text);
            this.closeModal();
        } catch (error) {
            alert(error.message);
        }
    }

    // 유틸리티 메서드
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    const todoApp = new TodoApp();
    const todoUI = new TodoUI(todoApp);
    todoUI.setupEventListeners();
});