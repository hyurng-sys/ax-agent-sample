// 데이터 저장소
let bloodSugarData = JSON.parse(localStorage.getItem('bloodSugarData')) || [];
let currentPeriod = 'daily';

// DOM 요소
const dateInput = document.getElementById('date');
const bloodSugarInput = document.getElementById('bloodSugar');
const addBtn = document.getElementById('addBtn');
const tabs = document.querySelectorAll('.tab');
const recordsList = document.getElementById('recordsList');
const avgValue = document.getElementById('avgValue');
const maxValue = document.getElementById('maxValue');
const minValue = document.getElementById('minValue');
const canvas = document.getElementById('bloodSugarChart');
const ctx = canvas.getContext('2d');

// 오늘 날짜로 기본 설정
dateInput.valueAsDate = new Date();

// 혈당 추가
addBtn.addEventListener('click', () => {
    const date = dateInput.value;
    const bloodSugar = parseInt(bloodSugarInput.value);

    if (!date || !bloodSugar || bloodSugar <= 0) {
        alert('날짜와 혈당 수치를 올바르게 입력해주세요.');
        return;
    }

    // 같은 날짜가 있으면 업데이트, 없으면 추가
    const existingIndex = bloodSugarData.findIndex(item => item.date === date);
    if (existingIndex >= 0) {
        bloodSugarData[existingIndex].value = bloodSugar;
    } else {
        bloodSugarData.push({ date, value: bloodSugar });
    }

    // 날짜순 정렬
    bloodSugarData.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 저장 및 화면 업데이트
    saveData();
    bloodSugarInput.value = '';
    updateView();

    // 피드백 애니메이션
    addBtn.textContent = '✓ 추가됨!';
    setTimeout(() => {
        addBtn.textContent = '기록 추가';
    }, 1500);
});

// 탭 전환
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentPeriod = tab.dataset.period;
        updateView();
    });
});

// 데이터 저장
function saveData() {
    localStorage.setItem('bloodSugarData', JSON.stringify(bloodSugarData));
}

// 기간별 데이터 필터링
function getFilteredData() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return bloodSugarData.filter(item => {
        const itemDate = new Date(item.date);
        const diffDays = Math.floor((today - itemDate) / (1000 * 60 * 60 * 24));

        switch (currentPeriod) {
            case 'daily':
                return diffDays < 7; // 최근 7일
            case 'weekly':
                return diffDays < 30; // 최근 30일
            case 'monthly':
                return diffDays < 90; // 최근 90일
            default:
                return true;
        }
    });
}

// 통계 계산
function calculateStats(data) {
    if (data.length === 0) {
        return { avg: '-', max: '-', min: '-', values: [] };
    }

    const values = data.map(item => item.value);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return { avg, max, min, values };
}

