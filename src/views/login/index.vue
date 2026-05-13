<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2>社区互助养老平台 - 管理后台</h2>
        </div>
      </template>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="0px">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" prefix-icon="User" placeholder="用户名"></el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input style="z-index: 2" v-model="loginForm.password" @focus="isActive=true" @blur="isActive=false" prefix-icon="Lock" type="password" placeholder="密码" show-password></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleLogin" style="width: 100%">登录</el-button>
        </el-form-item>
      </el-form>
      <img class="img" :class="isActive?'img-active':''" src="../../assets/chicken.gif"></img>
    </el-card>
    <ParticlesBg
        :key="isDark.toString()"
        class="particles-bg"
        :quantity="100"
        :ease="100"
        :color="isDark ? '#ffffff' : '#ffffff'"
        :staticity="10"
        refresh
    />
  </div>

</template>

<script setup lang="ts">
import { reactive, ref, computed} from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { useColorMode } from "@vueuse/core";
import type { FormInstance, FormRules } from 'element-plus'
import ParticlesBg from "../../components/ParticlesBg/ParticlesBg.vue";

const isDark = computed(() => useColorMode().value === "dark");
const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const isActive = ref(false)
const loginForm = reactive({
  username: '',
  password: ''
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const res = await axios.post('/api/admin/login', loginForm)
        if (res.data.token) {
          localStorage.setItem('adminToken', res.data.token)
          localStorage.setItem('adminUser', JSON.stringify(res.data.user))
          ElMessage.success('登录成功')
          router.push('/')
        }
      } catch (error: any) {
        ElMessage.error(error.response?.data?.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #2b2a2a;
}

.login-card {
  width: 400px;
  background: linear-gradient(to bottom, #ffffff, #2b2a2a);
  opacity: 0.8;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.login-header {
  text-align: center;
}
.particles-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

:deep(.el-card) {
 border: none;
}

.img{
  width:24px ;
  height:24px ;
  position: absolute;
  top:160px;
  left: 180px;
  z-index: 1;
  transition: top 0.3s
}
.img-active{
  top: 175px;
}

</style>
