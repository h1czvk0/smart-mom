<template>
  <section class="panel">
    <div class="section-title">
      <h2>任务详情 / 报工</h2>
      <span>当前阶段完成表单原型</span>
    </div>
    <form class="report-form">
      <label>当前工序<input value="装配检测" /></label>
      <label>使用设备<input value="A02 自动装配台" /></label>
      <label>完成数量<input type="number" value="120" /></label>
      <label>不良数量<input type="number" value="2" /></label>
      <label>异常说明<textarea placeholder="如有异常请填写"></textarea></label>
      <button type="button">提交报工</button>
    </form>
  </section>
</template>
