<template>
  <div class="user-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleCreate">新增用户</el-button>
        </div>
      </template>

      <!-- Search Form -->
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="用户名/姓名">
          <el-input v-model="searchForm.search" placeholder="请输入用户名或姓名"></el-input>
        </el-form-item>
        <el-form-item label="角色">
          <el-select style="width: 100px" v-model="searchForm.role" placeholder="请选择角色" clearable>
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="家属" value="family"></el-option>
            <el-option label="老人" value="elderly"></el-option>
            <el-option label="志愿者" value="volunteer"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- User Table -->
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column  label="ID" width="80" >
          <template #default="{ $index }">
            {{ (currentPage - 1) * pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column prop="real_name" label="真实姓名" width="180" />
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag :type="getRoleTag(scope.row.role)">
              {{ getRoleName(scope.row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="180" />
        <el-table-column prop="emergency_contact" label="紧急联系人" width="140" />
        <el-table-column prop="emergency_phone" label="紧急电话" width="180" />
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(scope.row)"
            >删除</el-button>
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

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>
         <el-form-item label="重置密码" prop="password" v-else>
          <el-input v-model="userForm.password" type="password" placeholder="若不修改请留空" show-password></el-input>
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="userForm.real_name" placeholder="请输入真实姓名"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        <el-form-item label="紧急联系人" prop="emergency_contact">
          <el-input v-model="userForm.emergency_contact" placeholder="请输入紧急联系人"></el-input>
        </el-form-item>
        <el-form-item label="紧急电话" prop="emergency_phone">
          <el-input v-model="userForm.emergency_phone" placeholder="请输入紧急电话"></el-input>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="志愿者" value="volunteer"></el-option>
            <el-option label="老人" value="elderly"></el-option>
            <el-option label="家属" value="family"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { getUsers, deleteUser, createUser, updateUser } from '../../api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// Dialog related
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const submitLoading = ref(false)
const userFormRef = ref<FormInstance>()

const userForm = reactive({
  id: undefined,
  username: '',
  password: '',
  real_name: '',
  phone: '',
  emergency_contact: '',
  emergency_phone: '',
  role: 'elderly'
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: false, message: '请输入密码', trigger: 'blur' }], // Dynamic validation in logic
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
})

const searchForm = reactive({
  search: '',
  role: ''
})

const getRoleTag = (role: string) => {
  switch (role) {
    case 'admin': return 'danger'
    case 'volunteer': return 'success'
    case 'elderly': return 'warning'
    case 'family': return 'info'
    default: return ''
  }
}

const getRoleName = (role: string) => {
  switch (role) {
    case 'admin': return '管理员'
    case 'volunteer': return '志愿者'
    case 'elderly': return '老人'
    case 'family': return '家属'
    case 'user': return '普通用户'
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
    const res: any = await getUsers({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchForm.search,
      role: searchForm.role
    })
    // Note: Since I didn't strictly type axios interceptor return,
    // res here is likely just the data object { users: [], total: ... }
    // Let's assume it is.
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

const resetSearch = () => {
  searchForm.search = ''
  searchForm.role = ''
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
  dialogTitle.value = '新增用户'
  userForm.id = undefined
  userForm.username = ''
  userForm.password = ''
  userForm.real_name = ''
  userForm.phone = ''
  userForm.emergency_contact = ''
  userForm.emergency_phone = ''
  userForm.role = 'elderly'
  dialogVisible.value = true
  nextTick(() => {
    userFormRef.value?.clearValidate()
  })
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  userForm.id = row.id
  userForm.username = row.username
  userForm.password = '' // Don't show password
  userForm.real_name = row.real_name
  userForm.phone = row.phone
  userForm.emergency_contact = row.emergency_contact || ''
  userForm.emergency_phone = row.emergency_phone || ''
  userForm.role = row.role
  dialogVisible.value = true
  nextTick(() => {
    userFormRef.value?.clearValidate()
  })
}

const submitForm = async () => {
  if (!userFormRef.value) return
  
  // Custom validation for password in Create mode
  if (!isEdit.value && !userForm.password) {
    ElMessage.error('请输入密码')
    return
  }

  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateUser(userForm.id!, userForm)
          ElMessage.success('更新成功')
        } else {
          await createUser(userForm)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error: any) {
        // Error handled by interceptor
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const resetForm = () => {
  userFormRef.value?.resetFields()
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${row.username}" 吗?`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        await deleteUser(row.id)
        ElMessage.success('删除成功')
        fetchData()
      } catch (error) {
        console.error(error)
      }
    })
    .catch(() => {
      // cancel
    })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.user-container {
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