// 건강 조언 생성
function generateHealthAdvice(stats, dataCount) {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');
    const adviceTips = document.getElementById('adviceTips');

    if (dataCount === 0 || stats.avg === '-') {
        statusBadge.textContent = '-';
        statusBadge.className = 'status-badge';
        statusText.textContent = '데이터를 입력하면 건강 평가가 표시됩니다.';
        adviceTips.innerHTML = '';
        return;
    }

    const avg = stats.avg;
    const values = stats.values;

    // 혈당 범위별 개수 계산
    const highCount = values.filter(v => v > 140).length;
    const normalCount = values.filter(v => v >= 100 && v <= 140).length;
    const lowCount = values.filter(v => v < 100).length;

    const highPercent = Math.round((highCount / dataCount) * 100);
    const normalPercent = Math.round((normalCount / dataCount) * 100);
    const lowPercent = Math.round((lowCount / dataCount) * 100);

    let status = '';
    let statusClass = '';
    let statusMessage = '';
    let tips = [];

    // 평균 혈당 기반 전체 평가
    if (avg >= 100 && avg <= 120) {
        status = '우수';
        statusClass = 'excellent';
        statusMessage = `평균 혈당이 ${avg} mg/dL로 매우 잘 관리되고 있습니다! 👍`;
        tips.push({
            icon: '✨',
            text: '현재 상태가 매우 좋습니다. 지금처럼 꾸준히 관리하세요.',
            type: 'normal'
        });
    } else if (avg > 120 && avg <= 140) {
        status = '양호';
        statusClass = 'good';
        statusMessage = `평균 혈당이 ${avg} mg/dL로 정상 범위입니다. 잘하고 계십니다!`;
        tips.push({
            icon: '💪',
            text: '혈당이 정상 범위에 있지만, 120 이하로 낮추면 더 좋습니다.',
            type: 'normal'
        });
    } else if (avg > 140 && avg <= 180) {
        status = '주의';
        statusClass = 'warning';
        statusMessage = `평균 혈당이 ${avg} mg/dL로 정상 범위를 초과합니다. 관리가 필요합니다.`;
        tips.push({
            icon: '⚠️',
            text: '식사량을 조절하고 당분 섭취를 줄이는 것이 좋습니다.',
            type: 'warning'
        });
    } else {
        status = '위험';
        statusClass = 'danger';
        statusMessage = `평균 혈당이 ${avg} mg/dL로 매우 높습니다. 즉시 관리가 필요합니다!`;
        tips.push({
            icon: '🚨',
            text: '의사와 상담하여 식단 및 약물 조절이 필요할 수 있습니다.',
            type: 'danger'
        });
    }

    // 높은 혈당 비율에 따른 조언
    if (highPercent > 50) {
        tips.push({
            icon: '🍽️',
            text: `전체의 ${highPercent}%가 140 이상입니다. 저녁 식사량을 20% 정도 줄여보세요.`,
            type: 'warning'
        });
        tips.push({
            icon: '🚶',
            text: '식후 20-30분 가볍게 산책하면 혈당 조절에 도움이 됩니다.',
            type: 'normal'
        });
    } else if (highPercent > 20) {
        tips.push({
            icon: '🥗',
            text: `${highPercent}%의 기록이 높습니다. 탄수화물 섭취를 조절해보세요.`,
            type: 'normal'
        });
    }

    // 낮은 혈당에 대한 조언
    if (lowPercent > 20) {
        tips.push({
            icon: '🍎',
            text: `${lowPercent}%의 기록이 100 미만입니다. 식사량이 너무 적지 않은지 확인하세요.`,
            type: 'warning'
        });
    }

    // 변동성 체크
    const range = stats.max - stats.min;
    if (range > 50) {
        tips.push({
            icon: '📊',
            text: `혈당 변동폭이 ${range} mg/dL로 큽니다. 매일 비슷한 양의 식사를 하면 안정화에 도움이 됩니다.`,
            type: 'normal'
        });
    }

    // 일관성 있는 관리에 대한 격려
    if (normalPercent >= 70) {
        tips.push({
            icon: '🎯',
            text: `전체의 ${normalPercent}%가 정상 범위입니다. 훌륭한 관리입니다!`,
            type: 'normal'
        });
    }

    // 추가 일반 조언
    if (tips.length < 3) {
        tips.push({
            icon: '💧',
            text: '충분한 수분 섭취는 혈당 관리에 도움이 됩니다.',
            type: 'normal'
        });
    }

    // UI 업데이트
    statusBadge.textContent = status;
    statusBadge.className = `status-badge ${statusClass}`;
    statusText.textContent = statusMessage;

    // 조언 팁 렌더링
    adviceTips.innerHTML = tips.map(tip => `
        <div class="advice-tip ${tip.type === 'warning' || tip.type === 'danger' ? tip.type : ''}">
            <span class="tip-icon">${tip.icon}</span>
            <p class="tip-text">${tip.text}</p>
        </div>
    `).join('');
}

// 혈당 레벨 판단
function getBloodSugarLevel(value) {
    if (value < 100) return 'low';
    if (value > 140) return 'high';
    return 'normal';
}

