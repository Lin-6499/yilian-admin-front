<template>
  <div class="task-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务监管</span>
          <div class="header-actions">
            <el-input v-model="searchForm.search" placeholder="搜索标题/发布者/接单者" style="width: 240px" />
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 140px">
              <el-option label="待接单" value="pending" />
              <el-option label="已分配" value="assigned" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tasks" style="width: 100%" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="任务标题" width="200" show-overflow-tooltip />
        <el-table-column prop="publisher_name" label="发布者" width="120" />
        <el-table-column prop="volunteer_name" label="接单者" width="120" />
        <el-table-column prop="points_reward" label="悬赏积分" width="100" />
        <el-table-column prop="scheduled_time" label="预约时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.scheduled_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="任务状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ formatStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
            <el-dropdown @command="(cmd: string) => handleStatusCommand(row, cmd)">
              <el-button size="small" type="primary">
                变更状态
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pending">待接单</el-dropdown-item>
                  <el-dropdown-item command="assigned">已分配</el-dropdown-item>
                  <el-dropdown-item command="in_progress">进行中</el-dropdown-item>
                  <el-dropdown-item command="completed">已完成</el-dropdown-item>
                  <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              size="small"
              type="warning"
              :disabled="!row.volunteer_name || row.status === 'completed' || row.status === 'cancelled'"
              @click="handleUnassign(row)"
            >
              取消指派
            </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="任务详情" size="520px">
      <div v-loading="detailLoading">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务标题">{{ detail.title }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getStatusTagType(detail.status)">{{ formatStatus(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发布者">{{ detail.publisher_name }} {{ detail.publisher_phone ? `(${detail.publisher_phone})` : '' }}</el-descriptions-item>
          <el-descriptions-item label="接单者">{{ detail.volunteer_name }} {{ detail.volunteer_phone ? `(${detail.volunteer_phone})` : '' }}</el-descriptions-item>
          <el-descriptions-item label="地点">{{ detail.location }}</el-descriptions-item>
          <el-descriptions-item label="预约时间">{{ formatDateTime(detail.scheduled_time) }}</el-descriptions-item>
          <el-descriptions-item label="悬赏积分">{{ detail.points_reward }}</el-descriptions-item>
          <el-descriptions-item label="任务详情">{{ detail.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { TaskRow } from '../../api/task'
import { getTaskDetail, getTasks, unassignTask, updateTaskStatus } from '../../api/task'

const loading = ref(false)
const tasks = ref<TaskRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  search: '',
  status: ''
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<any>({})

const fetchTasks = async () => {
  loading.value = true
  try {
    const res = await getTasks({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchForm.search,
      status: searchForm.status
    })
    tasks.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchTasks()
}

const resetSearch = () => {
  searchForm.search = ''
  searchForm.status = ''
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchTasks()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchTasks()
}

const formatDateTime = (dateTime?: string | null) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString()
}

const formatStatus = (status?: string) => {
  const statusMap: Record<string, string> = {
    pending: '待接单',
    assigned: '已分配',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  if (!status) return '未知'
  return statusMap[status] || '未知'
}

const getStatusTagType = (status?: string) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'assigned':
      return ''
    case 'in_progress':
      return 'primary'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'info'
    default:
      return 'danger'
  }
}

const openDetail = async (row: TaskRow) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getTaskDetail(row.id)
    detail.value = res.data
  } finally {
    detailLoading.value = false
  }
}

const handleStatusCommand = async (row: TaskRow, status: string) => {
  try {
    await updateTaskStatus(row.id, status)
    ElMessage.success('状态已更新')
    fetchTasks()
  } catch {
    //
  }
}

const handleUnassign = async (row: TaskRow) => {
  ElMessageBox.confirm(`确定取消指派任务 "${row.title}" 吗?`, '提示', { type: 'warning' })
    .then(async () => {
      await unassignTask(row.id)
      ElMessage.success('已取消指派')
      fetchTasks()
    })
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.task-list-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.action-buttons {
  white-space: nowrap;
  display: flex;
  gap: 8px;
}
</style>
