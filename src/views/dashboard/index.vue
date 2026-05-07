<template>
  <div class="dashboard-container">
    <el-row :gutter="16">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">用户总数</div>
          <div class="stat-value">{{ overview?.users.total ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">志愿者</div>
          <div class="stat-value">{{ overview?.users.volunteer ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">待审核用户</div>
          <div class="stat-value">{{ overview?.audit.pending ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">待处理纠纷</div>
          <div class="stat-value">{{ overview?.disputes.pending ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">老人</div>
          <div class="stat-value">{{ overview?.users.elderly ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">家属</div>
          <div class="stat-value">{{ overview?.users.family ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">今日活跃</div>
          <div class="stat-value">{{ overview?.today.active_users ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
        <el-card class="stat-card">
          <div class="stat-title">健康预警</div>
          <div class="stat-value">{{ overview?.health_alerts ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24" :md="12">
        <el-card>
          <div class="chart-title">任务状态分布</div>
          <v-chart :option="taskStatusOption" autoresize class="chart"></v-chart>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12" style="margin-top: 16px" class="col-md-up-margin-reset">
        <el-card>
          <div class="chart-title">7日趋势</div>
          <v-chart :option="trendOption" autoresize class="chart"></v-chart>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24">
        <el-card>
          <div class="chart-title">积分收支（7日）</div>
          <v-chart :option="pointsOption" autoresize class="chart"></v-chart>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { getOverview, getTrends, type Overview, type Trends } from '../../api/dashboard'

const overview = ref<Overview | null>(null)
const trends = ref<Trends | null>(null)
const loading = ref(false)

const taskStatusOption = computed(() => {
  const data = [
    { name: '待接单', value: overview.value?.tasks.pending || 0 },
    { name: '已分配', value: overview.value?.tasks.assigned || 0 },
    { name: '进行中', value: overview.value?.tasks.in_progress || 0 },
    { name: '已完成', value: overview.value?.tasks.completed || 0 },
    { name: '已取消', value: overview.value?.tasks.cancelled || 0 }
  ]
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, type: 'scroll', itemWidth: 12, itemHeight: 12 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data,
        avoidLabelOverlap: true,
        label: {
          show: false
        },
        labelLine: {
          show: false
        }
      }
    ]
  }
})

const trendOption = computed(() => {
  const days = trends.value?.days || []
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['新增用户', '新增任务', '纠纷数量'] },
    grid: { left: 50, right: 24, bottom: 60, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: {
        rotate: 45,
        hideOverlap: true,
        formatter: (value: string) => (value?.length >= 5 ? value.slice(5) : value)
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: { margin: 10 }
    },
    series: [
      { name: '新增用户', type: 'line', smooth: true, data: trends.value?.new_users || [] },
      { name: '新增任务', type: 'line', smooth: true, data: trends.value?.new_tasks || [] },
      { name: '纠纷数量', type: 'line', smooth: true, data: trends.value?.disputes || [] }
    ]
  }
})

const pointsOption = computed(() => {
  const days = trends.value?.days || []
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['收入', '支出'] },
    grid: { left: 50, right: 24, bottom: 60, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLabel: {
        rotate: 45,
        hideOverlap: true,
        formatter: (value: string) => (value?.length >= 5 ? value.slice(5) : value)
      }
    },
    yAxis: { type: 'value', axisLabel: { margin: 10 } },
    series: [
      { name: '收入', type: 'bar', barMaxWidth: 24, data: trends.value?.points_in || [] },
      { name: '支出', type: 'bar', barMaxWidth: 24, data: trends.value?.points_out || [] }
    ]
  }
})

const fetchData = async () => {
  loading.value = true
  try {
    const [o, t] = await Promise.all([getOverview(), getTrends({ days: 7 })])
    overview.value = o
    trends.value = t
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}
.stat-card {
  text-align: center;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.stat-title {
  font-size: 14px;
  color: #666;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-top: 6px;
}
.chart {
  height: 360px;
  width: 100%;
}
.chart-title {
  font-size: 16px;
  margin-bottom: 8px;
}

@media (min-width: 768px) {
  .col-md-up-margin-reset {
    margin-top: 0 !important;
  }
}
</style>
