<template>
  <div class="audit-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>身份审核</span>
          <el-button type="primary" @click="fetchData">刷新</el-button>
        </div>
      </template>

      <!-- Search Form -->
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="角色">
          <el-select style="width: 100px" v-model="searchForm.role" placeholder="请选择角色" clearable>
            <el-option label="志愿者" value="volunteer"></el-option>
            <el-option label="家属" value="family"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- Audit Table -->
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column  label="ID" width="80" >
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="real_name" label="真实姓名" width="150" />
        <el-table-column prop="role" label="申请角色" width="120">
          <template #default="scope">
            <el-tag :type="getRoleTag(scope.row.role)">
              {{ getRoleName(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="created_at" label="申请时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="success" @click="handleApprove(scope.row)">通过</el-button>
            <el-button size="small" type="danger" @click="handleReject(scope.row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getAuditUsers, approveUser, rejectUser } from '../../api/audit'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  role: ''
})

const getRoleTag = (role: string) => {
  switch (role) {
    case 'volunteer': return 'success'
    case 'family': return 'info'
    default: return ''
  }
}

const getRoleName = (role: string) => {
  switch (role) {
    case 'volunteer': return '志愿者'
    case 'family': return '家属'
    default: return role
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getAuditUsers({
      page: currentPage.value,
      limit: pageSize.value,
      role: searchForm.role
    })
    tableData.value = res.users
    total.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

const handleApprove = (row: any) => {
  ElMessageBox.confirm(
    `确定通过用户 "${row.username}" 的身份申请吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success',
    }
  ).then(async () => {
    try {
      await approveUser(row.id)
      ElMessage.success('审核通过')
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

const handleReject = (row: any) => {
  ElMessageBox.confirm(
    `确定拒绝用户 "${row.username}" 的身份申请吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await rejectUser(row.id)
      ElMessage.success('已拒绝')
      fetchData()
    } catch (error) {
      console.error(error)
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.audit-container {
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
