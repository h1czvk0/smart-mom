import { reactive } from 'vue'
import { devices, reportRecords, tasks } from '../data/mock'

const STORAGE_KEY = 'smart-mom-production-state'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadState() {
  if (typeof window === 'undefined') {
    return {
      tasks: clone(tasks),
      devices: clone(devices),
      reportRecords: clone(reportRecords),
    }
  }

  try {
    const cached = window.localStorage.getItem(STORAGE_KEY)

    if (cached) {
      const parsed = JSON.parse(cached)

      if (Array.isArray(parsed.tasks) && Array.isArray(parsed.devices) && Array.isArray(parsed.reportRecords)) {
        return parsed
      }
    }
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
  }

  return {
    tasks: clone(tasks),
    devices: clone(devices),
    reportRecords: clone(reportRecords),
  }
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
  productionState.tasks.splice(0, productionState.tasks.length, ...clone(tasks))
  productionState.devices.splice(0, productionState.devices.length, ...clone(devices))
  productionState.reportRecords.splice(0, productionState.reportRecords.length, ...clone(reportRecords))
  saveProductionState()
}

export function findTaskById(id) {
  return productionState.tasks.find((task) => task.id === id)
}

export function submitTaskReport(taskId, payload) {
  const task = findTaskById(taskId)

  if (!task) {
    throw new Error(`未找到工单：${taskId}`)
  }

  const finishedQty = Number(payload.finishedQty)
  const badQty = Number(payload.badQty)

  task.finishedQty = Math.min(task.planQty, task.finishedQty + finishedQty)
  task.progress = Math.min(100, Math.round((task.finishedQty / task.planQty) * 100))
  task.status = payload.abnormal ? '异常' : task.progress >= 100 ? '已完成' : '生产中'
  task.abnormalType = payload.abnormal ? payload.abnormalText.trim() : task.abnormalType

  const record = {
    taskId: task.id,
    time: new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .format(new Date())
      .replace(/\//g, '-'),
    process: payload.process,
    device: payload.device,
    finishedQty,
    badQty,
    status: payload.abnormal ? '异常' : '正常',
    remark: payload.abnormal ? payload.abnormalText.trim() : payload.remark.trim(),
  }

  productionState.reportRecords.unshift(record)
  saveProductionState()

  return record
}
