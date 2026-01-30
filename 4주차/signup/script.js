// SignupApp 클래스 - 상태 관리 및 비즈니스 로직
class SignupApp {
    // Private 필드로 상태 캡슐화
    #users; // 저장된 사용자 목록
    #observers; // 옵저버 패턴을 위한 리스너 배열
    #validationState; // 유효성 검사 상태

    constructor() {
        // 상태 초기화
        this.#users = {};
        this.#observers = [];
        this.#validationState = {
            username: { isValid: false, isChecked: false, message: '' },
            password: { isValid: false, message: '' },
            passwordConfirm: { isValid: false, message: '' },
            email: { isValid: false, message: '' }
        };

        // 초기화
        this.init();
    }

    // 초기화 메서드
    init() {
        this.loadUsers();
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
                validationState: this.#validationState,
                ...data
            });
        });
    }

    // 상태 접근자
    getValidationState() {
        return JSON.parse(JSON.stringify(this.#validationState));
    }

    // 아이디 중복 체크
    checkUsernameDuplicate(username) {
        if (!username || username.trim().length === 0) {
            this.#validationState.username = {
                isValid: false,
                isChecked: false,
                message: '아이디를 입력해주세요.'
            };
            this.notifyObservers('usernameValidationChanged', {
                username: username
            });
            throw new Error('아이디를 입력해주세요.');
        }

        const trimmedUsername = username.trim();

        // 아이디 형식 검사 (영문, 숫자, 4-20자)
        if (!/^[a-zA-Z0-9]{4,20}$/.test(trimmedUsername)) {
            this.#validationState.username = {
                isValid: false,
                isChecked: true,
                message: '아이디는 영문, 숫자만 사용 가능하며 4-20자여야 합니다.'
            };
            this.notifyObservers('usernameValidationChanged', {
                username: trimmedUsername
            });
            throw new Error('아이디는 영문, 숫자만 사용 가능하며 4-20자여야 합니다.');
        }

        // 중복 체크
        const isDuplicate = this.#users.hasOwnProperty(trimmedUsername);

        this.#validationState.username = {
            isValid: !isDuplicate,
            isChecked: true,
            message: isDuplicate ? '이미 사용 중인 아이디입니다.' : '사용 가능한 아이디입니다.'
        };

        this.notifyObservers('usernameValidationChanged', {
            username: trimmedUsername,
            isDuplicate: isDuplicate
        });

        return !isDuplicate;
    }

    // 비밀번호 정규성 체크
    validatePassword(password) {
        if (!password) {
            this.#validationState.password = {
                isValid: false,
                message: ''
            };
            this.notifyObservers('passwordValidationChanged', {
                password: password,
                requirements: this.getPasswordRequirements(password)
            });
            return false;
        }

        const requirements = this.getPasswordRequirements(password);
        const isValid = Object.values(requirements).every(req => req.valid);

        this.#validationState.password = {
            isValid: isValid,
            message: isValid ? '' : '비밀번호 요구사항을 만족하지 않습니다.'
        };

        this.notifyObservers('passwordValidationChanged', {
            password: password,
            requirements: requirements
        });

        return isValid;
    }

    // 비밀번호 요구사항 체크
    getPasswordRequirements(password) {
        return {
            length: {
                valid: password.length >= 8,
                message: '8자 이상'
            },
            upper: {
                valid: /[A-Z]/.test(password),
                message: '대문자 포함'
            },
            lower: {
                valid: /[a-z]/.test(password),
                message: '소문자 포함'
            },
            number: {
                valid: /[0-9]/.test(password),
                message: '숫자 포함'
            },
            special: {
                valid: /[!@#$%^&*]/.test(password),
                message: '특수문자 포함 (!@#$%^&*)'
            }
        };
    }

    // 비밀번호 확인 체크
    validatePasswordConfirm(password, passwordConfirm) {
        if (!passwordConfirm) {
            this.#validationState.passwordConfirm = {
                isValid: false,
                message: ''
            };
            this.notifyObservers('passwordConfirmValidationChanged', {
                passwordConfirm: passwordConfirm
            });
            return false;
        }

        const isValid = password === passwordConfirm;

        this.#validationState.passwordConfirm = {
            isValid: isValid,
            message: isValid ? '' : '비밀번호가 일치하지 않습니다.'
        };

        this.notifyObservers('passwordConfirmValidationChanged', {
            passwordConfirm: passwordConfirm
        });

        return isValid;
    }

    // 이메일 유효성 체크
    validateEmail(email) {
        if (!email) {
            this.#validationState.email = {
                isValid: false,
                message: ''
            };
            this.notifyObservers('emailValidationChanged', {
                email: email
            });
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);

        this.#validationState.email = {
            isValid: isValid,
            message: isValid ? '' : '올바른 이메일 형식이 아닙니다.'
        };

        this.notifyObservers('emailValidationChanged', {
            email: email
        });

        return isValid;
    }

    // 전체 폼 유효성 검사
    isFormValid() {
        return this.#validationState.username.isValid &&
               this.#validationState.password.isValid &&
               this.#validationState.passwordConfirm.isValid &&
               this.#validationState.email.isValid;
    }

    // 회원가입 처리
    signup(username, password, email) {
        // 최종 유효성 검사
        if (!this.#validationState.username.isChecked) {
            throw new Error('아이디 중복확인을 해주세요.');
        }

        if (!this.isFormValid()) {
            throw new Error('모든 항목을 올바르게 입력해주세요.');
        }

        // 사용자 저장
        this.#users[username.trim()] = {
            username: username.trim(),
            password: password, // 실제로는 해시화해야 함
            email: email.trim(),
            createdAt: new Date().toISOString()
        };

        this.saveUsers();
        this.notifyObservers('signupSuccess', {
            username: username.trim()
        });
    }

    // 로컬 스토리지 저장
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.#users));
    }

    // 로컬 스토리지 불러오기
    loadUsers() {
        const saved = localStorage.getItem('users');
        if (saved) {
            this.#users = JSON.parse(saved);
        }
    }
}