// 화면 업데이트
function updateView() {
    const filteredData = getFilteredData();
    const stats = calculateStats(filteredData);

    // 통계 업데이트
    avgValue.textContent = stats.avg === '-' ? '-' : `${stats.avg} mg/dL`;
    maxValue.textContent = stats.max === '-' ? '-' : `${stats.max} mg/dL`;
    minValue.textContent = stats.min === '-' ? '-' : `${stats.min} mg/dL`;

    // 건강 조언 업데이트
    generateHealthAdvice(stats, filteredData.length);

    // 기록 리스트 업데이트
    if (filteredData.length === 0) {
        recordsList.innerHTML = '<p class="empty-message">이 기간에는 기록이 없습니다.</p>';
    } else {
        recordsList.innerHTML = filteredData.map((item, index) => `
            <div class="record-item">
                <span class="record-date">${formatDate(item.date)}</span>
                <span class="record-value ${getBloodSugarLevel(item.value)}">${item.value} mg/dL</span>
                <button class="record-delete" onclick="deleteRecord('${item.date}')">삭제</button>
            </div>
        `).join('');
    }

    // 차트 업데이트
    drawChart(filteredData);
}

// 날짜 포맷
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];

    return `${month}월 ${day}일 (${weekday})`;
}

// 기록 삭제
function deleteRecord(date) {
    if (confirm('이 기록을 삭제하시겠습니까?')) {
        bloodSugarData = bloodSugarData.filter(item => item.date !== date);
        saveData();
        updateView();
    }
}

// 차트 그리기
function drawChart(data) {
    // 캔버스 크기 설정
    const container = canvas.parentElement;
    canvas.width = container.clientWidth - 40;
    canvas.height = 300;

    if (data.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#999';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('데이터가 없습니다', canvas.width / 2, canvas.height / 2);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 데이터를 날짜순으로 정렬 (오래된 것부터)
    const sortedData = [...data].reverse();

    // 차트 여백
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // 값 범위
    const values = sortedData.map(d => d.value);
    const maxVal = Math.max(...values, 200);
    const minVal = Math.min(...values, 50);
    const range = maxVal - minVal;

    // 좌표 계산
    const points = sortedData.map((item, index) => {
        const x = padding + (chartWidth / (sortedData.length - 1 || 1)) * index;
        const y = padding + chartHeight - ((item.value - minVal) / range) * chartHeight;
        return { x, y, value: item.value, date: item.date };
    });

    // 기준선 그리기 (정상 범위: 100-140)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // 140 선
    const y140 = padding + chartHeight - ((140 - minVal) / range) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, y140);
    ctx.lineTo(canvas.width - padding, y140);
    ctx.stroke();

    // 100 선
    const y100 = padding + chartHeight - ((100 - minVal) / range) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(padding, y100);
    ctx.lineTo(canvas.width - padding, y100);
    ctx.stroke();

    ctx.setLineDash([]);

    // 라벨
    ctx.fillStyle = '#999';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('140', padding - 10, y140 + 4);
    ctx.fillText('100', padding - 10, y100 + 4);

    // 선 그리기
    if (points.length > 1) {
        ctx.strokeStyle = '#03C75A';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }

    // 점 그리기
    points.forEach(point => {
        const level = getBloodSugarLevel(point.value);
        let color = '#03C75A';
        if (level === 'high') color = '#ff6b6b';
        if (level === 'low') color = '#ffa94d';

        // 외곽
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // 내부
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    // X축 라벨 (날짜)
    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    points.forEach((point, index) => {
        if (sortedData.length <= 10 || index % Math.ceil(sortedData.length / 7) === 0) {
            const date = new Date(point.date);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;
            ctx.fillText(label, point.x, canvas.height - padding + 20);
        }
    });
}

// 초기 로드
updateView();

// 윈도우 리사이즈 시 차트 다시 그리기
window.addEventListener('resize', () => {
    updateView();
});
