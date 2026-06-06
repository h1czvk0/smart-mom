<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ProgressBar from '../components/common/ProgressBar.vue'
import StatusTag from '../components/common/StatusTag.vue'
import { devices, reportRecords, tasks } from '../data/mock'

const route = useRoute()
const task = computed(() => tasks.find((item) => item.id === route.params.id) ?? tasks[0])
const taskRecords = ref([])

const form = reactive({
  process: '',
  device: '',
  finishedQty: 120,
  badQty: 2,
  abnormal: false,
  abnormalText: '',
  remark: '本批次生产完成，等待质检复核。',
})

const message = ref('')
const messageType = ref('success')

watch(
  task,
  (current) => {
    form.process = current.process
    form.device = current.device
    taskRecords.value = reportRecords.filter((record) => record.taskId === current.id)
  },
  { immediate: true },
)

const processTimeline = computed(() => {
  const steps = ['排产下发', '物料齐套', task.value.process, '质量复核', '入库交接']
  const activeIndex = task.value.status === '已完成' ? steps.length - 1 : Math.max(1, Math.round(task.value.progress / 25))

  return steps.map((name, index) => ({
    name,
    done: index <= activeIndex,
  }))
})

function submitReport() {
  message.value = ''

  if (form.finishedQty === '' || Number(form.finishedQty) <= 0) {
    setMessage('完成数量必须大于 0。', 'error')
    return
  }

  if (Number(form.badQty) < 0 || Number(form.badQty) > Number(form.finishedQty)) {
    setMessage('不良数量不能小于 0，也不能大于完成数量。', 'error')
    return
  }

  if (form.abnormal && !form.abnormalText.trim()) {
    setMessage('选择异常时必须填写异常说明。', 'error')
    return
  }

  const finishedQty = Number(form.finishedQty)
  const badQty = Number(form.badQty)
  const currentTask = task.value

  currentTask.finishedQty = Math.min(currentTask.planQty, currentTask.finishedQty + finishedQty)
  currentTask.progress = Math.min(100, Math.round((currentTask.finishedQty / currentTask.planQty) * 100))
  currentTask.status = form.abnormal ? '异常' : currentTask.progress >= 100 ? '已完成' : '生产中'
  currentTask.abnormalType = form.abnormal ? form.abnormalText.trim() : currentTask.abnormalType

  const record = {
    taskId: currentTask.id,
    time: new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .format(new Date())
      .replace(/\//g, '-'),
    process: form.process,
    device: form.device,
    finishedQty,
    badQty,
    status: form.abnormal ? '异常' : '正常',
    remark: form.abnormal ? form.abnormalText.trim() : form.remark.trim(),
  }

  reportRecords.unshift(record)
  taskRecords.value.unshift(record)
  setMessage(
    form.abnormal ? '异常报工已记录，任务状态已切换为异常。' : '报工提交成功，任务进度已更新。',
    form.abnormal ? 'warning' : 'success',
  )
}

function setMessage(text, type) {
  message.value = text
  messageType.value = type
}
</script>

<template>
  <section class="detail-layout">
    <section class="panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">Work Order Detail</p>
          <h2>任务详情 / 报工</h2>
        </div>
        <RouterLink class="text-link" to="/tasks">返回任务列表</RouterLink>
      </div>

      <div class="detail-summary">
        <div>
          <span>工单号</span>
          <strong>{{ task.id }}</strong>
        </div>
        <div>
          <span>产品</span>
          <strong>{{ task.product }}</strong>
        </div>
        <div>
          <span>状态</span>
          <StatusTag :value="task.status" />
        </div>
        <div>
          <span>负责人</span>
          <strong>{{ task.owner }}</strong>
        </div>
        <div>
          <span>计划 / 完成</span>
          <strong>{{ task.planQty }} / {{ task.finishedQty }}</strong>
        </div>
        <div>
          <span>截止时间</span>
          <strong>{{ task.deadline }}</strong>
        </div>
      </div>

      <div class="progress-block">
        <div class="section-title compact-title">
          <h2>执行进度</h2>
          <span>{{ task.line }} / {{ task.device }}</span>
        </div>
        <ProgressBar :value="task.progress" />
        <div class="timeline">
          <span v-for="step in processTimeline" :key="step.name" :class="{ done: step.done }">{{ step.name }}</span>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-title">
        <h2>报工录入</h2>
        <span>v-model 表单校验</span>
      </div>
      <form class="report-form" @submit.prevent="submitReport">
        <label>当前工序<input v-model="form.process" /></label>
        <label>
          使用设备
          <select v-model="form.device">
            <option>{{ task.device }}</option>
            <option v-for="device in devices" :key="device.code">{{ device.code }} {{ device.name }}</option>
          </select>
        </label>
        <label>本次完成数量<input v-model.number="form.finishedQty" type="number" min="0" /></label>
        <label>不良数量<input v-model.number="form.badQty" type="number" min="0" /></label>
        <label class="check-inline">
          <input v-model="form.abnormal" type="checkbox" />
          本次报工存在异常
        </label>
        <label>异常说明<textarea v-model="form.abnormalText" placeholder="如有异常请填写原因、影响和处理建议"></textarea></label>
        <label>备注<textarea v-model="form.remark" placeholder="填写本次报工备注"></textarea></label>
        <button type="submit">提交报工</button>
      </form>

      <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    </section>

    <section class="panel detail-records">
      <div class="section-title">
        <h2>报工记录</h2>
        <span>{{ taskRecords.length }} 条记录</span>
      </div>
      <div class="task-cards">
        <article v-for="record in taskRecords" :key="`${record.taskId}-${record.time}`" class="task-card">
          <strong>{{ record.process }} / {{ record.status }}</strong>
          <span>{{ record.device }}</span>
          <span>完成 {{ record.finishedQty }} 件，不良 {{ record.badQty }} 件</span>
          <small>{{ record.time }} / {{ record.remark }}</small>
        </article>
        <article v-if="taskRecords.length === 0" class="task-card empty-state">
          <strong>暂无报工记录</strong>
          <span>提交报工后会在这里追加生产记录。</span>
        </article>
      </div>
    </section>
  </section>
</template>
