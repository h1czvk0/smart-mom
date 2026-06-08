<script setup>
import { Plus, X } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ProgressBar from '../components/common/ProgressBar.vue'
import StatusTag from '../components/common/StatusTag.vue'
import { lineOptions, statusOptions } from '../data/mock'
import { createProductionTask, productionState } from '../stores/productionStore'

const route = useRoute()
const router = useRouter()
const keyword = ref('')
const status = ref('全部状态')
const line = ref('全部产线')
const urgentOnly = ref(false)
const sortBy = ref('deadline')
const showCreateForm = ref(false)
const createError = ref('')
const createForm = reactive({
  product: '',
  line: 'A 产线',
  device: '',
  owner: '',
  planQty: 500,
  deadline: getDefaultDeadline(),
  priority: '中',
  urgent: false,
})

const priorityScore = {
  高: 3,
  中: 2,
  低: 1,
}

const availableDevices = computed(() =>
  productionState.devices.filter((device) => device.line === createForm.line),
)

watch(
  () => route.query.keyword,
  (value) => {
    keyword.value = typeof value === 'string' ? value : ''
  },
  { immediate: true },
)

watch(
  availableDevices,
  (current) => {
    if (!current.some((device) => `${device.code} ${device.name}` === createForm.device)) {
      const firstDevice = current[0]
      createForm.device = firstDevice ? `${firstDevice.code} ${firstDevice.name}` : ''
    }
  },
  { immediate: true },
)

const filteredTasks = computed(() => {
  const text = keyword.value.trim().toLowerCase()

  return productionState.tasks
    .filter((task) => {
      const matchesKeyword =
        !text ||
        task.id.toLowerCase().includes(text) ||
        task.product.toLowerCase().includes(text) ||
        task.line.toLowerCase().includes(text) ||
        task.process.toLowerCase().includes(text) ||
        task.owner.toLowerCase().includes(text) ||
        task.device.toLowerCase().includes(text) ||
        task.status.toLowerCase().includes(text) ||
        task.abnormalType.toLowerCase().includes(text)
      const matchesStatus = status.value === '全部状态' || task.status === status.value
      const matchesLine = line.value === '全部产线' || task.line === line.value
      const matchesUrgent = !urgentOnly.value || task.urgent

      return matchesKeyword && matchesStatus && matchesLine && matchesUrgent
    })
    .toSorted((a, b) => {
      if (sortBy.value === 'progress') {
        return b.progress - a.progress
      }

      if (sortBy.value === 'priority') {
        return priorityScore[b.priority] - priorityScore[a.priority]
      }

      return new Date(a.deadline) - new Date(b.deadline)
    })
})

function getDefaultDeadline() {
  const date = new Date()
  date.setDate(date.getDate() + 7)

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function createTask() {
  createError.value = ''

  try {
    const task = createProductionTask(createForm)
    showCreateForm.value = false
    router.push(`/tasks/${task.id}`)
  } catch (error) {
    createError.value = error instanceof Error ? error.message : '任务创建失败。'
  }
}

function resetFilters() {
  keyword.value = ''
  status.value = '全部状态'
  line.value = '全部产线'
  urgentOnly.value = false
  sortBy.value = 'deadline'
  router.replace({ path: '/tasks' })
}
</script>

<template>
  <section class="panel table-panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">Work Order Dispatch</p>
        <h2>生产任务列表</h2>
      </div>
      <div class="section-actions">
        <span>{{ filteredTasks.length }} 条匹配任务</span>
        <button type="button" class="icon-text-button" @click="showCreateForm = !showCreateForm">
          <X v-if="showCreateForm" :size="17" />
          <Plus v-else :size="17" />
          {{ showCreateForm ? '取消创建' : '创建任务' }}
        </button>
      </div>
    </div>

    <form v-if="showCreateForm" class="create-task-panel" @submit.prevent="createTask">
      <div class="create-task-heading">
        <div>
          <strong>新建生产任务</strong>
          <span>工艺路线：装配 → 检查 → 包装</span>
        </div>
        <span class="initial-state">初始状态：装配待开始 · 0%</span>
      </div>
      <div class="create-task-grid">
        <label>产品名称<input v-model.trim="createForm.product" required placeholder="例如：伺服驱动器" /></label>
        <label>
          产线
          <select v-model="createForm.line">
            <option v-for="item in lineOptions.slice(1)" :key="item">{{ item }}</option>
          </select>
        </label>
        <label>
          首选设备
          <select v-model="createForm.device" required>
            <option v-for="device in availableDevices" :key="device.code" :value="`${device.code} ${device.name}`">
              {{ device.code }} {{ device.name }}
            </option>
          </select>
        </label>
        <label>负责人<input v-model.trim="createForm.owner" required placeholder="例如：张工" /></label>
        <label>计划数量<input v-model.number="createForm.planQty" type="number" min="1" step="1" required /></label>
        <label>截止时间<input v-model="createForm.deadline" type="date" required /></label>
        <label>
          优先级
          <select v-model="createForm.priority">
            <option>高</option>
            <option>中</option>
            <option>低</option>
          </select>
        </label>
        <label class="check-inline create-urgent">
          <input v-model="createForm.urgent" type="checkbox" />
          标记为加急任务
        </label>
      </div>
      <p v-if="createError" class="feedback error">{{ createError }}</p>
      <button type="submit">创建并进入报工</button>
    </form>

    <div class="filter-row task-filter-row">
      <input v-model="keyword" placeholder="搜索工单号、产品、工序、负责人" />
      <select v-model="status">
        <option v-for="item in statusOptions" :key="item">{{ item }}</option>
      </select>
      <select v-model="line">
        <option v-for="item in lineOptions" :key="item">{{ item }}</option>
      </select>
      <select v-model="sortBy">
        <option value="deadline">按截止时间</option>
        <option value="progress">按任务进度</option>
        <option value="priority">按优先级</option>
      </select>
      <label class="check-inline">
        <input v-model="urgentOnly" type="checkbox" />
        仅看加急
      </label>
      <button type="button" class="secondary-button" @click="resetFilters">重置</button>
    </div>

    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>工单号</th>
            <th>产品</th>
            <th>产线</th>
            <th>当前节点 / 设备</th>
            <th>负责人</th>
            <th>计划数量</th>
            <th>状态</th>
            <th>进度</th>
            <th>优先级</th>
            <th>截止时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id" :class="{ 'row-alert': task.status === '异常' }">
            <td data-label="工单号">
              <strong>{{ task.id }}</strong>
              <small v-if="task.urgent" class="urgent-pill">加急</small>
            </td>
            <td data-label="产品">{{ task.product }}</td>
            <td data-label="产线">{{ task.line }}</td>
            <td data-label="当前节点 / 设备">
              <span>{{ task.process }}</span>
              <small>{{ task.device }}</small>
            </td>
            <td data-label="负责人">{{ task.owner }}</td>
            <td data-label="计划数量">{{ task.planQty }} 件</td>
            <td data-label="状态"><StatusTag :value="task.status" /></td>
            <td data-label="进度"><ProgressBar :value="task.progress" /></td>
            <td data-label="优先级">{{ task.priority }}</td>
            <td data-label="截止时间">{{ task.deadline }}</td>
            <td data-label="操作">
              <RouterLink class="text-link" :to="`/tasks/${task.id}`">查看详情</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <article v-if="filteredTasks.length === 0" class="empty-state panel-inline">
      <strong>暂无匹配任务</strong>
      <span>请调整关键字、状态、产线或加急筛选条件。</span>
    </article>
  </section>
</template>
