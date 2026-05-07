<template>
  <div class="sos-page">
    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <div class="title">SOS 兜底配置</div>
                <div class="desc">不新增数据库表，配置会写入共享文件并被移动端和管理端同时读取。</div>
              </div>
              <el-tag :type="config?.dialEnabled ? 'success' : 'info'">
                {{ config?.dialEnabled ? '启用拨号' : '仅提示不拨号' }}
              </el-tag>
            </div>
          </template>

          <el-alert
            v-if="loadError"
            :title="loadError"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 16px"
          />

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="140px"
            status-icon
          >
            <el-form-item label="默认联系人名称" prop="defaultContactName">
              <el-input v-model="form.defaultContactName" placeholder="例如：社区值班中心" />
            </el-form-item>
            <el-form-item label="默认联系电话" prop="defaultPhone">
              <el-input v-model="form.defaultPhone" placeholder="例如：15104086499" />
            </el-form-item>
            <el-form-item label="是否允许直接拨号" prop="dialEnabled">
              <el-switch v-model="form.dialEnabled" active-text="拨号" inactive-text="仅展示" />
            </el-form-item>
            <el-form-item label="备注" prop="note">
              <el-input
                v-model="form.note"
                type="textarea"
                :rows="4"
                maxlength="200"
                show-word-limit
                placeholder="可填写值班说明、交接提醒、备用说明等"
              />
            </el-form-item>
          </el-form>

          <div class="action-row">
            <el-button :loading="loading" @click="loadConfig">重新加载</el-button>
            <el-button :loading="saving" type="primary" @click="handleSave">保存配置</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10" class="right-col">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="card-header">
              <div>
                <div class="title">当前配置状态</div>
                <div class="desc">展示共享文件中的实时值，便于确认保存是否生效。</div>
              </div>
            </div>
          </template>

          <el-descriptions :column="1" border size="small" label-width="120px">
            <el-descriptions-item label="来源">{{ config?.source || '-' }}</el-descriptions-item>
            <el-descriptions-item label="配置文件">{{ config?.configPath || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最后更新人">{{ config?.updatedByName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最后更新时间">{{ formatTime(config?.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="加载异常">{{ config?.loadError || '-' }}</el-descriptions-item>
            <el-descriptions-item label="系统热线">
              {{ config?.defaultContactName || '-' }} / {{ config?.defaultPhone || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider content-position="left">测试预览</el-divider>

          <el-form :inline="true" :model="testForm">
            <el-form-item label="用户ID">
              <el-input-number v-model="testForm.userId" :min="1" :controls="false" placeholder="留空则只测试系统兜底" />
            </el-form-item>
            <el-form-item>
              <el-button :loading="testing" type="primary" @click="handleTest">执行测试</el-button>
            </el-form-item>
          </el-form>

          <el-alert
            v-if="testResult"
            type="success"
            :title="`将拨打：${testResult.contact_name}（${testResult.phone || '无有效号码'}）`"
            show-icon
            :closable="false"
          >
            <template #default>
              <div class="result-grid">
                <div>来源：{{ testResult.source }}</div>
                <div>拨号开关：{{ testResult.dial_enabled ? '开启' : '关闭' }}</div>
                <div>关联用户：{{ testResult.user_id ?? '无' }}</div>
              </div>
            </template>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { getSosConfig, testSosConfig, updateSosConfig, type SosConfig, type SosTestTarget } from '../../../api/system'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const loadError = ref('')
const formRef = ref<FormInstance>()
const config = ref<SosConfig | null>(null)
const testResult = ref<SosTestTarget | null>(null)

const form = reactive({
  defaultContactName: '',
  defaultPhone: '',
  dialEnabled: true,
  note: ''
})

const testForm = reactive({
  userId: undefined as number | undefined
})

const rules = computed<FormRules>(() => ({
  defaultContactName: [{ required: true, message: '请输入默认联系人名称', trigger: 'blur' }],
  defaultPhone: [
    { required: true, message: '请输入默认联系电话', trigger: 'blur' },
    { pattern: /^[+]?[0-9][0-9\-()]{5,}[0-9]$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}))

const formatTime = (value?: string | null) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

const fillForm = (data: SosConfig) => {
  form.defaultContactName = data.defaultContactName || ''
  form.defaultPhone = data.defaultPhone || ''
  form.dialEnabled = Boolean(data.dialEnabled)
  form.note = data.note || ''
}

const loadConfig = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const result = await getSosConfig()
    config.value = result.config
    fillForm(result.config)
    loadError.value = result.config.loadError || ''
  } catch (error: any) {
    loadError.value = error?.message || '加载 SOS 配置失败'
    ElMessage.error(loadError.value)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const result = await updateSosConfig({
        defaultContactName: form.defaultContactName,
        defaultPhone: form.defaultPhone,
        dialEnabled: form.dialEnabled,
        note: form.note
      })

      config.value = result.config
      fillForm(result.config)
      ElMessage.success('SOS 配置已保存')
    } catch (error: any) {
      ElMessage.error(error?.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

const handleTest = async () => {
  testing.value = true
  try {
    const result = await testSosConfig({
      user_id: testForm.userId ?? null
    })
    testResult.value = result.dial_target
    ElMessage.success(result.message)
  } catch (error: any) {
    ElMessage.error(error?.message || '测试失败')
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.sos-page {
  padding: 20px;
}

.panel-card {
  min-height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.desc {
  margin-top: 6px;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.action-row {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.right-col {
  margin-top: 16px;
}

.result-grid {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  color: #1f2937;
  font-size: 13px;
}

@media (min-width: 992px) {
  .right-col {
    margin-top: 0;
  }
}
</style>