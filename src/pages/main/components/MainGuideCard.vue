<template>
  <div class="guide-card">
    <p class="guide-title">HisTour 이렇게 사용해요</p>
    <ol class="guide-list">
      <li>
        <span class="guide-num">1</span>
        <div>
          <strong>여행 만들기</strong>
          <p>날짜와 이름을 입력해 여행을 시작하세요.</p>
        </div>
      </li>
      <li>
        <span class="guide-num">2</span>
        <div>
          <strong>현장에서 사진 찍기</strong>
          <p>문화재 앞에서 사진을 찍으면 AI가 역사 해설을 들려드려요.</p>
        </div>
      </li>
      <li>
        <span class="guide-num">3</span>
        <div>
          <strong>퀴즈로 기억 남기기</strong>
          <p>여행 후 퀴즈로 오늘 배운 역사를 오래 기억하세요.</p>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.guide-card {
  padding: 22px;
  border: 1px solid var(--color-outline-variant);
  border-radius: 18px;
  background: var(--color-surface-lowest);
}

.guide-title {
  margin-bottom: 18px;
  color: var(--color-primary-container);
  font-size: 14px;
  font-weight: 700;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  list-style: none;
  padding: 0;
}
.guide-list li {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.guide-num {
  display: grid;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  place-items: center;
  flex-shrink: 0;
  background: var(--color-primary-container);
  color: var(--color-on-primary);
  font-size: 11px;
  font-weight: 700;
}

.guide-list strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary-container);
}
.guide-list p {
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>
