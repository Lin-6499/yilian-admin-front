<template>
  <div class="video-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>老年大学</span>
          <el-button type="primary" @click="handleCreate">新增课程</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.search" placeholder="标题 / 描述 / 标签" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
            <el-option label="养生" value="yangsheng" />
            <el-option label="戏曲" value="xiqu" />
            <el-option label="法律常识" value="legal" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="隐藏" value="hidden" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            {{ categoryLabel(row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="video_url" label="视频URL" min-width="240" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'">
              {{ row.status === 'published' ? '已发布' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="90" />
        <el-table-column prop="updated_at" label="更新时间" width="180">
          <template #default="{ row }">{{ formatDate(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" @click="toggleStatus(row)">{{ row.status === 'published' ? '隐藏' : '发布' }}</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" @close="resetForm">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入课程标题" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="养生" value="yangsheng" />
            <el-option label="戏曲" value="xiqu" />
            <el-option label="法律常识" value="legal" />
          </el-select>
        </el-form-item>
        <el-form-item label="视频URL" prop="video_url">
          <el-input v-model="form.video_url" placeholder="请输入在线视频地址" />
        </el-form-item>
        <el-form-item label="封面URL" prop="cover_url">
          <div class="cover-upload">
            <el-upload
              class="cover-uploader"
              name="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              :show-file-list="false"
              :before-upload="beforeCoverUpload"
              :http-request="handleCoverUploadRequest"
              :on-success="handleCoverUploadSuccess"
              :on-error="handleCoverUploadError"
            >
              <img v-if="form.cover_url" :src="form.cover_url" class="cover-preview" alt="封面预览" />
              <div v-else class="cover-placeholder">
                <el-icon class="cover-placeholder__icon"><Plus /></el-icon>
                <span>上传封面</span>
              </div>
            </el-upload>
            <div class="cover-hint">支持 JPG / PNG，建议 16:9，大小不超过 5MB</div>
          </div>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="form.tags_text" placeholder="例如：养生,中医,健康" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="5" placeholder="请输入课程简介" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态">
            <el-option label="已发布" value="published" />
            <el-option label="隐藏" value="hidden" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="form.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import service from '../../utils/request'
import { createAdminVideo, deleteAdminVideo, getAdminVideos, updateAdminVideo, updateAdminVideoStatus } from '../../api/videos'
import type { AdminVideoCourse } from '../../api/videos'

const loading = ref(false)
const tableData = ref<AdminVideoCourse[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  search: '',
  category: '',
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
  category: 'yangsheng',
  description: '',
  video_url: '',
  cover_url: '',
  tags_text: '',
  status: 'published',
  sort_order: 0
})

const rules = reactive<FormRules>({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  video_url: [{ required: true, message: '请输入视频URL', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

const formatDate = (dateStr: string) => (dateStr ? new Date(dateStr).toLocaleString() : '')

const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    yangsheng: '养生',
    xiqu: '戏曲',
    legal: '法律常识'
  }
  return map[category] || category
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getAdminVideos({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchForm.search,
      category: searchForm.category,
      status: searchForm.status
    })
    tableData.value = res.data || []
    total.value = res.total || 0
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
  searchForm.category = ''
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
  dialogTitle.value = '新增课程'
  Object.assign(form, {
    id: undefined,
    title: '',
    category: 'yangsheng',
    description: '',
    video_url: '',
    cover_url: '',
    tags_text: '',
    status: 'published',
    sort_order: 0
  })
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleEdit = (row: AdminVideoCourse) => {
  isEdit.value = true
  dialogTitle.value = '编辑课程'
  Object.assign(form, {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description || '',
    video_url: row.video_url,
    cover_url: row.cover_url || '',
    tags_text: Array.isArray(row.tags) ? row.tags.join(',') : String(row.tags || ''),
    status: row.status,
    sort_order: row.sort_order || 0
  })
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const buildPayload = () => ({
  title: form.title,
  category: form.category,
  description: form.description,
  video_url: form.video_url,
  cover_url: form.cover_url,
  tags: String(form.tags_text || '')
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean),
  status: form.status,
  sort_order: form.sort_order
})

const beforeCoverUpload = (file: File) => {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  if (!allowedTypes.has(file.type)) {
    ElMessage.error('封面只能上传 JPG、PNG、GIF 或 WebP 图片')
    return false
  }

  const isWithinLimit = file.size / 1024 / 1024 <= 5
  if (!isWithinLimit) {
    ElMessage.error('封面图片不能超过 5MB')
    return false
  }

  return true
}

const handleCoverUploadRequest = async (options: any) => {
  const formData = new FormData()
  formData.append(options.filename || 'file', options.file)

  try {
    const response: any = await service.post('/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
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

const handleCoverUploadSuccess = (response: any) => {
  const uploadedUrl = response?.url || response?.data?.url
  if (!uploadedUrl) {
    return
  }

  form.cover_url = uploadedUrl
  ElMessage.success('封面上传成功')
}

const handleCoverUploadError = () => {
  ElMessage.error('封面上传失败')
}

const submitForm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (err) {
    return
  }

  submitLoading.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await updateAdminVideo(form.id!, payload)
      ElMessage.success('更新成功')
    } else {
      await createAdminVideo(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (err) {
    console.error(err)
  } finally {
    submitLoading.value = false
  }
}

const toggleStatus = async (row: AdminVideoCourse) => {
  const nextStatus = row.status === 'published' ? 'hidden' : 'published'
  try {
    await updateAdminVideoStatus(row.id, nextStatus)
    ElMessage.success('状态已更新')
    fetchData()
  } catch (error) {
    console.error(error)
    ElMessage.error('状态更新失败')
  }
}

const handleDelete = (row: AdminVideoCourse) => {
  ElMessageBox.confirm(`确定删除课程“${row.title}”吗？`, '提示', { type: 'warning' })
    .then(async () => {
      await deleteAdminVideo(row.id)
      ElMessage.success('删除成功')
      fetchData()
    })
    .catch(() => {})
}

const resetForm = () => {
  formRef.value?.resetFields()
}

onMounted(fetchData)
</script>

<style scoped>
.video-container {
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

.cover-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-uploader :deep(.el-upload) {
  width: 180px;
  height: 101px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: var(--el-fill-color-lighter);
}

.cover-preview {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  gap: 6px;
}

.cover-placeholder__icon {
  font-size: 22px;
}

.cover-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
