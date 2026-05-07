<template>
  <div class="activity-create-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发布活动</span>
          <div class="header-actions">
            <el-button @click="goList">返回列表</el-button>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="max-width: 720px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入活动标题" />
        </el-form-item>

        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入活动地点" />
        </el-form-item>

        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="form.start_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择开始时间"
          />
        </el-form-item>

        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="form.end_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择结束时间"
          />
        </el-form-item>

        <el-form-item label="人数上限" prop="max_participants">
          <el-input-number v-model="form.max_participants" :min="0" />
          <div class="hint">填 0 表示不限制</div>
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
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入活动简介（可选）" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submit">发布</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import service from '../../utils/request'
import { createActivity } from '../../api/activity'
import { normalizeMysqlDateTime } from '../../utils/datetime'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
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

const goList = () => {
  router.push('/activities/list')
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      await createActivity({
        ...form,
        start_time: normalizeMysqlDateTime(form.start_time),
        end_time: normalizeMysqlDateTime(form.end_time)
      })
      ElMessage.success('发布成功')
      router.push('/activities/list')
    } finally {
      submitting.value = false
    }
  })
}

const reset = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.activity-create-container {
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
.hint {
  margin-left: 10px;
  color: #999;
  font-size: 12px;
}

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
</style>

