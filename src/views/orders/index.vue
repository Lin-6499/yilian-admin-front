<template>
  <div class="orders-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>兑换订单管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="已处理/等待领取" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="product_name" label="商品" width="220">
          <template #default="scope">
            <div style="display:flex;align-items:center;gap:8px">
              <img v-if="scope.row.product_image" :src="scope.row.product_image" style="width:48px;height:48px;object-fit:cover;border-radius:4px" />
              <span>{{ scope.row.product_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="points_cost" label="积分" width="100" />
        <el-table-column prop="status" label="状态" width="140">
          <template #default="scope">
            <el-tag :type="statusTag(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">{{ formatDate(scope.row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button size="small" @click="openDetail(scope.row)">详情</el-button>
              <el-button size="small" type="primary" @click="markShipped(scope.row)" v-if="scope.row.status==='pending'">标记已处理</el-button>
              <el-button size="small" type="success" @click="markCompleted(scope.row)" v-if="scope.row.status!=='completed'">标记已完成</el-button>
              <el-button size="small" type="danger" @click="cancelOrder(scope.row)" v-if="scope.row.status!=='cancelled'">取消</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10,20,50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="600px">
      <div v-if="currentOrder">
        <p><strong>订单ID：</strong>{{ currentOrder.id }}</p>
        <p><strong>用户：</strong>{{ currentOrder.username }} / {{ currentOrder.phone }}</p>
        <p><strong>商品：</strong>{{ currentOrder.product_name }}</p>
        <p><strong>积分：</strong>{{ currentOrder.points_cost }}</p>
        <p><strong>状态：</strong>{{ statusText(currentOrder.status) }}</p>
        <el-input type="textarea" v-model="adminNote" placeholder="填写备注(可选)" rows="4" />
      </div>
      <template #footer>
        <el-button @click="detailVisible=false">关闭</el-button>
        <el-button type="primary" @click="submitStatusChange('shipped')">标记已处理</el-button>
        <el-button type="success" @click="submitStatusChange('completed')">标记已完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOrders, updateOrderStatus } from '../../api/orders'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({ status: '' })

const detailVisible = ref(false)
const currentOrder = ref<any>(null)
const adminNote = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getOrders({ status: searchForm.status, page: currentPage.value, limit: pageSize.value })
    tableData.value = res.orders || []
    total.value = (res.orders && res.orders.length) ? res.orders.length : 0
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { currentPage.value = 1; fetchData() }
const resetSearch = () => { searchForm.status = ''; handleSearch() }
const handleSizeChange = (val: number) => { pageSize.value = val; fetchData() }
const handleCurrentChange = (val: number) => { currentPage.value = val; fetchData() }

const statusText = (s: string) => {
  switch (s) {
    case 'pending': return '待处理'
    case 'shipped': return '已处理/等待领取'
    case 'completed': return '已完成'
    case 'cancelled': return '已取消'
    default: return s
  }
}

const statusTag = (s: string) => {
  switch (s) {
    case 'pending': return ''
    case 'shipped': return 'warning'
    case 'completed': return 'success'
    case 'cancelled': return 'danger'
    default: return ''
  }
}

const formatDate = (d: string) => d ? new Date(d).toLocaleString() : ''

const openDetail = (row: any) => {
  currentOrder.value = row
  adminNote.value = ''
  detailVisible.value = true
}

const doUpdate = async (orderId: number, status: string, note = '') => {
  try {
    await updateOrderStatus(orderId, { status, note })
    ElMessage.success('操作成功')
    fetchData()
  } catch (err: any) {
    console.error(err)
    ElMessage.error(err?.response?.data?.message || '操作失败')
  }
}

const markShipped = (row: any) => {
  ElMessageBox.confirm('确认将该订单标记为已处理/等待领取吗？', '确认', { type: 'warning' })
    .then(() => doUpdate(row.id, 'shipped'))
    .catch(() => {})
}

const markCompleted = (row: any) => {
  ElMessageBox.confirm('确认将该订单标记为已完成吗？(用户已线下领取)', '确认', { type: 'warning' })
    .then(() => doUpdate(row.id, 'completed'))
    .catch(() => {})
}

const cancelOrder = (row: any) => {
  ElMessageBox.confirm('确认取消该订单吗？', '确认', { type: 'warning' })
    .then(() => doUpdate(row.id, 'cancelled'))
    .catch(() => {})
}

const submitStatusChange = (status: string) => {
  if (!currentOrder.value) return
  doUpdate(currentOrder.value.id, status, adminNote.value)
  detailVisible.value = false
}

onMounted(() => { fetchData() })
</script>

<style scoped>
.orders-container { padding: 20px }
.card-header { display:flex; justify-content:space-between; align-items:center }
.pagination-container { margin-top: 20px; display:flex; justify-content:flex-end }
.action-buttons {
  white-space: nowrap;
  display: flex;
  gap: 8px;
}
</style>
