<template>
  <el-container class="layout-container">
    <el-aside width="220px">
      <Sidebar />
    </el-aside>
    <el-container>
      <el-header height="60px" style="padding: 0;">
        <Header />
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.el-aside {
  overflow: auto;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow: auto;
}
</style>
