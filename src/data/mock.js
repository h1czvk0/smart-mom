export const tasks = [
  {
    id: 'WO-20260606-001',
    product: '伺服电机',
    line: 'A 产线',
    process: '装配检测',
    device: 'A02 自动装配台',
    owner: '张工',
    status: '生产中',
    progress: 72,
    workflowStep: 4,
    priority: '高',
    urgent: true,
    planQty: 1200,
    finishedQty: 864,
    deadline: '2026-06-10',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-002',
    product: '减速器总成',
    line: 'A 产线',
    process: '扭矩复检',
    device: 'A03 扭矩检测台',
    owner: '李工',
    status: '生产中',
    progress: 55,
    workflowStep: 3,
    priority: '中',
    urgent: false,
    planQty: 800,
    finishedQty: 440,
    deadline: '2026-06-11',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-003',
    product: '视觉识别模组',
    line: 'B 产线',
    process: '固件烧录',
    device: 'B01 烧录工位',
    owner: '陈工',
    status: '待生产',
    progress: 0,
    workflowStep: 0,
    priority: '中',
    urgent: false,
    planQty: 450,
    finishedQty: 0,
    deadline: '2026-06-14',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-004',
    product: 'PLC 控制柜',
    line: 'B 产线',
    process: '功能测试',
    device: 'B03 测试台',
    owner: '王工',
    status: '待生产',
    progress: 18,
    workflowStep: 1,
    priority: '中',
    urgent: false,
    planQty: 600,
    finishedQty: 108,
    deadline: '2026-06-12',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-005',
    product: '工业传感器',
    line: 'C 产线',
    process: '传感校准',
    device: 'C02 校准台',
    owner: '赵工',
    status: '异常',
    progress: 43,
    workflowStep: 3,
    priority: '高',
    urgent: true,
    planQty: 900,
    finishedQty: 387,
    deadline: '2026-06-08',
    abnormalType: '校准漂移',
  },
  {
    id: 'WO-20260606-006',
    product: '包装套件',
    line: 'D 产线',
    process: '包装入库',
    device: 'D02 包装线',
    owner: '孙工',
    status: '已完成',
    progress: 100,
    workflowStep: 6,
    priority: '低',
    urgent: false,
    planQty: 500,
    finishedQty: 500,
    deadline: '2026-06-07',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-007',
    product: '电池管理板',
    line: 'C 产线',
    process: 'ICT 测试',
    device: 'C03 测试夹具',
    owner: '周工',
    status: '生产中',
    progress: 64,
    workflowStep: 4,
    priority: '高',
    urgent: true,
    planQty: 1000,
    finishedQty: 640,
    deadline: '2026-06-09',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-008',
    product: '机器人关节模组',
    line: 'A 产线',
    process: '老化测试',
    device: 'A04 老化柜',
    owner: '钱工',
    status: '异常',
    progress: 68,
    workflowStep: 4,
    priority: '高',
    urgent: true,
    planQty: 300,
    finishedQty: 204,
    deadline: '2026-06-09',
    abnormalType: '设备停机',
  },
  {
    id: 'WO-20260606-009',
    product: '边缘网关',
    line: 'B 产线',
    process: '整机组装',
    device: 'B02 组装工位',
    owner: '吴工',
    status: '生产中',
    progress: 81,
    workflowStep: 5,
    priority: '中',
    urgent: false,
    planQty: 700,
    finishedQty: 567,
    deadline: '2026-06-13',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-010',
    product: '温控模块',
    line: 'D 产线',
    process: '终检',
    device: 'D03 终检台',
    owner: '郑工',
    status: '已完成',
    progress: 100,
    workflowStep: 6,
    priority: '低',
    urgent: false,
    planQty: 960,
    finishedQty: 960,
    deadline: '2026-06-06',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-011',
    product: '执行器控制板',
    line: 'C 产线',
    process: '三防涂覆',
    device: 'C01 涂覆机',
    owner: '刘工',
    status: '待生产',
    progress: 12,
    workflowStep: 1,
    priority: '低',
    urgent: false,
    planQty: 1100,
    finishedQty: 132,
    deadline: '2026-06-16',
    abnormalType: '',
  },
  {
    id: 'WO-20260606-012',
    product: 'HMI 面板',
    line: 'D 产线',
    process: '贴合检测',
    device: 'D01 贴合机',
    owner: '黄工',
    status: '异常',
    progress: 35,
    workflowStep: 2,
    priority: '中',
    urgent: false,
    planQty: 520,
    finishedQty: 182,
    deadline: '2026-06-15',
    abnormalType: '不良率偏高',
  },
]

