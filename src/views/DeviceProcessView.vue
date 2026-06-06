<template>
  <section class="panel">
    <div class="section-title">
      <h2>设备 / 工序管理</h2>
      <span>设备状态矩阵原型</span>
    </div>
    <div class="device-grid">
      <article v-for="item in ['A01', 'A02', 'A03', 'B01', 'B02', 'C02']" :key="item">
        <strong>{{ item }}</strong>
        <span>运行状态监控</span>
      </article>
    </div>
  </section>
</template>
