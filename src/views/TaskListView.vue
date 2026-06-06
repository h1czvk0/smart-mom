<script setup>
import { computed, ref } from 'vue'
import { tasks } from '../data/mock'

const keyword = ref('')
const status = ref('全部状态')
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
        task.line.toLowerCase().includes(text)
      const matchesStatus = status.value === '全部状态' || task.status === status.value
      const matchesUrgent = !urgentOnly.value || task.urgent

      return matchesKeyword && matchesStatus && matchesUrgent
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
  urgentOnly.value = false
  sortBy.value = 'deadline'
}
</script>

<template>
  <section class="panel">
    <div class="section-title">
      <h2>生产任务列表</h2>
      <span>{{ filteredTasks.length }} 条匹配任务</span>
    </div>
    <div class="filter-row">
      <input v-model="keyword" placeholder="输入工单号、产品或产线" />
      <select v-model="status">
        <option>全部状态</option>
        <option>待生产</option>
        <option>生产中</option>
        <option>异常</option>
        <option>已完成</option>
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
      <button type="button" @click="resetFilters">重置</button>
    </div>
    <div class="task-cards">
      <article v-for="task in filteredTasks" :key="task.id" class="task-card">
        <strong>{{ task.id }}</strong>
        <span>{{ task.product }} / {{ task.line }} / {{ task.process }}</span>
        <em>{{ task.status }} - {{ task.progress }}% - {{ task.priority }}优先级</em>
        <small>截止：{{ task.deadline }}{{ task.urgent ? ' / 加急' : '' }}</small>
      </article>
      <article v-if="filteredTasks.length === 0" class="task-card empty-state">
        <strong>暂无匹配任务</strong>
        <span>请调整关键词、状态或加急筛选条件。</span>
      </article>
    </div>
  </section>
</template>
