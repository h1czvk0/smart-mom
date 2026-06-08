import { reactive } from 'vue'
import { devices, reportRecords, tasks } from '../data/mock'

const STORAGE_KEY = 'smart-mom-production-state'

export const workflowActions = [
  { stage: '装配', action: '开始装配', stateAfter: '装配进行中' },
  { stage: '装配', action: '完成装配', stateAfter: '检查待开始' },
  { stage: '检查', action: '开始检查', stateAfter: '检查进行中' },
  { stage: '检查', action: '完成检查', stateAfter: '包装待开始' },
  { stage: '包装', action: '开始包装', stateAfter: '包装进行中' },
  { stage: '包装', action: '完成包装', stateAfter: '已完成' },
]

export const workflowStages = [
  { name: '装配', startActionIndex: 0, finishActionIndex: 1 },
  { name: '检查', startActionIndex: 2, finishActionIndex: 3 },
  { name: '包装', startActionIndex: 4, finishActionIndex: 5 },
]

const workflowStates = ['装配待开始', ...workflowActions.map((item) => item.stateAfter)]

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function clampWorkflowStep(value) {
  return Math.min(workflowActions.length, Math.max(0, Math.trunc(Number(value) || 0)))
}

function deriveLegacyWorkflowStep(task) {
  if (Number.isFinite(Number(task.workflowStep))) {
    return clampWorkflowStep(task.workflowStep)
  }

  if (task.status === '已完成' || Number(task.progress) >= 100) {
    return workflowActions.length
  }

  return clampWorkflowStep(Math.round((Number(task.progress) / 100) * workflowActions.length))
}

function normalizeTask(source) {
  const task = clone(source)
  const workflowStep = deriveLegacyWorkflowStep(task)

  task.workflowStep = workflowStep
  task.workflowName = task.workflowName || '标准装检包工艺'
  task.progress = getWorkflowProgress(workflowStep)
  task.process = workflowStates[workflowStep]

  if (workflowStep === workflowActions.length) {
    task.status = '已完成'
  } else if (task.status !== '异常') {
    task.status = workflowStep === 0 ? '待生产' : '生产中'
  }

  return task
}

function normalizeState(source) {
  return {
    tasks: source.tasks.map(normalizeTask),
    devices: clone(source.devices),
    reportRecords: clone(source.reportRecords),
  }
}

function getDefaultState() {
  return normalizeState({ tasks, devices, reportRecords })
}

function loadState() {
  if (typeof window === 'undefined') {
    return getDefaultState()
  }

  try {
    const cached = window.localStorage.getItem(STORAGE_KEY)

    if (cached) {
      const parsed = JSON.parse(cached)

      if (Array.isArray(parsed.tasks) && Array.isArray(parsed.devices) && Array.isArray(parsed.reportRecords)) {
        return normalizeState(parsed)
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return getDefaultState()
}

function formatTimestamp() {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(/\//g, '-')
}

function createTaskId() {
  const date = new Date()
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('')
  const prefix = `WO-${datePart}-`
  const sequence =
    productionState.tasks.reduce((max, task) => {
      if (!task.id.startsWith(prefix)) {
        return max
      }

      return Math.max(max, Number(task.id.slice(prefix.length)) || 0)
    }, 0) + 1

  return `${prefix}${String(sequence).padStart(3, '0')}`
}

export function getWorkflowProgress(step) {
  return Math.round((clampWorkflowStep(step) / workflowActions.length) * 100)
}

export function getNextWorkflowAction(task) {
  return workflowActions[clampWorkflowStep(task.workflowStep)] ?? null
}

export function getWorkflowStageState(task, stageIndex) {
  const step = clampWorkflowStep(task.workflowStep)
  const stage = workflowStages[stageIndex]

  if (step > stage.finishActionIndex) {
    return 'completed'
  }

  if (step > stage.startActionIndex) {
    return 'active'
  }

  return 'pending'
}

export const productionState = reactive(loadState())

export function saveProductionState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      tasks: productionState.tasks,
      devices: productionState.devices,
      reportRecords: productionState.reportRecords,
    }),
  )
}

export function resetProductionState() {
  const initialState = getDefaultState()

  productionState.tasks.splice(0, productionState.tasks.length, ...initialState.tasks)
  productionState.devices.splice(0, productionState.devices.length, ...initialState.devices)
  productionState.reportRecords.splice(0, productionState.reportRecords.length, ...initialState.reportRecords)
  saveProductionState()
}

export function findTaskById(id) {
  return productionState.tasks.find((task) => task.id === id)
}

export function createProductionTask(payload) {
  const product = String(payload.product ?? '').trim()
  const owner = String(payload.owner ?? '').trim()
  const planQty = Number(payload.planQty)

  if (!product || !owner || !payload.line || !payload.device || !payload.deadline) {
    throw new Error('请完整填写产品、产线、设备、负责人和截止时间。')
  }

  if (!Number.isInteger(planQty) || planQty <= 0) {
    throw new Error('计划数量必须是大于 0 的整数。')
  }

  const task = normalizeTask({
    id: createTaskId(),
    product,
    line: payload.line,
    process: '装配待开始',
    device: payload.device,
    owner,
    status: '待生产',
    progress: 0,
    workflowStep: 0,
    workflowName: '标准装检包工艺',
    priority: payload.priority,
    urgent: Boolean(payload.urgent),
    planQty,
    finishedQty: 0,
    deadline: payload.deadline,
    abnormalType: '',
  })

  productionState.tasks.unshift(task)
  saveProductionState()

  return task
}

export function submitTaskReport(taskId, payload) {
  const task = findTaskById(taskId)

  if (!task) {
    throw new Error(`未找到工单：${taskId}`)
  }

  const nextAction = getNextWorkflowAction(task)
  const abnormalText = String(payload.abnormalText ?? '').trim()
  const remark = String(payload.remark ?? '').trim()

  if (!nextAction) {
    throw new Error('该任务已完成全部工序，不能继续报工。')
  }

  if (payload.action !== nextAction.action) {
    throw new Error(`当前只能执行“${nextAction.action}”，不能跳过或重复工序。`)
  }

  if (payload.abnormal && !abnormalText) {
    throw new Error('异常报工必须填写异常说明。')
  }

  task.device = payload.device || task.device

  if (payload.abnormal) {
    task.status = '异常'
    task.abnormalType = abnormalText
  } else {
    task.workflowStep = clampWorkflowStep(task.workflowStep + 1)
    task.progress = getWorkflowProgress(task.workflowStep)
    task.process = workflowStates[task.workflowStep]
    task.status = task.workflowStep === workflowActions.length ? '已完成' : '生产中'
    task.abnormalType = ''

    if (task.workflowStep === workflowActions.length) {
      task.finishedQty = task.planQty
    }
  }

  const record = {
    id: `${task.id}-${Date.now()}`,
    taskId: task.id,
    time: formatTimestamp(),
    process: nextAction.stage,
    action: nextAction.action,
    workflowStep: task.workflowStep,
    progress: task.progress,
    advanced: !payload.abnormal,
    device: task.device,
    status: payload.abnormal ? '异常' : '正常',
    remark: payload.abnormal ? abnormalText : remark || `${nextAction.action}已确认。`,
  }

  productionState.reportRecords.unshift(record)
  saveProductionState()

  return record
}
