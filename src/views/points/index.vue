<template>
  <div class="points-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>积分管理</span>
          <el-button type="primary" @click="openAdjust()">手动调整积分</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.search" placeholder="用户名/描述" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="全部" clearable style="width: 160px">
            <el-option label="任务奖励" value="task_reward" />
            <el-option label="任务扣减" value="task_payment" />
            <el-option label="商城兑换" value="mall_exchange" />
            <el-option label="系统发放/调整" value="system_grant" />
            <el-option label="捐赠" value="donation" />
          </el-select>
        </el-form-item>
        <el-form-item label="方向">
          <el-select v-model="searchForm.direction" placeholder="全部" clearable style="width: 120px">
            <el-option label="收入" value="in" />
            <el-option label="支出" value="out" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.user_id" placeholder="可选" style="width: 120px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column  label="ID" width="80" >
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="user_id" label="用户ID" width="90" />
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column prop="amount" label="变动" width="100">
          <template #default="{ row }">
            <el-tag :type="row.amount > 0 ? 'success' : (row.amount < 0 ? 'danger' : '')">
              {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="140" />
        <el-table-column prop="description" label="描述" min-width="260" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openAdjust(row)">调整</el-button>
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

    <el-dialog v-model="adjustVisible" title="调整积分" width="520px" @close="resetAdjust">
      <el-form ref="adjustFormRef" :model="adjustForm" :rules="adjustRules" label-width="100px">
        <el-form-item label="用户ID" prop="user_id">
          <el-input v-model="adjustForm.user_id" placeholder="请输入用户ID" :disabled="!!adjustForm.username" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="adjustForm.username" disabled placeholder="可选" />
        </el-form-item>
        <el-form-item label="调整数值" prop="amount">
          <el-input v-model="adjustForm.amount" placeholder="正数=增加，负数=扣减" />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="adjustForm.description" type="textarea" :rows="3" placeholder="可选，建议填写原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="adjustVisible = false">取消</el-button>
          <el-button type="primary" :loading="adjustLoading" @click="submitAdjust">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { PointsLogRow } from '../../api/points'
import { adjustPoints, getPointsLogs } from '../../api/points'

const loading = ref(false)
const tableData = ref<PointsLogRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  search: '',
  type: '',
  direction: '',
  user_id: ''
})

const formatDate = (s: string) => (s ? new Date(s).toLocaleString() : '')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPointsLogs({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchForm.search,
      type: searchForm.type,
      direction: searchForm.direction,
      user_id: searchForm.user_id
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
  searchForm.search = ''
  searchForm.type = ''
  searchForm.direction = ''
  searchForm.user_id = ''
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

const adjustVisible = ref(false)
const adjustLoading = ref(false)
const adjustFormRef = ref<FormInstance>()
const adjustForm = reactive({
  user_id: '',
  username: '',
  amount: '',
  description: ''
})

const adjustRules = reactive<FormRules>({
  user_id: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  amount: [{ required: true, message: '请输入调整数值', trigger: 'blur' }]
})

const openAdjust = (row?: PointsLogRow) => {
  adjustForm.user_id = row ? String(row.user_id) : ''
  adjustForm.username = row?.username || ''
  adjustForm.amount = ''
  adjustForm.description = ''
  adjustVisible.value = true
}

const resetAdjust = () => {
  adjustFormRef.value?.resetFields()
  adjustForm.username = ''
}

const submitAdjust = async () => {
  if (!adjustFormRef.value) return
  await adjustFormRef.value.validate(async (valid) => {
    if (!valid) return
    adjustLoading.value = true
    try {
      await adjustPoints({
        user_id: adjustForm.user_id,
        amount: adjustForm.amount,
        description: adjustForm.description
      })
      ElMessage.success('调整成功')
      adjustVisible.value = false
      fetchData()
    } finally {
      adjustLoading.value = false
    }
  })
}

onMounted(fetchData)
</script>

<style scoped>
.points-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

