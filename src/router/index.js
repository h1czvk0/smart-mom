import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: import.meta.env.PROD
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    { path: '/tasks', name: 'tasks', component: () => import('../views/TaskListView.vue') },
    {
      path: '/tasks/:id',
      name: 'task-detail',
      component: () => import('../views/TaskDetailView.vue'),
    },
    {
      path: '/devices',
      name: 'devices',
      component: () => import('../views/DeviceProcessView.vue'),
    },
    { path: '/ai', name: 'ai', component: () => import('../views/AiWorkbenchView.vue') },
    { path: '/reports', name: 'reports', component: () => import('../views/ReportView.vue') },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router