export const reportRecords = [
  {
    taskId: 'WO-20260606-001',
    time: '2026-06-06 10:30',
    process: '装配检测',
    device: 'A02 自动装配台',
    finishedQty: 80,
    badQty: 1,
    status: '正常',
    remark: '装配节拍稳定，等待质检复核。',
  },
  {
    taskId: 'WO-20260606-005',
    time: '2026-06-06 11:10',
    process: '传感校准',
    device: 'C02 校准台',
    finishedQty: 42,
    badQty: 8,
    status: '异常',
    remark: '校准结果波动，已通知设备维护。',
  },
  {
    taskId: 'WO-20260606-008',
    time: '2026-06-06 13:40',
    process: '老化测试',
    device: 'A04 老化柜',
    finishedQty: 28,
    badQty: 0,
    status: '异常',
    remark: '老化柜温控停机 18 分钟。',
  },
]

export const devices = [
  {
    code: 'A01',
    name: '柔性上料站',
    line: 'A 产线',
    process: '上料',
    status: '运行',
    utilization: 92,
    lastMaintenance: '2026-05-28',
    currentTask: 'WO-20260606-002',
  },
  {
    code: 'A02',
    name: '自动装配台',
    line: 'A 产线',
    process: '装配检测',
    status: '运行',
    utilization: 95,
    lastMaintenance: '2026-05-30',
    currentTask: 'WO-20260606-001',
  },
  {
    code: 'A03',
    name: '扭矩检测台',
    line: 'A 产线',
    process: '扭矩复检',
    status: '预警',
    utilization: 78,
    lastMaintenance: '2026-05-18',
    currentTask: 'WO-20260606-002',
  },
  {
    code: 'A04',
    name: '老化柜',
    line: 'A 产线',
    process: '老化测试',
    status: '异常',
    utilization: 61,
    lastMaintenance: '2026-05-12',
    currentTask: 'WO-20260606-008',
  },
  {
    code: 'B01',
    name: '烧录工位',
    line: 'B 产线',
    process: '固件烧录',
    status: '运行',
    utilization: 88,
    lastMaintenance: '2026-05-25',
    currentTask: 'WO-20260606-003',
  },
  {
    code: 'B02',
    name: '组装工位',
    line: 'B 产线',
    process: '整机组装',
    status: '运行',
    utilization: 84,
    lastMaintenance: '2026-05-29',
    currentTask: 'WO-20260606-009',
  },
  {
    code: 'B03',
    name: '功能测试台',
    line: 'B 产线',
    process: '功能测试',
    status: '待机',
    utilization: 56,
    lastMaintenance: '2026-06-01',
    currentTask: 'WO-20260606-004',
  },
  {
    code: 'C01',
    name: '三防涂覆机',
    line: 'C 产线',
    process: '三防涂覆',
    status: '运行',
    utilization: 82,
    lastMaintenance: '2026-05-27',
    currentTask: 'WO-20260606-011',
  },
  {
    code: 'C02',
    name: '传感校准台',
    line: 'C 产线',
    process: '传感校准',
    status: '异常',
    utilization: 48,
    lastMaintenance: '2026-05-08',
    currentTask: 'WO-20260606-005',
  },
  {
    code: 'C03',
    name: 'ICT 测试夹具',
    line: 'C 产线',
    process: 'ICT 测试',
    status: '运行',
    utilization: 90,
    lastMaintenance: '2026-05-22',
    currentTask: 'WO-20260606-007',
  },
  {
    code: 'D01',
    name: '面板贴合机',
    line: 'D 产线',
    process: '贴合检测',
    status: '预警',
    utilization: 73,
    lastMaintenance: '2026-05-15',
    currentTask: 'WO-20260606-012',
  },
  {
    code: 'D02',
    name: '自动包装线',
    line: 'D 产线',
    process: '包装入库',
    status: '运行',
    utilization: 87,
    lastMaintenance: '2026-05-26',
    currentTask: 'WO-20260606-006',
  },
  {
    code: 'D03',
    name: '终检台',
    line: 'D 产线',
    process: '终检',
    status: '待机',
    utilization: 63,
    lastMaintenance: '2026-06-02',
    currentTask: 'WO-20260606-010',
  },
]