// SignupUI 클래스 - UI 렌더링 및 이벤트 처리
class SignupUI {
    constructor(signupApp) {
        this.signupApp = signupApp;
        this.elements = this.getElements();
        this.setupObservers();
        this.setupEventListeners();
    }

    // DOM 요소 참조 가져오기
    getElements() {
        return {
            form: document.getElementById('signupForm'),
            username: document.getElementById('username'),
            btnCheckId: document.getElementById('btnCheckId'),
            usernameError: document.getElementById('usernameError'),
            usernameSuccess: document.getElementById('usernameSuccess'),
            password: document.getElementById('password'),
            passwordError: document.getElementById('passwordError'),
            passwordRequirements: document.getElementById('passwordRequirements'),
            passwordConfirm: document.getElementById('passwordConfirm'),
            passwordConfirmError: document.getElementById('passwordConfirmError'),
            email: document.getElementById('email'),
            emailError: document.getElementById('emailError'),
            btnSubmit: document.getElementById('btnSubmit')
        };
    }

    // 옵저버 구독 설정
    setupObservers() {
        this.signupApp.subscribe((event, data) => {
            switch (event) {
                case 'usernameValidationChanged':
                    this.updateUsernameUI(data);
                    break;
                case 'passwordValidationChanged':
                    this.updatePasswordUI(data);
                    break;
                case 'passwordConfirmValidationChanged':
                    this.updatePasswordConfirmUI(data);
                    break;
                case 'emailValidationChanged':
                    this.updateEmailUI(data);
                    break;
                case 'signupSuccess':
                    this.handleSignupSuccess(data);
                    break;
            }
        });
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 아이디 입력 시 중복확인 상태 초기화
        this.elements.username.addEventListener('input', () => {
            const validationState = this.signupApp.getValidationState();
            if (validationState.username.isChecked) {
                validationState.username.isChecked = false;
                this.elements.usernameError.textContent = '';
                this.elements.usernameSuccess.textContent = '';
                this.elements.username.classList.remove('success', 'error');
            }
        });

        // 중복확인 버튼
        this.elements.btnCheckId.addEventListener('click', () => {
            this.handleCheckUsername();
        });

        // 비밀번호 입력 시 실시간 검사
        this.elements.password.addEventListener('input', () => {
            const password = this.elements.password.value;
            this.signupApp.validatePassword(password);
            
            // 비밀번호 확인도 다시 검사
            if (this.elements.passwordConfirm.value) {
                this.signupApp.validatePasswordConfirm(
                    password,
                    this.elements.passwordConfirm.value
                );
            }
        });

        // 비밀번호 확인 입력 시 검사
        this.elements.passwordConfirm.addEventListener('input', () => {
            this.signupApp.validatePasswordConfirm(
                this.elements.password.value,
                this.elements.passwordConfirm.value
            );
        });

        // 이메일 입력 시 실시간 검사
        this.elements.email.addEventListener('input', () => {
            this.signupApp.validateEmail(this.elements.email.value);
        });

        // 폼 제출
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    // 아이디 중복확인 처리
    handleCheckUsername() {
        const username = this.elements.username.value;
        
        try {
            this.signupApp.checkUsernameDuplicate(username);
        } catch (error) {
            // 에러는 이미 상태에 반영됨
        }
    }

    // 아이디 UI 업데이트
    updateUsernameUI(data) {
        const state = this.signupApp.getValidationState().username;
        
        this.elements.usernameError.textContent = '';
        this.elements.usernameSuccess.textContent = '';
        this.elements.username.classList.remove('error', 'success');

        if (state.isChecked) {
            if (state.isValid) {
                this.elements.usernameSuccess.textContent = state.message;
                this.elements.username.classList.add('success');
            } else {
                this.elements.usernameError.textContent = state.message;
                this.elements.username.classList.add('error');
            }
        }
    }

    // 비밀번호 UI 업데이트
    updatePasswordUI(data) {
        const state = this.signupApp.getValidationState().password;
        const requirements = data.requirements || {};

        // 에러 메시지
        this.elements.passwordError.textContent = state.message;
        this.elements.password.classList.toggle('error', !state.isValid && this.elements.password.value.length > 0);

        // 요구사항 표시 업데이트
        const requirementIds = {
            length: 'reqLength',
            upper: 'reqUpper',
            lower: 'reqLower',
            number: 'reqNumber',
            special: 'reqSpecial'
        };

        Object.keys(requirementIds).forEach(key => {
            const element = document.getElementById(requirementIds[key]);
            if (element) {
                const requirement = requirements[key];
                if (requirement) {
                    element.classList.toggle('valid', requirement.valid);
                    element.classList.toggle('invalid', !requirement.valid);
                }
            }
        });
    }

    // 비밀번호 확인 UI 업데이트
    updatePasswordConfirmUI(data) {
        const state = this.signupApp.getValidationState().passwordConfirm;
        
        this.elements.passwordConfirmError.textContent = state.message;
        this.elements.passwordConfirm.classList.toggle('error', !state.isValid && this.elements.passwordConfirm.value.length > 0);
    }

    // 이메일 UI 업데이트
    updateEmailUI(data) {
        const state = this.signupApp.getValidationState().email;
        
        this.elements.emailError.textContent = state.message;
        this.elements.email.classList.toggle('error', !state.isValid && this.elements.email.value.length > 0);
    }

    // 폼 제출 처리
    handleSubmit() {
        const username = this.elements.username.value.trim();
        const password = this.elements.password.value;
        const email = this.elements.email.value.trim();

        // 아이디 중복확인 체크
        const validationState = this.signupApp.getValidationState();
        if (!validationState.username.isChecked) {
            alert('아이디 중복확인을 해주세요.');
            return;
        }

        try {
            this.signupApp.signup(username, password, email);
        } catch (error) {
            alert(error.message);
        }
    }

    // 회원가입 성공 처리
    handleSignupSuccess(data) {
        alert(`회원가입이 완료되었습니다!\n환영합니다, ${data.username}님!`);
        this.elements.form.reset();
        
        // 모든 상태 초기화
        this.elements.username.classList.remove('error', 'success');
        this.elements.password.classList.remove('error');
        this.elements.passwordConfirm.classList.remove('error');
        this.elements.email.classList.remove('error');
        
        // 요구사항 표시 초기화
        document.querySelectorAll('.requirement-item').forEach(item => {
            item.classList.remove('valid', 'invalid');
        });
    }
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    const signupApp = new SignupApp();
    const signupUI = new SignupUI(signupApp);
});

