export const kpis = [
  { label: '今日工单', value: 28, unit: '单', tone: 'blue' },
  { label: '生产中任务', value: 12, unit: '单', tone: 'cyan' },
  { label: '异常任务', value: 3, unit: '单', tone: 'red' },
  { label: '完成率', value: 86, unit: '%', tone: 'green' },
  { label: '设备利用率', value: 91, unit: '%', tone: 'orange' },
]

export const productionLines = [
  {
    name: 'A 产线',
    task: '伺服电机装配 WO-001',
    devices: [
      { code: 'A01', status: 'running' },
      { code: 'A02', status: 'running' },
      { code: 'A03', status: 'warning' },
    ],
  },
  {
    name: 'B 产线',
    task: '控制柜测试 WO-006',
    devices: [
      { code: 'B01', status: 'running' },
      { code: 'B02', status: 'idle' },
      { code: 'B03', status: 'running' },
    ],
  },
  {
    name: 'C 产线',
    task: '传感器校准 WO-009',
    devices: [
      { code: 'C01', status: 'running' },
      { code: 'C02', status: 'down' },
      { code: 'C03', status: 'running' },
    ],
  },
  {
    name: 'D 产线',
    task: '包装入库 WO-012',
    devices: [
      { code: 'D01', status: 'idle' },
      { code: 'D02', status: 'running' },
      { code: 'D03', status: 'running' },
    ],
  },
]

export const tasks = [
  {
    id: 'WO-20260606-001',
    product: '伺服电机',
    line: 'A 产线',
    process: '装配检测',
    device: 'A02 自动装配台',
    status: '生产中',
    progress: 72,
    priority: '高',
    urgent: true,
    planQty: 1200,
    finishedQty: 864,
    deadline: '2026-06-10',
  },
  {
    id: 'WO-20260606-006',
    product: '控制柜',
    line: 'B 产线',
    process: '功能测试',
    device: 'B03 测试台',
    status: '待生产',
    progress: 18,
    priority: '中',
    urgent: false,
    planQty: 600,
    finishedQty: 108,
    deadline: '2026-06-12',
  },
  {
    id: 'WO-20260606-009',
    product: '工业传感器',
    line: 'C 产线',
    process: '传感校准',
    device: 'C02 校准台',
    status: '异常',
    progress: 43,
    priority: '高',
    urgent: true,
    planQty: 900,
    finishedQty: 387,
    deadline: '2026-06-08',
  },
  {
    id: 'WO-20260606-012',
    product: '包装套件',
    line: 'D 产线',
    process: '包装入库',
    device: 'D02 包装线',
    status: '已完成',
    progress: 100,
    priority: '低',
    urgent: false,
    planQty: 500,
    finishedQty: 500,
    deadline: '2026-06-07',
  },
]

export const reportStats = {
  totalOutput: 1856,
  completionRate: 86,
  abnormalCount: 3,
  deviceUtilization: 91,
  topRisk: 'C02 校准台温度异常，WO-20260606-009 不良率偏高',
}
