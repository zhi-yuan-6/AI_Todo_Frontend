import {
  defineStore
} from "pinia";
import {
  ref
} from 'vue'

export const useAnalyticsStore = defineStore('analytics', () => {
  // 存储分析报告
  const aiReport = ref('')
  // 存储最后使用的查询参数
  const lastQueryParams = ref(null)

  // 保存报告和查询参数
  function saveReport(report, params) {
    aiReport.value = report
    lastQueryParams.value = params
  }

  // 清除存储
  function clearStore() {
    aiReport.value = ''
    lastQueryParams.value = null
  }

  return {
    aiReport,
    lastQueryParams,
    saveReport,
    clearStore
  }
})
