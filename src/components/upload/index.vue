<template>
  <el-upload
    class="upload-box"
    :action="action"
    :headers="headers"
    :data="data"
    :accept="accept"
    :limit="maxCount"
    :multiple="maxCount > 1"
    :file-list="uploadFileList"
    :list-type="listType"
    :disabled="disabled"
    :before-upload="beforeUpload"
    :http-request="handleHttpRequest"
    :on-preview="handlePreview"
    :on-remove="handleRemove"
    :on-exceed="handleExceed"
  >
    <template #default>
      <div class="upload-trigger" v-if="uploadFileList.length < maxCount">
        <el-icon class="upload-trigger__icon"><Plus /></el-icon>
        <div class="upload-trigger__text">点击上传</div>
      </div>
    </template>

    <template #file="{ file }">
      <img
        class="el-upload-list__item-thumbnail"
        :src="file.url || file.thumbnailUrl"
        alt=""
      />
      <span class="el-upload-list__item-actions">
        <span class="el-upload-list__item-preview" @click.stop="handlePreview(file)">
          <el-icon><ZoomIn /></el-icon>
        </span>
        <span class="el-upload-list__item-delete" @click.stop="handleRemove(file)">
          <el-icon><Delete /></el-icon>
        </span>
      </span>
    </template>
  </el-upload>
</template>

<script setup>
import { computed } from 'vue'
import axios from 'axios'
import { Delete, Plus, ZoomIn } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

let uidSeed = 0
const fallbackUidCache = new WeakMap()

const createUid = () => `upload-file-${Date.now()}-${++uidSeed}`

const getStableUid = (item, index) => {
  if (item?.uid) {
    return item.uid
  }

  if (item && typeof item === 'object') {
    const cachedUid = fallbackUidCache.get(item)
    if (cachedUid) {
      return cachedUid
    }

    const nextUid = createUid()
    fallbackUidCache.set(item, nextUid)
    return nextUid
  }

  return `upload-file-${index}`
}

const props = defineProps({
  fileList: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 1
  },
  maxSize: {
    type: Number,
    default: 2
  },
  action: {
    type: String,
    default: 'http://localhost:3001/api/upload'
  },
  accept: {
    type: String,
    default: 'image/*'
  },
  listType: {
    type: String,
    default: 'picture-card'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  headers: {
    type: Object,
    default: () => ({})
  },
  data: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:fileList', 'success'])

const uploadFileList = computed(() =>
  props.fileList.map((item, index) => {
    const uid = getStableUid(item, index)
    return {
      ...item,
      name: item.name || `image-${index + 1}`,
      uid
    }
  })
)

const normalizeList = (fileList) =>
  fileList.map((item, index) => ({
    ...item,
    name: item.name || `image-${index + 1}`,
    uid: getStableUid(item, index)
  }))

const syncFileList = (fileList) => {
  emit('update:fileList', normalizeList(fileList))
}

const beforeUpload = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }

  const isWithinSize = rawFile.size / 1024 / 1024 <= props.maxSize
  if (!isWithinSize) {
    ElMessage.error(`图片不能超过 ${props.maxSize}MB`)
    return false
  }

  return true
}

const handleHttpRequest = async (options) => {
  const formData = new FormData()
  formData.append(options.filename || 'file', options.file)

  Object.entries(props.data || {}).forEach(([key, value]) => {
    formData.append(key, value)
  })

  try {
    const response = await axios.post(props.action, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...props.headers
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          options.onProgress?.({
            percent: Math.round((progressEvent.loaded * 100) / progressEvent.total)
          })
        }
      }
    })

    const responseData = response.data || {}
    const uploadedUrl = responseData.url || responseData.data?.url || responseData.data || ''

    if (!uploadedUrl) {
      throw new Error('上传接口未返回图片地址')
    }

    const nextList = normalizeList([
      ...props.fileList,
      {
        name: options.file.name,
        url: uploadedUrl,
        raw: options.file
      }
    ])

    syncFileList(nextList)
    emit('success', responseData, nextList)
    options.onSuccess?.(responseData)
    ElMessage.success('上传成功')
  } catch (error) {
    options.onError?.(error)
    ElMessage.error(error?.message || '上传失败')
  }
}

const handlePreview = (file) => {
  const urls = props.fileList.map((item) => item.url).filter(Boolean)
  if (!urls.length) {
    return
  }

  const current = file.url || file.thumbnailUrl
  window.open(current, '_blank')
}

const handleRemove = (file) => {
  const targetUid = file.uid
  const nextList = props.fileList.filter((item, index) => getStableUid(item, index) !== targetUid)
  syncFileList(nextList)
}

const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.maxCount} 张图片`)
}
</script>

<style scoped>
.upload-box {
  width: 100%;
}

.upload-trigger {
  width: 100%;
  height: 100%;
  min-height: 148px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.upload-trigger__icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-trigger__text {
  font-size: 12px;
}

:deep(.el-upload--picture-card) {
  width: 148px;
  height: 148px;
  line-height: 1;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 148px;
  height: 148px;
}

:deep(.el-upload-list__item-thumbnail) {
  object-fit: cover;
}
</style>