export const processes = [
  {
    code: 'P-010',
    name: '上料',
    standardHours: 0.4,
    devices: ['A01'],
    owner: '张工',
    description: '完成原料绑定、批次校验和扫码上线。',
  },
  {
    code: 'P-020',
    name: '装配检测',
    standardHours: 1.2,
    devices: ['A02', 'B02'],
    owner: '李工',
    description: '完成核心部件装配、扭矩检测和装配结果采集。',
  },
  {
    code: 'P-030',
    name: '功能测试',
    standardHours: 0.8,
    devices: ['B03', 'C03'],
    owner: '王工',
    description: '执行自动测试脚本并记录不良项。',
  },
  {
    code: 'P-040',
    name: '传感校准',
    standardHours: 1.5,
    devices: ['C02'],
    owner: '赵工',
    description: '按温度、压力、位移参数进行传感器标定。',
  },
  {
    code: 'P-050',
    name: '三防涂覆',
    standardHours: 0.7,
    devices: ['C01'],
    owner: '刘工',
    description: '对控制板进行涂覆、烘干和外观复检。',
  },
  {
    code: 'P-060',
    name: '包装入库',
    standardHours: 0.5,
    devices: ['D02', 'D03'],
    owner: '孙工',
    description: '完成贴标、包装、称重和成品入库交接。',
  },
]

export const productionLines = ['A 产线', 'B 产线', 'C 产线', 'D 产线'].map((line) => ({
  name: line,
  task: tasks.find((task) => task.line === line && task.status !== '已完成')?.id ?? '暂无待执行任务',
  devices: devices
    .filter((device) => device.line === line)
    .slice(0, 4)
    .map((device) => ({
      code: device.code,
      status: mapDeviceStatus(device.status),
    })),
}))

export const productionTrend = [
  { time: '08:00', output: 180, target: 160 },
  { time: '10:00', output: 420, target: 360 },
  { time: '12:00', output: 710, target: 650 },
  { time: '14:00', output: 1030, target: 960 },
  { time: '16:00', output: 1380, target: 1290 },
  { time: '18:00', output: 1760, target: 1650 },
]

export const abnormalTypes = [
  { name: '设备停机', value: 1 },
  { name: '校准漂移', value: 1 },
  { name: '不良率偏高', value: 1 },
]

export const statusOptions = ['全部状态', '待生产', '生产中', '已完成', '异常']
export const lineOptions = ['全部产线', 'A 产线', 'B 产线', 'C 产线', 'D 产线']
export const deviceStatusOptions = ['全部状态', '运行', '待机', '预警', '异常']

export const kpis = buildKpis()
export const reportStats = buildReportStats()

export function buildKpis(sourceTasks = tasks, sourceDevices = devices) {
  const total = sourceTasks.length
  const running = sourceTasks.filter((task) => task.status === '生产中').length
  const abnormal = sourceTasks.filter((task) => task.status === '异常').length
  const completed = sourceTasks.filter((task) => task.status === '已完成').length
  const completionRate = Math.round((sourceTasks.reduce((sum, task) => sum + task.progress, 0) / total) * 10) / 10
  const deviceUtilization = Math.round(
    sourceDevices.reduce((sum, device) => sum + device.utilization, 0) / sourceDevices.length,
  )

  return [
    { label: '今日工单', value: total, unit: '单', tone: 'blue' },
    { label: '生产中任务', value: running, unit: '单', tone: 'cyan' },
    { label: '异常任务', value: abnormal, unit: '单', tone: 'red' },
    { label: '已完成任务', value: completed, unit: '单', tone: 'green' },
    { label: '设备利用率', value: deviceUtilization, unit: '%', tone: 'orange' },
    { label: '平均进度', value: completionRate, unit: '%', tone: 'violet' },
  ]
}

export function buildReportStats(sourceTasks = tasks, sourceDevices = devices) {
  const totalOutput = sourceTasks.reduce((sum, task) => sum + task.finishedQty, 0)
  const plannedOutput = sourceTasks.reduce((sum, task) => sum + task.planQty, 0)
  const completionRate =
    sourceTasks.length === 0
      ? 0
      : Math.round(sourceTasks.reduce((sum, task) => sum + task.progress, 0) / sourceTasks.length)
  const abnormalCount = sourceTasks.filter((task) => task.status === '异常').length
  const deviceUtilization = Math.round(
    sourceDevices.reduce((sum, device) => sum + device.utilization, 0) / sourceDevices.length,
  )
  const topRisk =
    sourceTasks.find((task) => task.status === '异常' && task.urgent)?.abnormalType ??
    sourceTasks.find((task) => task.status === '异常')?.abnormalType ??
    '暂无关键异常'

  return {
    totalOutput,
    plannedOutput,
    completionRate,
    abnormalCount,
    deviceUtilization,
    topRisk,
  }
}

function mapDeviceStatus(status) {
  return {
    运行: 'running',
    待机: 'idle',
    预警: 'warning',
    异常: 'down',
  }[status]
}
