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
  { id: 'WO-20260606-001', product: '伺服电机', line: 'A 产线', status: '生产中', progress: 72 },
  { id: 'WO-20260606-006', product: '控制柜', line: 'B 产线', status: '待生产', progress: 18 },
  { id: 'WO-20260606-009', product: '工业传感器', line: 'C 产线', status: '异常', progress: 43 },
  { id: 'WO-20260606-012', product: '包装套件', line: 'D 产线', status: '已完成', progress: 100 },
]
