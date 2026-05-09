<template>
  <div class="dispute-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>纠纷处理</span>
          <div class="header-actions">
            <el-input v-model="searchForm.search" placeholder="搜索任务标题/纠纷原因/发起人" style="width: 260px" />
            <el-select v-model="searchForm.status" placeholder="处理状态" clearable style="width: 140px">
              <el-option label="待处理" value="pending" />
              <el-option label="已处理" value="resolved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" style="width: 100%"  v-loading="loading" :row-class-name=tableRowClassName>
        <el-table-column  label="ID" width="80" >
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="task_title" label="任务标题" width="220" show-overflow-tooltip />
        <el-table-column prop="reason" label="纠纷原因" show-overflow-tooltip />
        <el-table-column prop="reporter_name" label="发起人" width="120" />
        <el-table-column prop="publisher_name" label="发布者" width="120" />
        <el-table-column prop="volunteer_name" label="接单者" width="120" />
        <el-table-column prop="status" label="处理状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getDisputeTag(row.status)">{{ formatDisputeStatus(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发起时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDetail(row)">详情</el-button>
            <el-button size="small" type="success" :disabled="row.status !== 'pending'" @click="openResolve(row)">处理</el-button>
            <el-button size="small" type="danger" :disabled="row.status !== 'pending'" @click="openReject(row)">拒绝</el-button>
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

    <el-drawer v-model="detailVisible" title="纠纷详情" size="560px">
      <div v-loading="detailLoading">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务标题">{{ detail.task_title }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag>{{ detail.task_status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="纠纷原因">{{ detail.reason }}</el-descriptions-item>
          <el-descriptions-item label="纠纷描述">{{ detail.description }}</el-descriptions-item>
          <el-descriptions-item label="发起人">{{ detail.reporter_name }} {{ detail.reporter_phone ? `(${detail.reporter_phone})` : '' }}</el-descriptions-item>
          <el-descriptions-item label="发布者">{{ detail.publisher_name }} {{ detail.publisher_phone ? `(${detail.publisher_phone})` : '' }}</el-descriptions-item>
          <el-descriptions-item label="接单者">{{ detail.volunteer_name }} {{ detail.volunteer_phone ? `(${detail.volunteer_phone})` : '' }}</el-descriptions-item>
          <el-descriptions-item label="服务地点">{{ detail.task_location }}</el-descriptions-item>
          <el-descriptions-item label="预约时间">{{ formatDateTime(detail.task_scheduled_time) }}</el-descriptions-item>
          <el-descriptions-item label="悬赏积分">{{ detail.task_points_reward }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getDisputeTag(detail.status)">{{ formatDisputeStatus(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理结果">{{ detail.resolution }}</el-descriptions-item>
          <el-descriptions-item label="处理管理员">{{ detail.admin_name }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>

    <el-dialog v-model="resolveVisible" title="处理纠纷" width="560px">
      <el-form :model="resolveForm" label-width="120px">
        <el-form-item label="任务处理动作">
          <el-select v-model="resolveForm.task_action" placeholder="请选择">
            <el-option label="不变更任务" value="no_change" />
            <el-option label="取消任务" value="cancel" />
            <el-option label="取消指派并回到待接单" value="reset_pending" />
            <el-option label="强制标记完成" value="complete" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="resolveForm.resolution" type="textarea" :rows="4" placeholder="请输入处理说明（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="resolveVisible = false">取消</el-button>
          <el-button type="primary" :loading="resolveLoading" @click="submitResolve">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="拒绝纠纷" width="560px">
      <el-form :model="rejectForm" label-width="120px">
        <el-form-item label="拒绝原因">
          <el-input v-model="rejectForm.resolution" type="textarea" :rows="4" placeholder="请输入拒绝原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span>
          <el-button @click="rejectVisible = false">取消</el-button>
          <el-button type="primary" :loading="rejectLoading" @click="submitReject">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { DisputeRow } from '../../api/dispute'
import { getDisputeDetail, getDisputes, rejectDispute, resolveDispute } from '../../api/dispute'

const loading = ref(false)
const tableData = ref<DisputeRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  status: '',
  search: ''
})


const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<any>({})

const resolveVisible = ref(false)
const resolveLoading = ref(false)
const rejectVisible = ref(false)
const rejectLoading = ref(false)

const currentDisputeId = ref<number | null>(null)

const resolveForm = reactive({
  task_action: 'no_change',
  resolution: ''
})
const tableRowClassName = ({row, rowIndex}:{row:DisputeRow,rowIndex:number}) => {
  if (row.status === 'pending') {
    return 'warning-row'
  }
  return ''
}
const rejectForm = reactive({
  resolution: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getDisputes({
      page: currentPage.value,
      limit: pageSize.value,
      status: searchForm.status,
      search: searchForm.search
    })
    tableData.value = res.data
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const resetSearch = () => {
  searchForm.status = ''
  searchForm.search = ''
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

const formatDateTime = (s?: string) => (s ? new Date(s).toLocaleString() : '')

const formatDisputeStatus = (s?: string) => {
  if (s === 'pending') return '待处理'
  if (s === 'resolved') return '已处理'
  if (s === 'rejected') return '已拒绝'
  return '未知'
}

const getDisputeTag = (s?: string) => {
  if (s === 'pending') return 'warning'
  if (s === 'resolved') return 'success'
  if (s === 'rejected') return 'info'
  return 'danger'
}

const openDetail = async (row: DisputeRow) => {
  detailVisible.value = true
  detailLoading.value = true
  try {
    const res = await getDisputeDetail(row.id)
    detail.value = res.data
  } finally {
    detailLoading.value = false
  }
}

const openResolve = (row: DisputeRow) => {
  currentDisputeId.value = row.id
  resolveForm.task_action = 'no_change'
  resolveForm.resolution = ''
  resolveVisible.value = true
}

const submitResolve = async () => {
  if (!currentDisputeId.value) return
  resolveLoading.value = true
  try {
    await resolveDispute(currentDisputeId.value, { ...resolveForm })
    ElMessage.success('处理成功')
    resolveVisible.value = false
    fetchData()
  } finally {
    resolveLoading.value = false
  }
}

const openReject = (row: DisputeRow) => {
  currentDisputeId.value = row.id
  rejectForm.resolution = ''
  rejectVisible.value = true
}

const submitReject = async () => {
  if (!currentDisputeId.value) return
  rejectLoading.value = true
  try {
    await rejectDispute(currentDisputeId.value, { ...rejectForm })
    ElMessage.success('已拒绝')
    rejectVisible.value = false
    fetchData()
  } finally {
    rejectLoading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.dispute-container {
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

:deep(.el-table .warning-row){
  --el-table-tr-bg-color: var(--el-color-error-light-3);
}

</style>

