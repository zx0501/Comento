// DOM 요소 가져오기
const currentTimeElement = document.getElementById('currentTime');
const timeSection = document.getElementById('timeSection');
const batteryPercent = document.querySelector('.battery-percent');
const batteryFill = document.querySelector('.battery-fill');
const alarmHour = document.getElementById('alarmHour');
const alarmMinute = document.getElementById('alarmMinute');
const alarmSecond = document.getElementById('alarmSecond');
const addAlarmBtn = document.getElementById('addAlarmBtn');
const alarmList = document.getElementById('alarmList');

// 상태 관리
let batteryLevel = 100;
let alarms = [];
const MAX_ALARMS = 3;

// 시간 포맷팅 함수
function formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 시간 업데이트 함수
function updateTime() {
    const now = new Date();
    currentTimeElement.textContent = formatTime(now);

    // 알람 체크
    checkAlarms(now);
}

// 배터리 업데이트 함수
function updateBattery() {
    batteryLevel--;

    if (batteryLevel < 0) {
        batteryLevel = 0;
    }

    // 배터리 퍼센트 표시
    batteryPercent.textContent = `${batteryLevel}%`;

    // 배터리 아이콘 업데이트
    const fillWidth = (batteryLevel / 100) * 26;
    batteryFill.setAttribute('width', fillWidth);

    // 배터리 색상 변경 (낮을수록 빨간색)
    if (batteryLevel <= 20) {
        batteryFill.setAttribute('fill', '#ff4444');
        batteryPercent.style.color = '#ff4444';
    } else if (batteryLevel <= 50) {
        batteryFill.setAttribute('fill', '#ffaa00');
        batteryPercent.style.color = '#ffaa00';
    } else {
        batteryFill.setAttribute('fill', 'currentColor');
        batteryPercent.style.color = '';
    }

    // 배터리 0%일 때 시간 섹션과 시간 숫자 숨기기
    if (batteryLevel === 0) {
        timeSection.classList.add('hidden');
        currentTimeElement.classList.add('hidden');
    } else {
        timeSection.classList.remove('hidden');
        currentTimeElement.classList.remove('hidden');
    }
}

// 알람 추가 함수
function addAlarm() {
    // 최대 개수 체크
    if (alarms.length >= MAX_ALARMS) {
        alert(`알람은 최대 ${MAX_ALARMS}개까지 추가할 수 있습니다.`);
        return;
    }

    const hour = parseInt(alarmHour.value) || 0;
    const minute = parseInt(alarmMinute.value) || 0;
    const second = parseInt(alarmSecond.value) || 0;

    // 유효성 검사
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
        alert('올바른 시간을 입력해주세요.');
        return;
    }

    // 알람 객체 생성
    const alarm = {
        id: Date.now(),
        hour: hour,
        minute: minute,
        second: second,
        enabled: true,
        timeString: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}` 
    };

    alarms.push(alarm);
    updateAlarmList();

    // 입력 필드 리셋
    alarmHour.value = 0;
    alarmMinute.value = 0;
    alarmSecond.value = 0;
}

// 알람 리스트 업데이트 함수
function updateAlarmList() {
    alarmList.innerHTML = '';

    alarms.forEach(alarm => {
        const li = document.createElement('li');

        // 토글 버튼 스타일 클래스
        const toggleClass = alarm.enabled ? 'toggle-on' : 'toggle-off';
        const toggleText = alarm.enabled ? 'ON' : 'OFF';

        li.innerHTML = `
            <span class="alarm-time ${alarm.enabled ? '' : 'disabled'}">${alarm.timeString}</span>
            <div class="alarm-controls">
                <button class="toggle-btn ${toggleClass}" onclick="toggleAlarm(${alarm.id})">${toggleText}</button>
                <button class="delete-btn" onclick="deleteAlarm(${alarm.id})">삭제</button>
            </div>
        `;
        alarmList.appendChild(li);
    })
}

// 알람 토글 함수
function toggleAlarm(alarmId) {
    const alarm = alarms.find(a => a.id === alarmId);
    if (alarm) {
        alarm.enabled = !alarm.enabled;
        updateAlarmList();
    }
}

// 알람 삭제 함수
function deleteAlarm(alarmId) {
    alarms = alarms.filter(alarm => alarm.id !== alarmId);
    updateAlarmList();
}

// 알람 체크 함수
function checkAlarms(now) {
    alarms.forEach(alarm => {
        // enabled가 true인 알람만 체크
        if (alarm.enabled &&
            now.getHours() === alarm.hour &&
            now.getMinutes() === alarm.minute &&
            now.getSeconds() === alarm.second) {
                alert(`알람: ${alarm.timeString}`);
            }
    });
}

// 전역 함수로 등록 (버튼 onclick에서 사용)
window.deleteAlarm = deleteAlarm;
window.toggleAlarm = toggleAlarm;

// 이벤트 리스너
addAlarmBtn.addEventListener('click', addAlarm);

// 초기 실행
updateTime();
updateBattery();

// 1초마다 시간과 배터리 업데이트
setInterval(() => {
    updateTime();
    updateBattery();
}, 1000);