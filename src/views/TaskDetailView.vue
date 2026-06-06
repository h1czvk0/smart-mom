<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { tasks } from '../data/mock'

const route = useRoute()
const task = computed(() => tasks.find((item) => item.id === route.params.id) ?? tasks[0])

const form = reactive({
  process: task.value.process,
  device: task.value.device,
  finishedQty: 120,
  badQty: 2,
  abnormal: false,
  abnormalText: '',
  remark: '本批次装配检测完成，待质检复核。',
})

const message = ref('')
const reportRecords = ref([
  {
    time: '2026-06-06 10:30',
    process: task.value.process,
    finishedQty: 80,
    badQty: 1,
    status: '正常',
  },
])

function submitReport() {
  message.value = ''

  if (form.finishedQty === '' || Number(form.finishedQty) <= 0) {
    message.value = '完成数量必须大于 0。'
    return
  }

  if (Number(form.badQty) < 0 || Number(form.badQty) > Number(form.finishedQty)) {
    message.value = '不良数量不能小于 0，也不能大于完成数量。'
    return
  }

  if (form.abnormal && !form.abnormalText.trim()) {
    message.value = '选择异常时必须填写异常说明。'
    return
  }

  reportRecords.value.unshift({
    time: new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date()),
    process: form.process,
    finishedQty: Number(form.finishedQty),
    badQty: Number(form.badQty),
    status: form.abnormal ? '异常' : '正常',
  })
  message.value = form.abnormal ? '异常报工已记录，任务状态需跟进处理。' : '报工提交成功，生产记录已更新。'
}
</script>

<template>
  <section class="panel">
    <div class="section-title">
      <h2>任务详情 / 报工</h2>
      <span>{{ task.id }} - {{ task.product }}</span>
    </div>
    <form class="report-form" @submit.prevent="submitReport">
      <label>当前工序<input v-model="form.process" /></label>
      <label>使用设备<input v-model="form.device" /></label>
      <label>完成数量<input v-model.number="form.finishedQty" type="number" min="0" /></label>
      <label>不良数量<input v-model.number="form.badQty" type="number" min="0" /></label>
      <label class="check-inline">
        <input v-model="form.abnormal" type="checkbox" />
        本次报工存在异常
      </label>
      <label>异常说明<textarea v-model="form.abnormalText" placeholder="如有异常请填写"></textarea></label>
      <label>备注<textarea v-model="form.remark" placeholder="填写本次报工备注"></textarea></label>
      <button type="submit">提交报工</button>
    </form>

    <p v-if="message" class="feedback">{{ message }}</p>

    <div class="section-title compact-title">
      <h2>报工记录</h2>
      <span>{{ reportRecords.length }} 条记录</span>
    </div>
    <div class="task-cards">
      <article v-for="record in reportRecords" :key="record.time" class="task-card">
        <strong>{{ record.process }} / {{ record.status }}</strong>
        <span>完成 {{ record.finishedQty }} 件，不良 {{ record.badQty }} 件</span>
        <em>{{ record.time }}</em>
      </article>
    </div>
  </section>
</template>
