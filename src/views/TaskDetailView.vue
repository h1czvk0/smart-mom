<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ProgressBar from '../components/common/ProgressBar.vue'
import StatusTag from '../components/common/StatusTag.vue'
import {
  findTaskById,
  getNextWorkflowAction,
  getWorkflowStageState,
  productionState,
  submitTaskReport,
  workflowActions,
  workflowStages,
} from '../stores/productionStore'

const route = useRoute()
const task = computed(() => findTaskById(route.params.id) ?? productionState.tasks[0])
const form = reactive({
  device: '',
  abnormal: false,
  abnormalText: '',
  remark: '',
})
const message = ref('')
const messageType = ref('success')

watch(
  task,
  (current) => {
    form.device = current.device
    form.abnormal = false
    form.abnormalText = ''
    form.remark = ''
  },
  { immediate: true },
)

const nextAction = computed(() => getNextWorkflowAction(task.value))
const taskRecords = computed(() =>
  productionState.reportRecords.filter((record) => record.taskId === task.value.id),
)
const availableDevices = computed(() =>
  productionState.devices.filter((device) => device.line === task.value.line),
)
const processTimeline = computed(() =>
  workflowStages.map((stage, stageIndex) => ({
    ...stage,
    state: getWorkflowStageState(task.value, stageIndex),
    checkpoints: [stage.startActionIndex, stage.finishActionIndex].map((actionIndex) => ({
      ...workflowActions[actionIndex],
      done: task.value.workflowStep > actionIndex,
      next: task.value.workflowStep === actionIndex,
    })),
  })),
)

function submitReport() {
  message.value = ''

  try {
    const action = nextAction.value?.action

    const record = submitTaskReport(task.value.id, {
      ...form,
      action,
    })

    form.abnormal = false
    form.abnormalText = ''
    form.remark = ''

    if (!record.advanced) {
      setMessage(`异常已记录，工序未推进。处理后仍需执行“${action}”。`, 'warning')
    } else {
      setMessage(
        task.value.status === '已完成'
          ? '包装已完成，全部工序闭环，任务进度达到 100%。'
          : `“${action}”报工成功，下一步只能执行“${nextAction.value.action}”。`,
        'success',
      )
    }
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '报工提交失败。', 'error')
  }
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
          <h2>任务详情 / 工序报工</h2>
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
          <span>计划数量</span>
          <strong>{{ task.planQty }} 件</strong>
        </div>
        <div>
          <span>截止时间</span>
          <strong>{{ task.deadline }}</strong>
        </div>
      </div>

      <div class="progress-block">
        <div class="section-title compact-title">
          <div>
            <h2>工序闭环进度</h2>
            <span>{{ task.workflowName }} · 已完成 {{ task.workflowStep }} / {{ workflowActions.length }} 个节点</span>
          </div>
          <strong class="current-process">{{ task.process }}</strong>
        </div>
        <ProgressBar :value="task.progress" />

        <div class="process-timeline">
          <article
            v-for="stage in processTimeline"
            :key="stage.name"
            class="process-stage"
            :class="`is-${stage.state}`"
          >
            <div class="process-stage-head">
              <strong>{{ stage.name }}</strong>
              <span>{{ stage.state === 'completed' ? '已完成' : stage.state === 'active' ? '进行中' : '待开始' }}</span>
            </div>
            <ol>
              <li
                v-for="checkpoint in stage.checkpoints"
                :key="checkpoint.action"
                :class="{ done: checkpoint.done, next: checkpoint.next }"
              >
                <span class="checkpoint-mark">{{ checkpoint.done ? '✓' : checkpoint.next ? '→' : '·' }}</span>
                {{ checkpoint.action }}
              </li>
            </ol>
          </article>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="section-title">
        <div>
          <h2>顺序报工</h2>
          <span>系统锁定下一节点，不能跳过或重复工序</span>
        </div>
        <StatusTag :value="task.status" />
      </div>

      <div v-if="nextAction" class="next-action-panel">
        <span>当前唯一可执行动作</span>
        <strong>{{ nextAction.action }}</strong>
        <small>完成后自动进入“{{ nextAction.stateAfter }}”</small>
      </div>
      <div v-else class="next-action-panel is-complete">
        <span>工序状态</span>
        <strong>全部工序已闭环</strong>
        <small>装配、检查和包装均已完成。</small>
      </div>

      <form class="report-form workflow-report-form" @submit.prevent="submitReport">
        <label>
          使用设备
          <select v-model="form.device" :disabled="!nextAction">
            <option v-for="device in availableDevices" :key="device.code" :value="`${device.code} ${device.name}`">
              {{ device.code }} {{ device.name }}
            </option>
          </select>
        </label>
        <label class="check-inline">
          <input v-model="form.abnormal" type="checkbox" :disabled="!nextAction" />
          本次报工存在异常
        </label>
        <label class="workflow-form-wide">
          异常说明
          <textarea
            v-model="form.abnormalText"
            :disabled="!nextAction || !form.abnormal"
            placeholder="出现异常时填写原因、影响和处置情况"
          ></textarea>
        </label>
        <label class="workflow-form-wide">
          报工备注
          <textarea
            v-model="form.remark"
            :disabled="!nextAction"
            :placeholder="nextAction ? `填写“${nextAction.action}”的现场记录` : '任务已完成'"
          ></textarea>
        </label>
        <button type="submit" :disabled="!nextAction">
          {{ nextAction ? `确认${nextAction.action}` : '工序已完成' }}
        </button>
      </form>

      <p v-if="message" class="feedback" :class="messageType">{{ message }}</p>
    </section>

    <section class="panel detail-records">
      <div class="section-title">
        <h2>报工记录</h2>
        <span>{{ taskRecords.length }} 条记录</span>
      </div>
      <div class="task-cards">
        <article
          v-for="record in taskRecords"
          :key="record.id ?? `${record.taskId}-${record.time}-${record.action ?? record.process}`"
          class="task-card workflow-record"
        >
          <div>
            <strong>{{ record.action ?? record.process }}</strong>
            <StatusTag :value="record.status" />
          </div>
          <span>{{ record.device }}</span>
          <span v-if="record.progress !== undefined">
            {{ record.advanced === false ? `异常阻断，仍停留在 ${record.progress}%` : `工序进度更新至 ${record.progress}%` }}
          </span>
          <span v-else-if="record.finishedQty !== undefined">
            历史数量报工：完成 {{ record.finishedQty }} 件，不良 {{ record.badQty }} 件
          </span>
          <small>{{ record.time }} / {{ record.remark }}</small>
        </article>
        <article v-if="taskRecords.length === 0" class="task-card empty-state">
          <strong>暂无报工记录</strong>
          <span>执行“{{ nextAction?.action ?? '已完成' }}”后会在这里追加工序记录。</span>
        </article>
      </div>
    </section>
  </section>
</template>
