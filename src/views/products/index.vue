<template>
  <div class="products-container">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>商品管理</span>
          <el-button type="primary" @click="openCreate">新增商品</el-button>
        </div>
      </template>

      <el-table :data="tableData" style="width:100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="price_points" label="积分" width="100" />
        <el-table-column prop="stock" label="库存" width="100">
          <template #default="scope">
            <span :style="scope.row.stock<=0? 'color:#f56c6c':''">{{ scope.row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="openEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="remove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="积分" prop="price_points">
          <el-input-number v-model="form.price_points" :min="0" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="图片 URL" prop="image_url">
          <div class="image-upload">
            <el-upload
              class="image-uploader"
              name="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              :show-file-list="false"
              :before-upload="beforeImageUpload"
              :http-request="handleImageUploadRequest"
              :on-success="handleImageUploadSuccess"
            >
              <img v-if="form.image_url" :src="form.image_url" class="image-preview" alt="商品图片预览" />
              <div v-else class="image-placeholder">
                <el-icon class="image-placeholder__icon"><Plus /></el-icon>
                <span>上传图片</span>
              </div>
            </el-upload>
            <div class="hint">支持 JPG / PNG / GIF / WebP，大小不超过 5MB</div>
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submit" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getAdminProducts, createAdminProduct, updateAdminProduct, deleteAdminProduct } from '../../api/products'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import service from '../../utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)

const form = reactive({ id: null, name: '', description: '', image_url: '', price_points: 0, stock: 0, category: 'goods' })

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  price_points: [{ required: true, message: '请输入积分', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'change' }]
}

const beforeImageUpload = (file: File) => {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  if (!allowedTypes.has(file.type)) {
    ElMessage.error('商品图片只能上传 JPG、PNG、GIF 或 WebP 图片')
    return false
  }

  if (file.size / 1024 / 1024 > 5) {
    ElMessage.error('商品图片不能超过 5MB')
    return false
  }

  return true
}

const handleImageUploadRequest = async (options: any) => {
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

const handleImageUploadSuccess = (response: any) => {
  const uploadedUrl = response?.url || response?.data?.url
  if (!uploadedUrl) {
    return
  }

  form.image_url = uploadedUrl
  ElMessage.success('商品图片上传成功')
}

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getAdminProducts({})
    tableData.value = res.products || []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  dialogTitle.value = '新增商品'
  Object.assign(form, { id: null, name: '', description: '', image_url: '', price_points: 0, stock: 0, category: 'goods' })
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  dialogTitle.value = '编辑商品'
  Object.assign(form, { id: row.id, name: row.name, description: row.description, image_url: row.image_url, price_points: row.price_points, stock: row.stock, category: row.category })
  dialogVisible.value = true
}

const submit = async () => {
  // basic validation
  if (!form.name) { ElMessage.error('请输入名称'); return }
  if (form.price_points == null || form.price_points < 0) { ElMessage.error('积分不合法'); return }
  if (form.stock == null || form.stock < 0) { ElMessage.error('库存不可为负数'); return }

  submitLoading.value = true
  try {
    if (form.id) {
      await updateAdminProduct(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createAdminProduct(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (err: any) {
    console.error(err)
    ElMessage.error(err?.response?.data?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const remove = (row: any) => {
  ElMessageBox.confirm('确认删除该商品吗？', '确认', { type: 'warning' })
    .then(async () => {
      try {
        await deleteAdminProduct(row.id)
        ElMessage.success('删除成功')
        fetchData()
      } catch (err) {
        console.error(err)
        ElMessage.error('删除失败')
      }
    })
    .catch(()=>{})
}

onMounted(() => { fetchData() })
</script>

<style scoped>
.products-container { padding: 20px }

.image-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-uploader :deep(.el-upload) {
  width: 180px;
  height: 180px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: var(--el-fill-color-lighter);
}

.image-preview {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  gap: 6px;
}

.image-placeholder__icon {
  font-size: 22px;
}

.hint {
  color: #999;
  font-size: 12px;
}
</style>
