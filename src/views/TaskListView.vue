<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ProgressBar from '../components/common/ProgressBar.vue'
import StatusTag from '../components/common/StatusTag.vue'
import { lineOptions, statusOptions, tasks } from '../data/mock'

const keyword = ref('')
const status = ref('全部状态')
const line = ref('全部产线')
const urgentOnly = ref(false)
const sortBy = ref('deadline')

const priorityScore = {
  高: 3,
  中: 2,
  低: 1,
}

const filteredTasks = computed(() => {
  const text = keyword.value.trim().toLowerCase()

  return tasks
    .filter((task) => {
      const matchesKeyword =
        !text ||
        task.id.toLowerCase().includes(text) ||
        task.product.toLowerCase().includes(text) ||
        task.line.toLowerCase().includes(text) ||
        task.process.toLowerCase().includes(text) ||
        task.owner.toLowerCase().includes(text)
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

function resetFilters() {
  keyword.value = ''
  status.value = '全部状态'
  line.value = '全部产线'
  urgentOnly.value = false
  sortBy.value = 'deadline'
}
</script>

<template>
  <section class="panel table-panel">
    <div class="section-title">
      <div>
        <p class="eyebrow">Work Order Dispatch</p>
        <h2>生产任务列表</h2>
      </div>
      <span>{{ filteredTasks.length }} 条匹配任务</span>
    </div>

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
            <th>工序 / 设备</th>
            <th>负责人</th>
            <th>数量</th>
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
            <td data-label="工序 / 设备">
              <span>{{ task.process }}</span>
              <small>{{ task.device }}</small>
            </td>
            <td data-label="负责人">{{ task.owner }}</td>
            <td data-label="数量">{{ task.finishedQty }} / {{ task.planQty }}</td>
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
