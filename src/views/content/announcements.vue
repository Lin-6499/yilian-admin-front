<template>
  <div class="announcement-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>公告管理</span>
          <el-button type="primary" @click="handleCreate">新增公告</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="标题">
          <el-input v-model="searchForm.search" placeholder="请输入标题关键字" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="260" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_pinned" label="置顶" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_pinned ? 'warning' : ''">{{ row.is_pinned ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item label="置顶" prop="is_pinned">
          <el-switch v-model="form.is_pinned" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createAnnouncement, deleteAnnouncement, getAnnouncements, updateAnnouncement } from '../../api/announcement'
import type { AnnouncementRow } from '../../api/announcement'

const loading = ref(false)
const tableData = ref<AnnouncementRow[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  search: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  id: undefined as number | undefined,
  title: '',
  content: '',
  status: 'published',
  is_pinned: false
})

const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const formatDate = (s: string) => (s ? new Date(s).toLocaleString() : '')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getAnnouncements({
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

const handleCreate = () => {
  isEdit.value = false
  dialogTitle.value = '新增公告'
  form.id = undefined
  form.title = ''
  form.content = ''
  form.status = 'published'
  form.is_pinned = false
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleEdit = (row: AnnouncementRow) => {
  isEdit.value = true
  dialogTitle.value = '编辑公告'
  form.id = row.id
  form.title = row.title
  form.content = row.content
  form.status = row.status
  form.is_pinned = !!row.is_pinned
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = {
        title: form.title,
        content: form.content,
        status: form.status,
        is_pinned: form.is_pinned
      }
      if (isEdit.value) {
        await updateAnnouncement(form.id!, payload)
        ElMessage.success('更新成功')
      } else {
        await createAnnouncement(payload)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchData()
    } finally {
      submitLoading.value = false
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const handleDelete = (row: AnnouncementRow) => {
  ElMessageBox.confirm(`确定删除公告 "${row.title}" 吗?`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteAnnouncement(row.id)
      ElMessage.success('删除成功')
      fetchData()
    })
}

onMounted(fetchData)
</script>

<style scoped>
.announcement-container {
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

