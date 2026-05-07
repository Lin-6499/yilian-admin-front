<template>
  <div class="activity-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>活动管理</span>
          <div>
            <el-input v-model="searchForm.search" placeholder="搜索标题" style="width:220px;margin-right:8px" />
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button type="primary" @click="handleCreate" style="margin-left:8px">新增活动</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" width="220" />
        <el-table-column prop="location" label="地点" width="180" />
        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="scope">{{ formatDate(scope.row.start_time) }}</template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="180">
          <template #default="scope">{{ formatDate(scope.row.end_time) }}</template>
        </el-table-column>
        <el-table-column prop="max_participants" label="人数上限" width="100" />
        <el-table-column label="报名人数" width="120">
          <template #default="scope">
            {{ (scope.row.signup_count || 0) }}/{{ scope.row.max_participants > 0 ? scope.row.max_participants : '不限' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="exportParticipants(scope.row)">导出报名</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker v-model="form.start_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker v-model="form.end_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="人数上限" prop="max_participants">
          <el-input-number v-model="form.max_participants" :min="0" />
        </el-form-item>
        <el-form-item label="海报URL" prop="image_url">
          <div class="poster-upload">
            <el-upload
              class="poster-uploader"
              name="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              :show-file-list="false"
              :before-upload="beforePosterUpload"
              :http-request="handlePosterUploadRequest"
              :on-success="handlePosterUploadSuccess"
            >
              <img v-if="form.image_url" :src="form.image_url" class="poster-preview" alt="海报预览" />
              <div v-else class="poster-placeholder">
                <el-icon class="poster-placeholder__icon"><Plus /></el-icon>
                <span>上传海报</span>
              </div>
            </el-upload>
            <div class="hint">支持 JPG / PNG / GIF / WebP，大小不超过 5MB</div>
          </div>
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
  import { ref, reactive, onMounted, nextTick } from 'vue'
  import { getActivities, createActivity, updateActivity, deleteActivity, getActivityParticipants } from '../../api/activity'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import service from '../../utils/request'
  import { normalizeMysqlDateTime } from '../../utils/datetime'

  const loading = ref(false)
  const tableData = ref([])
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(10)

  const searchForm = reactive({ search: '' })

  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const isEdit = ref(false)
  const submitLoading = ref(false)
  const formRef = ref<FormInstance>()

  const form = reactive({
    id: undefined as number | undefined,
    title: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    max_participants: 0,
    image_url: ''
  })

  const rules = reactive<FormRules>({
    title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
    location: [{ required: true, message: '请输入地点', trigger: 'blur' }],
    start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
    end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
  })

  const beforePosterUpload = (file: File) => {
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
    if (!allowedTypes.has(file.type)) {
      ElMessage.error('海报只能上传 JPG、PNG、GIF 或 WebP 图片')
      return false
    }

    if (file.size / 1024 / 1024 > 5) {
      ElMessage.error('海报图片不能超过 5MB')
      return false
    }

    return true
  }

  const handlePosterUploadRequest = async (options: any) => {
    const formData = new FormData()
    formData.append(options.filename || 'file', options.file)

    try {
      const response: any = await service.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            options.onProgress?.({
              percent: Math.round((progressEvent.loaded * 100) / progressEvent.total)
            })
          }
        }
      })

      options.onSuccess?.(response)
    } catch (error) {
      options.onError?.(error)
      throw error
    }
  }

  const handlePosterUploadSuccess = (response: any) => {
    const uploadedUrl = response?.url || response?.data?.url
    if (!uploadedUrl) {
      ElMessage.error('上传成功但未返回海报地址')
      return
    }

    form.image_url = uploadedUrl
    ElMessage.success('海报上传成功')
  }

  const formatDate = (s: string) => s ? new Date(s).toLocaleString() : ''

  const fetchData = async () => {
    loading.value = true
    try {
      const res: any = await getActivities({ page: currentPage.value, limit: pageSize.value, search: searchForm.search })
      tableData.value = res.activities
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => { currentPage.value = 1; fetchData() }
  const handleSizeChange = (v: number) => { pageSize.value = v; fetchData() }
  const handleCurrentChange = (v: number) => { currentPage.value = v; fetchData() }

  const handleCreate = () => {
    isEdit.value = false
    dialogTitle.value = '新增活动'
    Object.assign(form, { id: undefined, title: '', description: '', location: '', start_time: '', end_time: '', max_participants: 0, image_url: '' })
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleEdit = (row: any) => {
    isEdit.value = true
    dialogTitle.value = '编辑活动'
    Object.assign(form, {
      ...row,
      start_time: normalizeMysqlDateTime(row.start_time),
      end_time: normalizeMysqlDateTime(row.end_time)
    })
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const submitForm = async () => {
    if (!formRef.value) return
    await formRef.value.validate(async (valid) => {
      if (!valid) return
      submitLoading.value = true
      try {
        const payload = {
          ...form,
          start_time: normalizeMysqlDateTime(form.start_time),
          end_time: normalizeMysqlDateTime(form.end_time)
        }

        if (isEdit.value) {
          await updateActivity(form.id!, payload)
          ElMessage.success('更新成功')
        } else {
          await createActivity(payload)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchData()
      } finally {
        submitLoading.value = false
      }
    })
  }

  const handleDelete = (row: any) => {
    ElMessageBox.confirm(`确定删除活动 "${row.title}" 吗?`, '提示', { type: 'warning' })
      .then(async () => {
        await deleteActivity(row.id)
        ElMessage.success('删除成功')
        fetchData()
      })
  }

  const resetForm = () => {
    formRef.value?.resetFields()
  }

  const escapeCsv = (value: any) => {
    const s = value === null || value === undefined ? '' : String(value)
    const escaped = s.replace(/"/g, '""')
    return `"${escaped}"`
  }

  const exportParticipants = async (row: any) => {
    const res: any = await getActivityParticipants(row.id, { page: 1, limit: 10000 })
    const participants = res.data || []
    const header = ['用户ID', '用户名', '真实姓名', '手机号', '角色', '报名时间']
    const lines = [header.map(escapeCsv).join(',')]
    for (const p of participants) {
      lines.push([
        p.user_id,
        p.username,
        p.real_name,
        p.phone,
        p.role,
        formatDate(p.joined_at)
      ].map(escapeCsv).join(','))
    }
    const csv = '\ufeff' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${row.title || '活动'}-报名名单.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('已导出')
  }

  onMounted(fetchData)
  </script>

  <style scoped>
  .activity-container { padding: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .pagination-container { margin-top: 20px; display: flex; justify-content: flex-end; }

  .poster-upload {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .poster-uploader :deep(.el-upload) {
    width: 180px;
    height: 101px;
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: var(--el-fill-color-lighter);
  }

  .poster-preview {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
  }

  .poster-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    gap: 6px;
  }

  .poster-placeholder__icon {
    font-size: 22px;
  }

  .hint {
    color: #999;
    font-size: 12px;
  }
  </style>
