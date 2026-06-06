<script setup>
import { computed, ref } from 'vue'
import ProgressBar from '../components/common/ProgressBar.vue'
import StatusTag from '../components/common/StatusTag.vue'
import { devices, deviceStatusOptions, lineOptions, processes } from '../data/mock'

const status = ref('全部状态')
const line = ref('全部产线')
const selectedDeviceCode = ref(devices.find((item) => item.status === '异常')?.code ?? devices[0].code)

const filteredDevices = computed(() =>
  devices.filter((device) => {
    const matchesStatus = status.value === '全部状态' || device.status === status.value
    const matchesLine = line.value === '全部产线' || device.line === line.value
    return matchesStatus && matchesLine
  }),
)

const selectedDevice = computed(
  () => devices.find((device) => device.code === selectedDeviceCode.value) ?? filteredDevices.value[0] ?? devices[0],
)

function selectDevice(code) {
  selectedDeviceCode.value = code
}
</script>

<template>
  <section class="device-page">
    <section class="panel">
      <div class="section-title">
        <div>
          <p class="eyebrow">Resource Management</p>
          <h2>设备 / 工序管理</h2>
        </div>
        <span>{{ filteredDevices.length }} 台设备</span>
      </div>

      <div class="filter-row device-filter-row">
        <select v-model="status">
          <option v-for="item in deviceStatusOptions" :key="item">{{ item }}</option>
        </select>
        <select v-model="line">
          <option v-for="item in lineOptions" :key="item">{{ item }}</option>
        </select>
      </div>

      <div class="device-grid">
        <button
          v-for="device in filteredDevices"
          :key="device.code"
          type="button"
          class="device-card"
          :class="{ active: selectedDevice.code === device.code, warning: device.status !== '运行' }"
          @click="selectDevice(device.code)"
        >
          <span class="device-code">{{ device.code }}</span>
          <strong>{{ device.name }}</strong>
          <small>{{ device.line }} / {{ device.process }}</small>
          <StatusTag :value="device.status" />
          <ProgressBar :value="device.utilization" />
        </button>
      </div>
    </section>

    <aside class="panel device-detail">
      <div class="section-title">
        <h2>设备详情</h2>
        <StatusTag :value="selectedDevice.status" />
      </div>
      <dl>
        <div>
          <dt>设备编号</dt>
          <dd>{{ selectedDevice.code }}</dd>
        </div>
        <div>
          <dt>设备名称</dt>
          <dd>{{ selectedDevice.name }}</dd>
        </div>
        <div>
          <dt>所属产线</dt>
          <dd>{{ selectedDevice.line }}</dd>
        </div>
        <div>
          <dt>当前工序</dt>
          <dd>{{ selectedDevice.process }}</dd>
        </div>
        <div>
          <dt>当前任务</dt>
          <dd>{{ selectedDevice.currentTask }}</dd>
        </div>
        <div>
          <dt>最近维护</dt>
          <dd>{{ selectedDevice.lastMaintenance }}</dd>
        </div>
      </dl>
    </aside>

    <section class="panel process-panel">
      <div class="section-title">
        <h2>工序配置</h2>
        <span>{{ processes.length }} 道标准工序</span>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>工序编号</th>
              <th>工序名称</th>
              <th>标准工时</th>
              <th>关联设备</th>
              <th>负责人</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="process in processes" :key="process.code">
              <td data-label="工序编号">{{ process.code }}</td>
              <td data-label="工序名称">{{ process.name }}</td>
              <td data-label="标准工时">{{ process.standardHours }} h</td>
              <td data-label="关联设备">{{ process.devices.join(' / ') }}</td>
              <td data-label="负责人">{{ process.owner }}</td>
              <td data-label="说明">{{ process.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>
