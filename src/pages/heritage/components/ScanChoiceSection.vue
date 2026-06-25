<script setup lang="ts">
defineEmits<{
  chooseCamera: []
  chooseUpload: []
}>()
</script>

<template>
  <section class="scan-choice" aria-labelledby="scan-choice-title">
    <div class="choice-emblem" aria-hidden="true">⌖</div>
    <p>HERITAGE ARCHIVE</p>
    <h1 id="scan-choice-title">문화재를 어떻게<br />기록할까요?</h1>
    <span>지금 촬영하거나 사진첩에 저장된 이미지를 선택할 수 있어요.</span>
    <div class="choice-actions">
      <button type="button" @click="$emit('chooseCamera')">
        <i aria-hidden="true">◎</i>
        <strong>사진 촬영</strong>
        <small>카메라로 문화재를 촬영해요</small>
      </button>
      <button type="button" @click="$emit('chooseUpload')">
        <i aria-hidden="true">▧</i>
        <strong>사진 업로드</strong>
        <small>사진첩에서 이미지를 선택해요</small>
      </button>
    </div>
    <slot name="error" />
  </section>
</template>

<style scoped>
.scan-choice {
  position: absolute;
  z-index: 2;
  inset: 0;
  padding: 105px 27px 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(160deg, rgba(6, 20, 40, 0.76), rgba(12, 15, 20, 0.92));
  backdrop-filter: blur(8px);
  color: white;
}

.choice-emblem {
  width: 58px;
  height: 58px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 18px;
  display: grid;
  place-items: center;
  color: #ffd4b2;
  background: rgba(255, 255, 255, 0.1);
  font-size: 30px;
}

.scan-choice > p {
  margin-top: 17px;
  color: #efb77d;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.scan-choice h1 {
  margin-top: 7px;
  font-family: var(--font-serif);
  font-size: 28px;
  line-height: 1.35;
}

.scan-choice > span {
  max-width: 290px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 11px;
  line-height: 1.55;
}

.choice-actions {
  width: 100%;
  margin-top: 32px;
  display: grid;
  gap: 12px;
}

.choice-actions button {
  min-height: 82px;
  padding: 14px 17px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 13px;
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-rows: auto auto;
  column-gap: 13px;
  align-items: center;
  text-align: left;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.choice-actions button:active {
  transform: scale(0.98);
  background: rgba(255, 255, 255, 0.16);
}

.choice-actions i {
  grid-row: 1 / 3;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #ffd4b2;
  background: rgba(255, 255, 255, 0.1);
  font-size: 24px;
  font-style: normal;
}

.choice-actions strong {
  align-self: end;
  font-size: 14px;
}

.choice-actions small {
  align-self: start;
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 9px;
}
</style>
