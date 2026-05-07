<template>
  <el-menu
    active-text-color="#409EFF"
    background-color="#304156"
    class="el-menu-vertical"
    :default-active="activeMenu"
    text-color="#bfcbd9"
    router
  >
    <div class="logo-container">
      <h3 v-if="!isCollapse">颐联养老管理</h3>
      <h3 v-else>颐联</h3>
    </div>
    
    <el-menu-item index="/">
      <el-icon><Odometer /></el-icon>
      <span>首页</span>
    </el-menu-item>
    
    <el-sub-menu index="/users">
      <template #title>
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </template>
      <el-menu-item index="/users/list">用户列表</el-menu-item>
      <el-menu-item index="/users/audit">身份审核</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="/tasks">
      <template #title>
        <el-icon><List /></el-icon>
        <span>任务监管</span>
      </template>
      <el-menu-item index="/tasks/list">任务列表</el-menu-item>
      <el-menu-item index="/tasks/disputes">纠纷处理</el-menu-item>
      <el-menu-item index="/points/logs">积分管理</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="/activities">
      <template #title>
        <el-icon><Calendar /></el-icon>
        <span>活动运营</span>
      </template>
      <el-menu-item index="/activities/list">活动管理</el-menu-item>
      <el-menu-item index="/activities/create">发布活动</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="/content">
      <template #title>
        <el-icon><Bell /></el-icon>
        <span>内容中心</span>
      </template>
      <el-menu-item index="/content/announcements">公告管理</el-menu-item>
      <el-menu-item index="/content/neighbors">邻里分享</el-menu-item>
      <el-menu-item index="/content/videos">老年大学</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="/mall">
      <template #title>
        <el-icon><ShoppingCart /></el-icon>
        <span>商城</span>
      </template>
      <el-menu-item index="/orders/list">兑换订单</el-menu-item>
      <el-menu-item index="/orders/products">商品管理</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="/system">
      <template #title>
        <el-icon><Setting /></el-icon>
        <span>系统设置</span>
      </template>
      <el-menu-item index="/system/sos">SOS配置</el-menu-item>
    </el-sub-menu>

  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isCollapse = false // 暂时固定，后续可接状态管理

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.el-menu-vertical {
  height: 100vh;
  border-right: none;
  overflow-y: auto;
}

.logo-container {
  height: 60px;
  line-height: 60px;
  text-align: center;
  color: white;
  background-color: #2b2f3a;
  overflow: hidden;
}

.logo-container h3 {
  margin: 0;
}

.el-menu-vertical::-webkit-scrollbar {
  width: 6px;
}
.el-menu-vertical::-webkit-scrollbar-track {
  background: #2b2f3a;
}
.el-menu-vertical::-webkit-scrollbar-thumb {
  background: #396ba1;
  border-radius: 3px;
}
</style>
