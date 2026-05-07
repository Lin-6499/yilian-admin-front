import { createRouter, createWebHistory } from 'vue-router'
import Layout from '../layout/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login/index.vue')
    },
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/dashboard/index.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: 'users/list',
          name: 'UserList',
          component: () => import('../views/user/index.vue'),
          meta: { title: '用户列表' }
        },
        {
          path: 'users/audit',
          name: 'UserAudit',
          component: () => import('../views/user/audit.vue'),
          meta: { title: '身份审核' }
        },
        {
          path: 'activities/list',
          name: 'ActivityList',
          component: () => import('../views/activity/index.vue'),
          meta: { title: '活动管理' }
        },
        {
          path: 'activities/create',
          name: 'ActivityCreate',
          component: () => import('../views/activity/create.vue'),
          meta: { title: '发布活动' }
        },
        {
          path: 'content/announcements',
          name: 'Announcements',
          component: () => import('../views/content/announcements.vue'),
          meta: { title: '公告管理' }
        },
        {
          path: 'content/neighbors',
          name: 'NeighborSharing',
          component: () => import('../views/content/neighbors.vue'),
          meta: { title: '邻里分享管理' }
        },
        {
          path: 'content/videos',
          name: 'VideoCourses',
          component: () => import('../views/video/index.vue'),
          meta: { title: '老年大学' }
        },
        {
          path: 'orders/products',
          name: 'ProductsAdmin',
          component: () => import('../views/products/index.vue'),
          meta: { title: '商品管理' }
        },
        {
          path: 'orders/list',
          name: 'OrdersList',
          component: () => import('../views/orders/index.vue'),
          meta: { title: '兑换订单' }
        },
        {
          path: 'tasks/list',
          name: 'TaskList',
          component: () => import('../views/task/index.vue'),
          meta: { title: '任务监管' }
        },
        {
          path: 'tasks/disputes',
          name: 'TaskDisputes',
          component: () => import('../views/task/disputes.vue'),
          meta: { title: '纠纷处理' }
        },
        {
          path: 'points/logs',
          name: 'PointsLogs',
          component: () => import('../views/points/index.vue'),
          meta: { title: '积分管理' }
        },
        {
          path: 'system/sos',
          name: 'SystemSos',
          component: () => import('../views/system/sos/index.vue'),
          meta: { title: 'SOS配置' }
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('adminToken')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
