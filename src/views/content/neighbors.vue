<template>
  <div class="neighbor-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>邻里分享管理</span>
          <div>
            <el-input v-model="searchForm.search" placeholder="搜索内容或作者" style="width:220px;margin-right:8px" />
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:140px;margin-right:8px">
              <el-option label="已发布" value="published" />
              <el-option label="已隐藏" value="hidden" />
            </el-select>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column  label="ID" width="80" >
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="作者" width="180">
          <template #default="{ row }">
            <div class="author-cell">
              <div class="author-name">{{ row.real_name || row.username || '未知用户' }}</div>
              <div class="author-meta">{{ row.role || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '已隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_pinned" label="置顶" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_pinned ? 'warning' : ''">{{ row.is_pinned ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="like_count" label="点赞" width="90" />
        <el-table-column prop="comment_count" label="评论" width="90" />
        <el-table-column prop="report_count" label="举报" width="90" />
        <el-table-column prop="created_at" label="发布时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.is_pinned ? 'warning' : 'primary'"
              @click="handleTogglePin(row)"
            >
              {{ row.is_pinned ? '取消置顶' : '置顶' }}
            </el-button>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getNeighborPosts, updateNeighborPin } from '../../api/neighbors'
import type { NeighborPostRow } from '../../api/neighbors'

const loading = ref(false)
const tableData = ref<NeighborPostRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  search: '',
  status: ''
})

const formatDate = (s: string) => (s ? new Date(s).toLocaleString() : '')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getNeighborPosts({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchForm.search,
      status: searchForm.status
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
  searchForm.status = ''
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

const handleTogglePin = async (row: NeighborPostRow) => {
  const nextPinned = !Boolean(row.is_pinned)
  try {
    await ElMessageBox.confirm(`确定${nextPinned ? '置顶' : '取消置顶'}这条帖子吗？`, '提示', { type: 'warning' })
    await updateNeighborPin(row.id, nextPinned)
    ElMessage.success(nextPinned ? '置顶成功' : '已取消置顶')
    fetchData()
  } catch (_) {
    // 取消操作不提示
  }
}

onMounted(fetchData)
</script>

<style scoped>
.neighbor-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.author-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.4;
}

.author-name {
  font-weight: 600;
}

.author-meta {
  color: #909399;
  font-size: 12px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>