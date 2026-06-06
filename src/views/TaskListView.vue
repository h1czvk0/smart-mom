<script setup>
import { tasks } from '../data/mock'
</script>

<template>
  <section class="panel">
    <div class="section-title">
      <h2>生产任务列表</h2>
      <span>搜索、筛选、排序功能将在交互阶段完善</span>
    </div>
    <div class="filter-row">
      <input placeholder="输入工单号或产品名称" />
      <select>
        <option>全部状态</option>
        <option>待生产</option>
        <option>生产中</option>
        <option>异常</option>
      </select>
      <button>查询</button>
    </div>
    <div class="task-cards">
      <article v-for="task in tasks" :key="task.id" class="task-card">
        <strong>{{ task.id }}</strong>
        <span>{{ task.product }} / {{ task.line }}</span>
        <em>{{ task.status }} - {{ task.progress }}%</em>
      </article>
    </div>
  </section>
</template>
